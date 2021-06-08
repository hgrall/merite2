import { Set, Record } from 'immutable';

import { SorteIdentifiant } from "../applications/sortes";
import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { fabriqueIdentifiant, Identifiant } from "./identifiant";
import { option, Option, rienOption } from "./option";
import { fabriquerTableIdentificationMutable, fabriqueTableIdentification, tableIdentification, TableIdentification, TableIdentificationMutable } from './tableIdentification';
import { jamais, Unite } from "./typesAtomiques";

/**
 * Format pour les ensembles d'identifiants. 
 * Structure :
 * - sorte commune des identifiants.
 * - ensemble : tableau formé des valeurs des identifiants.
 * @param Sorte type singleton définissant la sorte.
*/
export interface FormatEnsembleIdentifiants<Sorte extends SorteIdentifiant> {
    readonly sorte: Sorte;
    readonly ensemble: ReadonlyArray<string>;
}

/**
 * Etiquettes utilisées pour la représentation des ensembles
 *  d'identifiants.
 */
export type EtiquetteEnsembleIdentifiants = 'sorte' | 'ensemble';

export interface EnsembleIdentifiants<
    Sorte extends SorteIdentifiant>
    extends
    TypeEnveloppe<
    Set<Record<Identifiant<Sorte>>>,
    FormatEnsembleIdentifiants<Sorte>, EtiquetteEnsembleIdentifiants> {
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
     * @param proc procédure appelée à chaque itération.
    */
    iterer(
        proc: (ID_sorte: Identifiant<Sorte>) => void
    ): void;
    /**
     * Application fonctorielle de f à l'ensemble.
     * @param f fonction à appliquer à chaque identifiant de l'ensemble.
     * @returns une nouvelle table formée d'associations (id, f(id).
     */
    application<S>(f: (ID_sorte: Identifiant<Sorte>) => S): TableIdentification<Sorte, S>;
    /**
     * Crible des identifiants de l'ensemble
     *  vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler.
     * @returns un ensemble contenant les identifiants tels que prop(identifiant).
     */
    crible(prop: (ID_sorte: Identifiant<Sorte>) => boolean): EnsembleIdentifiants<Sorte>;
}



class EnsembleIdentifiantsParEnveloppe<
    Sorte extends SorteIdentifiant>
    extends Enveloppe<
    Set<Record<Identifiant<Sorte>>>,
    FormatEnsembleIdentifiants<Sorte>, EtiquetteEnsembleIdentifiants>
    implements EnsembleIdentifiants<Sorte> {

    protected fabriqueID: Record.Factory<Identifiant<Sorte>>;

    constructor(
        sorte: Sorte,
        etat: Set<Record<Identifiant<Sorte>>>) {
        super(etat);
        this.fabriqueID = fabriqueIdentifiant<Sorte>(sorte, "defaut");
    }

    net(etiquette: EtiquetteEnsembleIdentifiants): string {
        let ens = this.toJSON();
        switch (etiquette) {
            case 'sorte': return JSON.stringify(ens.sorte);
            case 'ensemble': return JSON.stringify(ens.ensemble); 
        }
        return jamais(etiquette);
    }
    representation(): string {
        return JSON.stringify(this.toJSON());
    }
    toJSON(): FormatEnsembleIdentifiants<Sorte> {
        return {
            sorte : this.fabriqueID().sorte,
            ensemble : this.etat().map((id) => id.toJSON().val).toJSON()
        };
    }
    taille(): number {
        return this.etat().size;
    }
    estVide(): boolean {
        return this.etat().isEmpty();
    }
    selectionIdentifiant(): Option<Identifiant<Sorte>> {
        let r : Option<Identifiant<Sorte>> = rienOption();
        this.etat().forEach((id) => {
            r = option(id.toJSON());
        });
        return r;
    }
    selectionIdentifiantSuivantCritere(prop: (ID_sorte: Identifiant<Sorte>) => boolean): Option<Identifiant<Sorte>> {
        let r : Option<Identifiant<Sorte>> = rienOption();
        this.etat().forEach((id) => {
            const ID = id.toJSON();
            console.log("ID : " + ID.val + " === a2 ?" + prop(ID) );
            if(prop(ID)){
                r = option(ID);
            }
        });
        return r;
    }
    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return this.etat().has(this.fabriqueID(ID_sorte));
    }
    iterer(proc: (ID_sorte: Identifiant<Sorte>) => void): void {
        const ens = this.etat();
        ens.forEach((id) => proc(id.toJSON()));
    }
    application<S>(f: (ID_sorte: Identifiant<Sorte>) => S): TableIdentification<Sorte, S> {
        const ens = this.etat();
        const r = ens.toMap().map((id2, id1) => f(id2.toJSON()));
        return fabriqueTableIdentification(
            this.fabriqueID().sorte, r
        );
    }
    /**
     * Crible des identifiants de l'ensemble
     *  vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler.
     * @returns un ensemble contenant les identifiants tels que prop(identifiant).
     */
    crible(prop: (ID_sorte: Identifiant<Sorte>) => boolean): EnsembleIdentifiants<Sorte> {
        const ens = this.etat();
        const r = ens.filter((id) => prop(id.toJSON()));
        return new EnsembleIdentifiantsParEnveloppe(
            this.fabriqueID().sorte, r
        );
    }
}

export function ensembleIdentifiants<Sorte extends SorteIdentifiant>(sorte: Sorte, ids: Set<Identifiant<Sorte>>): EnsembleIdentifiants<Sorte> {
    const ens = ids.map((ID) => 
        fabriqueIdentifiant(sorte, "defaut")(ID));
    return new EnsembleIdentifiantsParEnveloppe(sorte, ens);
}

export function fabriqueEnsembleIdentifiants<Sorte extends SorteIdentifiant>(
    sorte : Sorte, ids : Set<Record<Identifiant<Sorte>>>)
    : EnsembleIdentifiants<Sorte> {
    return new EnsembleIdentifiantsParEnveloppe(
        sorte, ids
    );
}

export interface EnsembleMutableIdentifiants<Sorte extends SorteIdentifiant> extends EnsembleIdentifiants<Sorte> {
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
    /**
     * Crible les identifiants de l'ensemble
     *  vérifiant le prédicat. La modification se fait en place.
     * @param prop prédicat utilisé pour cribler.
     * @returns rien avec l'effet de retirer les identifiants ID tels que !prop(ID).
     */
    cribler(prop: (ID_sorte: Identifiant<Sorte>) => boolean): void;
}

class EnsembleMutableIdentifiantsParEnveloppe<Sorte extends SorteIdentifiant> extends
    EnsembleIdentifiantsParEnveloppe<Sorte>
    implements EnsembleMutableIdentifiants<Sorte> {
    constructor(sorte: Sorte,
        etat: Set<Record<Identifiant<Sorte>>>) {
        super(sorte, etat);
    }

    /* Applique fonctoriellement f à l'ensemble.
     * @param f fonction à appliquer à chaque élément de l'ensemble.
     * @returns une nouvelle table mutable formée d'associations (id, f(id).
     */
    appliquer<S>(f: (ID_sorte: Identifiant<Sorte>) => S): TableIdentificationMutable<Sorte, S> {
        const ens = this.etat();
        const r = ens.toMap().map((id2, id1) => f(id2.toJSON()));
        return fabriquerTableIdentificationMutable(
            this.fabriqueID().sorte, r
        );
    }
    /**
     * Ajoute l'élément x à l'ensemble s'il n'est pas déjà dans l'ensemble.
     * @param ID_sorte identifiant à ajouter.
     * @returns true si l'identifiant est ajouté, false sinon.
     */
    ajouter(ID_sorte: Identifiant<Sorte>): boolean {
        const ens = this.etat();
        const id = this.fabriqueID(ID_sorte);
        if(ens.has(id)){
            return false;
        }
        this._etat = ens.add(id);
        return true;        

    }
    /**
     * Retire l'identifiant de la table mutable.
     * @param ID_sorte identifiant à retirer.
     * @returns true si l'identifiant est effectivement retiré, false sinon.
     */
    retirer(ID_sorte: Identifiant<Sorte>): boolean {
        const ens = this.etat();
        const id = this.fabriqueID(ID_sorte);
        if(ens.has(id)){
            this._etat = ens.delete(id);
            return true;
        }else {
            return false;
        }
    }
    /**
     * Crible les identifiants de l'ensemble
     *  vérifiant le prédicat. La modification se fait en place.
     * @param prop prédicat utilisé pour cribler.
     * @returns rien avec l'effet de retirer les identifiants ID tels que !prop(ID).
     */
    cribler(prop: (ID_sorte: Identifiant<Sorte>) => boolean): void {
        const ens = this.etat();
        this._etat = ens.filter((id) => 
            prop(id.toJSON()));
    }
}

export function creerEnsembleMutableIdentifiantsVide<Sorte extends SorteIdentifiant>(sorte: Sorte): EnsembleMutableIdentifiants<Sorte> {
    return new EnsembleMutableIdentifiantsParEnveloppe(
        sorte, Set()
    );
}