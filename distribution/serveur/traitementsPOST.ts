import { isRight } from "fp-ts/lib/Either";
import { ConfigurationJeuDistribution } from "../../accueil/commun/configurationJeux";
import { logger } from "../../bibliotheque/administration/log";
import { erreur } from "../../bibliotheque/communication/communicationGenerique";
import { ConnexionExpress, ConnexionLongueExpress } from "../../bibliotheque/communication/connexion";
import { GenerateurIdentifiants, Identifiant, sontIdentifiantsEgaux } from "../../bibliotheque/types/identifiant";
import { rienOption, option, Option } from "../../bibliotheque/types/option";
import { TableIdentification, TableIdentificationMutable } from "../../bibliotheque/types/tableIdentification";
import { FormatMessageDistribution, estUtilisateur, messageTransit, messageActif, messageInactif, CanalClient } from "../commun/echangesDistribution";
import { ReponsePOSTEnvoi, messageAvecVerrouInitial, FormatMessageDistributionAvecVerrou, ReponsePOSTVerrou, verrouillage } from "./echangesServeurDistribution";
import { ReseauMutableDistribution } from "./reseauDistribution";
import { ValidateurFormatMessageEnvoiDistribution, ValidateurFormatMessageVerrouillageDistribution } from "./validation";

/**
 * Serveur : réaction à un message sur le canal 'envoyer'.
 * A réception du message initial, le serveur 
 * - accuse réception,
 * - initie la transmission en autorisant le verrouillage 
 * pour le domaine destinataire,
 * - diffuse le message aux utilisateurs. 
 */
export class Envoyer {
    /**
     * Constructeur de l'objet fournissant les méthodes
     *  de traitement d'une requête.
     * @param reseau réseau utilisé.
     * @param messagesEnvoyesParUtilisateur table mémorisant les envois.
     * @param messagesTransitParDomaine table mémorisant les messages en transit.
     * @param generateurIdentifiantsMessages générateur des identifiants de messages. 
     */
    constructor(
        private reseau: ReseauMutableDistribution<ConnexionLongueExpress>,
        private messagesEnvoyesParUtilisateur: TableIdentificationMutable<
            'sommet',
            FormatMessageDistribution>,
        private messagesTransitParDomaine: TableIdentification<
            'sommet',
            TableIdentificationMutable<
                'message',
                FormatMessageDistributionAvecVerrou
            >
        >,
        private generateurIdentifiantsMessages:
            GenerateurIdentifiants<'message'>
    ) {

    }
    /**
     * Service de réception d'un message sur le canal 'envoyer'.
     * Traduction initiale de la requête.
     * Les vérifications suivantes sont réalisées :
     * - le format du message est vérifié,
     * - la cohérence du message est vérifié (domaines voisins,
     *  émetteur appartenant au domaine émetteur),
     * - l'activité du domaine destinataire est vérifiée.
     * En cas d'erreur, la réponse est immédiate : 
     * HTTP 400, Bad Request.
     * @param canal canal de communication utilisé.
     * @returns une option, soit vide en cas d'erreur, soit contenant le message reçu.
     */
    traductionEntreePostEnvoi(canal: ConnexionExpress): Option<FormatMessageDistribution> {
        const msg: FormatMessageDistribution = canal.lire();
        // Vérification du format.
        if (!isRight(ValidateurFormatMessageEnvoiDistribution.decode(msg))) {
            const desc = "Le format JSON du message reçu n'est pas correct. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        // Le message reçu est supposé correct,
        // en première approximation.
        // Vérification de la cohérence : les domaines d'origine et de destination doivent être voisins et l'utilisateur émetteur doit appartenir au domaine d'origine.
        const voisinageDomaines = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_destination);
        const appartenanceUtilisateurDomaine = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_utilisateur_emetteur);
        if (!voisinageDomaines
            || !appartenanceUtilisateurDomaine) {
            const desc = `Le message reçu n'est pas cohérent. Les domaines d'origine et de destination doivent être voisins (ici ${voisinageDomaines}) et l'utilisateur émetteur doit appartenir au domaine d'origine (ici ${appartenanceUtilisateurDomaine}). Erreur HTTP 400 : Bad Request.`;
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        // Vérification de l'activité du domaine destination.
        if (!this.reseau.sommet(msg.corps.ID_destination).actif) {
            const desc = "Le domaine de destination n'est pas actif. La requête doit être renvoyée lorsque le domaine devient actif. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        return option(msg);
    }
    /**
     * Service de réception d'un message sur le canal 'envoyer'.
     * Détermination de la réponse :
     * - accusé réception : le message reçu,
     * - utilisateurs destinataires : ceux actifs 
     * du domaine destinataire.
     * La méthode a pour effet de mémoriser le message envoyé
     * par l'utilisateur émetteur.
     * @param msg message reçu
     * @returns les informations utiles pour prduire la réponse.
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

    /**
     * Service de réception d'un message sur le canal 'envoyer'.
     * Envoie :
     * - à l'émetteur (via le canal 'accuserEnvoi', réalisé 
     * par la réponse à la requête POST) : un accusé de réception,
     * contenant le message envoyé initialement,
     * - aux utilisateurs du domaine destinataire (via le canal
     *  'recevoir', réalisé par le requête GET persistante) :
     * un message en transit, avec un nouvel identifiant engendré par
     * le serveur, et avec comme utilisateur émetteur, l'utilisateur
     * destinataire (le futur émetteur).
     * La méthode a aussi pour effet de mémoriser le message en
     *  transit :
     * - association avec le domaine destinataire,
     * - utilisateur émetteur mémorisé,
     * - aucun verrouillage.
     * @param reponse informations utiles pour former la réponse.
     * @param canal canal de communication pour la réponse directe.
     */
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
                CanalClient.RECEPTION,
                messageTransit(reponse.accuseReception,
                    ID, idMsg));
        });
    }
}

/**
 * Fabrique du traitement d'une requête POST sur le canal 'envoyer'.
 * @param reseau réseau du jeu.
 * @param messagesEnvoyesParUtilisateur table mémoriant les messages envoyés 
 * @param messagesTransitParDomaine table mémorisant les messages en transit par domaine, ainsi que les verrous
 * @param generateurIdentifiantsMessages générateur d'identifiants de messages
 * @returns un objet contenant les méthodes de traitement des messages 
 */
export function traitementPOSTEnvoyer(
    reseau: ReseauMutableDistribution<ConnexionLongueExpress>, messagesEnvoyesParUtilisateur: TableIdentificationMutable<"sommet", FormatMessageDistribution>,
    messagesTransitParDomaine: TableIdentification<"sommet", TableIdentificationMutable<"message", FormatMessageDistributionAvecVerrou>>,
    generateurIdentifiantsMessages: GenerateurIdentifiants<"message">
): Envoyer {
    return new Envoyer(reseau, messagesEnvoyesParUtilisateur, messagesTransitParDomaine, generateurIdentifiantsMessages);
}

/**
 * Serveur : réaction à un message sur le canal 'verrouiller'.
 * A réception de la demande de verrouillage, 
 * si le verrouillage est possible, le serveur 
 * - accuse réception,
 * - prévient du verrouillage les autres utilisateurs du domaine
 *  en utilisant le canal 'inactiver',
 * sinon,
 * - accuse l'échec.
 */
export class Verrouiller {
    /**
     * Constructeur de l'objet fournissant les méthodes
     *  de traitement d'une requête.
     * @param reseau réseau utilisé.
     * @param messagesTransitParDomaine table mémorisant les messages en transit.
     * @param generateurIdentifiantsMessages générateur des identifiants de messages. 
     */
    constructor(
        private reseau: ReseauMutableDistribution<ConnexionLongueExpress>,
        private messagesTransitParDomaine: TableIdentification<
            'sommet',
            TableIdentificationMutable<
                'message',
                FormatMessageDistributionAvecVerrou
            >
        >,
        private generateurIdentifiantsMessages:
            GenerateurIdentifiants<'message'>
    ) {

    }
    /**
     * Service de réception d'un message sur le canal 'verrouiller'.
     * Traduction initiale de la requête.
     * Les vérifications suivantes sont réalisées :
     * - le format du message est vérifié,
     * - la cohérence du message est vérifié (domaines voisins,
     *  émetteur appartenant au domaine émetteur),
     * - la possibilité de verrouiller est vérifiée.
     * En cas d'erreur, la réponse est immédiate : 
     * - HTTP 400, Bad Request, ou 
     * - HTTP 403, FORBIDDEN REQUEST (pour le verrouillage).
     * @param canal canal de communication utilisé.
     * @returns une option, soit vide en cas d'erreur, soit contenant le message reçu.
     */
    traductionEntreePostVerrou(canal: ConnexionExpress): Option<FormatMessageDistribution> {
        const msg: FormatMessageDistribution = canal.lire();
        // Vérification du format du message.
        if (!isRight(ValidateurFormatMessageVerrouillageDistribution.decode(msg))) {
            const desc = "Le format JSON du message reçu n'est pas correct. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        // Le message reçu est supposé correct,
        // en première approximation.
        // Vérification de la cohérence du message.
        const voisinageDomaines = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_destination);
        const appartenanceUtilisateurDomaine = this.reseau.sontVoisins(msg.corps.ID_destination, msg.corps.ID_utilisateur_emetteur);
        if (!voisinageDomaines
            || !appartenanceUtilisateurDomaine) {
            const desc = `Le message reçu n'est pas cohérent. Les domaines d'origine et de destination doivent être voisins (ici ${voisinageDomaines}) et l'utilisateur émetteur doit appartenir au domaine de destination (ici ${appartenanceUtilisateurDomaine}). Erreur HTTP 400 : Bad Request.`;
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        // Contrôle du verrouillage
        if (this.messagesTransitParDomaine.valeur(msg.corps.ID_destination).valeur(msg.ID).verrou.estPresent()) {
            const desc = `Le messsage d'identifiant ${msg.ID} est déjà verrouillé. Erreur HTTP 403 : Forbidden Request.`;
            canal.envoyerJSONCodeErreur(403, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageDistribution>();
        }
        return option(msg);
    }

    /**
     * Verrouille le message dans la table des messages en transit,
     * en indiquant que l'utilisateur dont l'identifiant est spécifié
     * est le verrouilleur. 
     * @param ID_domaine domaine de l'utilisateur verrouillant.
     * @param ID_util utilisateur verrouillant.
     * @param ID_msg identifiant du message à verrouiller.
     */
    verrouiller(ID_domaine: Identifiant<'sommet'>, ID_util: Identifiant<'sommet'>, ID_msg: Identifiant<'message'>): void {
        const table = this.messagesTransitParDomaine.valeur(ID_domaine);
        let msgVerrou = table.valeur(ID_msg);
        table.ajouter(ID_msg, verrouillage(msgVerrou, ID_util));
    }
    /**
     * Service de réception d'un message sur le canal 'verrouiller'.
     * Détermination de la réponse :
     * - accusé réception : le message reçu,
     * - utilisateurs destinataires : ceux actifs 
     * du domaine du verrouilleur, exclu.
     * La méthode a pour effet de verrouiller le message 
     * dans la table des messages en transit.
     * @param msg message reçu
     * @returns les informations utiles pour prduire la réponse.
     */
    traitementPOSTVerrou(msg: FormatMessageDistribution)
        : ReponsePOSTVerrou {
        // Verrouiller côté serveur.
        this.verrouiller(msg.corps.ID_destination, msg.corps.ID_utilisateur_emetteur, msg.ID);
        return {
            accuseReception: msg,
            utilisateursDestinataires: this.reseau.cribleVoisins(msg.corps.ID_destination, (ID, s) => estUtilisateur(s) && s.actif && !sontIdentifiantsEgaux(msg.corps.ID_utilisateur_emetteur, ID))
        };
    }

    /**
     * Service de réception d'un message sur le canal 'verrouiller'.
     * Envoie :
     * - à l'émetteur (via le canal 'accuserSuccesVerrouiller',
     *  réalisé par la réponse à la requête POST) : un accusé de
     *  réception, contenant le message verrouillé de type 'ACTIF',
     * - aux autres utilisateurs du domaine du verrouilleur 
     * (via le canal 'inactiver', réalisé par le requête 
     * GET persistante) : un message de type 'INACTIF' de même
     * identifiant et contenu que le message original en transit.
     * @param reponse informations utiles pour former la réponse.
     * @param canal canal de communication pour la réponse directe.
     */
    traduireSortiePOSTVerrou(reponse: ReponsePOSTVerrou, canal: ConnexionExpress): void {
        // Activer le message après le verrouillage.
        canal.envoyerJSON(messageActif(reponse.accuseReception));
        // Inactiver le message pour les autres utilisateurs du domaine.
        reponse.utilisateursDestinataires.iterer((ID) => {
            const canalDest = this.reseau.connexion(ID);
            canalDest.envoyerJSON(
                CanalClient.INACTIVATION,
                messageInactif(reponse.accuseReception));
        });
    }


}

/**
 * Fabrique du traitement d'une requête POST sur le canal
 *  'verrouiller'.
 * @param reseau réseau du jeu.
 * @param messagesTransitParDomaine table mémorisant les messages en transit par domaine, ainsi que les verrous.
 * @param generateurIdentifiantsMessages générateur d'identifiants de messages.
 * @returns un objet contenant les méthodes de traitement des messages. 
 */
export function traitementPOSTVerrouiller(
    reseau: ReseauMutableDistribution<ConnexionLongueExpress>, 
    messagesTransitParDomaine: TableIdentification<"sommet", TableIdentificationMutable<"message", FormatMessageDistributionAvecVerrou>>,
    generateurIdentifiantsMessages: GenerateurIdentifiants<"message">
): Verrouiller {
    return new Verrouiller(reseau, messagesTransitParDomaine, generateurIdentifiantsMessages);
}