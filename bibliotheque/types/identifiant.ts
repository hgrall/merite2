/**
 * TODO
 */
export type EnsembleSortes = "sommet" | "message"; // à compléter

/**
 * Identifiant au format JSON. Type paramétré et valeur paramétrée par la sorte des identifiants,
 * donnée par une chaîne de caractères (considérée comme un type et une valeur respectivement).
 *
 * Exemple : Identifiant<"sommet"> ("sommet" étant aussi un type singleton sous-type de string),
 * { val : un_identifiant, sorte : "sommet" }.
 *
 * Remarque : les identifiants sont toujours accéder via un champ nommé ID ou ID_x.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
export type Identifiant<Sorte extends EnsembleSortes> = {
    readonly val: string;
    readonly sorte: Sorte;
}

/**
 * Format JSON mutable pour les identifiants.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
export interface FormatIdentifiableMutable<Sorte extends EnsembleSortes> {
    ID: Identifiant<Sorte>; // en majuscule par exception
}

/**
 * Format JSON pour les identifiants.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
export interface FormatIdentifiable<Sorte extends EnsembleSortes> {
    readonly ID: Identifiant<Sorte>; // en majuscule par exception
}

/**
 * Interface pour un générateur d'identifiants d'une sorte donnée.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 */
export interface GenerateurIdentifiants<Sorte extends EnsembleSortes> {
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
class GenerateurIdentifiantsParCompteur<Sorte extends EnsembleSortes>
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
    Sorte extends EnsembleSortes
    >(prefixe: string)
    : GenerateurIdentifiants<Sorte> {
    return new GenerateurIdentifiantsParCompteur(prefixe);
}

/**
 * Fabrique d'un identifiant (au format JSON).
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 * @param s sorte des identifiants (précondition : valeur s = type Sorte).
 * @param cle valeur de l'identifiant.
 */
export function identifiant<Sorte extends EnsembleSortes>(
    s: Sorte, cle: string
): Identifiant<Sorte> {
    return {
        val: cle,
        sorte: s
    };
}

/**
 * Test d'égalité entre deux identifiants.
 * @param Sorte chaîne donnant la sorte des identifiants (précondition : sous-type singleton de string).
 * @param id1 premier identifiant.
 * @param id2 second identifiant.
 */
export function sontIdentifiantsEgaux<Sorte extends EnsembleSortes>(
    id1: Identifiant<Sorte>,
    id2: Identifiant<Sorte>
): boolean {
    return id1.val === id2.val;
}
