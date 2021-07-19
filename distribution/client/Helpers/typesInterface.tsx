import {Couleur} from "../../../bibliotheque/interface/couleur";

import {Identifiant} from "../../../bibliotheque/types/identifiant";
import {Deux} from "../../../bibliotheque/types/typesAtomiques";
import {FormatDateFr} from "../../../bibliotheque/types/date";
import {
    FormatConsigne, FormatDomaineDistribution,
    FormatUtilisateurDistribution
} from "../../commun/echangesDistribution";

export interface DomaineInterface {
    readonly domaine: FormatDomaineDistribution;
    readonly fond: Couleur;
    readonly encre: Couleur;
}

export interface ActionAffichable {
}

export interface Formulaire extends ActionAffichable {
}

export class FormulaireMessage implements Formulaire {
    constructor(
        public readonly emetteur: FormatUtilisateurDistribution,
        public readonly domaineEmission: DomaineInterface,
        public readonly domaineDestin: DomaineInterface,
        public trame: ReadonlyArray<Deux>,
        public readonly consigne: FormatConsigne) {
    }
}

export function formulaireMessage(
    emetteur: FormatUtilisateurDistribution,
    domaineEmission: DomaineInterface,
    domaineDestin: DomaineInterface,
    trame: ReadonlyArray<Deux>,
    consigne: FormatConsigne): FormulaireMessage {
    return new FormulaireMessage(emetteur, domaineEmission, domaineDestin, trame, consigne);
}

export class FormulaireEssai implements Formulaire {
    constructor(
        public readonly ID: Identifiant<'message'>,
        public readonly essayeur: FormatUtilisateurDistribution,
        public readonly domaineEssayeur: DomaineInterface,
        public readonly emetteur: FormatUtilisateurDistribution,
        public readonly domaineEmetteur: DomaineInterface,
        public trame: ReadonlyArray<Deux>,
        public readonly consigne: FormatConsigne) {
    }
}

export function formulaireEssai(
    id: Identifiant<'message'>,
    essayeur: FormatUtilisateurDistribution,
    domaineEssayeur: DomaineInterface,
    emetteur: FormatUtilisateurDistribution,
    domaineEmetteur: DomaineInterface,
    original: ReadonlyArray<Deux>,
    consigne: FormatConsigne): FormulaireEssai {
    return new FormulaireEssai(id, essayeur, domaineEssayeur,
        emetteur, domaineEmetteur, original, consigne);
}


export type TypeMessageInformant
    = 'AR_initial' | 'transit' | 'omission'
    | 'verrouillage' | 'verrouillage_autrui'
    | 'transmission' | 'gain' | 'perte' | 'essai';

// utilisateur = emetteur vs recepteur vs recepteur

export class MessageInformant {
    constructor(
        public readonly ID: Identifiant<'message'>,
        public readonly utilisateur: FormatUtilisateurDistribution,
        public readonly domaineUtilisateur: DomaineInterface,
        public readonly domaineEmission: DomaineInterface,
        public readonly domaineDestination: DomaineInterface,
        public readonly trame: ReadonlyArray<Deux>,
        public readonly interpretation: ReadonlyArray<Deux>,
        public readonly date: FormatDateFr,
        public readonly typeInformation: TypeMessageInformant) {
    }
}

export function messageInformant(
    identifiant: Identifiant<'message'>,
    utilisateur: FormatUtilisateurDistribution,
    domaineUtilisateur: DomaineInterface,
    domaineEmission: DomaineInterface,
    domaineReception: DomaineInterface,
    trame: ReadonlyArray<Deux>,
    date: FormatDateFr,
    typeInformation: TypeMessageInformant) {
    return new MessageInformant(
        identifiant, utilisateur, domaineUtilisateur,
        domaineEmission, domaineReception,
        trame, [], date, typeInformation);
}

export function messageInformantAvecInterpretation(
    identifiant: Identifiant<'message'>,
    utilisateur: FormatUtilisateurDistribution,
    domaineUtilisateur: DomaineInterface,
    domaineEmission: DomaineInterface,
    domaineReception: DomaineInterface,
    trame: ReadonlyArray<Deux>,
    interpretation: ReadonlyArray<Deux>,
    date: FormatDateFr,
    typeInformation: TypeMessageInformant) {
    return new MessageInformant(
        identifiant, utilisateur, domaineUtilisateur,
        domaineEmission, domaineReception,
        trame, interpretation, date, typeInformation);
}

export function messageInformantAvecNouveauxInterpretationType(
    msg: MessageInformant, i: ReadonlyArray<Deux>, type: TypeMessageInformant) {
    return new MessageInformant(
        msg.ID, msg.utilisateur, msg.domaineUtilisateur,
        msg.domaineEmission, msg.domaineDestination,
        msg.trame, i, msg.date, type);
}

export function messageInformantAvecNouveauType(
    msg: MessageInformant, type: TypeMessageInformant) {
    return new MessageInformant(
        msg.ID, msg.utilisateur, msg.domaineUtilisateur,
        msg.domaineEmission, msg.domaineDestination,
        msg.trame, msg.interpretation, msg.date, type);
}


// TODO inutile ?
export interface Message {
    readonly ID: Identifiant<'message'>;
    readonly domaineEmission: DomaineInterface;
    readonly domaineDestination: DomaineInterface;
    //readonly cachet: string;
    readonly contenu: ReadonlyArray<Deux>;
}


/**
 * readonly ID_utilisateur: Identifiant<'utilisateur'>;
 readonly ID_origine: Identifiant<'sommet'>;
 readonly ID_destination: Identifiant<'sommet'>;
 readonly type: TypeMessageDistribution;
 readonly contenu: ReadonlyArray<Deux>;
 readonly date: FormatDateFr;
 */