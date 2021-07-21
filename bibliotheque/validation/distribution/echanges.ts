import * as t from 'io-ts';
import {IdentifiantMessage, IdentifiantSommet} from "../types/identifiant";
import {FormatDateValidator} from "../types/date";
import {TypeMessageDistribution} from "../../../distribution/commun/echangesDistribution";
import {DeuxFormat} from "../types/typesAtomiques";

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
export const FormatMessageInitialDistributionValidator = t.type({
    ID: IdentifiantMessage,
    type: t.literal(TypeMessageDistribution.INIT),
    date: FormatDateValidator,
    corps: FormatMessageDistribution
});
