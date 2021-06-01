import { Enveloppe, TypeEnveloppe } from './enveloppe';
import { FormatTableMutable, FormatTable, MODULE_TABLE, EtiquetteTable, FABRIQUE_FORMAT_TABLE } from './table';
import { EnsembleSortes, Identifiant, identifiant } from './identifiant';
import { jamais } from './typesAtomiques';
import { option, Option, rienOption } from './option';


/**
 * Format pour les tables d'identification mutables. 
 * Requis : T est convertible en un type JSON.
 * Structure :
 * - identification
 *   - taille : taille de la table
 *   - table : type indexé associant à la valeur d'un identifiant
 * (une chaîne) une valeur dans T
 * - sorte : sorte des identifiants (une chaîne)
 * @param Sorte type singleton représentant la sorte des identifiants 
 * @param T le type contenu dans la table
*/
export interface FormatTableIdentificationMutable<Sorte extends string, T> {
    identification: FormatTableMutable<T>,
    readonly sorte: Sorte
}
/**
 * Fabrique une table d'identification au bon format à partir des données.
* Précondition : les clés de la table doivent être des valeurs d'identifiants de la sorte passée en argument.
 * @param Sorte type singleton représentant la sorte des identifiants 
 * @param T le type contenu dans la table
 * @param t une table mutable de T au format
 * @param s la sorte des identifiants
 */
export function creerTableIdentificationMutableAuFormat<Sorte extends string, T>(
    t: FormatTableMutable<T>, s: Sorte):
    FormatTableIdentificationMutable<Sorte, T> {
    return {
        "identification": t,
        "sorte": s
    };
}

/**
 * Format pour les tables d'identifications. 
 * Requis : T est convertible en un type JSON.
 * Structure :
 * - identification
 *   - taille : taille de la table
 *   - table : type indexé associant à la valeur d'un identifiant
 * (une chaîne) une valeur dans T
 * - sorte : sorte des identifiants (une chaîne)
 * @param Sorte type singleton représentant la sorte des identifiants 
 * @param T le type contenu dans la table
*/
export interface FormatTableIdentification<Sorte extends string, T> {
    readonly identification: FormatTable<T>,
    readonly sorte: Sorte
}

/**
 * Fabrique d'une table d'identification au bon format à partir d'une table en JSON.
 * Précondition : les clés de la table doivent être des valeurs d'identifiants de la sorte passée en argument.
 * @param Sorte type singleton représentant la sorte des identifiants 
 * @param T le type contenu dans la table
 * @param t une table mutable de T au format
 * @param s la sorte des identifiants
 */
export function tableIdentificationAuFormat<Sorte extends string, T>(
    t: FormatTable<T>, s: Sorte):
    FormatTableIdentification<Sorte, T> {
    return {
        "identification": t,
        "sorte": s
    };
}

/**
 * Conversion fonctorielle d'une table d'identification mutable
 * en une table d'identification.
 * @param Sorte type singleton représentant la sorte des identifiants 
 * @param S le type contenu dans la table de départ
 * @param T le type contenu dans la table d'arrivée
 * @param conv fonction de conversion des éléments de S vers T.
 * @returns fonction de conversion transformant une table d'identification mutable en une nouvelle table d'identification après composition avec conv.
 */
export function conversionFormatTableIdentification<
    Sorte extends string, S, T
>(conv: (x: S) => T, s: Sorte)
    : (t: FormatTableIdentification<Sorte, S>)
        => FormatTableIdentification<Sorte, T> {
    return (
        (t: FormatTableIdentificationMutable<Sorte, S>) => {
            return tableIdentificationAuFormat(
                MODULE_TABLE.applicationFonctorielle(t.identification, conv),
                s
            );
        });
}

/**
 * Interface pour les tables d'identification. TODO à commenter
 */
export interface TableIdentification<Sorte extends EnsembleSortes, T>
    extends TypeEnveloppe<
        FormatTableIdentification<Sorte, T>, FormatTableIdentification<Sorte, T>, 
        EtiquetteTable> {
    /**
     * Itère une procédure sur chaque association de la table.
     * @param f procédure appelée à chaque itération.
     */
    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void;
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table égale à la composition f o this.
     */
    application<S>(f: (x: T) => S): TableIdentification<Sorte, S>;
    /**
     * Valeur associée à l'identifiant.
     * @param ID_sorte chaîne représentant une clé (précondition : this.contient(ID_sorte) == true).
     * @returns valeur associée à cle.
     */
    valeur(ID_sorte: Identifiant<Sorte>): T;
    /**
     * Teste si la clé appartient à la table.
     * @param ID_sorte chaîne représentant une clé.
     */
    contient(ID_sorte: Identifiant<Sorte>): boolean;
    /**
     * Liste des valeurs de la table.
     * @returns un tableau listant les valeurs.
     */
    image(): ReadonlyArray<T>;
    /**
     * Liste des identifiants de la table.
     * @returns un tableau listant les identifiants servant de clé.
     */
    domaine(): ReadonlyArray<Identifiant<Sorte>>;
    /**
     * Sélection d'un identifiant clé de la table.
     * @returns une option contenant un identifiant de la table s'il en existe, vide sinon.
     */
    selectionCle(): Option<Identifiant<Sorte>>;
    /**
     * Sélection d'un identifiant clé dont la valeur vérifie une propriété.
     * @param prop prédicat portant sur les valeurs.
     * @returns une option contenant un identifiant de la table s'il en existe un satisfaisant, vide sinon.
     */
    selectionCleSuivantCritere(prop: (x: T) => boolean): Option<Identifiant<Sorte>>;
    /**
     * Nombre d'associations dans la table.
     * @returns un entier naturel égal au nombre d'associations.
     */
    taille(): number;
    /**
     * Teste si la table est vide ou non.
     * @retuns true si la table est vide, false sinon.
     */
    estVide(): boolean;
}


/**
 * Table d'identification mutable utilisant la valeur d'identificateurs
 * comme clé.
 */
export interface TableIdentificationMutable<Sorte extends EnsembleSortes, T>
    extends TableIdentification<Sorte, T> {
    /**
     * Ajoute l'association (cle, x) à la table mutable si la 
     * clé n'est pas présente.
     * @param ID_sorte identifiant servant de clé.
     * @param x valeur.
     * @returns true si la clé est ajoutée, false sinon.
     */
    ajouter(ID_sorte: Identifiant<Sorte>, x: T): boolean;
    /**
     * Modifie ou ajoute l'association (cle, x) à la table mutable.
     * @param ID_sorte identifiant servant de clé.
     * @param x valeur.
     * @returns une option contenant l'ancienne valeur en cas de modification, vide sinon.
     */
    modifier(ID_sorte: Identifiant<Sorte>, x: T): Option<T>;
    /**
     * Retire l'association (cle, ?) de la table mutable.
     * @param ID_sorte identifiant servant de clé.
     * @returns une option contenant la valeur retirée, vide sinon.
     */
    retirer(ID_sorte: Identifiant<Sorte>): Option<T>;
}

/**
 * Table d'identification mutable utilisant la valeur d'identificateurs
 * comme clé.
 */
class TableIdentificationMutableParEnveloppe<Sorte extends EnsembleSortes, T>
    extends Enveloppe<
        FormatTableIdentificationMutable<Sorte, T>,
        FormatTableIdentification<Sorte, T>,
        EtiquetteTable>
    implements TableIdentificationMutable<Sorte, T> {
    
    constructor(
        protected sorte: Sorte,
        etat: FormatTableIdentificationMutable<Sorte, T> =
            creerTableIdentificationMutableAuFormat(FABRIQUE_FORMAT_TABLE.creerVideMutable(), sorte)) {
        super(etat);
    }
    toJSON(): FormatTableIdentification<Sorte, T> {
        return this.etat();
    }
    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'domaine': return JSON.stringify(this.domaine());
            case 'image': return JSON.stringify(this.image());
            case 'graphe': return JSON.stringify(this.etat().identification.table);
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('graphe');
    }

    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void {
        MODULE_TABLE.iterer((id, v, tab, taille) =>
            f(identifiant(this.sorte, id), v, tab, taille), this.etat().identification);
    }

    valeur(ID_sorte: Identifiant<Sorte>): T {
        return MODULE_TABLE.valeur(this.etat().identification, ID_sorte.val);
    }

    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return MODULE_TABLE.contient(this.etat().identification, ID_sorte.val);
    }
    image(): ReadonlyArray<T> {
        return MODULE_TABLE.image(this.etat().identification);
    }

    domaine(): ReadonlyArray<Identifiant<Sorte>> {
        return MODULE_TABLE.transformationFonctorielleEnTableau(this.etat().identification, (c, v) => identifiant(this.sorte, c));
        // moins efficace : return MODULE_TABLE.domaine(this.val()).
        //    map((s) => { return { val: s, sorte: this.sorte } });
    }
    selectionCle(): Option<Identifiant<Sorte>> {
        return MODULE_TABLE.selectionCle(this.etat().identification).filtrage(
            (id) => option(identifiant(this.sorte, id)),
            () => rienOption()
        );
    }
    selectionCleSuivantCritere(prop: (x: T) => boolean): Option<Identifiant<Sorte>> {
        return MODULE_TABLE.selectionCleSuivantCritere(this.etat().identification, prop).filtrage(
            (id) => option(identifiant(this.sorte, id)),
            () => rienOption()
        );
    }

    taille(): number {
        return MODULE_TABLE.taille(this.etat().identification);
    }
    estVide(): boolean {
        return this.taille() === 0;
    }

    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque valeur de la table.
     * @returns une nouvelle table égale à la composition f o this.
     */
    application<S>(f: (x: T) => S): TableIdentificationMutable<Sorte, S> {
        return creerTableIdentificationMutableParCopie(this.sorte, f, this.etat()); // TODO plus direct ?
    }

    ajouter(ID_sorte: Identifiant<Sorte>, x: T): boolean {
        return MODULE_TABLE.ajouter(this.etat().identification, ID_sorte.val, x);
    }
    modifier(ID_sorte: Identifiant<Sorte>, x: T): Option<T> {
        return MODULE_TABLE.modifier(this.etat().identification, ID_sorte.val, x);
    }
    retirer(ID_sorte: Identifiant<Sorte>): Option<T> {
        return MODULE_TABLE.retirer(this.etat().identification, ID_sorte.val);
    }
}
export function creerTableIdentificationMutableVide<Sorte extends EnsembleSortes, T>(
    sorte: Sorte
): TableIdentificationMutable<Sorte, T> {
    return new TableIdentificationMutableParEnveloppe<Sorte, T>(sorte);
}
/*
* Création par copie de la table.
*/
export function creerTableIdentificationMutableParCopie<Sorte extends EnsembleSortes, S, T>(
    sorte: Sorte, transformation: (x: S) => T,
    table: FormatTableIdentification<Sorte, S>
): TableIdentificationMutable<Sorte, T> {
    let r = creerTableIdentificationMutableVide<Sorte, T>(sorte);
    MODULE_TABLE.iterer((c, v) => r.ajouter(identifiant(sorte, c), transformation(v)), table.identification);
    return r;
}

/*
 *  Création d'une enveloppe de la table passée en argument (qui est donc partagée).
 */
export function creerTableIdentificationMutableParEnveloppe<Sorte extends EnsembleSortes, T>(
    sorte: Sorte,
    table: FormatTableIdentificationMutable<Sorte, T>
) {
    return new TableIdentificationMutableParEnveloppe<Sorte, T>(sorte, table);
}



// TODO commentaires version immutable.
class TableIdentificationParEnveloppe<Sorte extends EnsembleSortes, T>
    extends Enveloppe<
    FormatTableIdentification<Sorte, T>,
    FormatTableIdentification<Sorte, T>,
    EtiquetteTable>
    implements TableIdentification<Sorte, T> {

    constructor(
        protected sorte: Sorte,
        etat: FormatTableIdentification<Sorte, T> =
            tableIdentificationAuFormat(FABRIQUE_FORMAT_TABLE.vide(), sorte)) {
        super(etat);
    }

    toJSON(): FormatTableIdentification<Sorte, T> {
        return this.etat();
    }

    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'domaine': return JSON.stringify(this.domaine());
            case 'image': return JSON.stringify(this.image());
            case 'graphe': return JSON.stringify(this.etat().identification.table);
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('graphe');
    }

    
    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void {
        MODULE_TABLE.iterer((id, v, tab, taille) => f(identifiant(this.sorte, id), v, tab, taille), this.etat().identification);
    }

    /**
         * Application fonctorielle de f à la table.
         * @param f fonction à appliquer à chaque valeur de la table.
         * @returns une nouvelle table égale à la composition f o this.
         */
    application<S>(f: (x: T) => S): TableIdentification<Sorte, S> {
        return tableIdentificationDeTable(this.sorte, MODULE_TABLE.applicationFonctorielle(this.etat().identification, f));
    }

    valeur(ID_sorte: Identifiant<Sorte>): T {
        return MODULE_TABLE.valeur(this.etat().identification, ID_sorte.val);
    }

    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return MODULE_TABLE.contient(this.etat().identification, ID_sorte.val);
    }
    image(): ReadonlyArray<T> {
        return MODULE_TABLE.image(this.etat().identification);
    }
    domaine(): ReadonlyArray<Identifiant<Sorte>> {
        return MODULE_TABLE.transformationFonctorielleEnTableau(this.etat().identification, (c, v) => identifiant(this.sorte, c));
    }
    selectionCle(): Option<Identifiant<Sorte>> {
        return MODULE_TABLE.selectionCle(this.etat().identification).filtrage(
            (id) => option(identifiant(this.sorte, id)),
            () => rienOption()
        );
    }
    selectionCleSuivantCritere(prop: (x: T) => boolean): Option<Identifiant<Sorte>> {
        return MODULE_TABLE.selectionCleSuivantCritere(this.etat().identification, prop).filtrage(
            (id) => option(identifiant(this.sorte, id)),
            () => rienOption()
        );
    }

    taille(): number {
        return MODULE_TABLE.taille(this.etat().identification);
    }
    estVide(): boolean {
        return this.taille() === 0;
    }

}

export function tableIdentification<Sorte extends EnsembleSortes, T>(
    sorte: Sorte,
    table: FormatTableIdentification<Sorte, T>)
    : TableIdentification<Sorte, T> {
    return new TableIdentificationParEnveloppe<Sorte, T>(
        sorte,
        table
    );
}


export function tableIdentificationDeTable<Sorte extends EnsembleSortes, T>(
    sorte: Sorte,
    table: FormatTable<T>)
    : TableIdentification<Sorte, T> {
    return new TableIdentificationParEnveloppe<Sorte, T>(
        sorte,
        tableIdentificationAuFormat(table, sorte)
    );
}

