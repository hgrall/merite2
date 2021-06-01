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
 * - pseudo : nom
 * - actif : booléen
 */
export interface FormatSommetTchat extends FormatIdentifiable<'sommet'>, Prioritarisable, Activable {
    readonly pseudo: string,
}

export function modificationActivite(s: FormatSommetTchat): FormatSommetTchat {
    return {
        ID: s.ID,
        priorite: s.priorite,
        actif: !s.actif,
        pseudo: s.pseudo
    };
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
export type TypeMessageTchat = 'noeud' | 'envoi' | 'AR' | 'transit' | 'erreur';

/** 
 * Message au format JSON contenant une configuration du tchat, soit un noeud du graphe.
 * -  type : 'noeud',
 * - corps : le noeud,
 * - date : la date lors de l'émission.
*/
export type FormatConfigurationTchat = FormatMessage<'noeud', FormatNoeudTchat>;

/**
 * Description JSON du corps d'un message pour le tchat.
 * Structure :
 * - ID : identifiant
 * - ID_emetteur : identifiant du sommet émetteur
 * - ID_destinataire : tableau dormé des identifiants des sommets destinataires destinataire
 * - contenu : le contenu textuel du message
 */
export interface FormatEnvoiTchat {
    readonly ID_emetteur: Identifiant<'sommet'>;
    readonly ID_destinataires: FormatTableau<Identifiant<'sommet'>>;
    readonly contenu: string;
}

/** 
 * Message au format JSON contenant un envoi d'un client du tchat.
 * - type : 'envoi',
 * - corps : le message envoyé,
 * - date : la date lors de l'émission.
*/
export type FormatMessageEnvoiTchat = FormatMessage<'envoi', FormatEnvoiTchat>;

/**
 * Description JSON du corps d'un accusé de réception (AR) pour le tchat.
 * Structure :
 * - ID : identifiant du message
 * - ID_envoi : identifiant du message dont on accuse réception
 * - ID_emetteur : identifiant du sommet émetteur
 * - ID_destinataire : identifiant du sommet destinataire
 * - contenu : contenu textuel (TODO utile ?)
 */
export interface FormatARTchat {
    readonly ID_emetteur: Identifiant<'sommet'>;
    readonly ID_envoi: Identifiant<'message'>;
    readonly ID_destinataires: FormatTableau<Identifiant<'sommet'>>;
}

/** 
 * Message au format JSON contenant un accusé de réception.
 * - type : 'AR',
 * - corps : l'accusé de réception,
 * - date : la date lors de l'émission.
*/
export type FormatMessageARTchat = FormatMessage<'AR', FormatARTchat>;

