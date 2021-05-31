import { TypeEnveloppe, Enveloppe } from "./enveloppe";
import { jamais, Unite } from "./typesAtomiques";


/**
 * Type union représentant un T ou une option vide.  
 */
type FormatOption<T> = {option : T} | { vide: Unite };

/**
 * Détermine si l'option est vide.
 * @param x une option
 * @returns la valeur du prédicat de typage "x est Vide".
 */
function estVide<T>(x: FormatOption<T>): x is { vide: Unite } {
    return ("vide" in x);
}

/**
 * Etiquette unique pour les options.
 */
export type EtiquetteOption = 'type';

/**
 * Interface pour les options. Requis : T est un type convertible en JSON.
 * 
 * Option T ::= Vide | T 
 * 
 * @param T type de l'option.
 */
export interface Option<T> extends TypeEnveloppe<FormatOption<T>, FormatOption<T>, EtiquetteOption> {
    /**
     * Filtrage de l'option en distinguant les deux cas.
     * @param present fonction de traitement en cas de présence.
     * @param absent fonction de traitement en cas d'absence.
     */
    filtrage<S>(present: (x: T) => S, absent: () => S): S;
    /**
     * Teste si l'option est réalisée.
     * @returns true si l'option contient une valeur, false sinon.
     */
    estPresent(): boolean;
    /**
     * Teste si l'option est vide
     * @returns true si l'option est vide, false sinon.
     */
    estVide(): boolean;
    /**
     * Valeur contenue dans l'option.
     * @returns valeur de type T
     */
    valeur(): T;
}

/**
 * Implémentation par une enveloppe.
 */
class OptionParEnveloppe<T>
    extends Enveloppe<FormatOption<T>, FormatOption<T>, EtiquetteOption>
    implements Option<T>{
    constructor(v: FormatOption<T>) {
        super(v);
    }
    /**
     * Réprésentation du type de l'option.
     * @param e étiquette.
     * @returns une chaîne de caratères représentant le type de l'option.
     */
    net(e: EtiquetteOption): string {
        switch (e) {
            case 'type': {
                return this.estVide() ? `option vide` : 'option pleine';
            }
        }
        return jamais(e);
    }

    /**
     * Représentation partielle de l'option.
     * @return  type de l'option.
     */
    representation(): string {
        return this.net('type');
    }
    
    /**
     * Filtrage suivant le type de l'option.
     * @param present fonction à appliquer à une option pleine.
     * @param absent fonction à appliquer à une option vide.
     */
    filtrage<S>(present: (x: T) => S, absent: () => S): S {
        let e = this.etat();
        if (estVide(e)) {
            return absent();
        } else {
            return present(e.option);
        }
    }
    /**
     * Teste si l'option est réalisée.
     * @returns true si l'option contient une valeur, false sinon.
     */
    estPresent() {
        return !this.estVide();
    }
    /**
     * Teste si l'option est vide
     * @returns true si l'option est vide, false sinon.
     */
    estVide() {
        return (estVide(this.etat()));
    }
    /**
     * Valeur de l'option.
     * @returns valeur de l'option ou une exception si elle est vide.
     */
    valeur(): T {
        let e = this.etat();
        if (estVide(e)) {
            throw new Error("[Exception : valeur() non définie pour une option vide.]");
        } else {
            return e.option;
        }
    }
    /**
     * Représentation en JSON.
     * @returns la représentation JSON de l'option.
     */
    toJSON(): FormatOption<T> {
        return this.etat();
    }
}

/**
 * Fabrique d'une option vide.
 */
export function rienOption<T>(): Option<T> {
    return new OptionParEnveloppe<T>({vide : Unite.ZERO });
}

/**
 * Fabrique d'une option à partir d'un T.
 * @param x la valeur à envelopper.
 */
export function option<T>(x: T){
    return new OptionParEnveloppe({ option : x});
}