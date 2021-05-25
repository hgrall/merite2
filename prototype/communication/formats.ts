import * as t from 'io-ts'
import * as td from 'io-ts-types'
import { isLeft } from "fp-ts/These";
import {
    creerMessage,
    creerMessageADestinataire, MessageTchatADestinataireParEnveloppe,
    MessageTchatParEnveloppe,
    TypeMessageTchat
} from "../../bibliotheque/echangesTchat";
import {identifiant} from "../../bibliotheque/types/identifiant";
import {conversionDate} from "../../bibliotheque/types/date";
import {PathReporter} from "io-ts/PathReporter";


const messageErreurConnexion  = t.type({
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
        return creerMessageADestinataire(
            identifiant( "message", validResult.ID),
            identifiant( "sommet", validResult.ID_emetteur),
            identifiant( "sommet", validResult.ID_destinataire),
            validResult.contenu,
            conversionDate(validResult.date),
            TypeMessageTchat.ERREUR_CONNEXION
        );
    }
}

const MessageCommunication = t.type({
    //TODO Ajouter date
    ID: t.string,
    ID_emetteur: t.string,
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
        const validResult = result.right
        return creerMessage(
            identifiant( "message", validResult.ID),
            identifiant( "sommet", validResult.ID_emetteur),
            validResult.contenu,
            conversionDate(new Date()),
            TypeMessageTchat.COM
        );
    }
}

const MessageCommunicationAvecDestinataire = t.type({
    //TODO Ajouter date
    ID: t.string,
    ID_emetteur: t.string,
    ID_destinataire: t.string,
    type: t.literal(TypeMessageTchat.COM),
    contenu: t.string,
})

export function validerMessageCommunicationAvecDestinataire(messageToValidate: unknown): MessageTchatADestinataireParEnveloppe {
    console.log(`Message a valider: ${messageToValidate}`);
    const result = MessageCommunicationAvecDestinataire.decode(messageToValidate)
    if (isLeft(result)){
        let  error = "";
        PathReporter.report(result).forEach(value => {
            error+= `${value}, `;
        })
        // TODO: Envoyer Response, bad request
        throw Error(error);
    } else {
        const validResult = result.right
        return creerMessageADestinataire(
            identifiant( "message", validResult.ID),
            identifiant( "sommet", validResult.ID_emetteur),
            identifiant( "sommet", validResult.ID_destinataire),
            validResult.contenu,
            conversionDate(new Date()),
            TypeMessageTchat.COM
        );
    }
}