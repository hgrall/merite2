import {
    FormatIdentifiable,
} from "../types/identifiant"
import {
    Enveloppe, TypeEnveloppe
} from "../types/enveloppe"

/**
 * Interface pour un sommet abstrait d'un réseau,
 * dérivée de TypeEnveloppe.
 * La sorte pour les identifiants de sommets est 'sommet'.
 *
 * @param TEX type de sortie représentant un sommet.
 * @param E étiquettes utiles pour une représentation d'un sommet.
 */
export interface Sommet<
    TEX extends FormatIdentifiable<'sommet'>,
    E extends string
    >
    extends TypeEnveloppe<TEX, E> {
}

/**
 * Sommet abstrait d'un réseau, dérivé d'Enveloppe.
 * La sorte pour les identifiants de sommets est 'sommet'.
 *
 * @param T type représentant un sommet.
 * @param TEX type de sortie représentant un sommet.
 * @param E étiquettes utiles pour une représentation d'un sommet.
 */
export abstract class SommetParEnveloppe<
    T extends FormatIdentifiable<'sommet'>,
    E extends string
    >
    extends Enveloppe<T,  E>
    implements Sommet<T, E> {
}


