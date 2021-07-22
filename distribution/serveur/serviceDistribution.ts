import * as express from 'express';
import { isRight } from 'fp-ts/lib/Either'
import { logger } from '../../bibliotheque/administration/log';
import { ConnexionExpress, ConnexionLongueExpress } from '../../bibliotheque/communication/connexion';

import { ConfigurationJeuDistribution } from '../../accueil/commun/configurationJeux';

import {
    chemin,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant, sontIdentifiantsEgaux } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { creerGenerateurReseauDistribution, ReseauMutableDistribution } from './reseauDistribution';
import {
    estDomaine,
    estUtilisateur, FormatConfigDistribution,
    FormatMessageDistribution,
    messageActif,
    messageInactif,
    messageTransit,
    TypeMessageDistribution
} from '../commun/echangesDistribution';
import { avertissement, erreur, TypeMessage } from '../../bibliotheque/applications/message';
import { FormatMessageAvecVerrou, messageAvecVerrouInitial, ReponsePOSTEnvoi, ReponsePOSTVerrou, verrouillage } from './echangesServeurDistribution';
import { ValidateurFormatMessageEnvoiDistribution } from "./validation";
import { creerTableIdentificationMutableVide, TableIdentification, TableIdentificationMutable } from '../../bibliotheque/types/tableIdentification';


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
    >
    private messagesEnvoyesParUtilisateur: TableIdentificationMutable<
        'sommet',
        FormatMessageDistribution>;
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
    }

    /*
    * Service de réception d'un message ENVOI (POST).
    */

    traitementPOSTEnvoi(msg: FormatMessageDistribution)
        : ReponsePOSTEnvoi {
        // Mettre à jour les messages envoyés côté serveur.
        this.messagesEnvoyesParUtilisateur.ajouter(msg.corps.ID_utilisateur_emetteur, msg);
        return {
            accuseReception: msg,
            utilisateursDestinataires: this.reseau.cribleVoisins(msg.corps.ID_destination, (ID, s) => estUtilisateur(s) && s.actif)
        };
    }
    traductionEntreePostEnvoi(canal: ConnexionExpress): Option<FormatMessageDistribution> {
        const msg: FormatMessageDistribution = canal.lire();
        if (!isRight(ValidateurFormatMessageEnvoiDistribution.decode(msg))) {
            const desc = "Le format JSON du message reçu n'est pas correct. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
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
            return rienOption<FormatMessageDistribution>();
        }
        if (!this.reseau.sommet(msg.corps.ID_destination).actif) {
            const desc = "Le domaine de destination n'est pas actif. La requête doit être renvoyée lorsque le domaine devient actif. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
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
        this.messagesTransitParDomaine.valeur(reponse.accuseReception.corps.ID_destination).ajouter(idMsg, messageAvecVerrouInitial(idMsg, reponse.accuseReception));
        // Envoyer le message en transit aux utilisateurs 
        // du domaine destinataire. Dans chaque message, 
        // l'utilisateur est le destinataire.
        reponse.utilisateursDestinataires.iterer((ID) => {
            const canalDest = this.reseau.connexion(ID);
            canalDest.envoyerJSON(
                TypeMessageDistribution.TRANSIT,
                messageTransit(reponse.accuseReception,
                    ID, idMsg));
        });
    }

    /*
    * Service de réception d'un message VERROU (POST).
    */
    verrouiller(ID_domaine: Identifiant<'sommet'>, ID_util: Identifiant<'sommet'>, ID_msg: Identifiant<'message'>): void {
        const table = this.messagesTransitParDomaine.valeur(ID_domaine);
        let msgVerrou = table.valeur(ID_msg);
        table.ajouter(ID_msg, verrouillage(msgVerrou, ID_util));
    }
    traitementPOSTVerrou(msg: FormatMessageDistribution)
        : ReponsePOSTVerrou {
        // Verrouiller côté serveur.
        this.verrouiller(msg.corps.ID_destination, msg.corps.ID_utilisateur_emetteur, msg.ID);
        return {
            accuseReception: msg,
            utilisateursDestinataires: this.reseau.cribleVoisins(msg.corps.ID_destination, (ID, s) => estUtilisateur(s) && s.actif && !sontIdentifiantsEgaux(msg.corps.ID_utilisateur_emetteur, ID))
        };
    }
    traductionEntreePostVerrou(canal: ConnexionExpress): Option<FormatMessageDistribution> {
        const msg: FormatMessageDistribution = canal.lire();
        // TODO
        if (!isRight(ValidateurFormatMessageEnvoiDistribution.decode(msg))) {
            const desc = "Le format JSON du message reçu n'est pas correct. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        // Le message reçu est supposé correct,
        // en première approximation.
        const voisinageDomaines = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_destination);
        const appartenanceUtilisateurDomaine = this.reseau.sontVoisins(msg.corps.ID_destination, msg.corps.ID_utilisateur_emetteur);
        if (!voisinageDomaines
            || !appartenanceUtilisateurDomaine) {
            const desc = `Le message reçu n'est pas cohérent. Les domaines d'origine et de destination doivent être voisins (ici ${voisinageDomaines}) et l'utilisateur émetteur doit appartenir au domaine de destination (ici ${appartenanceUtilisateurDomaine}). Erreur HTTP 400 : Bad Request.`;
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        // On suppose que les identifiants sont corrects. TODO 
        // Quels contrôles réaliser finalement ? Toujours supposer la
        // correction des données ?
        // Contrôle du verrouillage
        if (this.messagesTransitParDomaine.valeur(msg.corps.ID_destination).valeur(msg.ID).verrou.estPresent()) {
            const desc = `Le messsage d'identifiant ${msg.ID} est déjà verrouillé. Erreur HTTP 403 : Forbidden Request.`;
            canal.envoyerJSONCodeErreur(403, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        return option(msg);
    }

    traduireSortiePOSTVerrou(reponse: ReponsePOSTVerrou, canal: ConnexionExpress): void {
        // Activer le message après le verrouillage.
        canal.envoyerJSON(messageActif(reponse.accuseReception));
        // Inactiver le message pour les autres utilisateurs du domaine.
        reponse.utilisateursDestinataires.iterer((ID) => {
            const canalDest = this.reseau.connexion(ID);
            canalDest.envoyerJSON(
                TypeMessageDistribution.INACTIF,
                messageInactif(reponse.accuseReception));
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
                TypeMessage.AVERTISSEMENT,
                avertissement(this.generateurIdentifiantsMessages.produire('message'), desc));
            return;
        }
        const ID_util = this.reseau.activerSommet(canal);
        const config: FormatConfigDistribution = this.reseau.configurationUtilisateur(ID_util);

        // Envoi de la configuration initiale
        canal.envoyerJSON(TypeMessage.CONFIG, config);
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
            chemin(this.config.suffixe, this.config.post.envoi),
            (entree) => this.traitementPOSTEnvoi(entree),
            (canal) => this.traductionEntreePostEnvoi(canal),
            (s, canal) => this.traduireSortiePOSTEnvoi(s, canal)
        );

        serveurApplications.specifierTraitementRequetePOST<
            FormatMessageDistribution,
            ReponsePOSTVerrou
        >(
            this.config.prefixe,
            this.cleAcces,
            chemin(this.config.suffixe, this.config.post.verrouillage),
            (entree) => this.traitementPOSTVerrou(entree),
            (canal) => this.traductionEntreePostVerrou(canal),
            (s, canal) => this.traduireSortiePOSTVerrou(s, canal)
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

