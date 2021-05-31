import { MesurableMutable, Mesurable, jamais } from "./typesAtomiques";
import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { Option, option, rienOption } from "./option";

/**
 * Format pour les tables mutables. C'est un type JSON si et seulement si T est un type JSON. 
 * Structure :
 * - taille : taille de la table
 * - table : table brute d'un type indexé associant
 *  à une chaîne une valeur dans T
 * 
 * @param T type des images
*/
export interface FormatTableMutable<T> extends MesurableMutable {
    readonly table: { [cle: string]: T }
}

/**
 * Format pour les tables immutables. C'est un type JSON si et seulement si T est un type JSON. 
 * Structure :
 * - taille : taille de la table
 * - table : table brute d'un type indexé associant
 *  à une chaîne une valeur dans T
 * 
 * @param T type des images
*/
export interface FormatTable<T> extends Mesurable {
    readonly table: { readonly [cle: string]: T }
}

/**
 * Fabrique de tables au format.
 */
class FabriqueFormatTable {
    /**
     * Fabrique une table vide mutable.
     * @returns la table vide mutable.
     */
    creerVideMutable<T>(): FormatTableMutable<T> {
        return { table: {}, taille: 0 };
    }
    /**
     * Fabrique d'une table vide.
     * @returns la table vide.
     */
    vide<T>(): FormatTable<T> {
        return { table: {}, taille: 0 };
    }
    /**
     * Fabrique une table mutable à partir d'associations fournies par une table brute { (cle1: val1), ... } représentant un 
     * graphe fonctionnel et d'une taille.
     * @param T type des éléments de la table
     * @param tab une table brute associant à chaque clé du domaine une valeur de type T.
     * @param t taille de la table
     * @returns la table mutable contenant les associations passées en argument.
     */
    creerFormatTableMutable<T>(tab: { [cle: string]: T; }, t: number): FormatTableMutable<T> {
        return { table: tab, taille: t };
    }
    /**
     * Fabrique une table à partir d'associations fournies par une 
     * table brute { (cle1: val1), ... } représentant un 
     * graphe fonctionnel et d'une taille.
     * @param T type des éléments de la table
     * @param tab une table brute associant à chaque clé du domaine une valeur de type T.
     * @param t taille de la table
     * @returns la table contenant les associations passées en argument.
     */
    formatTable<T>(tab: { readonly [cle: string]: T }, t: number): FormatTable<T> {
        return { table: tab, taille: t };
    }
}

/**
 * Fabrique de tables au format.
 */
export const FABRIQUE_FORMAT_TABLE = new FabriqueFormatTable();

/**
 * Classe singleton contenant les fonctions utiles pour les tables au format.
 */
class ModuleFormatTable {
    /**
     * Itère sur les associations de la table.
     * @param f procédure appelée pendant l'itération.
     * @param t table.
     */
    iterer<T>(
        f: (cle: string, val: T, tab?: { [cle: string]: T }, taille?: number) => void,
        t: FormatTable<T>
    ): void {
        for (let c in t.table) {
            f(c, t.table[c], t.table, t.taille);
        }
    }

    /**
     * Valeur de la table en la clé.
     * @param t table.
     * @param cle une chaîne du domaine (précondition : contient(t, cle) == true).
     * @returns valeur de t en cle.
     */
    valeur<T>(t: FormatTable<T>, cle: string): T {
        return t.table[cle];
    }

    /**
     * Détermine si la clé appartient au domaine de la table.
     * @param t table.
     * @param cle une chaîne quelconque.
     * @returns true si cle dans t, false sinon.
     */
    contient<T>(t: FormatTable<T>, cle: string): boolean {
        if (cle in t.table) {
            return true;
        }
        return false;
    }

    /**
     * Liste des valeurs de la table.
     * @param t table.
     * @returns un tableau en lecture seulement listant les valeurs.
     */
    image<T>(t: FormatTable<T>): ReadonlyArray<T> {
        let tab: T[] = [];
        this.iterer((c, v) => {
            tab.push(v);
        }, t);
        return tab;
    }

    /**
     * Liste des clés de la table.
     * @param t table.
     * @returns un tableau listant les clés.
     */
    domaine<T>(t: FormatTable<T>): ReadonlyArray<string> {
        let tab: string[] = [];
        this.iterer((c, v) => {
            tab.push(c);
        }, t);
        return tab;
    }

    /**
     * Nombre d'associations dans la table.
     * @param t table.
     * @returns un entier naturel égal au nombre d'associations.
     */
    taille<T>(t: FormatTable<T>): number {
        return t.taille;
    }

    /**
     * Nombre de clés dans la table indexée.
     * @param t table.
     * @returns un entier naturel égal au nombre d'associations.
     */
    nombreCles<T>(t: { [cle: string]: T }): number {
        let n: number = 0;
        for (let c in t) {
            n++;
        }
        return n;
    }

    /**
     * Applique fonctoriellement f à la table produisant une nouvelle table mutable.
     * @param T type des éléments dans la table.
     * @param S type des éléments dans la nouvelle table après transformation.
     * @param t table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une table mutable égale à la composition de t avec f (f o t).
     */
    appliquerFonctoriellement<T, S>(t: FormatTable<T>, f: (x: T) => S): FormatTableMutable<S> {
        let r: { [cle: string]: S }
            = {};
        this.iterer((c, v) => {
            r[c] = f(v);
        }, t);
        return FABRIQUE_FORMAT_TABLE.creerFormatTableMutable(r, t.taille);
    }

    /**
     * Application fonctorielle de f à la table mutable produisant une nouvelle table.
     * @param T type des éléments dans la table.
     * @param S type des éléments dans la nouvelle table après transformation.
     * @param t table mutable.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une table égale à la composition de t avec f (f o t).
     */
    applicationFonctorielle<T, S>(t: FormatTable<T>, f: (x: T) => S): FormatTable<S> {
        let r: { [cle: string]: S }
            = {};
        this.iterer((c, v) => {
            r[c] = f(v);
        }, t);
        return FABRIQUE_FORMAT_TABLE.formatTable(r, t.taille);
    }

    /**
     * Transformation fonctorielle de la table en un tableau de valeurs.
     * @param T type des éléments dans la table.
     * @param S type des éléments dans le tableau après transformation.
     * @param t table.
     * @param f fonction transformant une association de la table en une valeur dans le tableau.
     * @returns un tableau en lecture seulement formé des éléments f(cle, x), où (cle, x) parcourt la table.
     */
    transformationFonctorielleEnTableau<T, S>(t: FormatTable<T>, f: (cle: string, x: T) => S): ReadonlyArray<S> {
        let r: S[] = [];
        this.iterer((c, v) => {
            r.push(f(c, v));
        }, t);
        return r;
    }

    /**
     * Sélection d'une clé d'une table.
     * @param t table.
     * @returns une option contenant une clé de la table s'il en existe, vide sinon.
     */
    selectionCle<T>(t: FormatTable<T>): Option<string> {
        // sélection d'une clé
        for (let c in t.table) { // une seule itération
            return option(c);
        }
        return rienOption();
    }

    /**
     * Sélection d'une clé dont la valeur vérifie une propriété.
     * @param t table.
     * @param prop prédicat portant sur les valeurs.
     * @returns une option contenant une clé de la table s'il en existe une satisfaisante, vide sinon.
     */
    selectionCleSuivantCritere<T>(t: FormatTable<T>, prop: (x: T) => boolean): Option<string> {
        // sélection d'une clé
        for (let c in t.table) {
            if (prop(t.table[c])) {
                return option(c);
            }
        }
        return rienOption();
    }

    /**
     * Ajoute l'association (cle, x) à la table mutable t si la clé cle n'est pas utilisée,
     * ne fait rien sinon.
     * @param t table mutable.
     * @param cle clé.
     * @param x valeur.
     * @returns true si la valeur est ajoutée, false sinon. 
     */
    ajouter<T>(t: FormatTableMutable<T>, cle: string, x: T): boolean {
        if (!(cle in t.table)) {
            t.table[cle] = x;
            t.taille++;
            return true;
        }
        return false;
    }

    /**
     * Modifie ou ajoute l'association (cle, x) à la table mutable t.
     * @param t table mutable.
     * @param cle clé.
     * @param x valeur.
     * @returns une option contenant l'ancienne valeur en cas de modification, vide sinon.
     */
    modifier<T>(t: FormatTableMutable<T>, cle: string, x: T): Option<T> {
        if (!(cle in t.table)) {
            t.table[cle] = x;
            t.taille++;
            return rienOption();
        } else {
            const w = t.table[cle];
            t.table[cle] = x;
            return option(w);
        }

    }

    /**
     * Retire l'association (cle, ?) de la table mutable t 
     * si elle est présente, ne fait rien sinon.
     * @param t table mutable.
     * @param cle clé.
     * @returns une option contenant la valeur retirée ou vide.
     */
    retirer<T>(t: FormatTableMutable<T>, cle: string): Option<T> {
        if (cle in t.table) {
            const res = t.table[cle];
            delete t.table[cle];
            t.taille--;
            return option(res);
        }
        return rienOption();
    }

}

/**
 * Module singleton permettant de manipuler les tables au format.
 */
export const MODULE_TABLE = new ModuleFormatTable();

/**
 * Conversion fonctorielle d'une table mutable en une table.
 * @param conv fonction de conversion des éléments.
 * @returns fonction de conversion transformant 
 * une table mutable en une nouvelle table
 * après composition avec conv.
 */
export function conversionFormatTable<S, T>(conv: (x: S) => T)
    : (t: FormatTableMutable<S>) => FormatTable<T> {
    return (
        (t: FormatTableMutable<S>) => {
            return MODULE_TABLE.applicationFonctorielle(t, conv);
        });
}

/**
 * Etiquettes utilisées pour la représentation des tables.
 */
export type EtiquetteTable = 'taille' | 'graphe' | 'domaine' | 'image';

/**
 * Table immutable dérivée de TypeEnveloppe, utilisant 
 * le format FormatTable.
 * 
 * @param T type des valeurs dans la table. (requis : T convertible en JSON)
 */
export interface Table<T>
extends TypeEnveloppe<FormatTable<T>, FormatTable<T>, EtiquetteTable> {
    
    /**
     * Itère une procédure sur chaque association de la table.
     * @param f procédure appelée à chaque itération.
     */
    iterer(
        f: (cle: string, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void;
    /**
     * Valeur associée à la clé.
     * @param cle chaîne représentant une clé (précondition : this.contient(cle) == true).
     * @returns valeur associée à cle.
     */
    valeur(cle: string): T;
    /**
     * Teste si la clé appartient à la table.
     * @param cle chaîne représentant une clé.
     */
    contient(cle: string): boolean;
    /**
     * Liste des valeurs de la table.
     * @returns un tableau listant les valeurs.
     */
    image(): ReadonlyArray<T>;
    /**
     * Liste des clés de la table.
     * @returns un tableau listant les clés.
     */
    domaine(): ReadonlyArray<string>;
    /**
     * Nombre d'associations dans la table.
     * @returns un entier naturel égal au nombre d'associations.
     */
    taille(): number;
    /**
     * Teste si la table est vide ou non.
     * @retuns true si la table est vide, false sinon.
     */
    estVide() : boolean;
    /**
     * Sélection d'une clé de la table.
     * @returns une option contenant une clé de la table s'il en existe, vide sinon.
     */
    selectionCle(): Option<string>;
    /**
     * Sélection d'une clé dont la valeur vérifie une propriété.
     * @param prop prédicat portant sur les valeurs.
     * @returns une option contenant une clé de la table s'il en existe une satisfaisante, vide sinon.
     */
    selectionCleSuivantCritere(prop: (x: T) => boolean): Option<string>;
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table égale à la composition f o this.
     */
    application<S>(f: (x: T) => S): Table<S>; 
}


/**
 * Table dérivée d'Enveloppe, utilisant le format FormatTable.
 * Les méthodes de la classe utilisent le module MODULE_TABLE.
 * @param T type des valeurs dans la table (requis : format JSON ou convertible en JSON)
 */ 
class TableParEnveloppe<T>
    extends Enveloppe<FormatTable<T>, FormatTable<T>, EtiquetteTable> 
    implements Table<T>
    {
    /**
     * Constructeur à partir d'une table au format.
     * @param etat table au format.
     */
    constructor(etat: FormatTable<T>) {
        super(etat);
    }
    /**
     * Représentation JSON de la table.
     * @returns la table au format.
     */
    toJSON(): FormatTable<T> {
        return this.etat();
    }
    /**
     * Représentation paramétrée de la table sous forme d'une chaîne de caractères :
     * - taille : un entier naturel,
     * - domaine : un tableau de clés,
     * - image : un tableau de valeurs représentées au format JSON,
     * - graphe : un document JSON représentant la table par les associations (clé : valeur).
     * @param e étiquette pour sélectionner la représentation.
     * @returns une représentation de la table sous forme de chaîne de caractères.
     */
    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'domaine': return JSON.stringify(this.domaine());
            case 'image': return JSON.stringify(this.image());
            case 'graphe': return JSON.stringify(this.etat().table);
        }
        return jamais(e);
    }
    /**
     * Représentation de la table comme graphe au format.
     * @returns une représentation complète de la table par les associations (clé : valeur).
     */
    representation(): string {
        return this.net('graphe');
    }
    /**
     * Itère une procédure sur chaque association de la table.
     * @param f procédure appelée à chaque itération.
     */
    iterer(
        f: (cle: string, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void {
        MODULE_TABLE.iterer(f, this.etat());
    }
    /**
     * Valeur associée à la clé.
     * @param cle chaîne représentant une clé (précondition : this.contient(cle) == true).
     * @returns valeur associée à cle.
     */
    valeur(cle: string): T {
        return MODULE_TABLE.valeur(this.etat(), cle);
    }
    /**
     * Teste si la clé appartient à la table.
     * @param cle chaîne représentant une clé.
     */
    contient(cle: string): boolean {
        return MODULE_TABLE.contient(this.etat(), cle);
    }
    /**
     * Liste des valeurs de la table.
     * @returns un tableau listant les valeurs.
     */
    image(): ReadonlyArray<T> {
        return MODULE_TABLE.image(this.etat());
    }
    /**
     * Liste des clés de la table.
     * @returns un tableau listant les clés.
     */
    domaine(): ReadonlyArray<string> {
        return MODULE_TABLE.domaine(this.etat());
    }
    /**
     * Nombre d'associations dans la table.
     * @returns un entier naturel égal au nombre d'associations.
     */
    taille(): number {
        return MODULE_TABLE.taille(this.etat());
    }
    /**
     * Teste si la table est vide ou non.
     * @retuns true si la table est vide, false sinon.
     */
    estVide() : boolean {
        return this.taille() === 0;
    }

    /**
     * Sélection d'une clé d'une table.
     * @returns une clé de la table s'il en existe, une erreur sinon.
     */
    selectionCle(): Option<string> {
        return MODULE_TABLE.selectionCle(this.etat());
    }
    /**
     * Sélection d'une clé dont la valeur vérifie une propriété.
     * @param prop prédicat portant sur les valeurs.
     * @returns une clé de la table s'il en existe une satisfaisante, une erreur sinon.
     */
    selectionCleSuivantCritere(prop: (x: T) => boolean): Option<string> {
        return MODULE_TABLE.selectionCleSuivantCritere(this.etat(), prop);
    }
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table égale à la composition f o this.
     */
    application<S>(f: (x: T) => S): Table<S> {
        return new TableParEnveloppe<S>(
            MODULE_TABLE.applicationFonctorielle(this.etat(), f)
        );
    }
}

/**
 * Fabrique d'une table.
 * @param t table au format.
 */
export function table<T>(t: FormatTable<T>)
    : Table<T> {
    return new TableParEnveloppe(t);
}

/**
 * Table mutable obtenue par dérivation d'une table immutable
 *  et étendue avec les méthodes de mutation.
 * @param T type des valeurs contenues dans la table.
 */
export interface TableMutable<T> extends Table<T> {
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table égale à la composition f o this.
     */
    appliquer<S>(f: (x: T) => S): TableMutable<S>; 

    /**
     * Ajoute l'association (cle, x) à la table mutable si la 
     * clé n'est pas présente.
     * @param cle clé.
     * @param x valeur.
     * @returns true si la clé est ajoutée, false sinon.
     */
    ajouter(cle: string, x: T): boolean;
    /**
     * Modifie ou ajoute l'association (cle, x) à la table mutable.
     * @param cle clé.
     * @param x valeur.
     * @returns une option contenant l'ancienne valeur en cas de modification, vide sinon.
     */
    modifier(cle: string, x: T): Option<T>;
    /**
     * Retire l'association (cle, ?) de la table mutable.
     * @param cle clé.
     * @returns une option contenant la valeur retirée, vide sinon.
     */
    retirer(cle: string): Option<T>;
}

/**
 * Table mutable dérivée d'Enveloppe, utilisant les formats FormatTableMutable et FormatTable.
 * Les méthodes de la classe utilisent le module MODULE_TABLE.
 * @param T type des valeurs dans la table. (requis : format JSON ou convertible en JSON)
 */

class TableMutableParEnveloppe<T>
    extends Enveloppe<FormatTableMutable<T>, FormatTableMutable<T>, EtiquetteTable>
    implements TableMutable<T> {

    /**
     * Constructeur à partir d'une table au format.
     * @param etat table mutable au format.
     */
    constructor(
        etat: FormatTableMutable<T> = FABRIQUE_FORMAT_TABLE.creerVideMutable()) {
        super(etat);
    }
    /**
     * Une représentation JSON de la table.
     * @returns la table au format.
     */
    toJSON(): FormatTableMutable<T> {
        return this.etat();
    }

    /**
     * Représentation paramétrée de la table sous forme d'une chaîne de caractères : 
     * - taille : un entier naturel,
     * - domaine : un tableau de clés,
     * - image : un tableau de valeurs représentées au format JSON,
     * - graphe : un document JSON représentant la table par les associations (clé : valeur).
     * @param e étiquette pour sélectionner la représentation.
     * @returns une représentation de la table sous forme de chaîne de caractères.
     */
    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'domaine': return JSON.stringify(this.domaine());
            case 'image': return JSON.stringify(this.image());
            case 'graphe': return JSON.stringify(this.etat().table);
        }
        return jamais(e);
    }
    /**
     * Représentation de la table comme graphe au format JSON.
     * @returns une représentation complète de la table par les associations (clé : valeur).
     */
    representation(): string {
        return this.net('graphe');
    }
    /**
     * Itère une procédure sur chaque association de la table.
     * @param f procédure appelée à chaque itération.
     */
    iterer(
        f: (cle: string, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void {
        MODULE_TABLE.iterer(f, this.etat());
    }
    /**
     * Valeur associée à la clé.
     * @param cle chaîne représentant une clé (précondition : this.contient(cle) == true).
     * @returns valeur associée à cle.
     */
    valeur(cle: string): T {
        return MODULE_TABLE.valeur(this.etat(), cle);
    }
    /**
     * Teste si la clé appartient à la table.
     * @param cle chaîne représentant une clé.
     */
    contient(cle: string): boolean {
        return MODULE_TABLE.contient(this.etat(), cle);
    }
    /**
     * Liste des valeurs de la table mutable.
     * @returns un tableau listant les valeurs.
     */
    image(): ReadonlyArray<T> {
        return MODULE_TABLE.image(this.etat());
    }
    /**
      * Liste des clés de la table.
      * @returns un tableau listant les clés.
      */
    domaine(): ReadonlyArray<string> {
        return MODULE_TABLE.domaine(this.etat());
    }
    /**
     * Nombre d'associations dans la table.
     * @returns un entier naturel égal au nombre d'associations.
     */
    taille(): number {
        return MODULE_TABLE.taille(this.etat());
    }
    /**
     * Teste si la table est vide.
     */
    estVide(): boolean {
        return this.taille() === 0;
    }
    /**
      * Sélection d'une clé d'une table.
      * @returns une clé de la table s'il en existe, une erreur sinon.
      */
    selectionCle(): Option<string> {
        return MODULE_TABLE.selectionCle(this.etat());
    }
    /**
     * Sélection d'une clé dont la valeur vérifie une propriété.
     * @param prop prédicat portant sur les valeurs de la table mutable formant l'état.
     * @returns une clé de la table s'il en existe une satisfaisante, une erreur sinon.
     */
    selectionCleSuivantCritere(prop: (x: T) => boolean): Option<string> {
        return MODULE_TABLE.selectionCleSuivantCritere(this.etat(), prop);
    }
    /**
     * Ajoute l'association (cle, x) à la table mutable.
     * @param cle clé.
     * @param x valeur.
     * @returns true si l'association est ajoutée, false sinon.
     */
    ajouter(cle: string, x: T): boolean {
        return MODULE_TABLE.ajouter(this.etat(), cle, x);
    }
    /**
     * Modifie ou ajoute l'association (cle, x) à la table mutable.
     * @param cle clé.
     * @param x valeur.
     * @returns une option contenant l'ancienne valeur en cas de modification, vide sinon.
     */
    modifier(cle: string, x: T): Option<T> {
        return MODULE_TABLE.modifier(this.etat(), cle, x);
    }
    /**
     * Retire l'association (cle, ?) de la table mutable.
     * @param cle clé.
     */
    retirer(cle: string): Option<T> {
        return MODULE_TABLE.retirer(this.etat(), cle);
    }
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table égale à la composition f o this.
     */
    application<S>(f: (x: T) => S): Table<S> {
        return new TableParEnveloppe<S>(
            MODULE_TABLE.applicationFonctorielle(this.etat(), f)
        );
    }
    /**
     * Applique fonctoriellement f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table mutable égale à la composition f o this.
     */
    appliquer<S>(f: (x: T) => S): TableMutable<S> {
        return new TableMutableParEnveloppe<S>(
            MODULE_TABLE.appliquerFonctoriellement(this.etat(), f)
        );
    }

}

/**
 * Fabrique une table mutable vide.
 * @param T type des valeurs contenue dans la table. (recommandé : format JSON)
 */
export function creerTableMutableVide<T>():
    TableMutable<T> {
    return new TableMutableParEnveloppe(FABRIQUE_FORMAT_TABLE.creerVideMutable());
}

/**
 * Fabrique une table mutable à partir d'une table brute formée d'associations (cle, valeur de type T), en la partageant.
 * @param T type des valeurs dans la table. (requis : format JSON ou convertible en JSON)
 * @param t table brute mutable.
 * @param taille taille de la table
 */
export function creerTableMutableParEnveloppe<T>(
    t: { [cle: string]: T }, taille: number)
    : TableMutable<T> {
    return new TableMutableParEnveloppe(FABRIQUE_FORMAT_TABLE.creerFormatTableMutable(t, taille));
}


/**
 * Fabrique une table mutable à partir d'une table brute formée d'associations (cle, valeur de type T), en la copiant.
 * @param T type des valeurs dans la table mutable. (requis : format JSON ou convertible en JSON)
 * @param t table brute mutable.
 * @param taille taille de la table
 */
export function creerTableMutableParCopie<T>(
    t: { [cle: string]: T }, taille: number
): TableMutable<T> {
    let r = creerTableMutableVide<T>();
    MODULE_TABLE.iterer((c, v) => r.ajouter(c, v), FABRIQUE_FORMAT_TABLE.creerFormatTableMutable(t, taille));
    return r;
}