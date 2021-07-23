import * as t from 'io-ts';
import {IdentifiantMessage, IdentifiantSommet} from "../../bibliotheque/validation/identifiant";
import {FormatDateValidator} from "../../bibliotheque/validation/date";
import {TypeMessageDistribution} from "../commun/echangesDistribution";
import {DeuxFormat} from "../../bibliotheque/validation/typesAtomiques";

/**
 * Schema d'un message d'envoi à valider
 */
const FormatMessageDistribution = t.type({
    ID_utilisateur_emetteur: IdentifiantSommet,
    ID_origine: IdentifiantSommet,
    ID_destination: IdentifiantSommet,
    contenu: t.array(DeuxFormat),
})

/**
 * Schema d'un message provenant du client de type envoi
 */
export const ValidateurFormatMessageEnvoiDistribution = t.type({
    ID: IdentifiantMessage,
    type: t.literal(TypeMessageDistribution.ENVOI),
    date: FormatDateValidator,
    corps: FormatMessageDistribution
});


/**
 * Schema d'un message provenant du client de type verrou
 */
export const ValidateurFormatMessageVerrouillageDistribution = t.type({
    ID: IdentifiantMessage,
    type: t.literal(TypeMessageDistribution.VERROU),
    date: FormatDateValidator,
    corps: FormatMessageDistribution
});