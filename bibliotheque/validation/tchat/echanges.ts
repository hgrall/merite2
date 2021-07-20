import * as t from 'io-ts';
import {IdentifiantMessage, IdentifiantSommet} from "../types/identifiant";
import {FormatTableau} from "../types/tableau";
import {FormatDateValidator} from "../types/date";

/**
 * Schema d'un message d'envoi à valider
 */
const FormatMessageEnvoiTchatValidator = t.type({
    ID_emetteur: IdentifiantSommet,
    contenu: t.string,
    ID_destinataires: FormatTableau
})

/**
 * Schema d'un message provenant du client de type envoi
 */
export const FormatMessageTchatValidator = t.type({
    ID: IdentifiantMessage,
    type: t.literal("envoi"),
    date: FormatDateValidator,
    corps: FormatMessageEnvoiTchatValidator
});
