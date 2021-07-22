import * as t from "io-ts";

/**
 * Schema d'un identifiant du sorte sommet à valider
 */
export const IdentifiantSommet = t.type({
    val: t.string,
    sorte: t.literal("sommet")
});

/**
 * Schema d'un identifiant du sorte message à valider
 */
export const IdentifiantMessage = t.type({
    val: t.string,
    sorte: t.literal("message")
});