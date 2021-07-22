import * as t from 'io-ts';
import {IdentifiantMessage, IdentifiantSommet} from "../../bibliotheque/validation/identifiant";
import {FormatTableau} from "../../bibliotheque/validation/tableau";
import {FormatDateValidator} from "../../bibliotheque/validation/date";

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
