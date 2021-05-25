import {Identifiant} from "../../../bibliotheque/types/identifiant";
import {dateMaintenant, FormatDateFr} from "../../../bibliotheque/types/date";
import {
    FormatMessageTchat,
    MessageTchat,
    MessageTchatParEnveloppe,
    TypeMessageTchat
} from "../../../bibliotheque/echangesTchat";

/**
 * Fabrique d'un message correspondnat à une erreur de connexion.
 * @param id identifiant du message
 * @param idEmetteur identifiant de l'émetteur
 * @param messageErreur message d'erreur
 */
export function creerMessageErreurConnexion(id: Identifiant<'message'>,
                                       idEmetteur: Identifiant<'sommet'>, messageErreur: string, type : string): MessageTchat {
    return new MessageTchatParEnveloppe({
        ID: id,
        ID_emetteur: idEmetteur,
        ID_destinataire: idEmetteur,
        type: type,
        contenu: messageErreur,
        date: dateMaintenant().val()
    });
}

/**
 * Fabrique d'un message de communication.
 */
export function creerMessageADestinataire(ID: Identifiant<"message">, ID_emetteur: Identifiant<"sommet">, ID_destinataire: Identifiant<"sommet">, contenu: string): MessageTchat {
    return new MessageTchatParEnveloppe({
        ID: ID,
        ID_emetteur: ID_emetteur,
        ID_destinataire: ID_destinataire,
        type: TypeMessageTchat.COM,
        contenu: contenu,
        date: dateMaintenant().val()
    });
}

export function creerMessageAVoisin(ID: Identifiant<"message">, ID_emetteur: Identifiant<"sommet">, ID_destinataire: Identifiant<"sommet">, contenu: string): MessageTchat {
    return new MessageTchatParEnveloppe({
        ID: ID,
        ID_emetteur: ID_emetteur,
        ID_destinataire: ID_destinataire,
        type: TypeMessageTchat.COM,
        contenu: contenu,
        date: dateMaintenant().val()
    });
}

/**
 * Fabrique d'un message d'information
 * @param id identifiant du message
 * @param idEmetteur identifiant de l'émetteur
 * @param idDestinataire identifiant du destinataire
 * @param texte contenu
 * @param date date (en français)
 */
export function messageInformation(id: Identifiant<'message'>,
                                   idEmetteur: Identifiant<'sommet'>, idDestinataire: Identifiant<'sommet'>,
                                   texte: string, date: FormatDateFr, ): MessageTchat {
    return new MessageTchatParEnveloppe({
        ID: id,
        ID_emetteur: idEmetteur,
        ID_destinataire: idDestinataire,
        type: TypeMessageTchat.ERREUR_CONNEXION,
        contenu: texte,
        date: date
    });
}