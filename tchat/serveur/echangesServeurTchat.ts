import { FormatMessageAvertissement, FormatMessageErreur } from "../../bibliotheque/communication/communicationGenerique";
import { dateMaintenant } from "../../bibliotheque/types/date";
import { Identifiant } from "../../bibliotheque/types/identifiant";
import { Tableau } from "../../bibliotheque/types/tableau";
import { FormatMessageARTchat, FormatMessageEnvoiTchat, FormatMessageTransitTchat } from "../commun/echangesTchat";

export function traductionEnvoiEnAR(e : FormatMessageEnvoiTchat, 
    idsDestinatairesEffectifs : Tableau<Identifiant<'sommet'>>, ID_msg : Identifiant<'message'>) : FormatMessageARTchat {
    return {
        ID: ID_msg,
        type: 'AR',
        corps: {
            ID_envoi: e.ID,
            ID_destinataires: idsDestinatairesEffectifs.toJSON(),
        },
        date: dateMaintenant().toJSON()
    };
}

export function traductionEnvoiEnTransit(e : FormatMessageEnvoiTchat, ID_msg : Identifiant<'message'>, ID_dest : Identifiant<'sommet'>) : FormatMessageTransitTchat {
    return {
        ID: ID_msg,
        type: 'transit',
        corps: {
            ID_envoi: e.ID,
            ID_emetteur : e.corps.ID_emetteur,
            ID_destinataire: ID_dest,
            contenu : e.corps.contenu
        },
        date: dateMaintenant().toJSON()
    };
}

