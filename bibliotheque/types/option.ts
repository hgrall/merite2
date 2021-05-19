import { TypeEnveloppe, Enveloppe } from "./enveloppe";
import { jamais } from "./typesAtomiques";

export class FormatOptionVide { }
export type FormatOption<T> = T | FormatOptionVide;
export type EtiquetteOption = 'type';

export interface Option<T> extends TypeEnveloppe<FormatOption<T>, EtiquetteOption> {
    filtrage<S>(present: (x: T) => S, absent: () => S): S;
    estPresent(): boolean;
    estVide(): boolean;
    valeur(): T;
}

class OptionParEnveloppe<T>
    extends Enveloppe<FormatOption<T>, EtiquetteOption>
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
        let e = this.val();
        if (e instanceof FormatOptionVide) {
            return absent();
        } else {
            return present(e);
        }
    }
    estPresent() {
        return !this.estVide();
    }
    estVide() {
        let e = this.val();
        return (e instanceof FormatOptionVide);
    }
    valeur(): T {
        let e = this.val();
        if (e instanceof FormatOptionVide) {
            throw new Error("[Exception : valeur() non définie pour une option vide.]");
        } else {
            return e;
        }
    }
}

export function rienOption<T>(): Option<T> {
    return new OptionParEnveloppe<T>(new FormatOptionVide());
}

export function option<T>(x: FormatOption<T>){
    return new OptionParEnveloppe(x);
}