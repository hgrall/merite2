import * as t from 'io-ts';

import {Mois, Semaine} from "../../bibliotheque/types/date";


const IdentifiantSommet = t.type({
    val: t.string,
    sorte: t.literal("sommet")
});

const IdentifiantMessage = t.type({
    val: t.string,
    sorte: t.literal("message")
});

const FormatTableau = t.type({
    taille: t.number,
    tableau: t.array(IdentifiantSommet)
})

const FormatMessageEnvoiTchatValidator = t.type({
    ID_emetteur: IdentifiantSommet,
    contenu: t.string,
    ID_destinataires: FormatTableau
})

const SemaineFormat = t.union([
    t.literal(Semaine.LUNDI),
    t.literal(Semaine.MARDI),
    t.literal(Semaine.MERCREDI),
    t.literal(Semaine.JEUDI),
    t.literal(Semaine.VENDREDI),
    t.literal(Semaine.SAMEDI),
    t.literal(Semaine.DIMANCHE)
])

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
 * Schéma JSON pour les dates et les heures francaises.
 */
const FormatDateValidator = t.type({
    seconde: t.number,
    minute: t.number,
    heure: t.number,
    jourSemaine: SemaineFormat,
    jourMois: t.number,
    mois: MoisFormat,
    annee: t.number,
})

export const FormatMessageTchatValidator = t.type({
    ID: IdentifiantMessage,
    type: t.literal("envoi"),
    date: FormatDateValidator,
    corps: FormatMessageEnvoiTchatValidator
});
