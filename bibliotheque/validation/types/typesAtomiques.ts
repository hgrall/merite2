import * as t from "io-ts";
import {Deux} from "../../types/typesAtomiques";

/**
 * Union de tous les mois à partir de l'enum Mois
 */
export const DeuxFormat = t.union([
    t.literal(Deux.UN),
    t.literal(Deux.ZERO)
])