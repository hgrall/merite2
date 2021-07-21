import * as t from "io-ts";
import {IdentifiantSommet} from "./identifiant";

/**
 * Schema d'un Tableau à valider
 */
export const FormatTableau = t.type({
    taille: t.number,
    tableau: t.array(IdentifiantSommet)
})