import { Enveloppe, TypeEnveloppe } from './enveloppe';
import { FormatTableMutable, FormatTable, MODULE_TABLE, EtiquetteTable, FABRIQUE_TABLE } from './table';
import { Identifiant, identifiant } from './identifiant';
import { jamais } from './typesAtomiques';
import { Option } from './option';


/**
 * Format JSON pour les tables d'identification mutables.
 * Structure :
 * - identification
 *   - taille : taille de la table
 *   - table : type indexé associant à la valeur d'un identifiant
 * (une chaîne) une valeur dans T
 * - sorte : sorte des identifiants (une chaîne)
 * @param Sorte sorte des identifiants
 * @param T type des images
*/
export interface FormatTableIdentificationMutable<Sorte extends string, T> {
    identification: FormatTableMutable<T>,
    readonly sorte: Sorte
}

export function creerTableIdentificationMutableEnJSON<Sorte extends string, T>(
    t: FormatTableMutable<T>, s: Sorte):
    FormatTableIdentificationMutable<Sorte, T> {
    return {
        "identification": t,
        "sorte": s
    };
}

/**
 * Format JSON pour les tables d'identifications.
 * Structure :
 * - identification
 *   - taille : taille de la table
 *   - table : type indexé associant à la valeur d'un identifiant (une chaîne)
 *     une valeur dans T
 * - sorte : sorte des identifiants (une chaîne)
 * @param Sorte sorte des identifiants (information pour le typage)
 * @param T type des images
*/
export interface FormatTableIdentification<Sorte extends string, T> {
    readonly identification: FormatTable<T>,
    readonly sorte: Sorte
}

/**
 * Fabrique d'une table d'identification en JSON à partir d'une table en JSON.
 * Précondition : les clés de la table doivent être des valeurs d'identifiants
 * de la sorte passée en argument.
 * @param t table en JSON.
 * @param s sorte des identifiants.
 */
export function tableIdentificationEnJSON<Sorte extends string, T>(
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
    Sorte extends string, TIN, TEX
    >(conv: (x: TIN) => TEX, s: Sorte)
    : (t: FormatTableIdentificationMutable<Sorte, TIN>)
        => FormatTableIdentification<Sorte, TEX> {
    return (
        (t: FormatTableIdentificationMutable<Sorte, TIN>) => {
            return tableIdentificationEnJSON(
                MODULE_TABLE.applicationFonctorielle(t.identification, conv),
                s
            );
        });
}

export interface TableIdentification<Sorte extends string, T>
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
export interface TableIdentificationMutable<Sorte extends string, T>
    extends TableIdentification<Sorte, T> {
    ajouter(ID_sorte: Identifiant<Sorte>, x: T): Option<T>;
    retirer(ID_sorte: Identifiant<Sorte>): Option<T>;
}

/**
 * Table d'identification mutable utilisant la valeur d'identificateurs
 * comme clé.
 */
export class TableIdentificationMutableParEnveloppe<Sorte extends string, T>
    extends Enveloppe<
    FormatTableIdentificationMutable<Sorte, T>,
    FormatTableIdentification<Sorte, T>, EtiquetteTable>
    implements TableIdentificationMutable<Sorte, T> {
    constructor(
        protected sorte: Sorte,
        table: FormatTableIdentificationMutable<Sorte, T> =
            creerTableIdentificationMutableEnJSON(FABRIQUE_TABLE.creerVideMutable(), sorte)
    ) {
        super(conversionFormatTableIdentification((x) => x, sorte), table);
        this.sorte = sorte;
    }

    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return this.taille().toString();
            case 'domaine': return this.domaine().map((v, i, t) => JSON.stringify(v)).toString();
            case 'image': return this.image().map((v, i, t) => JSON.stringify(v)).toString();
            case 'graphe': return JSON.stringify(this.val().identification.table);
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
        // moins efficace : return MODULE_TABLE.domaine(this.etat()).
        //    map((s) => { return { val: s, sorte: this.sorte } });
    }
    selectionCle(): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCle(this.etat().identification), );
    }
    selectionCleSuivantCritere(prop: (x: T) => boolean): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCleSuivantCritere(this.etat().identification, prop));
    }

    taille(): number {
        return MODULE_TABLE.taille(this.etat().identification);
    }
    estVide(): boolean {
        return this.taille() === 0;
    }

    ajouter(ID_sorte: Identifiant<Sorte>, x: T): Option<T> {
        return MODULE_TABLE.ajouter(this.etat().identification, ID_sorte.val, x);
    }

    retirer(ID_sorte: Identifiant<Sorte>): Option<T> {
        return MODULE_TABLE.retirer(this.etat().identification, ID_sorte.val);
    }
}
export function creerTableIdentificationMutableVide<Sorte extends string, T>(
    sorte: Sorte
) {
    return new TableIdentificationMutableParEnveloppe<Sorte, T>(sorte);
}
/*
* Création par copie de la table.
*/
export function creerTableIdentificationMutableParCopie<Sorte extends string, S, T>(
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
export function creerTableIdentificationMutableParEnveloppe<Sorte extends string, T>(
    sorte: Sorte, 
    table: FormatTableIdentificationMutable<Sorte, T>
) {
    return new TableIdentificationMutableParEnveloppe<Sorte, T>(sorte, table);
}



// TODO commentaires version immutable.
export class TableIdentificationParEnveloppe<Sorte extends string, T>
    extends Enveloppe<
        FormatTableIdentification<Sorte, T>,
        FormatTableIdentification<Sorte, T>, EtiquetteTable>
    implements TableIdentification<Sorte, T> {

    constructor(
        protected sorte: Sorte,
        table: FormatTableIdentification<Sorte, T> =
            tableIdentificationEnJSON(FABRIQUE_TABLE.vide(), sorte)
    ) {
        super((x) => x, table);
    }

    net(e: EtiquetteTable): string {
        switch (e) {
            case 'taille': return this.taille().toString();
            case 'domaine': return this.domaine().map((v, i, t) => JSON.stringify(v)).toString();
            case 'image': return this.image().map((v, i, t) => JSON.stringify(v)).toString();
            case 'graphe': return JSON.stringify(this.val().identification.table);
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('graphe');
    }

    val(): FormatTableIdentification<Sorte, T> {
        return this.etat();
    }

    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T, tab?: { [cle: string]: T }, taille?: number) => void
    ): void {
        MODULE_TABLE.iterer((id, v, tab, taille) => f(identifiant(this.sorte, id), v, tab, taille), this.etat().identification);
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
    selectionCle(): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCle(this.etat().identification));
    }
    selectionCleSuivantCritere(prop: (x: T) => boolean): Identifiant<Sorte> {
        return identifiant(this.sorte, MODULE_TABLE.selectionCleSuivantCritere(this.etat().identification, prop));
    }

    taille(): number {
        return MODULE_TABLE.taille(this.etat().identification);
    }
    estVide(): boolean {
        return this.taille() === 0;
    }

}

export function tableIdentification<Sorte extends string, TEX>(
    sorte: Sorte,
    table: FormatTable<TEX>)
    : TableIdentification<Sorte, TEX> {
    return new TableIdentificationParEnveloppe<Sorte, TEX>(
        sorte,
        tableIdentificationEnJSON(table, sorte)
    );
}

