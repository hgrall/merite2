import { SorteIdentifiant } from "../applications/sortes";
import { Record } from "immutable";

/**
 * Identifiant au format JSON. Type paramétré et valeur paramétrée par la sorte des identifiants,
 * donnée par une chaîne de caractères (considérée comme un type et une valeur respectivement).
 *
 * Exemple : Identifiant<'utilisateur'> ('utilisateur' étant aussi un type singleton sous-type de string),
 * { val : un_identifiant, sorte : 'utilisateur' }.
 *
 * Remarque : les identifiants sont toujours accédés via un champ nommé ID ou ID_x.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */

export type Identifiant<Sorte extends SorteIdentifiant> = {
    readonly sorte: Sorte;
    readonly val: string;
}

export type IdentifiantR<Sorte extends SorteIdentifiant> = Record<Identifiant<Sorte>>; // ??? & Readonly<Identifiant<Sorte>>;

/**
 * Format JSON mutable pour les identifiants.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
export interface FormatIdentifiableMutable<Sorte extends SorteIdentifiant> {
    ID: Identifiant<Sorte>; // en majuscule par exception
}

/**
 * Format JSON pour les identifiants.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
export interface FormatIdentifiable<Sorte extends SorteIdentifiant> {
    readonly ID: Identifiant<Sorte>; // en majuscule par exception
}

/**
 * Interface pour un générateur d'identifiants d'une sorte donnée.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
export interface GenerateurIdentifiants<Sorte extends SorteIdentifiant> {
    /**
     * Fabrique un identifiant "frais" (d'où l'effet de bord).
     * @param s sorte des identifiants (précondition : valeur s = type Sorte).
     */
    produire(s: Sorte): Identifiant<Sorte>;
}

/**
 * Fabrique d'identifiants utilisant un compteur. Les identifiants possèdent
 * un préfixe fourni lors de la construction de la fabrique.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
class GenerateurIdentifiantsParCompteur<Sorte extends SorteIdentifiant>
    implements GenerateurIdentifiants<Sorte> {
    /**
     * Compteur privé initialisé à zéro.
     */
    private compteur: number;
    /**
     * Constructeur acceptant comme argument le préfixe des identifiants à produire.
     * @param prefixe préfixe des identifiants.
     */
    constructor(private prefixe: string) {
        this.compteur = 0;
    }
    /**
     * Fabrique un identifiant sous la forme prefixeX, où X est la valeur du compteur.
     * @param s sorte des identifiants (précondition : valeur s = type Sorte).
     */
    produire(s: Sorte): Identifiant<Sorte> {
        let id: string = this.prefixe + this.compteur;
        this.compteur++;
        return identifiant(s, id);
    }

}

/**
 * Fabrique fournissant un générateur d'identifiants par compteur.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 * @param prefixe préfixe des identifiants.
 */
export function creerGenerateurIdentifiantParCompteur<
    Sorte extends SorteIdentifiant
    >(prefixe: string)
    : GenerateurIdentifiants<Sorte> {
    return new GenerateurIdentifiantsParCompteur(prefixe);
}

/**
 * Fabrique d'un identifiant (au format JSON).
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 * @param s sorte des identifiants (précondition : valeur s = type Sorte).
 * @param val valeur de l'identifiant.
 */
export function identifiant<Sorte extends SorteIdentifiant>(
    s: Sorte, val: string
): Identifiant<Sorte> {
    return {
        val: val,
        sorte: s
    };
}

export function fabriqueIdentifiant<Sorte extends SorteIdentifiant>(s : Sorte, valeurDefaut : string) : Record.Factory<Identifiant<Sorte>> {
    return Record<Identifiant<Sorte>>(identifiant(s, valeurDefaut));
}

/**
 * Test d'égalité entre deux identifiants.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 * @param id1 premier identifiant.
 * @param id2 second identifiant.
 */
export function sontIdentifiantsEgaux<Sorte extends SorteIdentifiant>(
    id1: Identifiant<Sorte>,
    id2: Identifiant<Sorte>
): boolean {
    return id1.val === id2.val;
}
