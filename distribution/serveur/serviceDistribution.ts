import * as express from 'express';
import { isRight } from 'fp-ts/lib/Either'
import { logger } from '../../bibliotheque/administration/log';
import { ConnexionExpress, ConnexionLongueExpress } from '../../bibliotheque/communication/connexion';

import { ConfigurationJeuDistribution } from '../../accueil/commun/configurationJeux';

import {
    chemin,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { creerGenerateurReseauDistribution, ReseauMutableDistribution } from './reseauDistribution';
import {
    estDomaine,
    estUtilisateur, FormatConfigDistribution,
    FormatMessageEnvoiDistribution as FormatMessageEnvoiDistribution,
    FormatMessageTransitDistribution,
} from '../commun/echangesDistribution';
import { avertissement, erreur } from '../../bibliotheque/applications/message';
import { EnsembleIdentifiants } from '../../bibliotheque/types/ensembleIdentifiants';
import { traductionEnvoiEnTransit } from './echangesServeurDistribution';
import { ValidateurFormatMessageEnvoiDistribution } from "./validation";
import { creerTableIdentificationMutableVide, TableIdentificationMutable } from '../../bibliotheque/types/tableIdentification';


/*
* Service de l'application.
*/

interface ReponsePOSTEnvoi {
    accuseReception: FormatMessageEnvoiDistribution;
    utilisateursDestinataires: EnsembleIdentifiants<"sommet">
}

interface FormatMessageAvecVerrou {
    message: FormatMessageTransitDistribution;
    verrou: Option<Identifiant<'sommet'>>;
}

function messageAvecVerrouInitial(idMsg: Identifiant<'message'>, msg: FormatMessageEnvoiDistribution): FormatMessageAvecVerrou {
    return {
        message: traductionEnvoiEnTransit(msg,
            msg.corps.ID_utilisateur_emetteur, idMsg),
        verrou: rienOption()
    };
}

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
    private messagesTransitParDomaine: TableIdentificationMutable<
        'sommet',
        TableIdentificationMutable<
            'message',
            FormatMessageAvecVerrou
        >
    >
    private messagesEnvoyesParUtilisateur: TableIdentificationMutable<
        'sommet',
        FormatMessageEnvoiDistribution>;
    constructor(
        private config: ConfigurationJeuDistribution,
        private cleAcces: string
    ) {
        this.reseau = creerGenerateurReseauDistribution<ConnexionLongueExpress>(
            cleAcces, config.nombreDomaines, config.effectifParDomaine
        ).engendrer();
        this.generateurIdentifiantsMessages = creerGenerateurIdentifiantParCompteur(cleAcces + "-distribution-" + config.type + "-");
        this.messagesEnvoyesParUtilisateur = creerTableIdentificationMutableVide('sommet');
        this.messagesTransitParDomaine = creerTableIdentificationMutableVide('sommet');
        this.reseau.itererSommets((ID, s) => {
            if (estDomaine(s)) {
                this.messagesTransitParDomaine.ajouter(ID, creerTableIdentificationMutableVide('message'));
            }
        })
    }

    /*
    * Service de réception d'un message (POST).
    */

    traitementPOSTEnvoi(msg: FormatMessageEnvoiDistribution)
        : ReponsePOSTEnvoi {
        // Mettre à jour les messages envoyés côté serveur.
        this.messagesEnvoyesParUtilisateur.ajouter(msg.corps.ID_utilisateur_emetteur, msg);
        return {
            accuseReception: msg,
            utilisateursDestinataires: this.reseau.cribleVoisins(msg.corps.ID_destination, (ID, s) => estUtilisateur(s) && s.actif)
        };
    }
    traductionEntreePostEnvoi(canal: ConnexionExpress): Option<FormatMessageEnvoiDistribution> {
        const msg: FormatMessageEnvoiDistribution = canal.lire();
        if (!isRight(ValidateurFormatMessageEnvoiDistribution.decode(msg))) {
            const desc = "Le format JSON du message reçu n'est pas correct. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageEnvoiDistribution>();
        }
        // Le message reçu est supposé correct,
        // en première approximation.
        const voisinageDomaines = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_destination);
        const appartenanceUtilisateurDomaine = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_utilisateur_emetteur);
        if (!voisinageDomaines
            || !appartenanceUtilisateurDomaine) {
            const desc = `Le message reçu n'est pas cohérent. Les domaines d'origine et de destination doivent être voisins (ici ${voisinageDomaines}) et l'utilisateur émetteur doit appartenir au domaine d'origine (ici ${appartenanceUtilisateurDomaine}). Erreur HTTP 400 : Bad Request.`;
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageEnvoiDistribution>();
        }
        if (!this.reseau.sommet(msg.corps.ID_destination).actif) {
            const desc = "Le domaine de destination n'est pas actif. La requête doit être renvoyée lorsque le domaine devient actif. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageEnvoiDistribution>();
        }
        return option(msg);
    }

    traduireSortiePOSTEnvoi(reponse: ReponsePOSTEnvoi, canal: ConnexionExpress): void {
        // Accuser réception du message envoyé.
        canal.envoyerJSON(reponse.accuseReception);
        // Mettre à jour les messages en transit côté serveur. 
        // Attention : l'utilisateur est l'émetteur, non le 
        // destinataire.
        const idMsg = this.generateurIdentifiantsMessages.produire('message');
        this.messagesTransitParDomaine.valeur(reponse.accuseReception.corps.ID_destination).ajouter(idMsg, messageAvecVerrouInitial(idMsg,reponse.accuseReception));
        // Envoyer le message en transit aux utilisateurs 
        // du domaine destinataire. Dans chaque message, 
        // l'utilisateur est le destinataire.
        reponse.utilisateursDestinataires.iterer((ID) => {
            const canalDest = this.reseau.connexion(ID);
            canalDest.envoyerJSON(
                'TRANSIT',
                traductionEnvoiEnTransit(reponse.accuseReception,
                    ID, idMsg));
        });
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
                'avertissement',
                avertissement(this.generateurIdentifiantsMessages.produire('message'), desc));
            return;
        }
        const ID_util = this.reseau.activerSommet(canal);
        const config: FormatConfigDistribution = this.reseau.configurationUtilisateur(ID_util);

        // Envoi de la configuration initiale
        canal.envoyerJSON('config', config);
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
            FormatMessageEnvoiDistribution,
            ReponsePOSTEnvoi
        >(
            this.config.prefixe,
            this.cleAcces,
            chemin(this.config.suffixe, this.config.post.envoi),
            (entree) => this.traitementPOSTEnvoi(entree),
            (canal) => this.traductionEntreePostEnvoi(canal),
            (s, canal) => this.traduireSortiePOSTEnvoi(s, canal)
        );

        serveurApplications
            .specifierTraitementRequeteGETLongue(
                this.config.prefixe,
                this.cleAcces,
                chemin(this.config.suffixe, this.config.getPersistant), (canal) => this.traiterGETpersistant(canal)
            );

    }

}

export function creerServiceDistribution(
    config: ConfigurationJeuDistribution, cleAcces: string): ServiceDistribution {
    return new ServiceDistribution(config, cleAcces);
}

