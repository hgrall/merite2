import { isRight } from "fp-ts/lib/Either";
import { ConfigurationJeuDistribution } from "../../accueil/commun/configurationJeux";
import { logger } from "../../bibliotheque/administration/log";
import { erreur } from "../../bibliotheque/applications/message";
import { ConnexionExpress, ConnexionLongueExpress } from "../../bibliotheque/communication/connexion";
import { GenerateurIdentifiants, Identifiant, sontIdentifiantsEgaux } from "../../bibliotheque/types/identifiant";
import { rienOption, option, Option } from "../../bibliotheque/types/option";
import { TableIdentification, TableIdentificationMutable } from "../../bibliotheque/types/tableIdentification";
import { FormatMessageDistribution, estUtilisateur, messageTransit, messageActif, messageInactif } from "../commun/echangesDistribution";
import { ReponsePOSTEnvoi, messageAvecVerrouInitial, FormatMessageAvecVerrou, ReponsePOSTVerrou, verrouillage } from "./echangesServeurDistribution";
import { ReseauMutableDistribution } from "./reseauDistribution";
import { ValidateurFormatMessageEnvoiDistribution, ValidateurFormatMessageVerrouillageDistribution } from "./validation";

export class Envoyer {
    constructor(
        private config: ConfigurationJeuDistribution,
        private reseau: ReseauMutableDistribution<ConnexionLongueExpress>,
        private messagesEnvoyesParUtilisateur: TableIdentificationMutable<
            'sommet',
            FormatMessageDistribution>,
        private messagesTransitParDomaine: TableIdentification<
            'sommet',
            TableIdentificationMutable<
                'message',
                FormatMessageAvecVerrou
            >
        >,
        private generateurIdentifiantsMessages:
            GenerateurIdentifiants<'message'>
    ) {

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
                this.config.getPersistant.recevoir,
                messageTransit(reponse.accuseReception,
                    ID, idMsg));
        });
    }
}

export function traitementPOSTEnvoyer(
    config: ConfigurationJeuDistribution,
    reseau: ReseauMutableDistribution<ConnexionLongueExpress>, messagesEnvoyesParUtilisateur: TableIdentificationMutable<"sommet", FormatMessageDistribution>,
    messagesTransitParDomaine: TableIdentification<"sommet", TableIdentificationMutable<"message", FormatMessageAvecVerrou>>,
    generateurIdentifiantsMessages: GenerateurIdentifiants<"message">
): Envoyer {
    return new Envoyer(config, reseau, messagesEnvoyesParUtilisateur, messagesTransitParDomaine, generateurIdentifiantsMessages);
}

export class Verrouiller {
    constructor(
        private config: ConfigurationJeuDistribution,
        private reseau: ReseauMutableDistribution<ConnexionLongueExpress>,
        private messagesEnvoyesParUtilisateur: TableIdentificationMutable<
            'sommet',
            FormatMessageDistribution>,
        private messagesTransitParDomaine: TableIdentification<
            'sommet',
            TableIdentificationMutable<
                'message',
                FormatMessageAvecVerrou
            >
        >,
        private generateurIdentifiantsMessages:
            GenerateurIdentifiants<'message'>
    ) {

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
        if (!isRight(ValidateurFormatMessageVerrouillageDistribution.decode(msg))) {
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
                this.config.getPersistant.inactiver,
                messageInactif(reponse.accuseReception));
        });
    }


}

export function traitementPOSTVerrouiller (
    config: ConfigurationJeuDistribution,
    reseau: ReseauMutableDistribution<ConnexionLongueExpress>, messagesEnvoyesParUtilisateur: TableIdentificationMutable<"sommet", FormatMessageDistribution>,
    messagesTransitParDomaine: TableIdentification<"sommet", TableIdentificationMutable<"message", FormatMessageAvecVerrou>>,
    generateurIdentifiantsMessages: GenerateurIdentifiants<"message">
): Verrouiller {
    return new Verrouiller(config, reseau, messagesEnvoyesParUtilisateur, messagesTransitParDomaine, generateurIdentifiantsMessages);
}