import { MesurableMutable, Mesurable, jamais } from "./typesAtomiques";
import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { Option, option, rienOption } from "./option";
import { FormatTableau } from "./tableau";

/**
 * Format pour les tables mutables. 
 * Structure :
 * - taille : taille de la table
 * - table : table native d'un type indexé associant
 *  à une chaîne une valeur dans T
 * 
 * @param T type des images
*/
export interface FormatTableMutable<T> extends MesurableMutable {
    readonly table: { [cle: string]: T }
}

/**
 * Format pour les tables immutables. 
 * Structure :
 * - taille : taille de la table
 * - table : table native d'un type indexé associant
 *  à une chaîne une valeur dans T
 * 
 * @param T type des images
*/
export interface FormatTable<T> extends Mesurable {
    readonly table: { readonly [cle: string]: T }
}


/**
 * Classe singleton contenant les fonctions utiles pour les tables au format.
 */
class ModuleTableAuFormat {
    /**
     * Itère sur les associations de la table.
     * @param f procédure appelée pendant l'itération.
     * @param t table au format.
     */
    iterer<T>(
        f: (cle: string, val: T) => void,
        t: FormatTable<T>
    ): void {
        for (let c in t.table) {
            f(c, t.table[c]);
        }
    }

    /**
     * Valeur de la table en la clé.
     * @param t table au format.
     * @param cle une chaîne du domaine (précondition : contient(t, cle) === true).
     * @returns valeur de t en cle.
     */
    valeur<T>(t: FormatTable<T>, cle: string): T {
        return t.table[cle];
    }

    /**
     * Détermine si la clé appartient au domaine de la table.
     * @param t table au format.
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
     * @param t table au format.
     * @returns un tableau au format listant les valeurs.
     */
    image<T>(t: FormatTable<T>): FormatTableau<T> {
        let tab: T[] = [];
        this.iterer((c, v) => {
            tab.push(v);
        }, t);
        return { taille : t.taille, tableau : tab};
    }

    /**
     * Liste des clés de la table.
     * @param t table au format.
     * @returns un tableau au format listant les clés.
     */
    domaine<T>(t: FormatTable<T>): FormatTableau<string> {
        let tab: string[] = [];
        this.iterer((c, v) => {
            tab.push(c);
        }, t);
        return { taille : t.taille, tableau : tab };
    }

    /**
     * Nombre de clés dans la table indexée.
     * @param t table native.
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
     * @param t table au format.
     * @param f fonction à appliquer à chaque association (clé, élément)  de la table.
     * @returns une table mutable formée d'associations (clé, f(clé, v) au lieu de (clé, v).
     */
    appliquerFonctoriellement<T, S>(t: FormatTable<T>, f: (cle : string, x: T) => S): FormatTableMutable<S> {
        let r: { [cle: string]: S }
            = {};
        this.iterer((c, v) => {
            r[c] = f(c, v);
        }, t);
        return { taille : t.taille, table : r };
    }

    /**
     * Application fonctorielle de f à la table mutable produisant une nouvelle table.
     * @param T type des éléments dans la table.
     * @param S type des éléments dans la nouvelle table après transformation.
     * @param t table mutable.
     * @param f fonction à appliquer à chaque association (clé, élément) de la table.
     * @returns une table formée d'associations (clé, f(clé, v) au lieu de (clé, v).
     */
    applicationFonctorielle<T, S>(t: FormatTable<T>, f: (cle : string, x: T) => S): FormatTable<S> {
        let r: { [cle: string]: S }
            = {};
        this.iterer((c, v) => {
            r[c] = f(c, v);
        }, t);
        return { taille : t.taille, table : r };
    }

    /**
     * Transformation fonctorielle de la table en un tableau de valeurs.
     * @param T type des éléments dans la table.
     * @param S type des éléments dans le tableau après transformation.
     * @param t table au format.
     * @param f fonction transformant une association de la table en une valeur dans le tableau.
     * @returns un tableau formé des éléments f(cle, x), où (cle, x) parcourt la table.
     */
    transformationFonctorielleEnTableau<T, S>(t: FormatTable<T>, f: (cle: string, x: T) => S): FormatTableau<S> {
        let r: S[] = [];
        this.iterer((c, v) => {
            r.push(f(c, v));
        }, t);
        return { taille : t.taille, tableau : r};
    }

    /**
     * Sélection d'une association (clé, valeur) d'une table
     * @param t table au format.
     * @returns une option contenant une association de la table s'il en existe, vide sinon.
     */
    selectionAssociation<T>(t: FormatTable<T>): Option<[string, T]> {
        // sélection d'une clé
        for (let c in t.table) { // une seule itération
            return option([c, t.table[c]]);
        }
        return rienOption();
    }

    /**
     * Sélection d'une association (clé, valeur) 
     * de la table vérifiant une propriété.
     * @param t table au format.
     * @param prop prédicat portant sur les associations.
     * @returns une option contenant une association 
     * (clé, valeur) de la table s'il en existe 
     * une satisfaisante, vide sinon.
     */
    selectionAssociationSuivantCritere<T>(t: FormatTable<T>, prop: (cle : string, x: T) => boolean): Option<[string, T]> {
        // sélection d'une clé
        for (let c in t.table) {
            const e = t.table[c];
            if (prop(c, e)) {
                return option([c, e]);
            }
        }
        return rienOption();
    }

    /**
     * Ajoute l'association à la table mutable si la clé n'est 
     * pas utilisée, ne fait rien sinon.
     * @param t table mutable.
     * @param cle clé.
     * @param x valeur.
     * @returns true et t.table'[cle] === x si initialement cle n'appartient pas à t.table, false et sans effet sinon. 
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
     * Modifie ou ajoute l'association à la table mutable.
     * @param t table mutable.
     * @param cle clé.
     * @param x valeur.
     * @returns une option contenant l'ancienne valeur t.table[cle] en cas de modification, vide en cas d'ajout et l'effet t.table'[cle] === x.
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
     * Retire l'association associée à la clé de la table mutable 
     * si elle est présente, ne fait rien sinon.
     * @param t table mutable.
     * @param cle clé.
     * @returns une option contenant la valeur retirée ou vide sinon.
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
export const MODULE_TABLE = new ModuleTableAuFormat();

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
            return MODULE_TABLE.applicationFonctorielle(t, (c, v) => conv(v));
        });
}

/**
 * Etiquettes utilisées pour la représentation des tables.
 */
export type EtiquetteTable = 'taille' | 'graphe' | 'domaine' | 'image';

/**
 * Table générique immutable dérivée de TypeEnveloppe, utilisant 
 * le format FormatTable. Le type de l'état est générique, 
 * permettant une factorisation. Voir Table<T>.
 * 
 * @param T type des valeurs dans la table. 
 * @param E type de l'état sous-type de FormatTable
 */
interface TableGenerique<T, E extends FormatTable<T>>
extends TypeEnveloppe<E, FormatTable<T>, EtiquetteTable> {
    /**
     * Itère une procédure sur chaque association de la table.
     * @param f procédure appelée à chaque itération.
     */
    iterer(
        f: (cle: string, val: T) => void
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
    image(): FormatTableau<T>;
    /**
     * Liste des clés de la table.
     * @returns un tableau listant les clés.
     */
    domaine(): FormatTableau<string>;
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
     * Sélection d'une association (identifiant, valeur) d'une table
     * @returns une option contenant une association de la table s'il en existe, vide sinon.
     */
    selectionAssociation(): Option<[string, T]>;

    /**
     * Sélection d'une association (cle, valeur) 
     * de la table vérifiant une propriété.
     * @param prop prédicat portant sur les associations.
     * @returns une option contenant une association 
     * (clé, valeur) de la table s'il en existe 
     * une satisfaisante, vide sinon.
     */
    selectionAssociationSuivantCritere(prop: (cle : string, x: T) => boolean): Option<[string, T]> ;
    
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une table formée d'associations (clé, f(clé, élément)) au lieu de (clé, élément).
     */
    application<S>(f: (cle : string, x: T) => S): Table<S>; 
}

/**
 * Table immutable étendant le type des enveloppes 
 * par des méthodes permettant :
 * - l'itération,
 * - l'application fonctorielle,
 * - l'observation complète de la table.
 * Une table associe à une chaîne de caractères 
 * une valeur dans T. 
 * @param T type des valeurs de la table.
 */
export type Table<T> = TableGenerique<T, FormatTable<T>>

/**
 * Table générique dérivée d'Enveloppe, 
 * utilisant le format FormatTable.
 * Les méthodes de la classe utilisent le module MODULE_TABLE.
 * @param T type des valeurs dans la table.
 * @param E type de l'état sous-type de FormatTable.
 */ 
class TableGeneriqueParEnveloppe<T, E extends FormatTable<T>>
    extends Enveloppe<E, FormatTable<T>, EtiquetteTable> 
    implements TableGenerique<T, E>
    {
    /**
     * Constructeur à partir d'une table au format.
     * @param etat table au format.
     */
    constructor(etat: E) {
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
        f: (cle: string, val: T) => void
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
     * @returns un tableau au format listant les valeurs.
     */
    image(): FormatTableau<T> {
        return MODULE_TABLE.image(this.etat());
    }
    /**
     * Liste des clés de la table.
     * @returns un tableau au format listant les clés.
     */
    domaine(): FormatTableau<string> {
        return MODULE_TABLE.domaine(this.etat());
    }
    /**
     * Nombre d'associations dans la table.
     * @returns un entier naturel égal au nombre d'associations.
     */
    taille(): number {
        return this.etat().taille;
    }
    /**
     * Teste si la table est vide ou non.
     * @retuns true si la table est vide, false sinon.
     */
    estVide() : boolean {
        return this.taille() === 0;
    }

    /**
     * Sélection d'une association (identifiant, valeur) d'une table
     * @param t table au format.
     * @returns une option contenant une association de la table s'il en existe, vide sinon.
     */
    selectionAssociation(): Option<[string, T]> {
        return MODULE_TABLE.selectionAssociation(this.etat());
    }

    /**
     * Sélection d'une association (cle, valeur) 
     * de la table vérifiant une propriété.
     * @param t table au format.
     * @param prop prédicat portant sur les associations.
     * @returns une option contenant une association 
     * (clé, valeur) de la table s'il en existe 
     * une satisfaisante, vide sinon.
     */
    selectionAssociationSuivantCritere(
        prop: (cle : string, x: T) => boolean) : Option<[string, T]> {
        return MODULE_TABLE.selectionAssociationSuivantCritere(this.etat(), prop);
    }

    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table formée d'associations (clé, f(t[clé]).
     */
    application<S>(f: (cle : string, x: T) => S): Table<S> {
        return new TableGeneriqueParEnveloppe<S, FormatTable<S>>(
            MODULE_TABLE.applicationFonctorielle(this.etat(), f)
        );
    }
}

/**
 * Fabrique d'une table immutable à partir de sa description native.
 * @param t table native.
 */
export function tableauDeNatif<T>(
    t: { [cle : string] : T}): Table<T> {
    return new TableGeneriqueParEnveloppe({ 
        taille: MODULE_TABLE.nombreCles(t), 
        table: t });
}


/**
 * Fabrique d'une table.
 * @param t table au format.
 */
export function table<T>(t: FormatTable<T>)
    : Table<T> {
    return new TableGeneriqueParEnveloppe(t);
}

/**
 * Table mutable obtenue par dérivation d'une table immutable
 *  et étendue avec les méthodes de mutation.
 * @param T type des valeurs contenues dans la table.
 */
export interface TableMutable<T> extends Table<T> {
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table mutable formée d'associations (clé, f(clé, x)) au lieu de (clé, x).
     */
    appliquer<S>(f: (cle : string, x: T) => S): TableMutable<S>; 

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
 * Table mutable dérivée de la table générique et d'Enveloppe,
 * utilisant les formats FormatTableMutable et FormatTable.
 * @param T type des valeurs dans la table.
 */

class TableMutableParEnveloppe<T>
    extends TableGeneriqueParEnveloppe<T, FormatTableMutable<T>>
    implements TableMutable<T> {

    /**
     * Constructeur à partir d'une table au format.
     * @param etat table mutable au format.
     */
    constructor(
        etat: FormatTableMutable<T> = {taille : 0, table : {}}) {
        super(etat);
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
     * Applique fonctoriellement f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table mutable formée 
     * d'associations (clé, f(t[clé]).
     */
    appliquer<S>(f: (cle : string, x: T) => S): TableMutable<S> {
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
    return new TableMutableParEnveloppe({taille : 0, table : {}});
}

/**
 * Fabrique une table mutable à partir d'une table au format.
 * @param T type des valeurs dans la table.
 * @param tab table mutable au format.
 * @returns une table mutable ayant pour état tab.
 */
export function creerTableMutable<T>(
    tab: FormatTableMutable<T>)
    : TableMutable<T> {
    return new TableMutableParEnveloppe(tab);
}


/**
 * Fabrique une table mutable à partir d'une table brute formée d'associations (cle, valeur de type T), en la copiant.
 * @param T type des valeurs dans la table mutable. (requis : format JSON ou convertible en JSON)
 * @param tab table mutable au format.
 * @returns une table mutable avec pour état une copie superficielle de la table au format.
 */
export function creerTableMutableParCopie<T>(tab : FormatTableMutable<T>) : TableMutable<T> {
    return creerTableMutable(tab).appliquer((cle, x) => x);
}