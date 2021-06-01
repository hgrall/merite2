import { dateMaintenant } from "../../bibliotheque/types/date";
import { Identifiant } from "../../bibliotheque/types/identifiant";
import { tableau } from "../../bibliotheque/types/tableau";
import { FormatMessageARTchat, FormatMessageEnvoiTchat } from "../commun/echangesTchat";

export function traductionEnvoiEnAR(e : FormatMessageEnvoiTchat, ID_msg : Identifiant<'message'>) : FormatMessageARTchat {
    return {
        ID: ID_msg,
        type: 'AR',
        corps: {
            ID_emetteur : e.corps.ID_emetteur,
            ID_envoi: e.ID,
            ID_destinataires: tableau([]).toJSON(),
        },
        date: dateMaintenant().toJSON()
    };
}