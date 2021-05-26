import * as t from 'io-ts'
import * as td from 'io-ts-types'
import { isLeft } from "fp-ts/These";
import {
    creerMessage,
    MessageTchatParEnveloppe,
    TypeMessageTchat
} from "../../bibliotheque/echangesTchat";
import {Identifiant, identifiant} from "../../bibliotheque/types/identifiant";
import {conversionDate} from "../../bibliotheque/types/date";
import {PathReporter} from "io-ts/PathReporter";
import {tableau} from "../../bibliotheque/types/tableau";


/*const messageErreurConnexion  = t.type({
    ID: t.string,
    ID_emetteur: t.string,
    ID_destinataire: t.string,
    type: t.literal(TypeMessageTchat.ERREUR_CONNEXION),
    contenu: t.string,
    date: td.date
})

export function validerMessageErreurConnexion(messageToValidate: unknown): MessageTchatParEnveloppe {
    const result = messageErreurConnexion.decode(messageToValidate)
    if (isLeft(result)){
        let  error = "";
        PathReporter.report(result).forEach(value => {
            error+= `${value}, `;
        })
        // TODO: Envoyer Response, bad request
        throw Error(error);
    } else {
        const validResult = result.right
        return creerMessage(
            identifiant( "message", validResult.ID),
            identifiant( "sommet", validResult.ID_emetteur),
            identifiant( "sommet", validResult.ID_destinataire),
            validResult.contenu,
            conversionDate(validResult.date),
            TypeMessageTchat.ERREUR_CONNEXION
        );
    }
}*/

const MessageCommunication = t.type({
    //TODO Ajouter date
    ID: t.string,
    ID_emetteur: t.string,
    ID_destinataires: t.Array,
    type: t.literal(TypeMessageTchat.COM),
    contenu: t.string,
})

export function validerMessageCommunication(messageToValidate: unknown): MessageTchatParEnveloppe {
    console.log(`Message a valider: ${messageToValidate}`);
    const result = MessageCommunication.decode(messageToValidate)
    if (isLeft(result)){
        let  error = "";
        PathReporter.report(result).forEach(value => {
            error+= `${value}, `;
        })
        // TODO: Envoyer Response, bad request
        throw Error(error);
    } else {
        try {
            const validResult = result.right;
            const arrayDestinataires: Array<Identifiant<"sommet">> = [];
            validResult.ID_destinataires.forEach(destinataire => {
                const destinataireString = destinataire as string;
                arrayDestinataires.push(identifiant("sommet", destinataireString))
            })
            return creerMessage(
                identifiant( "message", validResult.ID),
                identifiant( "sommet", validResult.ID_emetteur),
                validResult.contenu,
                conversionDate(new Date()),
                TypeMessageTchat.COM,
                tableau<Identifiant<"sommet">>(arrayDestinataires)
            );
        }
        catch (e) {
            // TODO: Envoyer Response, bad request
            throw Error(e);
        }
    }
}