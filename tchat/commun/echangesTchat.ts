import {
    Activable
} from "../../bibliotheque/types/typesAtomiques";


import {
    Identifiant, FormatIdentifiable} from "../../bibliotheque/types/identifiant";

import { FormatNoeud, Noeud } from "../../bibliotheque/applications/noeud";
import { FormatMessage } from "../../bibliotheque/applications/message";
import { FormatTableau } from "../../bibliotheque/types/tableau";

/**
 * Format JSON pour un utilisateur du réseau de tchat.
 * Structure :
 * - ID : identifiant
 * - actif : booléen
 * - pseudo : nom
 */
export interface FormatUtilisateurTchat extends FormatIdentifiable<'sommet'>, Activable {
    readonly pseudo: string,
}

/**
 * Fabrique d'un utilisateur.
 * @param ID_util identifiant de l'utilisateur.
 * @param actif true si actif, false sinon.
 * @param pseudo pseudonyme.
 */
export function utilisateurTchat(ID_util: Identifiant<'sommet'>, actif: boolean, pseudo: string): FormatUtilisateurTchat {
    return {
        ID: ID_util,
        actif: actif,
        pseudo: pseudo
    };
}

export type NoeudTchat = Noeud<FormatUtilisateurTchat>;
export type FormatNoeudTchat = FormatNoeud<FormatUtilisateurTchat>;

/**
 * Types de messages pour le tchat. TODO : actuellement inutile !
 */
export type TypeMessageTchat = 'config' | 'envoi' | 'AR' | 'transit' | 'erreur';

/** 
 * Message au format JSON contenant une configuration du tchat, soit un noeud du graphe.
 * - ID : identifiant
 * - type : 'config',
 * - corps : le noeud,
 * - date : la date lors de l'émission.
*/
export type FormatConfigurationTchat = FormatMessage<'config', FormatNoeudTchat>;

/**
 * Corps d'un message d'envoi pour le tchat.
 * Structure :
 * - ID_emetteur : identifiant de l'utilisateur émetteur
 * - ID_destinataires : tableau des identifiants des utilisateurs destinataires
 * - contenu : le contenu textuel du message
 */
export interface FormatEnvoiTchat {
    readonly ID_emetteur: Identifiant<'sommet'>;
    readonly ID_destinataires: FormatTableau<Identifiant<'sommet'>>;
    readonly contenu: string;
}

/** 
 * Message au format JSON contenant un envoi d'un client du tchat.
 * - ID : identifiant
 * - type : 'envoi',
 * - corps : l'envoi,
 * - date : la date lors de l'émission.
*/
export type FormatMessageEnvoiTchat = FormatMessage<'envoi', FormatEnvoiTchat>;

/**
 * Corps d'un accusé de réception (AR) pour le tchat.
 * Structure :
 * - ID_envoi : identifiant du message dont on accuse réception
 * - ID_destinataires : tableau des identifiants des utilisateurs effectivement destinataires
 */
export interface FormatARTchat {
    readonly ID_envoi: Identifiant<'message'>;
    readonly ID_destinataires: FormatTableau<Identifiant<'sommet'>>;
}

/** 
 * Message au format JSON contenant un accusé de réception.
 * - ID : identifiant
 * - type : 'AR',
 * - corps : l'accusé de réception,
 * - date : la date lors de l'émission.
*/
export type FormatMessageARTchat = FormatMessage<'AR', FormatARTchat>;

/**
 * Corps d'un message de transit pour le tchat.
 * Structure :
 * - ID_envoi : identifiant du message envoyé
 * - ID_emetteur : identifiant de l'utilisateur émetteur
 * - ID_destinataire : identifiant de l'utilisateur destinataire
 * - contenu : le contenu textuel du message
 */
export interface FormatTransitTchat {
    readonly ID_envoi: Identifiant<'message'>;
    readonly ID_emetteur: Identifiant<'sommet'>;
    readonly ID_destinataire: Identifiant<'sommet'>;
    readonly contenu: string;
}

/** 
 * Message au format JSON contenant un message en transit du serveur vers un client destinataire, suite à un envoi.
 * - ID : identifiant
 * - type : 'transit',
 * - corps : l'envoi,
 * - date : la date lors de l'émission.
*/
export type FormatMessageTransitTchat = FormatMessage<'transit', FormatTransitTchat>;

/**
 * Corps d'un message d'erreur pour le tchat. L'erreur a pour origine
 * le client. 
 * Structure :
 * - erreur : la description de l'erreur.
 */
export interface FormatErreurTchat {
    readonly erreur: string;
}

/** 
 * Message au format JSON contenant une erreur.
 * - ID : identifiant
 * - type : 'erreur',
 * - corps : l'erreur,
 * - date : la date lors de l'émission.
*/
export type FormatMessageErreurTchat = FormatMessage<'erreur', FormatErreurTchat>;

/**
 * Corps d'un message d'avertissement pour le tchat. Un avertissement * impose un comportement au client.
 * Structure :
 * - avertissement : la description de l'avertissement.
 */
export interface FormatAvertissementTchat {
    readonly avertissement : string;
}

/** 
 * Message au format JSON contenant un avertissement pour le client.
 * - ID : identifiant
 * - type : 'avertissement',
 * - corps : l'avertissement,
 * - date : la date lors de l'émission.
*/
export type FormatMessageAvertissementTchat = FormatMessage<'avertissement', FormatAvertissementTchat>;