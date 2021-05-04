import { Enveloppe, TypeEnveloppe } from './enveloppe';
import { FormatTableMutable, FormatTable, MODULE_TABLE, EtiquetteTable, FABRIQUE_TABLE } from './table';
import { EnsembleSortes, Identifiant, identifiant } from './identifiant';
import { jamais } from './typesAtomiques';
import { Option } from './option';


/**
 * Format pour les tables d'identification mutables. C'est un type JSON si et seulement si T est un type JSON. 
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
 * @param t une table mutable de T
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
 * Format pour les tables d'identifications. C'est un type JSON si et seulement si T est un type JSON. 
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
 * @param t une table mutable de T
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
 * @param conv fonction de conversion des éléments.
 * @returns fonction de conversion transformant une table d'identification
 *          mutable en une nouvelle table d'identification
 *          après composition avec conv.
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
 * Interface pour les tables d'identification.
 */
export interface TableIdentification<Sorte extends EnsembleSortes, T>
    extends TypeEnveloppe<FormatTableIdentification<Sorte, T>, EtiquetteTable> {
    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void;
    valeur(ID_sorte: Identifiant<Sorte>): T;
    contient(ID_sorte: Identifiant<Sorte>): boolean;
    image(): ReadonlyArray<T>;
    domaine(): ReadonlyArray<Identifiant<Sorte>>;
    selectionCle(): Identifiant<Sorte>;
    selectionCleSuivantCritere(prop: (x: T) => boolean): Identifiant<Sorte>;
    taille(): number;
    estVide(): boolean;
}


/**
 * Table d'identification mutable utilisant la valeur d'identificateurs
 * comme clé.
 */
export interface TableIdentificationMutable<Sorte extends EnsembleSortes, T>
    extends TableIdentification<Sorte, T> {
    ajouter(ID_sorte: Identifiant<Sorte>, x: T): Option<T>;
    retirer(ID_sorte: Identifiant<Sorte>): Option<T>;
}

/**
 * Table d'identification mutable utilisant la valeur d'identificateurs
 * comme clé.
 */
export class TableIdentificationMutableParEnveloppe<Sorte extends EnsembleSortes, T>
    extends Enveloppe<
    FormatTableIdentificationMutable<Sorte, T>,
    EtiquetteTable>
    implements TableIdentificationMutable<Sorte, T> {
    constructor(
        protected sorte: Sorte,
        etat: FormatTableIdentificationMutable<Sorte, T> =
            creerTableIdentificationMutableAuFormat(FABRIQUE_TABLE.creerVideMutable(), sorte)) {
        super(etat);
    }

    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'domaine': return JSON.stringify(this.domaine());
            case 'image': return JSON.stringify(this.image());
            case 'graphe': return JSON.stringify(this.val().identification.table);
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('domaine');
    }

    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void {
        MODULE_TABLE.iterer((id, v, tab, taille) =>
            f(identifiant(this.sorte, id), v, tab, taille), this.val().identification);
    }

    valeur(ID_sorte: Identifiant<Sorte>): T {
        return MODULE_TABLE.valeur(this.val().identification, ID_sorte.val);
    }

    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return MODULE_TABLE.contient(this.val().identification, ID_sorte.val);
    }
    image(): ReadonlyArray<T> {
        return MODULE_TABLE.image(this.val().identification);
    }

    domaine(): ReadonlyArray<Identifiant<Sorte>> {
        return MODULE_TABLE.transformationFonctorielleEnTableau(this.val().identification, (c, v) => identifiant(this.sorte, c));
        // moins efficace : return MODULE_TABLE.domaine(this.val()).
        //    map((s) => { return { val: s, sorte: this.sorte } });
    }
    selectionCle(): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCle(this.val().identification),);
    }
    selectionCleSuivantCritere(prop: (x: T) => boolean): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCleSuivantCritere(this.val().identification, prop));
    }

    taille(): number {
        return MODULE_TABLE.taille(this.val().identification);
    }
    estVide(): boolean {
        return this.taille() === 0;
    }

    ajouter(ID_sorte: Identifiant<Sorte>, x: T): Option<T> {
        return MODULE_TABLE.ajouter(this.val().identification, ID_sorte.val, x);
    }

    retirer(ID_sorte: Identifiant<Sorte>): Option<T> {
        return MODULE_TABLE.retirer(this.val().identification, ID_sorte.val);
    }
}
export function creerTableIdentificationMutableVide<Sorte extends EnsembleSortes, T>(
    sorte: Sorte
) {
    return new TableIdentificationMutableParEnveloppe<Sorte, T>(sorte);
}
/*
* Création par copie de la table.
*/
export function creerTableIdentificationMutableParCopie<Sorte extends EnsembleSortes, S, T>(
    sorte: Sorte, transformation: (x: S) => T,
    table: FormatTableIdentification<Sorte, S>
) {
    let r = creerTableIdentificationMutableVide(sorte);
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
export class TableIdentificationParEnveloppe<Sorte extends EnsembleSortes, T>
    extends Enveloppe<
    FormatTableIdentification<Sorte, T>,
    EtiquetteTable>
    implements TableIdentification<Sorte, T> {

    constructor(
        protected sorte: Sorte,
        etat: FormatTableIdentification<Sorte, T> =
            tableIdentificationAuFormat(FABRIQUE_TABLE.vide(), sorte)) {
        super(etat);
    }


    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'domaine': return JSON.stringify(this.domaine());
            case 'image': return JSON.stringify(this.image());
            case 'graphe': return JSON.stringify(this.val().identification.table);
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('domaine');
    }

    val(): FormatTableIdentification<Sorte, T> {
        return this.val();
    }

    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void {
        MODULE_TABLE.iterer((id, v, tab, taille) => f(identifiant(this.sorte, id), v, tab, taille), this.val().identification);
    }

    valeur(ID_sorte: Identifiant<Sorte>): T {
        return MODULE_TABLE.valeur(this.val().identification, ID_sorte.val);
    }

    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return MODULE_TABLE.contient(this.val().identification, ID_sorte.val);
    }
    image(): ReadonlyArray<T> {
        return MODULE_TABLE.image(this.val().identification);
    }
    domaine(): ReadonlyArray<Identifiant<Sorte>> {
        return MODULE_TABLE.transformationFonctorielleEnTableau(this.val().identification, (c, v) => identifiant(this.sorte, c));
    }
    selectionCle(): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCle(this.val().identification));
    }
    selectionCleSuivantCritere(prop: (x: T) => boolean): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCleSuivantCritere(this.val().identification, prop));
    }

    taille(): number {
        return MODULE_TABLE.taille(this.val().identification);
    }
    estVide(): boolean {
        return this.taille() === 0;
    }

}

export function tableIdentification<Sorte extends EnsembleSortes, TEX>(
    sorte: Sorte,
    table: FormatTable<TEX>)
    : TableIdentification<Sorte, TEX> {
    return new TableIdentificationParEnveloppe<Sorte, TEX>(
        sorte,
        tableIdentificationAuFormat(table, sorte)
    );
}

