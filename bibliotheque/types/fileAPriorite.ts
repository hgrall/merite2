/*
* Files à priorité - Une liste d'éléments accompagnés d'une priorité.
*/

import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { jamais, Mesurable } from "./typesAtomiques";
import { ajoutListeCroissante, Liste, triCroissant } from "./liste";




/**
 * Etat d'une file à priorité. Il s'agit d'une liste.
 */
export type EtatFileAPriorite<T> =
    {
        liste : Liste<[T, number]>
    };

/**
 * Format JSON pour une file à priorité. C'est une enveloppe d'un tableau natif (de type ReadonlyArray<T>). Requis : T est convertible en JSON.
 * La priorité est donnée par un nombre naturel : plus ce nombre est
 * proche de zéro, plus l'élément est prioritaire. 
 * Invariant : taille == tableau.length.
 * @param T type des éléments du tableau.
 */
export interface FormatFileAPriorite<T> extends Mesurable {
    readonly tableau: ReadonlyArray<[T, number]>
}

/**
 * Etiquettes utilisées pour la représentation des tableaux.
 */
export type EtiquetteFile = 'taille' | 'valeurs';


/**
 * File muatable à priorité étendant le type des enveloppes par des méthodes permettant : 
 * - l'ajout d'un élément,
 * - le retrait de l'élément le plus prioritaire. 
 * @param T type des éléments du tableau.
 */
export interface FileMutableAPriorite<T> extends
    TypeEnveloppe<EtatFileAPriorite<T>, FormatFileAPriorite<T>, EtiquetteFile> {

    /**
     * Taille de la file.
     * @returns la taille.
     */
    taille(): number;
    /**
     * Détermine si la file est vide.
     */
    estVide(): boolean;
    /**
     * Retire l'élément le plus prioritaire, celui dont la distance à zéro est la plus faible.
     */
    retirer() : T;
    /**
     * Ajoute un élément avec la priorité indiquée.
     * @param x élément à ajouter.
     * @param p nombre naturel indiquant la priorité (1 / (p + 1)).
     */
    ajouter(x : T, p : number) : void;
}

/**
 * File mutable à priorité implémentée par une enveloppe.
 * @param T type des valeurs dans la file.
 */
class FileMutableAPrioriteParEnveloppe<T>
    extends Enveloppe<EtatFileAPriorite<T>, FormatFileAPriorite<T>, EtiquetteFile>
    implements FileMutableAPriorite<T> {

    /**
     * Constructeur à partir de l'état d'une file.
     * Si T n'est pas un type JSON, une fonction de conversion doit 
     * être fournie. 
     * La liste reçue est triée à la construction.
     * @param etat table au format JSON.
     */
    constructor(etat: EtatFileAPriorite<T>) {
        etat.liste = triCroissant(
            etat.liste, 
            ([x, p], [y, q]) => (p <= q));
        super(etat);
    }
    
    /**
     * Représentation nette de la liste :
     * - taille : un entier naturel,
     * - valeurs : liste des valeurs
     */
    net(e: EtiquetteFile): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'valeurs': return JSON.stringify(this.toJSON().tableau);
        }
        return jamais(e);
    }
    /**
     * Représentation de la liste sous la forme suivante :
     * - [[v1, p1], [v2, p2], ...] avec les priorités décroissantes les pi croissants).
     */
    representation(): string {
        return this.net('valeurs');
    }
    
    /**
     * Représentation JSON du tableau.
     * @returns le tableau au format.
     */
    toJSON(): FormatFileAPriorite<T> {
        return this.etat().liste.toJSON();
    }
    taille(): number {
        return this.etat().liste.taille();
    }
    estVide(): boolean {
        return this.etat().liste.estVide();
    }

    retirer(): T {
        const l = this.etat().liste;
        const e = l.tete();
        this.etat().liste = l.reste();
        return e[0];
    }
    ajouter(x: T, p: number): void {
        const l = this.etat().liste;
        this.etat().liste = ajoutListeCroissante([x, p], l, (([x, p], [y, q]) => (p <= q)));
    }
}

/**
 * Fabrique d'une file à priorité.
 * @param tab tableau de valeurs, pouvant être énuméré ("var args")
 */
export function fileAPriorite<T>(l : Liste<[T, number]>): FileMutableAPriorite<T> {
    return new FileMutableAPrioriteParEnveloppe<T>({
        liste : l
    });
}