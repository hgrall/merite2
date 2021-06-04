import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { EnsembleSortes, Identifiant } from "./identifiant";
import { option, Option, rienOption } from "./option";
import { EtiquetteTableau, FormatTableau, tableau, Tableau } from "./tableau";
import { creerTableIdentificationMutableVide, TableIdentification, TableIdentificationMutable } from "./tableIdentification";
import { jamais, Unite } from "./typesAtomiques";

interface EnsembleGeneriqueIdentifiants<
    Sorte extends EnsembleSortes,
    E extends TableIdentification<Sorte, Unite>>
    extends
    TypeEnveloppe<
        E,FormatTableau<Identifiant<Sorte>>, EtiquetteTableau> {
    /**
     * Nombre d'éléments dans l'ensemble.
     * @returns un entier naturel égal au nombre d'associations.
    */
    taille(): number;
    /**
     * Teste si l'ensemble est vide ou non.
     * @retuns true si l'ensemble est vide, false sinon.
     */
    estVide(): boolean;
    /**
     * Sélection d'un identifiant de l'ensemble.
     * @returns une option contenant un identifiant de la table s'il en existe, vide sinon.
     */
    selectionIdentifiant(): Option<Identifiant<Sorte>>;
    /**
     * Sélection d'un identifiant dont la valeur vérifie une propriété.
     * @param prop prédicat portant sur les identifiants.
     * @returns une option contenant un identifiant de l'ensemble s'il en existe un satisfaisant, vide sinon.
     */
    selectionIdentifiantSuivantCritere(prop: (ID_sorte: Identifiant<Sorte>) => boolean): Option<Identifiant<Sorte>>;
    /**
     * Teste si l'identifiant appartient à l'ensemble.
     * @param ID_sorte chaîne représentant une clé.
     */
    contient(ID_sorte: Identifiant<Sorte>): boolean;
    /**
     * Itère une procédure sur chaque élément de l'ensemble.
     * @param f procédure appelée à chaque itération.
    */
    iterer(
        f: (ID_sorte: Identifiant<Sorte>) => void
    ): void;
    /**
     * Application fonctorielle de f à l'ensemble.
     * @param f fonction à appliquer à chaque identifiant de l'ensemble.
     * @returns une nouvelle table formée d'associations (id, f(id).
     */
    application<S>(f: (ID_sorte: Identifiant<Sorte>) => S): TableIdentification<Sorte, S>;
}

export type EnsembleIdentifiants<Sorte extends EnsembleSortes> =
    EnsembleGeneriqueIdentifiants<
        Sorte, TableIdentification<Sorte, Unite>>;

class EnsembleIdentifiantsGeneriqueParEnveloppe<
    Sorte extends EnsembleSortes,
    E extends TableIdentification<Sorte, Unite>>
    extends Enveloppe<
        E, FormatTableau<Identifiant<Sorte>>, EtiquetteTableau>
        implements EnsembleGeneriqueIdentifiants<Sorte, E> {
    constructor(etat: E) {
        super(etat);
    }
    net(etiquette: EtiquetteTableau): string {
        switch (etiquette) {
            case 'taille': return this.etat().net('taille');
            case 'valeurs': return this.etat().net('domaine');
        }
        return jamais(etiquette);
    }
    representation(): string {
        return this.net('valeurs');
    }
    toJSON(): FormatTableau<Identifiant<Sorte>> {
        return this.etat().domaine();
    }
    taille(): number {
        return this.etat().taille();
    }
    estVide(): boolean {
        return this.etat().estVide();
    }
    selectionIdentifiant(): Option<Identifiant<Sorte>> {
        return this.etat()
            .selectionAssociation().filtrage(
                ([id, u]) => option(id),
                () => rienOption()
            );
    }
    selectionIdentifiantSuivantCritere(prop: (ID_sorte: Identifiant<Sorte>) => boolean): Option<Identifiant<Sorte>> {
        return this.etat()
        .selectionAssociationSuivantCritere((id, u) => prop(id)).filtrage(
            ([id, u]) => option(id),
            () => rienOption()
        );
    }
    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return this.etat().contient(ID_sorte);
    }
    iterer(f: (ID_sorte: Identifiant<Sorte>) => void): void {
        this.etat().iterer(f);
    }
    application<S>(f: (ID_sorte: Identifiant<Sorte>) => S): TableIdentification<Sorte, S> {
        return this.etat().application((id, u) => f(id));
    }
}

export function ensembleIdentifiants<Sorte extends EnsembleSortes> (sorte : Sorte, ids : FormatTableau<Identifiant<Sorte>>) : EnsembleIdentifiants<Sorte> {
    const table : TableIdentificationMutable <Sorte, Unite> = 
        creerTableIdentificationMutableVide(sorte);
    tableau(ids).iterer((i, id) => table.ajouter(id, Unite.ZERO));
    return new EnsembleIdentifiantsGeneriqueParEnveloppe(table);
}

export interface EnsembleMutableIdentifiants<Sorte extends EnsembleSortes> extends EnsembleIdentifiants<Sorte> {
    /**
     * Applique fonctoriellement f à l'ensemble.
     * @param f fonction à appliquer à chaque élément de l'ensemble.
     * @returns une nouvelle table mutable formée d'associations (id, f(id).
     */
    appliquer<S>(f: (ID_sorte: Identifiant<Sorte>) => S): TableIdentificationMutable<Sorte, S>;
    /**
     * Ajoute l'élément x à l'ensemble s'il n'est pas déjà dans l'ensemble.
     * @param ID_sorte identifiant à ajouter.
     * @returns true si l'identifiant est ajouté, false sinon.
     */
    ajouter(ID_sorte: Identifiant<Sorte>): boolean;
    /**
     * Retire l'identifiant de la table mutable.
     * @param ID_sorte identifiant à retirer.
     * @returns true si l'identifiant est effectivement retiré, false sinon.
     */
    retirer(ID_sorte: Identifiant<Sorte>): boolean;
}

class EnsembleMutableIdentifiantsParEnveloppe<Sorte extends EnsembleSortes> extends 
    EnsembleIdentifiantsGeneriqueParEnveloppe<
        Sorte,
        TableIdentificationMutable<Sorte, Unite>
    >
implements EnsembleMutableIdentifiants<Sorte> {
    constructor(etat: TableIdentificationMutable<Sorte, Unite>) {
        super(etat);
    }
    /**
     * Applique fonctoriellement f à l'ensemble.
     * @param f fonction à appliquer à chaque élément de l'ensemble.
     * @returns une nouvelle table mutable formée d'associations (id, f(id).
     */
    appliquer<S>(f: (ID_sorte: Identifiant<Sorte>) => S): TableIdentificationMutable<Sorte, S> {
        return this.etat().appliquer((id, u) => f(id));
    }
    /**
     * Ajoute l'élément x à l'ensemble s'il n'est pas déjà dans l'ensemble.
     * @param ID_sorte identifiant à ajouter.
     * @returns true si l'identifiant est ajouté, false sinon.
     */
    ajouter(ID_sorte: Identifiant<Sorte>): boolean{
        return this.etat().ajouter(ID_sorte, Unite.ZERO);
    }
    /**
     * Retire l'identifiant de la table mutable.
     * @param ID_sorte identifiant à retirer.
     * @returns true si l'identifiant est effectivement retiré, false sinon.
     */
    retirer(ID_sorte: Identifiant<Sorte>): boolean{
        return this.etat().retirer(ID_sorte).estPresent();
    }
}

export function creerEnsembleMutableIdentifiantsVide<Sorte extends EnsembleSortes>(sorte : Sorte) : EnsembleMutableIdentifiants<Sorte> {
    return new EnsembleMutableIdentifiantsParEnveloppe(
        creerTableIdentificationMutableVide(sorte)   
    );
}