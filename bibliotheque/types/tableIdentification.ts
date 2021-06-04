import { Enveloppe, TypeEnveloppe } from './enveloppe';
import { FormatTableMutable, FormatTable, MODULE_TABLE, EtiquetteTable } from './table';
import { EnsembleSortes, Identifiant, identifiant } from './identifiant';
import { jamais } from './typesAtomiques';
import { option, Option, rienOption } from './option';
import { FormatTableau } from './tableau';

/**
 * Format pour les tables d'identification mutables. 
 * Structure :
 * - identification
 *   - taille : taille de la table
 *   - table : type indexé associant à la valeur d'un identifiant
 * (une chaîne) une valeur dans T
 * - sorte : sorte des identifiants (une chaîne)
 * @param Sorte type singleton représentant la sorte des identifiants 
 * @param T le type contenu dans la table
*/
export interface FormatTableIdentificationMutable<Sorte extends EnsembleSortes, T> {
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
/* TODO
export function creerTableIdentificationMutableAuFormat<Sorte extends EnsembleSortes, T>(
    t: FormatTableMutable<T>, s: Sorte):
    FormatTableIdentificationMutable<Sorte, T> {
    return {
        "identification": t,
        "sorte": s
    };
}*//*

/**
 * Format pour les tables d'identifications immutables. 
 * Structure :
 * - identification
 *   - taille : taille de la table
 *   - table : type indexé associant à la valeur d'un identifiant
 * (une chaîne) une valeur dans T
 * - sorte : sorte des identifiants (une chaîne)
 * @param Sorte type singleton représentant la sorte des identifiants 
 * @param T le type contenu dans la table
*/

export interface FormatTableIdentification<Sorte extends EnsembleSortes, T> {
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
/*TODO
export function tableIdentificationAuFormat<
    Sorte extends EnsembleSortes, T>(
    t: FormatTable<T>, s: Sorte):
    FormatTableIdentification<Sorte, T> {
    return {
        "identification": t,
        "sorte": s
    };
}
*/

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
    Sorte extends EnsembleSortes, S, T
>(conv: (x: S) => T, s: Sorte)
    : (t: FormatTableIdentification<Sorte, S>)
        => FormatTableIdentification<Sorte, T> {
    return (
        (t: FormatTableIdentificationMutable<Sorte, S>) => {
            return {
                identification:
                    MODULE_TABLE.applicationFonctorielle(t.identification, (id, v) => conv(v)),
                sorte: s
            };
        });
}

/**
 * Table d'identification générique immutable dérivée 
 * de TypeEnveloppe, utilisant le format FormatTableIdentification. 
 * Le type de l'état est générique, permettant une factorisation.
 * Voir TableIdentification<T>.
 * @param Sorte sorte des identifiants (un singleton).
 * @param T type des valeurs de la table.
 * @param E type de l'état, sous-type de FormatTableIdentification.
 */
interface TableGeneriqueIdentification<Sorte extends EnsembleSortes, T, E extends FormatTableIdentification<Sorte, T>>
    extends TypeEnveloppe<
    E,
    FormatTableIdentification<Sorte, T>,
    EtiquetteTable> {
    /**
     * Itère une procédure sur chaque association de la table.
     * @param f procédure appelée à chaque itération.
     */
    iterer(
        f: (ID_sorte: Identifiant<Sorte>, val: T) => void
    ): void;
    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table formée d'associations 
     *          (id, f(id, x)) au lieu de (id, x).
     */
    application<S>(f: (ID_sorte: Identifiant<Sorte>, x: T) => S): TableIdentification<Sorte, S>;
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
    image(): FormatTableau<T>;
    /**
     * Liste des identifiants de la table.
     * @returns un tableau listant les identifiants servant de clé.
     */
    domaine(): FormatTableau<Identifiant<Sorte>>;
    /**
     * Sélection d'une association (identifiant, valeur) de la table.
     * @returns une option contenant une association 
     * (identifiant, valeur) de la table s'il en existe, vide sinon.
     */
    selectionAssociation(): Option<[Identifiant<Sorte>, T]>;
    /**
     * Sélection d'une association (identifiant, valeur) 
     * de la table vérifiant une propriété.
     * @param prop prédicat portant sur les associations.
     * @returns une option contenant une association 
     * (identifiant, valeur) de la table s'il en existe 
     * une satisfaisante, vide sinon.
     */
    selectionAssociationSuivantCritere(prop: (ID_sorte: Identifiant<Sorte>, x: T) => boolean): Option<[Identifiant<Sorte>, T]>;
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
 * Table d'identifiaction immutable étendant le type des enveloppes 
 * par des méthodes permettant :
 * - l'itération,
 * - l'application fonctorielle,
 * - l'observation complète de la table.
 * Une table d'identification associe à un identifiant
 * une valeur dans T. 
 * @param Sorte sorte des identifiants (un singleton).
 * @param T type des valeurs de la table.
 */
export type TableIdentification<Sorte extends EnsembleSortes, T> = TableGeneriqueIdentification<Sorte, T, FormatTableIdentification<Sorte, T>>;

class TableIdentificationGeneriqueParEnveloppe<Sorte extends EnsembleSortes, T, E extends FormatTableIdentification<Sorte, T>>
    extends Enveloppe<
    E,
    FormatTableIdentification<Sorte, T>,
    EtiquetteTable>
    implements TableGeneriqueIdentification<Sorte, T, E> {

    constructor(
        etat: E) {
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
        MODULE_TABLE.iterer(
            (id, v) => f(identifiant(this.etat().sorte, id), v),
            this.etat().identification);
    }

    /**
         * Application fonctorielle de f à la table.
         * @param f fonction à appliquer à chaque valeur de la table.
         * @returns une nouvelle table égale à la composition f o this.
         */
    application<S>(f: (ID_sorte: Identifiant<Sorte>, x: T) => S): TableIdentification<Sorte, S> {
        const s = this.etat().sorte;
        return new TableIdentificationGeneriqueParEnveloppe(
            {
                identification: MODULE_TABLE.applicationFonctorielle(
                    this.etat().identification,
                    (c, v) => f(identifiant(s, c), v)
                ),
                sorte: s
            }
        );
    }

    valeur(ID_sorte: Identifiant<Sorte>): T {
        return MODULE_TABLE.valeur(this.etat().identification, ID_sorte.val);
    }

    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return MODULE_TABLE.contient(this.etat().identification, ID_sorte.val);
    }
    image(): FormatTableau<T> {
        return MODULE_TABLE.image(this.etat().identification);
    }
    domaine(): FormatTableau<Identifiant<Sorte>> {
        return MODULE_TABLE
            .transformationFonctorielleEnTableau(
                this.etat().identification,
                (c, v) => identifiant(this.etat().sorte, c)
            );
    }
    selectionAssociation(): Option<[Identifiant<Sorte>, T]> {
        return MODULE_TABLE
            .selectionAssociation(this.etat().identification)
            .filtrage(
                ([id, e]) =>
                    option([identifiant(this.etat().sorte, id), e]),
                () => rienOption()
            );
    }
    selectionAssociationSuivantCritere(prop: (ID_sorte: Identifiant<Sorte>, x: T) => boolean): Option<[Identifiant<Sorte>, T]> {
        return MODULE_TABLE
            .selectionAssociationSuivantCritere(
                this.etat().identification,
                (id, v) => prop(identifiant(this.etat().sorte, id), v))
            .filtrage(
                ([id, e]) =>
                    option([identifiant(this.etat().sorte, id), e]),
                () => rienOption()
            );
    }

    taille(): number {
        return this.etat().identification.taille;
    }
    estVide(): boolean {
        return this.taille() === 0;
    }
}

export function tableIdentification<Sorte extends EnsembleSortes, T>(
    tableId: FormatTableIdentification<Sorte, T>)
    : TableIdentification<Sorte, T> {
    return new TableIdentificationGeneriqueParEnveloppe<
        Sorte, T,
        FormatTableIdentification<Sorte, T>>(
            tableId
        );
}

/**
 * Table d'identification mutable obtenue par dérivation 
 * d'une table d'identification immutable
 * et étendue avec les méthodes de mutation.
 * @param Sorte sorte des identifiants (un singleton).
 * @param T type des valeurs de la table.
 */
export interface TableIdentificationMutable<Sorte extends EnsembleSortes, T>
    extends TableIdentification<Sorte, T> {
    /**
     * Appliquer fonctoriellement f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table formée d'associations (clé, f(clé, t[clé]).
     */
    appliquer<S>(f: (ID_sorte: Identifiant<Sorte>, x: T) => S): TableIdentificationMutable<Sorte, S>;
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
    extends TableIdentificationGeneriqueParEnveloppe<
    Sorte, T,
    FormatTableIdentificationMutable<Sorte, T>>
    implements TableIdentificationMutable<Sorte, T> {

    constructor(
        etat: FormatTableIdentificationMutable<Sorte, T>) {
        super(etat);
    }
    /**
     * Appliquer fonctoriellement f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table formée d'associations (clé, f(clé, t[clé]).
     */
    appliquer<S>(f: (ID_sorte: Identifiant<Sorte>, x: T) => S): TableIdentificationMutable<Sorte, S> {
        const s = this.etat().sorte;
        return new TableIdentificationMutableParEnveloppe(
            {
                identification: MODULE_TABLE.appliquerFonctoriellement(
                    this.etat().identification,
                    (c, v) => f(identifiant(s, c), v)
                ),
                sorte: s
            }
        );
    }
    ajouter(ID_sorte: Identifiant<Sorte>, x: T): boolean {
        return MODULE_TABLE.ajouter(
            this.etat().identification, ID_sorte.val, x);
    }
    modifier(ID_sorte: Identifiant<Sorte>, x: T): Option<T> {
        return MODULE_TABLE.modifier(
            this.etat().identification, ID_sorte.val, x);
    }
    retirer(ID_sorte: Identifiant<Sorte>): Option<T> {
        return MODULE_TABLE.retirer(
            this.etat().identification, ID_sorte.val);
    }
}

export function creerTableIdentificationMutableVide<Sorte extends EnsembleSortes, T>(
    sorte: Sorte
): TableIdentificationMutable<Sorte, T> {
    return new TableIdentificationMutableParEnveloppe<Sorte, T>(
        {
            identification: { taille: 0, table: {} },
            sorte: sorte
        });
}

export function creerTableIdentificationMutable<Sorte extends EnsembleSortes, T>(
    tableId : FormatTableIdentificationMutable<Sorte, T>
    ): TableIdentificationMutable<Sorte, T> {
    return new TableIdentificationMutableParEnveloppe<Sorte, T>(
        tableId);
}

