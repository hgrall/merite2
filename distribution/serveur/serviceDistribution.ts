import * as express from 'express';
import { logger } from '../../bibliotheque/administration/log';
import { ConnexionLongueExpress } from '../../bibliotheque/communication/connexion';

import { ConfigurationJeuDistribution } from '../../accueil/commun/configurationJeux';

import {
    chemin,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants } from "../../bibliotheque/types/identifiant";
import { creerGenerateurReseauDistribution, ReseauMutableDistribution } from './reseauDistribution';
import {
    estDomaine,
    FormatConfigDistribution,
    FormatMessageDistribution} from '../commun/echangesDistribution';
import { avertissement, TYPE_CANAL } from '../../bibliotheque/applications/message';
import { FormatMessageAvecVerrou, ReponsePOSTEnvoi, ReponsePOSTVerrou } from './echangesServeurDistribution';
import { creerTableIdentificationMutableVide, TableIdentification, TableIdentificationMutable } from '../../bibliotheque/types/tableIdentification';
import { Envoyer, traitementPOSTEnvoyer, traitementPOSTVerrouiller, Verrouiller } from './traitementsPOST';


/*
* Service de l'application.
*/


class ServiceDistribution {
    private reseau: ReseauMutableDistribution<ConnexionLongueExpress>;
    private generateurIdentifiantsMessages:
        GenerateurIdentifiants<'message'>;
    /**
     * Table associant à tout identifiant de domaine une table.
     * La table image associe à un identifiant de message 
     * - un message en transit, dont l'utilisateur est l'émetteur
     *  et non le destinataire (cas du client),
     * - une option indiquant l'identité de l'utilisateur
     *  verrouillant le message.
     */
    private messagesTransitParDomaine: TableIdentification<
        'sommet',
        TableIdentificationMutable<
            'message',
            FormatMessageAvecVerrou
        >
    >;
    private messagesEnvoyesParUtilisateur: TableIdentificationMutable<
        'sommet',
        FormatMessageDistribution>;
    private traitementPOSTEnvoyer: Envoyer;
    private traitementPOSTVerrouiller: Verrouiller;
    constructor(
        private config: ConfigurationJeuDistribution,
        private cleAcces: string
    ) {
        this.reseau = creerGenerateurReseauDistribution<ConnexionLongueExpress>(
            cleAcces, config.nombreDomaines, config.effectifParDomaine
        ).engendrer();
        this.generateurIdentifiantsMessages = creerGenerateurIdentifiantParCompteur(cleAcces + "-distribution-" + config.type + "-");
        this.messagesEnvoyesParUtilisateur = creerTableIdentificationMutableVide('sommet');
        const tableMessages =
            creerTableIdentificationMutableVide<'sommet',
                TableIdentificationMutable<
                    'message',
                    FormatMessageAvecVerrou
                >>('sommet');
        this.reseau.itererSommets((ID, s) => {
            if (estDomaine(s)) {
                tableMessages.ajouter(ID, creerTableIdentificationMutableVide('message'));
            }
        });
        this.messagesTransitParDomaine = tableMessages;
        this.traitementPOSTEnvoyer
            = traitementPOSTEnvoyer(
                this.config,
                this.reseau,
                this.messagesEnvoyesParUtilisateur,
                this.messagesTransitParDomaine,
                this.generateurIdentifiantsMessages);
        this.traitementPOSTVerrouiller
            = traitementPOSTVerrouiller(
                this.config,
                this.reseau,
                this.messagesEnvoyesParUtilisateur,
                this.messagesTransitParDomaine,
                this.generateurIdentifiantsMessages);

    }





    /*
    * Service de connexion persistante pour permettre 
    * une communication du serveur vers chaque client connecté.
    */
    traiterGETpersistant(canal: ConnexionLongueExpress): void {
        if (!this.reseau.aUnSommetInactifDeconnecte()) {
            const desc = "La connexion est impossible : tous les utilisateurs sont actifs."
            logger.warn(desc);
            canal.envoyerJSON(
                TYPE_CANAL.avertir,
                avertissement(this.generateurIdentifiantsMessages.produire('message'), desc));
            return;
        }
        const ID_util = this.reseau.activerSommet(canal);
        const config: FormatConfigDistribution = this.reseau.configurationUtilisateur(ID_util);

        // Envoi de la configuration initiale
        canal.envoyerJSON(TYPE_CANAL.configurer, config);
        // Envoi de la nouvelle configuration aux voisins actifs
        this.reseau.diffuserConfigurationAuxAutresUtilisateursDuDomaine(ID_util);
        this.reseau.diffuserConfigurationAuxUtilisateursDesDomainesVoisins(this.reseau.domaine(ID_util));

        // Enregistrement du traitement lors de la déconnexion
        canal.enregistrerTraitementDeconnexion(() => {
            this.reseau.inactiverSommet(ID_util);
            this.reseau.diffuserConfigurationAuxAutresUtilisateursDuDomaine(ID_util);
            this.reseau.diffuserConfigurationAuxUtilisateursDesDomainesVoisins(this.reseau.domaine(ID_util));
        });
    }

    servirDistribution(
        serveurApplications: ServeurApplications<express.Request, express.Response>,
        repertoireHtml: string,
        fichierHtml: string
    ): void {
        serveurApplications.specifierApplicationAServir(
            this.config.prefixe, this.cleAcces, this.config.suffixe,
            repertoireHtml, fichierHtml);

        serveurApplications.specifierTraitementRequetePOST<
            FormatMessageDistribution,
            ReponsePOSTEnvoi
        >(
            this.config.prefixe,
            this.cleAcces,
            chemin(this.config.suffixe, this.config.post.envoyer),
            (entree) => this.traitementPOSTEnvoyer.traitementPOSTEnvoi(entree),
            (canal) => this.traitementPOSTEnvoyer.traductionEntreePostEnvoi(canal),
            (s, canal) => this.traitementPOSTEnvoyer.traduireSortiePOSTEnvoi(s, canal)
        );

        serveurApplications.specifierTraitementRequetePOST<
            FormatMessageDistribution,
            ReponsePOSTVerrou
        >(
            this.config.prefixe,
            this.cleAcces,
            chemin(this.config.suffixe, this.config.post.verrouiller),
            (entree) => this.traitementPOSTVerrouiller.traitementPOSTVerrou(entree),
            (canal) => this.traitementPOSTVerrouiller.traductionEntreePostVerrou(canal),
            (s, canal) => this.traitementPOSTVerrouiller.traduireSortiePOSTVerrou(s, canal)
        );

        serveurApplications
            .specifierTraitementRequeteGETLongue(
                this.config.prefixe,
                this.cleAcces,
                chemin(this.config.suffixe, this.config.getPersistant.chemin), (canal) => this.traiterGETpersistant(canal)
            );

    }

}

export function creerServiceDistribution(
    config: ConfigurationJeuDistribution, cleAcces: string): ServiceDistribution {
    return new ServiceDistribution(config, cleAcces);
}

