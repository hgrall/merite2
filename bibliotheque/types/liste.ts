/*
* Tableaux - Un tableau peut être considéré comme une fonction
* d'un segment initial de Nat dans un ensemble.
*/

import { Enveloppe, TypeEnveloppe } from "./enveloppe";
import { jamais, Mesurable, Unite } from "./typesAtomiques";
import { creerTableauMutableVide, TableauMutable } from "./tableau";

/**
 * Type représentant l'état d'une liste construite de T.  
 */
export type EtatListeCons<T> =
    {
        readonly taille: number;
        readonly tete: T;
        readonly reste: EtatListe<T>
    }
/**
 * Type représentant l'état d'une liste vide.  
 */
export type EtatListeVide =
    {
        readonly taille: number;
        readonly vide: Unite
    };
/**
 * Type union représentant l'état d'une liste de T.  
 */
export type EtatListe<T> = EtatListeCons<T> | EtatListeVide;

/**
 * Détermine si la fonction est vide.
 * @param x une liste
 * @returns la valeur du prédicat de typage "x est Vide".
 */
function estVide<T>(x: EtatListe<T>): x is EtatListeVide {
    return ("vide" in x);
}

/**
 * Filtrage d'une liste en l'état.
 */
export function filtrage<T, R>(
    l: EtatListe<T>,
    casVide: () => R,
    casCons: (t: T, r: EtatListe<T>) => R): R {
    if (estVide(l)) {
        return casVide();
    } else {
        return casCons(l.tete, l.reste);
    }
}

/**
 * Format JSON pour une liste. C'est une enveloppe d'un tableau natif (de type ReadonlyArray<T>). Requis : T est convertible en JSON.
 * Alias de FormatTableau.
 * Invariant : taille == tableau.length.
 * @param T type des éléments du tableau.
 */
export interface FormatListe<T> extends Mesurable {
    readonly tableau: ReadonlyArray<T>
}


/**
 * Etiquettes utilisées pour la représentation des tableaux.
 */
export type EtiquetteListe = 'taille' | 'valeurs';


/**
 * Liste immutable étendant le type des enveloppes par des méthodes permettant : TODO
 * - le filtrage,
 * - l'itération,
 * - l'application fonctorielle,
 * - la réduction,
 * - l'observation complète de la liste.
 * @param T type des éléments du tableau.
 */
export interface Liste<T> extends
    TypeEnveloppe<EtatListe<T>, FormatListe<T>, EtiquetteListe> {

    /**
     * Tête de la liste. 
     */
    tete(): T;
    /**
     * Reste de la liste. 
     */
    reste(): Liste<T>;
    /**
     * Taille de la liste.
     * @returns la taille.
     */
    taille(): number;
    /**
     * Détermine si la liste est vide.
     */
    estVide(): boolean;
    
    /**
     * Filtrage de la liste en distinguant les deux cas.
     * Une alternative est plus efficace : 
     * filtrage(this.etat(), ...). 
     * @param vide fonction de traitement en cas de liste vide.
     * @param cons fonction de traitement en cas de liste construite.
     */
    filtrage<S>(vide : () => S, cons: (t: T, r : Liste<T>) => S, ): S;

    /**
     * Itère sur les éléments du tableau en appliquant 
     * la procédure passée en argument.
     * @param f procédure à appliquée à chaque élément.
     */
    iterer(
        f: (val: T) => void
    ): void;
    /**
     * Application fonctorielle de la fonction passée en argument.
     * Un nouveau tableau immutable est créé dont les valeurs sont les images
     * des valeurs de ce tableau.
     * @param f fonction à appliquer.
     */
    application<S>(f: (x: T) => S): Liste<S>;
    /**
     * Réduction du tableau en une valeur.
     * Le résultat est, en notation infixe :
     * - neutre op v0 op v1 op ...
     * @param neutre élément neutre de l'opération.
     * @param op opération binaire appliquée aux éléments du tableau.
     * @returns la valeur (...((neutre op t[0]) op t[1])...).
     */
    reduction(neutre: T, op: (x: T, y: T) => T): T;
    /**
     * Miroir de la liste.
     */
    miroir() : Liste<T> ;
}

/**
 * Tableau immutable implémenté par une enveloppe.
 * @param T type des valeurs dans le tableau.
 */
class ListeParEnveloppe<T>
    extends Enveloppe<EtatListe<T>, FormatListe<T>, EtiquetteListe>
    implements Liste<T> {

    /**
     * Constructeur à partir de l'état d'une liste. 
     * @param etat état d'une liste.
     */
    constructor(etat: EtatListe<T>) {
        super(etat);
    }

/**
     * Représentation nette de la liste :
     * - taille : un entier naturel,
     * - valeurs : liste des valeurs
     */
    net(e: EtiquetteListe): string {
        switch (e) {
            case 'taille': return JSON.stringify(this.taille());
            case 'valeurs': return JSON.stringify(this.toJSON().tableau);
        }
        return jamais(e);
    }
    /**
     * Représentation de la liste sous la forme suivante :
     * - [v1, v2, ...].
     */
    representation(): string {
        return this.net('valeurs');
    }
    
    /**
     * Représentation JSON du tableau.
     * @returns le tableau au format.
     */
    toJSON(): FormatListe<T> {
        const r : TableauMutable<T> = creerTableauMutableVide<T>();
        this.iterer((v) => r.ajouterEnFin(v));
        return r.toJSON();
    }
    tete(): T {
        const e = this.etat();
        if(estVide(e)){
            throw new Error("[Exception : tete() sur une liste vide non défini.]");
        }else{
            return e.tete;
        }
    }
    reste(): Liste<T> {
        const e = this.etat();
        if(estVide(e)){
            throw new Error("[Exception : reste() sur une liste vide non défini.]");
        }else{
            return new ListeParEnveloppe<T>(e.reste);
        }
    }
    taille(): number {
        return this.etat().taille;
    }
    estVide(): boolean {
        return estVide(this.etat());
    }
    /**
     * Filtrage de la liste en distinguant les deux cas. 
     * Une alternative est plus efficace : 
     * filtrage(this.etat(), ...). 
     * @param vide fonction de traitement en cas de liste vide.
     * @param cons fonction de traitement en cas de liste construite.
     */
    filtrage<S>(vide: () => S, cons: (t: T, r: Liste<T>) => S): S {
        const e = this.etat();
        if(estVide(e)){
            return vide();
        }else{
            return cons(e.tete, new ListeParEnveloppe<T>(e.reste));
        }
    }
    iterer(f: (val: T) => void): void {
        let e = this.etat();
        while(!estVide(e)){
            f(e.tete);
            e = e.reste;
        }
    }
    application<S>(f: (x: T) => S): Liste<S> {
        let r = listeVide<S>();
        this.iterer((v) => r = listeCons(f(v), r));
        return r.miroir();
    }
    reduction(neutre: T, op: (x: T, y: T) => T): T {
        let r = neutre;
        this.iterer((v) => r = op(r, v));
        return r;
    }
    /**
     * Miroir de la liste.
     */
    miroir() : Liste<T> {
        let r = listeVide<T>();
        r.iterer((v) => r = listeCons(v, r));
        return r;
    }
}

/**
 * Fabrique d'une liste vide.
 */
export function listeVide<T>() : Liste<T> {
    return new ListeParEnveloppe<T>({taille : 0, vide : Unite.ZERO});
}

/**
 * Fabrique d'une liste construite.
 * @param t tête de la liste.
 * @param r reste de la liste.
 */
export function listeCons<T>(t : T, r : Liste<T>) : Liste<T> {
    return new ListeParEnveloppe<T>(
        {taille : r.taille() + 1, tete : t, reste : r.etat()});
}

/**
 * Fabrique d'une liste.
 * @param tab tableau de valeurs, pouvant être énuméré ("var args")
 */
export function liste<T>(...tab: ReadonlyArray<T>): Liste<T> {
    let l: Liste<T> = listeVide();
    for (let i = tab.length - 1; i >= 0; i--) {
        l = listeCons(tab[i], l);
    }
    return l;
}

function ajoutEtatListeCroissante<T>(t : T, l : EtatListe<T>, inf : (x : T, y : T) => boolean) : EtatListe<T> {
    if(estVide(l)){
        return { 
            taille : 1, 
            tete : t, 
            reste : {taille : 0, vide : Unite.ZERO}};
    }else{
        if(inf(t, l.tete)){
            return {
                taille : 1 + l.taille, 
                tete : t, 
                reste : l 
            };
        }else{
            return {
                taille : 1 + l.taille, 
                tete : l.tete, 
                reste : ajoutEtatListeCroissante(t, l.reste, inf) 
            };
        }
    }
}

/**
 * Ajout d'un élément dans une liste triée, en préservant l'ordre.
 * @param e élément à ajouter
 * @param l liste triée
 * @param inf ordre (prédicat "inférieur à").
 * @returns une liste triée, avec l'élément en plus
 */
export function ajoutListeCroissante<T>(e : T, l : Liste<T>, inf : (x : T, y : T) => boolean) : Liste<T> {
    return new ListeParEnveloppe<T>(ajoutEtatListeCroissante(e, l.etat(), inf));
}
function triCroissantEtatListe<T>(l : EtatListe<T>, inf : (x : T, y : T) => boolean) : EtatListe<T> {
    if(estVide(l)){
        return l;
    }else{
        return ajoutEtatListeCroissante(l.tete, triCroissantEtatListe(l.reste, inf), inf);
    }
}

/**
 * Tri croissant de la liste passée en argument.
 * @param l liste
 * @param inf ordre (prédicat "inférieur à").
 * @returns une liste triée.
 */
export function triCroissant<T>(l : Liste<T>, inf : (x : T, y : T) => boolean) : Liste<T> {
    return new ListeParEnveloppe<T>(triCroissantEtatListe(l.etat(), inf));
}