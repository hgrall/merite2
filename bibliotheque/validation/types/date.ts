import * as t from "io-ts";
import {Mois, Semaine} from "../../types/date";

/**
 * Union de tous les jours de la semaine à partir de l'enum Semaine
 */
const SemaineFormat = t.union([
    t.literal(Semaine.LUNDI),
    t.literal(Semaine.MARDI),
    t.literal(Semaine.MERCREDI),
    t.literal(Semaine.JEUDI),
    t.literal(Semaine.VENDREDI),
    t.literal(Semaine.SAMEDI),
    t.literal(Semaine.DIMANCHE)
])

/**
 * Union de tous les mois à partir de l'enum Mois
 */
const MoisFormat = t.union([
    t.literal(Mois.JANVIER),
    t.literal(Mois.FEVRIER),
    t.literal(Mois.MARS),
    t.literal(Mois.AVRIL),
    t.literal(Mois.MAI),
    t.literal(Mois.JUIN),
    t.literal(Mois.JUILLET),
    t.literal(Mois.AOUT),
    t.literal(Mois.SEPTEMBRE),
    t.literal(Mois.OCTOBRE),
    t.literal(Mois.NOVEMBRE),
    t.literal(Mois.DECEMBRE)
])

/**
 * Schema d'une date aà valider
 */
export const FormatDateValidator = t.type({
    seconde: t.number,
    minute: t.number,
    heure: t.number,
    jourSemaine: SemaineFormat,
    jourMois: t.number,
    mois: MoisFormat,
    annee: t.number,
})