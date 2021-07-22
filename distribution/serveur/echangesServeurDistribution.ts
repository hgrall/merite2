import { dateMaintenant } from "../../bibliotheque/types/date";
import { EnsembleIdentifiants } from "../../bibliotheque/types/ensembleIdentifiants";
import { Identifiant } from "../../bibliotheque/types/identifiant";
import { rienOption, Option, option } from "../../bibliotheque/types/option";
import { FormatMessageEnvoiDistribution, FormatMessageTransitDistribution, FormatMessageVerrouDistribution, TypeMessageDistribution } from "../commun/echangesDistribution";


export function traductionEnvoiEnTransit(
    e: FormatMessageEnvoiDistribution,
    ID_util_dest: Identifiant<'sommet'>,
    ID_msg: Identifiant<'message'>): FormatMessageTransitDistribution {
    return {
        ID: ID_msg,
        type: TypeMessageDistribution.TRANSIT,
        corps: {
            ID_utilisateur_emetteur: ID_util_dest,
            ID_origine: e.corps.ID_origine,
            ID_destination: e.corps.ID_destination,
            contenu: e.corps.contenu
        },
        date: dateMaintenant().toJSON()
    };
}

export interface ReponsePOSTEnvoi {
    accuseReception: FormatMessageEnvoiDistribution;
    utilisateursDestinataires: EnsembleIdentifiants<"sommet">
}

export interface FormatMessageAvecVerrou {
    message: FormatMessageTransitDistribution;
    verrou: Option<Identifiant<'sommet'>>;
}

export function messageAvecVerrouInitial(idMsg: Identifiant<'message'>, msg: FormatMessageEnvoiDistribution): FormatMessageAvecVerrou {
    return {
        message: traductionEnvoiEnTransit(msg,
            msg.corps.ID_utilisateur_emetteur, idMsg),
        verrou: rienOption()
    };
}

export function verrouillage(msgVerrou : FormatMessageAvecVerrou, ID_util : Identifiant<'sommet'>) : FormatMessageAvecVerrou {
    return {
        message : msgVerrou.message,
        verrou : option(ID_util)
    };
}

export interface ReponsePOSTVerrou {
    accuseReception: FormatMessageVerrouDistribution;
    utilisateursDestinataires: EnsembleIdentifiants<"sommet">
}


/*
export function traductionEnvoiEnTransit(e: FormatMessageEnvoiTchat, ID_msg: Identifiant<'message'>, ID_dest: Identifiant<'sommet'>): FormatMessageTransitTchat {
    return {
        ID: ID_msg,
        type: 'transit',
        corps: {
            ID_envoi: e.ID,
            ID_emetteur: e.corps.ID_emetteur,
            ID_destinataire: ID_dest,
            contenu: e.corps.contenu
        },
        date: dateMaintenant().toJSON()
    };
}
*/
