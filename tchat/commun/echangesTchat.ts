import {
    Prioritarisable, Activable
} from "../../bibliotheque/types/typesAtomiques";

import {
    FormatDateFr, dateEnveloppe, dateMaintenant,
} from "../../bibliotheque/types/date";

import {
    Identifiant, FormatIdentifiable, identifiant
} from "../../bibliotheque/types/identifiant";

import { FormatNoeud, Noeud } from "../../bibliotheque/applications/noeud";
import { FormatMessage } from "../../bibliotheque/applications/message";
import { FormatTableau } from "../../bibliotheque/types/tableau";

/**
 * Format JSON pour un sommet du réseau de tchat.
 * Structure :
 * - ID : identifiant
 * - priorite : entier naturel n indiquant la priorité par (1/(n+1))
 * - actif : booléen
 * - pseudo : nom
 */
export interface FormatSommetTchat extends FormatIdentifiable<'sommet'>, Prioritarisable, Activable {
    readonly pseudo: string,
}

/**
 * Fabrique d'un sommet.
 * @param s sommet au format JSON.
 */
export function sommetTchat(ID_sommet: Identifiant<'sommet'>, priorite: number, actif: boolean, pseudo: string): FormatSommetTchat {
    return {
        ID: ID_sommet,
        priorite: priorite,
        actif: actif,
        pseudo: pseudo
    };
}

export type NoeudTchat = Noeud<FormatSommetTchat>;
export type FormatNoeudTchat = FormatNoeud<FormatSommetTchat>;

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
 * - ID_emetteur : identifiant du sommet émetteur
 * - ID_destinataires : tableau des identifiants des sommets destinataires
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
 * - ID_destinataires : tableau des identifiants des sommets effectivement destinataires
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
 * - ID_emetteur : identifiant du sommet émetteur
 * - ID_destinataire : identifiant du sommet destinataire
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
