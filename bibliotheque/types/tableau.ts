/*
* Tableaux - Un tableau peut être considéré comme une fonction
* d'un segment initial de Nat dans un ensemble.
*/

import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { MesurableMutable, jamais, Mesurable } from "./typesAtomiques";
import { option, Option, rienOption } from "./option";
import { entierAleatoire } from "./nombres";

/**
 * Format pour un tableau mutable enveloppe d'un tableau natif (de type T[]). C'est un type JSON si et seulement si T est un type JSON. 
 * Invariant : taille == tableau.length.
 * @param T type des éléments du tableau.
 */
export interface FormatTableauMutable<T> extends MesurableMutable {
    readonly tableau: T[]
}

/**
 * Format pour un tableau enveloppe d'un tableau natif (de type ReadonlyArray<T>). C'est un type JSON si et seulement si T est un type JSON. 
 *  * Invariant : taille == tableau.length.
 * @param T type des éléments du tableau.
 */
export interface FormatTableau<T> extends Mesurable {
    readonly tableau: ReadonlyArray<T>
}


/**
 * Mélange des éléments d'un tableau, en utilisant l'algorithme de
 * Fisher-Yates : (source : Wikipedia)
 * - To shuffle an array a of n elements (indices 0 to n-1):
 *   - for i from n-1 downto 1 do
 *     - j := random integer such that 0 ≤ j ≤ i
 *     - exchange a[j] and a[i]
 */
export function melange<T>(tab: ReadonlyArray<T>): FormatTableau<T> {
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

/**
 * Classe singleton contenant les fonctions utiles pour les tableaux au format.
 */
class ModuleTableauAuFormat {
    /**
     * Sélectionne une association (indice, élément) vérifiant 
     * la propriété passée en argument.
     * 
     * @param tab tableau
     * @param propriete prédicat 
     * @returns une option contenant l'indice et l'élément vérifiant la propriété, rien sinon.
     */
    selection<T>(tab: FormatTableau<T>, propriete: (i : number, e: T) => boolean): Option<[number, T]> {
        for (let i = 0; i < tab.taille; i++) {
            const r = tab.tableau[i];
            if (propriete(i, r)) {
                return option([i, r]);
            }
        }
        return rienOption();
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
     * @param f fonction à appliquer à chaque association (indice, élément) du tableau.
     * @returns un tableau mutable contenant en i 
     *          l'élément f(i, t[i]).
     */
    appliquerFonctoriellement<T, S>(t: FormatTableau<T>, f: (i : number, x: T) => S): FormatTableauMutable<S> {
        let r: S[] = [];
        this.iterer((i, v) => {
            r[i] = f(i, v);
        }, t);
        return { taille: t.taille, tableau: r };
    }

    /**
     * Application fonctorielle de f au tableau produisant un nouveau tableau.
     * @param T type des éléments dans le tableau.
     * @param S type des éléments dans le nouveau tableau après transformation.
     * @param t tableau.
     * @param f fonction à appliquer à chaque association 
     *       (indice, élément) du tableau.
     * @returns un tableau mutable contenant en i 
     *          l'élément f(i, t[i]).
     */
    applicationFonctorielle<T, S>(t: FormatTableau<T>, f: (i : number, x: T) => S): FormatTableau<S> {
        let r: S[] = [];
        this.iterer((i, v) => {
            r[i] = f(i, v);
        }, t);
        return { taille: t.taille, tableau: r };
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
     * Crible des associations (indice, élément) du tableau vérifiant le prédicat.
     * @param t tableau au format
     * @param prop prédicat utilisé pour cribler
     * @returns un tableau au format contenant les associations vérifiant le prédicat.
     */
    crible<T>(t: FormatTableau<T>, prop: (i : number, x: T) => boolean): FormatTableau<T> {
        let r: T[] = [];
        this.iterer((i, x) => {
            if (prop(i, x)) {
                r.push(x);
            }
        }, t
        );
        return { taille: r.length, tableau: r };
    }
    /**
     * Crible les associations (indice, élément) du tableau vérifiant le prédicat.
     * @param t tableau au format
     * @param prop prédicat utilisé pour cribler
     * @returns un tableau mutable au format contenant les associations vérifiant le prédicat.
     */
    cribler<T>(t: FormatTableau<T>, prop: (i : number, x: T) => boolean): FormatTableauMutable<T> {
        let r: T[] = [];
        this.iterer((i, x) => {
            if (prop(i, x)) {
                r.push(x);
            }
        }, t
        );
        return { taille: r.length, tableau: r };
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
    /**
     * Modifie un élément du tableau à une position donnée.
     * @param t tableau mutable.
     * @param i index (position)
     * @param x nouvelle valeur
     * @returns option contenant l'ancienne valeur si modifiée, vide sinon.
     */
    modifier<T>(t: FormatTableauMutable<T>, i: number, x: T): Option<T> {
        if ((0 <= i) && (i < t.taille)) {
            const a = t.tableau[i];
            t.tableau[i] = x;
            return option(a);
        } else {
            return rienOption();
        }
    }
}

/**
 * Module singleton permettant de manipuler les tableaux au format.
 */
const MODULE_TABLEAU_AU_FORMAT = new ModuleTableauAuFormat();

/**
 * Etiquettes utilisées pour la représentation des tableaux.
 */
export type EtiquetteTableau = 'taille' | 'valeurs';

/**
 * Conversion fonctorielle d'un tableau mutable en un tableau.
 * @param conv fonction de conversion des éléments.
 * @returns fonction de conversion transformant un tableau mutable en un nouveau tableau après composition avec conv.
 */
export function conversionFormatTableau<S, T>(conv: (x: S) => T)
    : (t: FormatTableau<S>) => FormatTableau<T> {
    return (
        (t: FormatTableau<S>) => {
            return MODULE_TABLEAU_AU_FORMAT.applicationFonctorielle(t,(i, x) => conv(x));
        });
}

/**
 * Tableau générique immutable étendant le type des enveloppes par des méthodes permettant :
 * - l'itération,
 * - l'application fonctorielle,
 * - la réduction,
 * - l'observation complète du tableau.
 * @param T type des éléments du tableau.
 * @param E type de l'état, sous-type du format.
 */
interface TableauGenerique<T, E extends FormatTableau<T>> extends
    TypeEnveloppe<FormatTableau<T>, FormatTableau<T>, EtiquetteTableau> {
    /**
     * Itère sur les éléments du tableau en appliquant la procédure passée
     * en argument.
     * @param f procédure prenant la position, 
     * la valeur et possiblement
     * le tableau sous-jacent en entier.
     */
    iterer(
        f: (index: number, val: T, tab?: T[]) => void
    ): void;
    /**
     * Application fonctorielle de la fonction passée en argument.
     * @param f fonction à appliquer à un couple (indice, élément).
     * @returns un nouveau tableau immutable contenant 
     *          en l'indice i l'élément f(i, x) au lieu de x.  
     */
    application<S>(f: (i : number, x: T) => S): Tableau<S>;
    /**
     * Réduction du tableau en une valeur.
     * Le résultat est, en notation infixe 
     * pour le tableau [v0, v1, ...]:
     * - neutre op v0 op v1 op ...
     * @param neutre élément neutre de l'opération.
     * @param op opération binaire appliquée aux éléments du tableau.
     * @returns la valeur (...((neutre op v0) op v1)...) si le tableau contient v0, v1, ....
     */
    reduction(neutre: T, op: (x: T, y: T) => T): T;
    /**
     * Crible des associations (indice, élément) du tableau vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler
     */
    crible(prop: (i : number, x: T) => boolean): Tableau<T>;
    /**
     * Valeur en position index. 
     * Précondition : la position est entre zéro et la
     * longueur moins un.
     * @param index position dans le tableau.
     */
    valeur(index: number): T;
    /**
     * Taille du tableau.
     * @returns la taille.
     */
    taille(): number;
    /**
     * Détermine si ce tableau est vide.
     */
    estVide(): boolean;
    /**
     * Teste si la valeur appartient au tableau. Cette méthode
     * utilise une comparaison fondée sur l'égalité ===. 
     * Pour des objets, les références doivent être égales.
     * @param valeur valeur à rechercher dans le tableau.
     * @returns true s'il existe un élément e tel que e === val, false sinon.
     */
    contient(val: T): boolean;
    /**
     * Sélectionne une association (indice, élément)) 
     * du tableau vérifiant une propriété, s'il en existe.
     * @param prop prédicat.
     * @returns une option contenant l'indice et l'élément vérifiant la propriété, vide sinon.
     */
    selection(prop: (i : number, x: T) => boolean): Option<[number, T]>;
}

/**
 * Tableau immutable étendant le type des enveloppes par des méthodes permettant :
 * - l'itération,
 * - l'application fonctorielle,
 * - la réduction,
 * - l'observation complète du tableau.
 * @param T type des éléments du tableau.
 */
export type Tableau<T> = TableauGenerique<T, FormatTableau<T>>;

/**
 * Tableau immutable implémenté par une enveloppe.
 * @param T type des valeurs dans le tableau.
 */
class TableauGeneriqueParEnveloppe<T, E extends FormatTableau<T>>
    extends Enveloppe<E, FormatTableau<T>, EtiquetteTableau>
    implements TableauGenerique<T, E> {

    /**
     * Constructeur à partir d'un tableau au format.
     * @param etat tableau au format
     */
    constructor(etat: E) {
        super(etat);
    }
    /**
     * Représentation JSON du tableau.
     * @returns le tableau au format.
     */
    toJSON(): FormatTableau<T> {
        return this.etat();
    }
    /**
     * Représentation nette du tableau :
     * - taille : un entier naturel,
     * - valeurs : [v1, v2, ...]
     */
    net(e: EtiquetteTableau): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'valeurs': return JSON.stringify(this.etat().tableau);
        }
        return jamais(e);
    }
    /**
     * Représentation du tableau sous la forme suivante :
     * - [v1, v2, ...]
     */
    representation(): string {
        return this.net('valeurs');
    }
    /**
     * Itère sur les éléments du tableau en appliquant 
     * la procédure passée en argument.
     * Implémentation par délégation au module.
     * @param f procédure prenant la position, la valeur 
     * et possiblement le tableau sous-jacent en entier.
     */
    iterer(
        f: (index: number, val: T, tab?: T[]) => void
    ): void {
        MODULE_TABLEAU_AU_FORMAT.iterer(f, this.etat());
    }
    /*
     * Application fonctorielle de la fonction passée en argument.
     * @param f fonction à appliquer à chaque couple (indice, élément).
     * @returns un nouveau tableau immutable contenant 
     *          en l'indice i l'élément f(i, x) au lieu de x.  
     */
    application<S>(f: (i : number, x: T) => S): Tableau<S> {
        return new TableauGeneriqueParEnveloppe<S, FormatTableau<S>>(
            MODULE_TABLEAU_AU_FORMAT.applicationFonctorielle(this.etat(), f));
    }
    /**
     * Réduction du tableau en une valeur. Implémentation par délégation au module.
     * Le résultat est, en notation infixe :
     * - neutre op v0 op v1 op ...
     * @param neutre élément neutre de l'opération.
     * @param op opération binaire appliquée aux éléments du tableau.
     * @returns la valeur (...((neutre op t[0]) op t[1])...).
     */
    reduction(neutre: T, op: (x: T, y: T) => T): T {
        return MODULE_TABLEAU_AU_FORMAT.reduction(
            this.etat(),
            neutre,
            op);
    }
    /**
     * Crible des associations (indice, élément) du tableau vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler.
     * @returns tableau immutable contenant les associations vérifiant le prédicat.
     */
    crible(prop: (i : number, x: T) => boolean): Tableau<T> {
        return new TableauGeneriqueParEnveloppe<T, FormatTableau<T>>(
            MODULE_TABLEAU_AU_FORMAT.crible(this.etat(), prop)
        );
    }
    /**
     * Valeur en position index. 
     * Implémentation par délégation au module.
     * Précondition : la position est entre zéro et la
     * longueur moins un.
     * @param index position dans le tableau.
     */
    valeur(i: number): T {
        return MODULE_TABLEAU_AU_FORMAT.valeur(this.etat(), i);
    }
    /**
     * Taille du tableau. Implémentation par délégation au module.
     * @returns la taille.
     */
    taille(): number {
        return MODULE_TABLEAU_AU_FORMAT.taille(this.etat());
    }
    /**
     * Teste si la taille vaut zéro.
     */
    estVide(): boolean {
        return this.taille() === 0;
    }
    /**
     * Teste si la valeur appartient au tableau. Cette méthode
     * utilise une comparaison fondée sur l'égalité ===. 
     * Pour des objets, les références doivent être égales.
     * @param valeur valeur à rechercher dans le tableau
     */
    contient(val: T): boolean {
        return MODULE_TABLEAU_AU_FORMAT.selection(this.etat(), (i : number, x: T) => x === val).estPresent();
    }

    /**
     * Sélectionne un élément du tableau vérifiant une propriété,
     * s'il en existe.
     * @param prop prédicat.
     * @returns une option contenant l'indice et l'élément vérifiant la propriété, vide sinon.
     */
    selection(prop: (i : number, x: T) => boolean): Option<[number, T]> {
        return MODULE_TABLEAU_AU_FORMAT.selection(this.etat(), prop);
    }
}

/**
 * Fabrique d'un tableau immutable à partir de sa description native.
 * @param t tableau natif.
 */
export function tableauDeNatif<T>(
    t: ReadonlyArray<T>): Tableau<T> {
    return new TableauGeneriqueParEnveloppe({ taille: t.length, tableau: t });
}

/**
 * Fabrique d'un tableau immutable à partir de sa description au format.
 * @param t tableau au format.
 */
export function tableau<T>(
    t: FormatTableau<T>): Tableau<T> {
    return new TableauGeneriqueParEnveloppe(t);
}

/**
 * Tableau mutable obtenu par dérivation d'un tableau immutable
 *  et étendu avec les méthodes de mutation.
 * @param T type des valeurs contenues dans le tableau.
 */
export interface TableauMutable<T> extends TableauGenerique<T, FormatTableauMutable<T>> {
    /*
     * Applique fonctoriellement la fonction passée en argument aux associations (indice, élément) du tableau.
     * @param f fonction à appliquer.
     * @returns un tableau immutable contenant 
     *          en l'indice i l'élément f(i, x) au lieu de x.  
     */
    appliquer<S>(f: (i : number, x: T) => S): TableauMutable<S>;
    /**
     * Crible les associations (indice, élément) du tableau vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler.
     * @returns tableau mutable contenant les associations vérifiant le prédicat.
     */
    cribler(prop: (i : number, x: T) => boolean): TableauMutable<T>;
    /**
     * Modifie la valeur en une position donnée et renvoie l'ancienne 
     * valeur.
     * @param i position
     * @param x nouvelle valeur 
     * @return une option contenant l'ancienne valeur en cas de modification, vide sinon.
     */
    modifier(i: number, x: T): Option<T>;
    /**
     * Ajoute en fin l'élément passé en argument.
     * @param x élément ajouté.
     */
    ajouterEnFin(x: T): void;
    /**
     * Retire le dernier élément.
     * @returns élément retiré ou déclenche une exception.
     */
    retirerEnFin(): T;
}


/**
 * Tableau mutable implémenté par une enveloppe.
 * TODO Attention : la méthode "val" requiert un parcours du tableau formant l'état.
 */
class TableauMutableParEnveloppe<T>
    extends TableauGeneriqueParEnveloppe<T, FormatTableauMutable<T>>
    implements TableauMutable<T> {

    /**
     * Constructeur d'un tableau au format.
     * @param etat tableau au format, par défaut vide.
     */
    constructor(etat: FormatTableauMutable<T>
        = { taille: 0, tableau: [] }) {
        super(etat);
    }
    /*
     * Applique fonctoriellement la fonction passée en argument aux associations (indice, élément) du tableau.
     * @param f fonction à appliquer.
     * @returns un tableau immutable contenant 
     *          en l'indice i l'élément f(i, x) au lieu de x.  
     */
    appliquer<S>(f: (i : number, x: T) => S): TableauMutable<S>{
        return new TableauMutableParEnveloppe<S>(
            MODULE_TABLEAU_AU_FORMAT.appliquerFonctoriellement(this.etat(), f));
    }
    /**
     * Crible les associations (indice, élément) du tableau vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler.
     * @returns tableau mutable contenant les associations vérifiant le prédicat.
     */
    cribler(prop: (i : number, x: T) => boolean): TableauMutable<T> {
        return new TableauMutableParEnveloppe<T>(
            MODULE_TABLEAU_AU_FORMAT.cribler(this.etat(), prop)
        );
    }
    /**
     * Délègue à la méthode ajouterEnFin du module.
     */
    ajouterEnFin(x: T): void {
        MODULE_TABLEAU_AU_FORMAT.ajouterEnFin(this.etat(), x);
    }
    /**
     * Délègue à la méthode retirerEnFin du module.
     */
    retirerEnFin(): T {
        return MODULE_TABLEAU_AU_FORMAT.retirerEnFin(this.etat());
    }
    /**
     * Modifie la valeur en une position donnée et renvoie l'ancienne 
     * valeur.
     * @param i position
     * @param x nouvelle valeur 
     * @return une option contenant l'ancienne valeur en cas de modification, vide sinon.
     */
    modifier(i: number, x: T): Option<T> {
        return MODULE_TABLEAU_AU_FORMAT.modifier(this.etat(), i, x);
    }
}

/**
 * Fabrique un tableau mutable vide.
 */
export function creerTableauMutableVide<T>(): TableauMutable<T> {
    return new TableauMutableParEnveloppe<T>();
}

/**
 * Fabrique un tableau mutable avec pour état le tableau passé en argument.
 * @param t tableau qui sera partagé.
 */
export function creerTableauMutableParEnveloppe<T>(
    t: T[])
    : TableauMutable<T> {
    return new TableauMutableParEnveloppe(
        { taille: t.length, tableau: t });
}

/**
 * Fabrique un tableau mutable avec pour état une copie du
 * tableau passé en argument.
 * @param t tableau qui sera copié.
 */
export function creerTableauMutableParCopie<T>(
    t: T[]
): TableauMutable<T> {
    let r = creerTableauMutableVide<T>();
    MODULE_TABLEAU_AU_FORMAT.iterer(
        (c, v) => (r.ajouterEnFin(v)),
        { taille: t.length, tableau: t });
    return r;
}

