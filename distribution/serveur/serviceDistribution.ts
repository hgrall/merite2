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
    FormatConfigurationDistribution,
    FormatMessageDistribution,
    CanalServeur} from '../commun/echangesDistribution';
import { FormatMessageDistributionAvecVerrou, ReponsePOSTEnvoi, ReponsePOSTVerrou } from './echangesServeurDistribution';
import { creerTableIdentificationMutableVide, TableIdentification, TableIdentificationMutable } from '../../bibliotheque/types/tableIdentification';
import { Envoyer, traitementPOSTEnvoyer, traitementPOSTVerrouiller, Verrouiller } from './traitementsPOST';
import { avertissement, CanalGenerique } from '../../bibliotheque/communication/communicationGenerique';

/** 
* Service de l'application de distribution. Un jeu de distribution
* correspond à une instance de la classe. Seule la fabrique est
* publique.
*/
class ServiceDistribution {
    /**
     * Réseau formé des domaines en anneau et des utilisateurs 
     * en étoile autour de leur domaine.
     */
    private reseau: ReseauMutableDistribution<ConnexionLongueExpress>;
    /**
     * Générateur d'identifiants de messages.
     */
    private generateurIdentifiantsMessages:
        GenerateurIdentifiants<'message'>;
    /**
     * Table associant à tout identifiant de domaine une table.
     * La table image associe à un identifiant de message 
     * - un message en transit, dont l'utilisateur est l'émetteur
     *  et non le destinataire (contrairement au cas du client),
     * - une option indiquant l'identité de l'utilisateur
     *  verrouillant le message.
     * La table fait partie de la duplication de l'état des clients.
     */
    private messagesTransitParDomaine: TableIdentification<
        'sommet',
        TableIdentificationMutable<
            'message',
            FormatMessageDistributionAvecVerrou
        >
    >;
    /**
     * Table d'identification associant à un utilisateur 
     * le message initial qu'il a envoyé.
     * La table fait partie de la duplication de l'état des clients.
     */
    private messagesEnvoyesParUtilisateur: TableIdentificationMutable<
        'sommet',
        FormatMessageDistribution>;
    /**
     * Traitement d'un POST sur le canal 'envoyer'.
     */
    private traitementPOSTEnvoyer: Envoyer;
    /**
     * Traitement d'un POST sur le canal 'verrouiller'.
     */
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
                    FormatMessageDistributionAvecVerrou
                >>('sommet');
        this.reseau.itererSommets((ID, s) => {
            if (estDomaine(s)) {
                tableMessages.ajouter(ID, creerTableIdentificationMutableVide('message'));
            }
        });
        this.messagesTransitParDomaine = tableMessages;
        this.traitementPOSTEnvoyer
            = traitementPOSTEnvoyer(
                this.reseau,
                this.messagesEnvoyesParUtilisateur,
                this.messagesTransitParDomaine,
                this.generateurIdentifiantsMessages);
        this.traitementPOSTVerrouiller
            = traitementPOSTVerrouiller(
                this.reseau,
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
                CanalGenerique.AVERTISSEMENT,
                avertissement(this.generateurIdentifiantsMessages.produire('message'), desc));
            return;
        }
        const ID_util = this.reseau.connecterSommet(canal);
        const config: FormatConfigurationDistribution = this.reseau.configurationUtilisateur(ID_util);

        // Envoi de la configuration initiale
        canal.envoyerJSON(CanalGenerique.CONFIG , config);
        // Envoi de la nouvelle configuration aux voisins actifs
        this.reseau.mettreAJourConfigurationAutresUtilisateursDuDomaine(ID_util);
        this.reseau.mettreAJourConfigurationUtilisateursDesDomainesVoisins(this.reseau.domaine(ID_util));

        // Enregistrement du traitement lors de la déconnexion
        canal.enregistrerTraitementDeconnexion(() => {
            this.reseau.deconnecterSommet(ID_util);
            this.reseau.mettreAJourConfigurationAutresUtilisateursDuDomaine(ID_util);
            this.reseau.mettreAJourConfigurationUtilisateursDesDomainesVoisins(this.reseau.domaine(ID_util));
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
            chemin(this.config.suffixe, CanalServeur.ENVOI),
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
            chemin(this.config.suffixe, CanalServeur.VERROU),
            (entree) => this.traitementPOSTVerrouiller.traitementPOSTVerrou(entree),
            (canal) => this.traitementPOSTVerrouiller.traductionEntreePostVerrou(canal),
            (s, canal) => this.traitementPOSTVerrouiller.traduireSortiePOSTVerrou(s, canal)
        );

        serveurApplications
            .specifierTraitementRequeteGETLongue(
                this.config.prefixe,
                this.cleAcces,
                chemin(this.config.suffixe, this.config.getPersistant), (canal) => this.traiterGETpersistant(canal)
            );

    }

}

/**
 * Fabrique d'un service de distribution.
 * @param config configuration du jeu de distribution.
 * @param cleAcces clé d'accès.
 * @returns un service du jeu de dsitribution.
 */
export function creerServiceDistribution(
    config: ConfigurationJeuDistribution, cleAcces: string): ServiceDistribution {
    return new ServiceDistribution(config, cleAcces);
}

