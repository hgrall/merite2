import { EnsembleIdentifiants } from "../../bibliotheque/types/ensembleIdentifiants";
import { Identifiant } from "../../bibliotheque/types/identifiant";
import { rienOption, Option, option } from "../../bibliotheque/types/option";
import { FormatMessageDistribution, messageTransit } from "../commun/echangesDistribution";

export interface ReponsePOSTEnvoi {
    accuseReception: FormatMessageDistribution;
    utilisateursDestinataires: EnsembleIdentifiants<"sommet">
}

export interface FormatMessageDistributionAvecVerrou {
    message: FormatMessageDistribution;
    verrou: Option<Identifiant<'sommet'>>;
}

export function messageAvecVerrouInitial(idMsg: Identifiant<'message'>, msg: FormatMessageDistribution): FormatMessageDistributionAvecVerrou {
    return {
        message: messageTransit(msg,
            msg.corps.ID_utilisateur_emetteur, idMsg),
        verrou: rienOption()
    };
}

export function verrouillage(msgVerrou : FormatMessageDistributionAvecVerrou, ID_util : Identifiant<'sommet'>) : FormatMessageDistributionAvecVerrou {
    return {
        message : msgVerrou.message,
        verrou : option(ID_util)
    };
}

export interface ReponsePOSTVerrou {
    accuseReception: FormatMessageDistribution;
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
