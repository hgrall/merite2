/*
Dates en Français
*/

import { normalisationNombre } from "./nombres";
import { jamais } from "./typesAtomiques";

import { Enveloppe, TypeEnveloppe } from "./enveloppe";

/**
 * Jours de la semaine en français.
 */
export enum Semaine {
    LUNDI,
    MARDI,
    MERCREDI,
    JEUDI,
    VENDREDI,
    SAMEDI,
    DIMANCHE
}

/**
 * Mois de l'année en français.
 */
export enum Mois {
    JANVIER, FEVRIER, MARS,
    AVRIL, MAI, JUIN,
    JUILLET, AOUT, SEPTEMBRE,
    OCTOBRE, NOVEMBRE, DECEMBRE
}

/**
 * Schéma JSON pour les dates et les heures francaises.
 */
export interface FormatDateFr {
    readonly seconde: number;
    readonly minute: number;
    readonly heure: number;
    readonly jourSemaine: Semaine;
    readonly jourMois: number;
    readonly mois: Mois;
    readonly annee: number;
}

/**
 * Etiquettes pour sélectionner des composants d'une date.
 */
export type EtiquetteDateFr =
    'heure'
    | 'jourSemaine' | 'jourMois'
    | 'moisLettre' | 'moisNumero'
    | 'annee'
    | 'date' | 'dateLongue';

/**
 * Interface structurelle définissant une date.
 */
export interface DateFr extends TypeEnveloppe<FormatDateFr, EtiquetteDateFr> {
    representationLongue(): string;
    representationLog(): string;
}

/**
 * Conversion du type natif Date au format de date française.
 * @param d date native.
 * @returns la date française correspondant.
 */
export function conversionDate(d: Date): FormatDateFr {
    return {
        seconde: d.getSeconds(),
        minute: d.getMinutes(),
        heure: d.getHours(),
        jourSemaine: (d.getDay() + 6) % 7,
        jourMois: d.getDate(),
        mois: d.getMonth(),
        annee: d.getFullYear()
    };
}

/**
 * Classe enveloppe représentant les datess.
 */
class DateFrEnveloppe extends Enveloppe<FormatDateFr, FormatDateFr, EtiquetteDateFr>
    implements DateFr {

    /**
     * Réprésentation des composantes sélectionnées de la date.
     * @param e étiquette pour sélection des composants de la date.
     * @returns une chaîne de caratères représentant les composantes.
     */
    net(e: EtiquetteDateFr): string {
        switch (e) {
            case 'heure': {
                let s = normalisationNombre(this.etat().seconde, 2);
                let min = normalisationNombre(this.etat().minute, 2);
                let h = normalisationNombre(this.etat().heure, 2);
                return `${h}:${min}:${s}`;
            }
            case 'jourSemaine': {
                let js = this.etat().jourSemaine;
                let jsL = Semaine[js].toLowerCase();
                return jsL;
            }
            case 'jourMois': {
                let jm = normalisationNombre(this.etat().jourMois, 2);
                return jm;
            }
            case 'moisLettre': {
                let mo = this.etat().mois;
                let moL = Mois[mo].toLowerCase();
                return moL;
            }
            case 'moisNumero': {
                let mo = this.etat().mois;
                let moN = normalisationNombre(mo + 1, 2);
                return moN;
            }
            case 'annee': {
                let a = this.etat().annee.toString();
                return a;
            }
            case 'date': {
                let a = this.etat().annee.toString();
                let jm = normalisationNombre(this.etat().jourMois, 2);
                let mo = this.etat().mois;
                let moN = normalisationNombre(mo + 1, 2);
                return `${jm}/${moN}/${a}`;
            }
            case 'dateLongue': {
                let js = this.etat().jourSemaine;
                let jsL = Semaine[js].toLowerCase();
                let jm = normalisationNombre(this.etat().jourMois, 2);
                let mo = this.etat().mois;
                let moL = Mois[mo].toLowerCase();
                let a = this.etat().annee.toString();
                return `${jsL} ${jm} ${moL} ${a}`;
            }
        }
        return jamais(e);
    }

    /**
     * Représentation de la date.
     * @return  la date sous la forme 12:53:53, le 02/02/2017.
     */
    representation(): string {
        return this.net('heure') + ", le " + this.net('date');
    }

    /**
     * Représentation longue de la date.
     * @returns la date sous la forme 12:53:53, le vendredi 02 fevrier 2017.
     */
    representationLongue(): string {
        return this.net('heure') + ", le " + this.net('dateLongue');
    }

    /**
     * Représentation de la date pour les logs.
     * @returns la date sous la forme 12:53:53 02/02/2017.
     */
    representationLog(): string {
        return this.net('heure') + " " + this.net('date');
    }

}

/**
 * Fabrique d'une date avec pour valeur l'instant present où la fonction est appelée.
 * @returns la date courante (, format français).
 */
export function dateMaintenant(): DateFr {
    return new DateFrEnveloppe(x => x, conversionDate(new Date()));
}


/**
 * Fabrique d'une date à partir d'une decription JSON.
 * @param d date Fr au format JSON
 * @returns la date correspondant au format JSON (, format français).
 */
export function dateEnveloppe(d: FormatDateFr): DateFr {
    return new DateFrEnveloppe(x => x, d);
}