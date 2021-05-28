import * as t from 'io-ts'
import * as td from 'io-ts-types'
import { isLeft } from "fp-ts/These";
import {
    creerMessage,
    MessageTchatParEnveloppe,
    TypeMessageTchat
} from "../../bibliotheque/echangesTchat";
import {
    Identifiant,
    identifiant,
    validerSorte,
} from "../../bibliotheque/types/identifiant";
import {conversionDate} from "../../bibliotheque/types/date";
import {PathReporter} from "io-ts/PathReporter";
import {tableau} from "../../bibliotheque/types/tableau";

const IdentifiantSommet = t.type({
    val: t.string,
    sorte: t.literal("sommet")
});

const IdentifiantMessage = t.type({
    val: t.string,
    sorte: t.literal("message")
});

const MessageCommunication = t.type({
    //TODO Ajouter date
    ID: IdentifiantMessage,
    ID_emetteur: IdentifiantSommet,
    ID_destinataires: t.array(IdentifiantSommet),
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
                const sorteValide = validerSorte<"sommet">("sommet",destinataire.sorte)
                const identifiantDestinataire = identifiant<"sommet">(sorteValide, destinataire.val);
                arrayDestinataires.push(identifiantDestinataire);
            })
            const sorteMessageValide = validerSorte<"message">(validResult.ID.sorte, "message");
            const sorteSommetEmetteurValide = validerSorte<"sommet">(validResult.ID_emetteur.sorte, "sommet");
            return creerMessage(
                identifiant( sorteMessageValide, validResult.ID.val),
                identifiant( sorteSommetEmetteurValide, validResult.ID_emetteur.val),
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