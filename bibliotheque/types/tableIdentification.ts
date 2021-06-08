import { Map, Set, Record } from 'immutable';
import { Enveloppe, TypeEnveloppe } from './enveloppe';
import { fabriqueIdentifiant, Identifiant, identifiant } from './identifiant';
import { jamais } from './typesAtomiques';
import { option, Option, rienOption } from './option';
import { SorteIdentifiant } from '../applications/sortes';

/**
 * Format pour les tables d'identification. 
 * Structure :
 * - sorte commune des identifiants
 * - identification : une table associant à la valeur 
 *    d'un identifiant un élément de T.
 * @param Sorte type singleton définissant la sorte.
 * @param T le type contenu dans la table.
*/
export interface FormatTableIdentification<Sorte extends SorteIdentifiant, T> {
    readonly sorte: Sorte;
    readonly identification: { [cle: string]: T };
}

/**
 * Etiquettes utilisées pour la représentation des tables
 *  d'identification.
 */
export type EtiquetteTableIdentification = 'sorte' | 'taille' | 'graphe' | 'domaine' | 'image';

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
export interface TableIdentification<
    Sorte extends SorteIdentifiant,
    T>
    extends TypeEnveloppe<
    Map<Record<Identifiant<Sorte>>, T>,
    FormatTableIdentification<Sorte, T>,
    EtiquetteTableIdentification> {
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
    /**
     * Itère une procédure sur chaque association de la table.
     * @param proc procédure appelée à chaque itération.
     */
    iterer(
        proc: (ID_sorte: Identifiant<Sorte>, val: T) => void
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
    image(): ReadonlyArray<T>;
    /**
     * Liste des identifiants de la table.
     * @returns un tableau listant les identifiants servant de clé.
     */
    domaine(): ReadonlyArray<Identifiant<Sorte>>;
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
     * Crible des associations (identifiant, élément) de la table
     *  vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler.
     * @returns une table contenant les associations (identifiant, val) telles que prop(identifiant, val).
     */
    crible(prop: (ID_sorte: Identifiant<Sorte>, x: T) => boolean): TableIdentification<Sorte, T>;

}

class TableIdentificationParEnveloppe<Sorte extends SorteIdentifiant, T>
    extends Enveloppe<
    Map<Record<Identifiant<Sorte>>, T>,
    FormatTableIdentification<Sorte, T>,
    EtiquetteTableIdentification>
    implements TableIdentification<Sorte, T> {

    protected fabriqueID: Record.Factory<Identifiant<Sorte>>;

    constructor(
        sorte: Sorte, 
        etat: Map<Record<Identifiant<Sorte>>, T>) {
        super(etat);
        this.fabriqueID = fabriqueIdentifiant<Sorte>(sorte, "defaut");
    }

    toJSON(): FormatTableIdentification<Sorte, T> {
        let tab = this.etat()
            .mapEntries(([id, v]) => [id.toJSON().val, v]).toJSON();
        return {
            sorte: this.fabriqueID().sorte,
            identification: tab
        };
    }

    net(e: EtiquetteTableIdentification): string {
        switch (e) {
            case 'sorte' : return this.fabriqueID().sorte;
            case 'taille': return JSON.stringify(this.taille());
            case 'domaine': return JSON.stringify(this.domaine());
            case 'image': return JSON.stringify(this.image());
            case 'graphe': return JSON.stringify(this.toJSON().identification);
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('graphe');
    }

    iterer(
        proc: (ID_sorte: Identifiant<Sorte>, val: T) => void
    ): void {
        const tab = this.etat();
        tab.forEach((v, id) => proc(id.toJSON(), v));
    }

    /**
     * Application fonctorielle de f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table égale à la composition f o this.
     */
    application<S>(f: (ID_sorte: Identifiant<Sorte>, x: T) => S): TableIdentification<Sorte, S> {
        const tab = this.etat();
        const r = tab.map((v, id) => f(id.toJSON(), v));
        return new TableIdentificationParEnveloppe(
            this.fabriqueID().sorte, r
        );
    }

    valeur(ID_sorte: Identifiant<Sorte>): T {
        return this.etat().get(this.fabriqueID(ID_sorte)) as T;
    }

    contient(ID_sorte: Identifiant<Sorte>): boolean {
        return this.etat().has(this.fabriqueID(ID_sorte));
    }
    image(): ReadonlyArray<T> {
        return this.etat().toIndexedSeq().toArray();
    }
    domaine(): ReadonlyArray<Identifiant<Sorte>> {
        return this.etat().keySeq().map((id) => id.toJSON()).toArray();
    }
    selectionAssociation(): Option<[Identifiant<Sorte>, T]> {
        let r : Option<[Identifiant<Sorte>, T]> = rienOption();
        this.etat().forEach((v, id) => {
            r = option([id.toJSON(), v]);
        });
        return r;
    }
    selectionAssociationSuivantCritere(prop: (ID_sorte: Identifiant<Sorte>, x: T) => boolean): Option<[Identifiant<Sorte>, T]> {
        let r : Option<[Identifiant<Sorte>, T]> = rienOption();
        this.etat().forEach((v, id) => {
            const ID = id.toJSON();
            if(prop(ID, v)){
                r = option([ID, v]);
            }
            
        });
        return r;
    }

    taille(): number {
        return this.etat().size;
    }
    estVide(): boolean {
        return this.etat().isEmpty();
    }
    /**
     * Crible des associations (identifiant, élément) de la table
     *  vérifiant le prédicat.
     * @param prop prédicat utilisé pour cribler.
     * @returns une table contenant les associations (identifiant, val) telles que prop(identifiant, val).
     */
    crible(prop: (ID_sorte: Identifiant<Sorte>, x: T) => boolean): TableIdentification<Sorte, T> {
        const tab = this.etat();
        const r = tab.filter((v, id) => prop(id.toJSON(), v));
        return new TableIdentificationParEnveloppe(
            this.fabriqueID().sorte, r
        );
    }
}

export function fabriqueTableIdentification<Sorte extends SorteIdentifiant, T>(
    sorte : Sorte, table : Map<Record<Identifiant<Sorte>>, T>)
    : TableIdentification<Sorte, T> {
    return new TableIdentificationParEnveloppe(
        sorte, table
    );
}

export function tableIdentification<Sorte extends SorteIdentifiant, T>(
    sorte : Sorte, table : Map<Identifiant<Sorte>, T>)
    : TableIdentification<Sorte, T> {
    const tab = table.mapEntries(([ID,v]) => 
        [fabriqueIdentifiant(sorte, "defaut")(ID),v]);
    return new TableIdentificationParEnveloppe(
        sorte, tab
    );
}

/**
 * Table d'identification mutable obtenue par dérivation 
 * d'une table d'identification immutable
 * et étendue avec les méthodes de mutation.
 * @param Sorte sorte des identifiants (un singleton).
 * @param T type des valeurs de la table.
 */
export interface TableIdentificationMutable<Sorte extends SorteIdentifiant, T>
    extends TableIdentification<Sorte, T> {
    /**
     * Appliquer fonctoriellement f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table formée d'associations (clé, f(clé, t[clé]).
     */
    appliquer<S>(f: (ID_sorte: Identifiant<Sorte>, x: T) => S): TableIdentificationMutable<Sorte, S>;
    /**
     * Ajoute l'association (identifiant, valeur) à la table mutable
     * si l'identifiant n'est pas présent.
     * @param ID_sorte identifiant servant de clé.
     * @param x valeur.
     * @returns true si l'association est ajoutée, false sinon.
     */
    ajouter(ID_sorte: Identifiant<Sorte>, x: T): boolean;
    /**
     * Modifie ou ajoute l'association (identifiant, valeur)
     *  à la table mutable.
     * @param ID_sorte identifiant servant de clé.
     * @param x valeur.
     * @returns une option contenant l'ancienne valeur en cas de modification, vide sinon.
     */
    modifier(ID_sorte: Identifiant<Sorte>, x: T): Option<T>;
    /**
     * Retire l'association (identifiant, ?) de la table mutable.
     * @param ID_sorte identifiant servant de clé.
     * @returns une option contenant la valeur retirée, vide sinon.
     */
    retirer(ID_sorte: Identifiant<Sorte>): Option<T>;
    /**
     * Crible les associations (identifiant, élément) de la table
     *  vérifiant le prédicat. La modification se fait en place.
     * @param prop prédicat utilisé pour cribler.
     * @returns rien avec l'effet de retirer les associations (ID, val) telles que !prop(ID, val).
     */
    cribler(prop: (ID_sorte: Identifiant<Sorte>, x: T) => boolean): void;
}

/**
 * Etat pour les tables mutables d'identification. 
 * Structure :
 * - identification : une table de T,
 * - sortes : une table de Sorte.
 * @param Sorte type représentant la sorte des identifiants 
 * @param T le type contenu dans la table
*/
export interface EtatTableMutableIdentification<Sorte extends SorteIdentifiant, T> {
    identification: Map<Record<Identifiant<Sorte>>, T>;
}

/**
 * Table d'identification mutable utilisant la valeur d'identificateurs
 * comme clé.
 */
class TableIdentificationMutableParEnveloppe<Sorte extends SorteIdentifiant, T>
    extends TableIdentificationParEnveloppe<Sorte, T>
    implements TableIdentificationMutable<Sorte, T> {

    constructor(sorte : Sorte,
        etat: Map<Record<Identifiant<Sorte>>, T>) {
        super(sorte, etat);
    }
    /**
     * Appliquer fonctoriellement f à la table.
     * @param f fonction à appliquer à chaque association de la table.
     * @returns une nouvelle table formée d'associations (clé, f(clé, t[clé]).
     */
    appliquer<S>(f: (ID_sorte: Identifiant<Sorte>, x: T) => S): TableIdentificationMutable<Sorte, S> {
        const tab = this.etat();
        const r = tab.map((v, id) => f(id.toJSON(), v));
        return new TableIdentificationMutableParEnveloppe(
            this.fabriqueID().sorte, r
        );
    }
    ajouter(ID_sorte: Identifiant<Sorte>, x: T): boolean {
        const tab = this.etat();
        const id = this.fabriqueID(ID_sorte);
        if(tab.has(id)){
            return false;
        }
        this._etat = tab.set(id, x);
        return true;        
    }
    modifier(ID_sorte: Identifiant<Sorte>, x: T): Option<T> {
        const tab = this.etat();
        const id = this.fabriqueID(ID_sorte);
        if(tab.has(id)){
            const r = tab.get(id) as T;
            this._etat = tab.set(id, x);
            return option(r);
        }else {
            this._etat = tab.set(id, x);
            return rienOption();
        }
    }
    retirer(ID_sorte: Identifiant<Sorte>): Option<T> {
        const tab = this.etat();
        const id = this.fabriqueID(ID_sorte);
        if(tab.has(id)){
            const r = tab.get(id) as T;
            this._etat = tab.delete(id);
            return option(r);
        }else {
            return rienOption();
        }
    }
    /**
     * Crible les associations (identifiant, élément) de la table
     *  vérifiant le prédicat. La modification se fait en place.
     * @param prop prédicat utilisé pour cribler.
     * @returns rien avec l'effet de retirer les associations (ID, val) telles que !prop(ID, val).
     */
    cribler(prop: (ID_sorte: Identifiant<Sorte>, x: T) => boolean): void {
        const tab = this.etat();
        this._etat = tab.filter((v, id) => 
            prop(id.toJSON(), v));
    }
}

export function creerTableIdentificationMutable<Sorte extends SorteIdentifiant, T>(
    sorte : Sorte, table : Map<Identifiant<Sorte>, T>)
    : TableIdentificationMutable<Sorte, T> {
    const tab = table.mapEntries(([ID,v]) => 
        [fabriqueIdentifiant(sorte, "defaut")(ID),v]);
    return new TableIdentificationMutableParEnveloppe(
        sorte, tab
    );
}

export function fabriquerTableIdentificationMutable<Sorte extends SorteIdentifiant, T>(
    sorte : Sorte, table : Map<Record<Identifiant<Sorte>>, T>)
    : TableIdentificationMutable<Sorte, T> {
    return new TableIdentificationMutableParEnveloppe(
        sorte, table
    );
}


export function creerTableIdentificationMutableVide<Sorte extends SorteIdentifiant, T>(
    sorte: Sorte
): TableIdentificationMutable<Sorte, T> {
    return creerTableIdentificationMutable(sorte, Map());
}

