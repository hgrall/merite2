/*
* Files d'identifiants prioritaires (qui ont une priorité) 
*/
import { Map, Set, Record } from 'immutable';
import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { jamais, Mesurable, MesurableMutable } from "./typesAtomiques";
import { fabriqueIdentifiant, Identifiant } from "./identifiant";
import { SorteIdentifiant } from "../applications/sortes";


/**
 * Etat d'une file d'identifiants prioritaires. 
 * L'état est formé d'une table associant à une priorité
 * un ensemble d'identifiants 
 * et de la priorité maximale de la table.  
 * Une priorité est un entier naturel. Leur ensemble est ordonné,
 * suivant l'ordre inverse : plus la distance à zéro est grande, 
 * plus la priorité est faible. 
 * @param Sorte type singleton décrivant la sorte d'identifiants.
 */
export interface EtatMutableFileIdentifiantsPrioritaires<Sorte extends SorteIdentifiant> extends MesurableMutable {
    prioriteMaximale: number;
    classement: Map<number, Set<Record<Identifiant<Sorte>>>>;
}

/**
 * Format des files d'identifiants prioritaires.
 */
export interface FormatFileIdentifiantsPrioritaires<Sorte extends SorteIdentifiant> extends Mesurable {
    readonly classement: {
        [priorite: string]: ReadonlyArray<Identifiant<Sorte>>
    };
}

/**
 * Etiquettes utilisées pour la représentation des tableaux.
 */
export type EtiquetteFileIdentifiantsPrioritaire = 'taille' | 'classement';


/**
 * File mutable d'identifiants prioritaires 
 * étendant le type des enveloppes par des méthodes permettant : 
 * - l'ajout d'un identifiant,
 * - la modification de la priorité d'identifiants,
 * - le retrait d'un identifiant parmi les plus prioritaires. 
 * @param Sorte type singleton décrivant la sorte d'identifiants.
 */
export interface FileMutableIdentifiantsPrioritaires<
    Sorte extends SorteIdentifiant> extends
    TypeEnveloppe<
    EtatMutableFileIdentifiantsPrioritaires<Sorte>,
    FormatFileIdentifiantsPrioritaires<Sorte>,
    EtiquetteFileIdentifiantsPrioritaire> {

    /**
     * Nombre d'identifiants dans la file.
     * @returns la taille.
     */
    taille(): number;
    /**
     * Détermine si la file est vide.
     */
    estVide(): boolean;
    /**
     * Retire un identifiant parmi les plus prioritaires, un dont la distance à zéro est la plus faible.
     */
    retirer(): Identifiant<Sorte>;
    /**
     * Ajoute un identifiant avec la priorité indiquée.
     * @param ID_sorte identifiant à ajouter.
     * @param p nombre naturel indiquant la priorité (1 / (p + 1)).
     */
    ajouter(ID_sorte: Identifiant<Sorte>, p: number): void;
    /**
     * Modifie la priorité d'un identifiant.
     * @param ID_sorte identifiant à modifier
     * @param anciennePriorite ancienne priorité
     * @param nouvellePriorite nouvelle priorité
     */
    modifier(
        ID_sorte: Identifiant<Sorte>,
        anciennePriorite: number, nouvellePriorite: number): void;
}

function prioriteMaximale<T>(cl: Map<number, T>): number {
    let p = Number.MAX_VALUE;
    cl.keySeq().forEach((q, i) => {
        if (q < p) {
            p = q;
        }
    });
    return p;
}

/**
 * File mutable à priorité implémentée par une enveloppe.
 * @param T type des valeurs dans la file.
 */
class FileMutableIdentifiantsPrioritairesParEnveloppe<Sorte extends SorteIdentifiant>
    extends Enveloppe<
    EtatMutableFileIdentifiantsPrioritaires<Sorte>,
    FormatFileIdentifiantsPrioritaires<Sorte>,
    EtiquetteFileIdentifiantsPrioritaire>
    implements FileMutableIdentifiantsPrioritaires<Sorte> {

    private fabriqueID: Record.Factory<Identifiant<Sorte>>;

    /**
     * Constructeur à partir de l'état d'une file.
     * Si T n'est pas un type JSON, une fonction de conversion doit 
     * être fournie. 
     * La liste reçue est triée à la construction.
     * @param etat table au format JSON.
     */
    constructor(sorte: Sorte, etat: EtatMutableFileIdentifiantsPrioritaires<Sorte>) {
        super(etat);
        this.fabriqueID = fabriqueIdentifiant<Sorte>(sorte, "defaut");
    }

    /**
     * Représentation nette de la liste :
     * - taille : un entier naturel,
     * - valeurs : liste des valeurs
     */
    net(e: EtiquetteFileIdentifiantsPrioritaire): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'classement':
                return JSON.stringify(this.toJSON().classement);
        }
        return jamais(e);
    }
    /**
     * Représentation de la liste sous la forme suivante :
     * - [[v1, p1], [v2, p2], ...] avec les priorités décroissantes les pi croissants).
     */
    representation(): string {
        return this.net('classement');
    }

    /**
     * Représentation JSON du tableau.
     * @returns le tableau au format.
     */
    toJSON(): FormatFileIdentifiantsPrioritaires<Sorte> {
        let valeurs = this.etat().classement.
            map((ids, p) => ids.map((id) => id.toJSON()).toJSON());
        return {
            taille: this.taille(),
            classement: valeurs.toJSON()
        }
    }
    taille(): number {
        return this.etat().taille;
    }
    estVide(): boolean {
        return this.taille() === 0;
    }
    retirerAvecPriorite(id : Record<Identifiant<Sorte>>, p : number) : void{
        let cl = this.etat().classement;
        let ens = cl.get(p, Set<Record<Identifiant<Sorte>>>());
        ens = ens.delete(id);
        if (ens.isEmpty()) {
            cl = cl.delete(p);
            if (!cl.isEmpty() && (p === this.etat().prioriteMaximale)) {
                this.etat().prioriteMaximale = prioriteMaximale(cl);
            }
        } else {
            cl = cl.set(p, ens);
        }
        this.etat().taille--;
        this.etat().classement = cl;
    }
    retirer(): Identifiant<Sorte> {
        let cl = this.etat().classement;
        const pmax = this.etat().prioriteMaximale;
        let ens = cl.get(pmax, Set<Record<Identifiant<Sorte>>>());
        const r = ens.first(this.fabriqueID());
        this.retirerAvecPriorite(r, pmax);
        return r.toJSON();
    }
    ajouter(ID_sorte: Identifiant<Sorte>, p: number): void {
        let cl = this.etat().classement;
        if (cl.isEmpty() || (p < this.etat().prioriteMaximale)) {
            this.etat().prioriteMaximale = p;
        }
        if (!cl.has(p)) {
            cl = cl.set(p, Set<Record<Identifiant<Sorte>>>());
        }
        let ens = cl.get(p, Set<Record<Identifiant<Sorte>>>());
        ens = ens.add(this.fabriqueID(ID_sorte));
        cl = cl.set(p, ens);
        this.etat().taille++;
        this.etat().classement = cl;
    }
    modifier(ID_sorte: Identifiant<Sorte>,
        anciennePriorite: number,
        nouvellePriorite: number): void {
        if (anciennePriorite === nouvellePriorite) {
            return;
        };
        this.ajouter(ID_sorte, nouvellePriorite);
        this.retirerAvecPriorite(this.fabriqueID(ID_sorte), anciennePriorite);
    }
}

/**
 * Fabrique d'une file vide d'identifiants prioritaires.
 * @param tab tableau de valeurs, pouvant être énuméré ("var args")
 */
export function creerFileMutableVideIdentifiantsPrioritaires<
    Sorte extends SorteIdentifiant>(sorte : Sorte): FileMutableIdentifiantsPrioritaires<Sorte> {
    return new FileMutableIdentifiantsPrioritairesParEnveloppe<Sorte>(
        sorte,
        {
            taille: 0,
            prioriteMaximale: 0,
            classement: Map()
        });
}