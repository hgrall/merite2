import { dateMaintenant } from "../../bibliotheque/types/date";
import { Identifiant } from "../../bibliotheque/types/identifiant";
import { FormatMessageEnvoiDistribution, FormatMessageTransitDistribution, TypeMessageDistribution } from "../commun/echangesDistribution";


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
