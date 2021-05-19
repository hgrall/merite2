/*
* Tableaux - Un tableau peut être considéré comme une fonction d'un segment initial de Nat
* dans un ensemble.
*/

import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { MesurableMutable, jamais, Mesurable } from "./typesAtomiques";
import { entierAleatoire } from "./nombres";

/**
 * Format JSON pour un tableau mutable enveloppe d'un tableau natif (de type T[]).
 * Invariant : taille == tableau.length.
 * @param T type des éléments du tableau.
 */
export interface FormatTableauMutable<T> extends MesurableMutable {
    readonly tableau: T[]
}

/**
 * Format JSON pour un tableau enveloppe d'un tableau natif (de type ReadonlyArray<T>).
 *  * Invariant : taille == tableau.length.
 * @param T type des éléments du tableau.
 */
export interface FormatTableau<T> extends Mesurable {
    readonly tableau: ReadonlyArray<T>
}

/**
* Module définissant des fabriques de tableaux au format JSON.
*/
class FabriqueTableauEnJSON {
    /**
     * Fabrique un tableau mutable vide au format JSON.
     * @param T type des éléments du tableau.
     */
    creerVideMutable<T>(): FormatTableauMutable<T> {
        return { taille: 0, tableau: [] };
    }
    /**
     * Fabrique d'un tableau vide au format JSON.
     * @param T type des éléments du tableau.
     */
    vide<T>(): FormatTableau<T> {
        return { taille: 0, tableau: [] };
    }

    /**
     * Fabrique un tableau mutable, à partir d'un tableau mutable en JSON.
     * @param T type des éléments du tableau.
     * @param tab tableau mutable de T en JSON.
     */
    creerEnveloppeMutable<T>(tab: T[]): FormatTableauMutable<T> {
        return { taille: tab.length, tableau: tab };
    }
    /**
     * Fabrique d'un tableau, à partir d'un tableau en JSON.
     * @param T type des éléments du tableau.
     * @param tab tableau de T en jSON.
     */
    enveloppe<T>(tab: ReadonlyArray<T>): FormatTableau<T> {
        return { taille: tab.length, tableau: tab };
    }
    /**
     * Mélange des éléments d'un tableau, en utilisant l'algorithme de
     * Fisher-Yates : (source : Wikipedia)
     * - To shuffle an array a of n elements (indices 0 to n-1):
     *   - for i from n-1 downto 1 do
     *     - j := random integer such that 0 ≤ j ≤ i
     *     - exchange a[j] and a[i]
     */
    melange<T>(tab: ReadonlyArray<T>): FormatTableau<T> {
        const n = tab.length;
        const t = new Array(n);
        for (let i in tab) {
            t[i] = tab[i];
        }
        for (let i = n - 1; i > 0; i--) {
            let j = entierAleatoire(i);
            [t[i], t[j]] = [t[j], t[i]];
        }
        return { taille: tab.length, tableau: t };
    }
}

/**
 * Fabrique singleton de tableaux.
 */
export const FABRIQUE_TABLEAU_JSON = new FabriqueTableauEnJSON();
/**
 * Classe singleton contenant les fonctions utiles pour les tableaux au format JSON.
 */
class ModuleTableauEnJSON {
    /**
     * Détermine si le tableau contient un élément vérifiant 
     * la propriété passée en argument.
     * 
     * @param tab tableau
     * @param propriete prédicat 
     * @returns renvoie true si le tableau contient un élément vérifiant la propriété, false sinon 
     */
    contient<T>(tab : FormatTableau<T>, propriete : (e : T) => boolean) : boolean {
        for(let i = 0; i < tab.taille; i++){
            if(propriete(tab.tableau[i])){
                return true;
            }
        }
        return false;
    }
    /**
     * Itère sur les associations du tableau.
     * @param f procédure appelée pendant l'itération.
     * @param t tableau.
     */
    iterer<T>(
        f: (index: number, val: T, tab?: ReadonlyArray<T>) => void,
        t: FormatTableau<T>
    ): void {
        t.tableau.forEach((v, i, t) => f(i, v, t));
    }

    /**
     * Valeur dans le tableau en la position donnée par l'index.
     * @param T type des éléments dans le tableau.
     * @param t tableau.
     * @param index position dans le tableau (précondition : 0 <= index < t.taille).
     * @returns la valeur de type T.
     */
    valeur<T>(t: FormatTableau<T>, index: number): T {
        return t.tableau[index];
    }

    /**
     * Taille du tableau.
     * @param t tableau.
     * @returns la taille (entier naturel).
     */
    taille<T>(t: FormatTableau<T>): number {
        return t.taille;
    }

    /**
     * Applique fonctoriellement f au tableau produisant un nouveau tableau mutable.
     * @param T type des éléments dans le tableau.
     * @param S type des éléments dans le nouveau tableau après transformation.
     * @param t tableau.
     * @param f fonction à appliquer à chaque valeur du tableau.
     * @returns un tableau mutable égale à la composition de t avec f (f o t).
     */
    appliquerFonctoriellement<T, S>(t: FormatTableau<T>, f: (x: T) => S): FormatTableauMutable<S> {
        let r: S[] = [];
        this.iterer((i, v) => {
            r[i] = f(v);
        }, t);
        return FABRIQUE_TABLEAU_JSON.creerEnveloppeMutable(r);
    }

    /**
     * Application fonctorielle de f au tableau produisant un nouveau tableau.
     * @param T type des éléments dans le tableau.
     * @param S type des éléments dans le nouveau tableau après transformation.
     * @param t tableau.
     * @param f fonction à appliquer à chaque valeur du tableau.
     * @returns un tableau égale à la composition de t avec f (f o t).
     */
    applicationFonctorielle<T, S>(t: FormatTableau<T>, f: (x: T) => S): FormatTableau<S> {
        let r: S[] = [];
        this.iterer((i, v) => {
            r[i] = f(v);
        }, t);
        return FABRIQUE_TABLEAU_JSON.enveloppe(r);
    }

    /**
     * Réduction du tableau en appliquant l'opération binaire à ses éléments.
     * Si l'opération est associative et notée +, le résultat se représente ainsi :
     * neutre + (Sigma_{0 <= i < taille} t[i]).
     * @param T type des éléments du tableau.
     * @param t tableau.
     * @param neutre élément neutre de l'opération, assoiciée au tableau vide.
     * @param op opération binaire.
     * @returns la valeur (...((neutre op t[0]) op t[1])...).
     */
    reduction<T>(t: FormatTableau<T>, neutre: T, op: (x: T, y: T) => T): T {
        let r: T = neutre;
        this.iterer((i, v) => {
            r = op(r, v);
        }, t);
        return r;
    }

    /**
     * Ajoute un element à la fin du tableau et incrémente la taille.
     * @param t tableau mutable.
     * @param x l'élément à ajouté
     */
    ajouterEnFin<T>(t: FormatTableauMutable<T>, x: T): void {
        t.taille++;
        t.tableau.push(x);
    }

    /**
     * Retire un élément a la fin du tableau et décrémente la taille, si possible,
     * déclenche une erreur sinon.
     * @param t tableau mutable.
     */
    retirerEnFin<T>(t: FormatTableauMutable<T>): T {
        let r = t.tableau.pop();
        if (typeof r === "undefined") {
            throw new Error("[Exception : retirerEnFin() non défini.]");
        } else {
            t.taille--;
            return r;
        }
    }
}

/**
 * Module singleton permettant de manipuler les tableaux au format JSON.
 */
const MODULE_TABLEAU_JSON = new ModuleTableauEnJSON();

/**
 * Etiquettes utilisées pour la représentation des tableaux.
 */
export type EtiquetteTableau = 'taille' | 'valeurs';

/**
 * Conversion fonctorielle d'un tableau mutable en un tableau.
 * @param conv fonction de conversion des éléments.
 * @returns fonction de conversion transformant un tableau mutable en un nouveau tableau
 *          après composition avec conv.
 */
export function conversionFormatTableau<TIN, TEX>(conv: (x: TIN) => TEX)
    : (t: FormatTableau<TIN>) => FormatTableau<TEX> {
    return (
        (t: FormatTableau<TIN>) => {
            let r: TEX[] = new Array(t.taille);
            MODULE_TABLEAU_JSON.iterer((i, v) => {
                r[i] = conv(v);
            }, t);
            return FABRIQUE_TABLEAU_JSON.enveloppe(r);
        });
}

/**
 * Tableau immutable étendant le type des enveloppes par des méthodes permettant :
 * - l'itération,
 * - l'application fonctorielle,
 * - la réduction,
 * - l'observation complète du tableau.
 * @param T type des éléments du tableau.
 */
export interface Tableau<T> extends
    TypeEnveloppe<FormatTableau<T>, EtiquetteTableau> {
    /**
     * Itère sur les éléments du tableau en appliquant la procédure passée
     * en argument.
     * @param f procédure prenant la position, la valeur et possiblement
     *          le tableau sous-jacent en entier.
     */
    iterer(
        f: (index: number, val: T, tab?: T[]) => void
    ): void;
    /**
     * Application fonctorielle de la fonction passée en argument.
     * Un nouveau tableau immutable est créé dont les valeurs sont les images
     * des valeurs de ce tableau.
     * @param f fonction à appliquer.
     */
    application<S>(f: (x: T) => S): Tableau<S>;
    /**
     * Réduction du tableau en une valeur.
     * Le résultat est, en notation infixe :
     * - neutre op v0 op v1 op ...
     * @param neutre élément neutre de l'opération.
     * @param op opération binaire appliquée aux éléments du tableau.
     */
    reduction(neutre: T, op: (x: T, y: T) => T): T;
    /**
     * Valeur en position index. Précondition : la position est entre zéro et la
     * longueur moins un.
     * @param index position dans le tableau.
     */
    valeur(index: number): T;
    /**
     * Taille du tableau.
     */
    taille(): number;
    /**
     * Détermine si ce tableau est vide.
     */
    estVide(): boolean;
}

/**
 * Tableau immutable implémenté par une enveloppe.
 * @param T type des valeurs dans le tableau.
 */
export class TableauParEnveloppe<T>
    extends Enveloppe<FormatTableau<T>, FormatTableau<T>, EtiquetteTableau>
    implements Tableau<T> {

    /**
     * Constructeur à partir d'une table au format JSON.
     * @param etat table au format JSON.
     */
    constructor(
        etat: FormatTableau<T>) {
        super((x) => x, etat);
    }
    /**
     * Représentation nette du tableau :
     * - taille : un entier naturel,
     * - valeurs : TODO.
     */
    net(e: EtiquetteTableau): string {
        switch (e) {
            case 'taille': return this.taille().toString();
            case 'valeurs': return this.etat().tableau.toString();
        }
        return jamais(e);
    }
    /**
     * Représentation du tableau sous la forme suivante :
     * - TODO.
     */
    representation(): string {
        return "[" + this.net('valeurs') + "]";
    }
    /**
     * Délégation à la méthode iterer du module.
     */
    iterer(
        f: (index: number, val: T, tab?: T[]) => void
    ): void {
        MODULE_TABLEAU_JSON.iterer(f, this.etat());
    }
    /**
     * Délégation à la méthode application du module.
     */
    application<S>(f: (x: T) => S): Tableau<S> {
        return new TableauParEnveloppe<S>(
            MODULE_TABLEAU_JSON.applicationFonctorielle(this.etat(), f));
    }
    /**
     * Délégation à la méthode reduction du module.
     */
    reduction(neutre: T, op: (x: T, y: T) => T): T {
        return MODULE_TABLEAU_JSON.reduction(
            this.etat(),
            neutre,
            op);
    }
    /**
     * Délégation à la méthode valeur du module.
     */
    valeur(i: number): T {
        return MODULE_TABLEAU_JSON.valeur(this.etat(), i);
    }
    /**
     * Délégation à la méthode taille du module.
     */
    taille(): number {
        return MODULE_TABLEAU_JSON.taille(this.etat());
    }
    /**
     * Teste si la taille vaut zéro.
     */
    estVide(): boolean {
        return this.taille() === 0;
    }
}

/**
 * Fabrique d'un tableau immutable à partir de sa description .
 * @param t tableau en JSON.
 */
export function tableau<T>(
    t: ReadonlyArray<T>): Tableau<T> {
    return new TableauParEnveloppe(FABRIQUE_TABLEAU_JSON.enveloppe(t));
}


/**
 * Tableau mutable obtenu par dérivation d'un tableau immutable
 *  et étendu avec les méthodes de mutation.
 * @param T type des valeurs contenues dans le tableau.
 */
export interface TableauMutable<T> extends Tableau<T> {
    /**
     * Ajoute en fin l'élément passé en argument.
     */
    ajouterEnFin(x: T): void;
    /**
     * Retire le dernier élément.
     */
    retirerEnFin(): T;
}


/**
 * Tableau mutable implémenté par une enveloppe.
 * TODO Attention : la méthode "val" requiert un parcours du tableau formant l'état.
 */
export class TableauMutableParEnveloppe<T>
    extends Enveloppe<FormatTableauMutable<T>, FormatTableau<T>, EtiquetteTableau>
    implements TableauMutable<T> {

    /**
     * Constructeur d'un tableau à partir d'une fonction de conversion
     * et d'un tableau décrit en JSON.
     * @param etat tableau au format JSON.
     */
    constructor(
        etat: FormatTableauMutable<T> = FABRIQUE_TABLEAU_JSON.creerVideMutable()) {
        super((x) => x, etat);
    }
    /**
     * Représentation nette du tableau :
     * - taille : un entier naturel,
     * - valeurs : TODO.
     */
    net(e: EtiquetteTableau): string {
        switch (e) {
            case 'taille': return this.taille().toString();
            case 'valeurs': return this.val().tableau.toString();
        }
        return jamais(e);
    }
    /**
     * Représentation du tableau sous la forme suivante :
     * - TODO.
     */
    representation(): string {
        return "[" + this.net('valeurs') + "]";
    }
    /**
     * Délégation à la méthode iterer du module. Méthode protégée.
     */
    iterer(
        f: (index: number, val: T, tab?: T[]) => void
    ): void {
        MODULE_TABLEAU_JSON.iterer(f, this.etat());
    }
    /**
     * Délégation à la méthode application du module.
     */
    application<S>(f: (x: T) => S): TableauMutable<S> {
        return new TableauMutableParEnveloppe<S>(
            MODULE_TABLEAU_JSON.appliquerFonctoriellement(
            this.etat(), f));
    }
    /**
     * Délégation aux méthodes application et reduction du module.
     */
    reduction(neutre: T, op: (x: T, y: T) => T): T {
        return MODULE_TABLEAU_JSON.reduction(
            this.etat(),
            neutre,
            op);
    }
    /**
     * Délégation à la méthode valeur du module.
     * @param i position dans le tableau.
     */
    valeur(i: number): T {
        return MODULE_TABLEAU_JSON.valeur(this.etat(), i);
    }
    /**
     * Délégation à la méthode taille du module.
     */
    taille(): number {
        return MODULE_TABLEAU_JSON.taille(this.etat());
    }
    /**
     * Teste si la taille vaut zéro.
     */
    estVide(): boolean {
        return this.taille() === 0;
    }
    /**
     * Délègue à la méthode ajouterEnFin du module.
     */
    ajouterEnFin(x: T): void {
        MODULE_TABLEAU_JSON.ajouterEnFin(this.etat(), x);
    }
    /**
     * Délègue à la méthode retirerEnFin du module.
     */
    retirerEnFin(): T {
        return MODULE_TABLEAU_JSON.retirerEnFin(this.etat());
    }
}

/**
 * Fabrique un tableau mutable vide.
 * @param conversionInEx fonction de conversion de TIN vers T.
 */
export function creerTableauMutableVide<T>() {
    return new TableauMutableParEnveloppe<T>();
}

/**
 * Fabrique un tableau mutable avec pour état le tableau passé en argument.
 * @param t tableau qui sera partagé.
 */
export function creerTableauMutableParEnveloppe<T>(
    t: T[])
    : TableauMutableParEnveloppe<T> {
    return new TableauMutableParEnveloppe(
        FABRIQUE_TABLEAU_JSON.creerEnveloppeMutable(t));
}

/**
 * Fabrique un tableau mutable avec pour état une copie du
 * tableau passé en argument.
 * @param t tableau qui sera copié.
 */
export function creerTableauMutableParCopie<T>(
    t: T[]
) {
    let r = creerTableauMutableVide();
    MODULE_TABLEAU_JSON.iterer((c, v) => r.ajouterEnFin(v),
        FABRIQUE_TABLEAU_JSON.creerEnveloppeMutable(t));
    return r;
}

