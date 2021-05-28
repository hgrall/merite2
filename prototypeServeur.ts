import {ServeurApplicationsExpress} from "./bibliotheque/communication/serveurApplications";
import * as express from 'express';
import * as shell from "shelljs";
import {ReseauAnneau, ReseauEtoile} from "./prototype/communication/reseau";
import {identifiant, Identifiant} from "./bibliotheque/types/identifiant";
import {validerMessageCommunication} from "./prototype/communication/formats";
import {MessageTchatParEnveloppe} from "./bibliotheque/echangesTchat";

const serveurApplications = new ServeurApplicationsExpress(8080);

class DataType {
    constructor(public message: string, public id: Identifiant<"sommet"> ) {};
}
// changer a interface
class DataTypeSortie {
    constructor(public message: MessageTchatParEnveloppe, public id: Identifiant<"sommet">, public messageSortie: string){};
}


class DataTypeGET {
    constructor(public message: string, public id: Identifiant<"sommet"> ) {};
}
// changer a interface
class DataTypeSortieGET {
    constructor(public message: DataTypeGET, public id: Identifiant<"sommet">, public messageSortie: string){};
}
const noms: ReadonlyArray<string> = ["dede", "fifi", "jojo", "lulu", "zaza"];

serveurApplications.demarrer();
const reseauEtoile = new ReseauAnneau(5, noms);

const traductionEntree = (request: express.Request) : DataType => {
    return new DataType(request.body.message, identifiant("sommet", request.body.id));
};

const traitementDesFlux = (request: express.Request, response: express.Response) => {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');

    // only if you want anyone to access this endpoint
    response.setHeader('Access-Control-Allow-Origin', '*');

    response.flushHeaders();
    const id_sommet = reseauEtoile.traitementOvertureConnectionLongue(response);
    if (id_sommet != undefined){
        request.on("close", () => {
            reseauEtoile.traitementFermetureConnectionLongue(id_sommet);
        });
    }
}

serveurApplications.specifierTraitementRequeteGETLongue<DataType,DataTypeSortie>(
    "/listen",
    "A1",
    "",
    traductionEntree,
    traitementDesFlux
);



const traducctionSortiePost = ( sortie: MessageTchatParEnveloppe, canalSortie: express.Response) =>{
    canalSortie.send(`data: ${JSON.stringify(sortie)} \n\n`)
};


const traducctionEntreePostAuxVoisins = (request: express.Request): MessageTchatParEnveloppe =>{
    return validerMessageCommunication(request.body);
};

const traitementPOSTEnvoyerAuxVoisins = (message: MessageTchatParEnveloppe): MessageTchatParEnveloppe =>  {
    reseauEtoile.envoyerMessage(message.val().ID_destinataires,message);
    return message;
};

serveurApplications.specifierTraitementRequetePOST<MessageTchatParEnveloppe,MessageTchatParEnveloppe>(
    "/envoyerAuxVoisins",
    "A1",
    "",
    traitementPOSTEnvoyerAuxVoisins,
    traducctionEntreePostAuxVoisins,
    traducctionSortiePost
)

const traducctionSortieGET = (sortie: DataTypeSortieGET, canalSortie: express.Response) =>{
    canalSortie.json(sortie);
};


const traitementGET = ( entree: DataTypeGET) : DataTypeSortieGET => {
   return new DataTypeSortieGET( entree, entree.id,"Salida");
};


serveurApplications.specifierTraitementRequeteGET<DataTypeGET,DataTypeSortieGET>(
    "/get",
    "A1",
    "",
    traitementGET,
    traductionEntree,
    traducctionSortieGET
)
const repertoireHtml: string = shell.pwd() + "/build/";

serveurApplications.specifierRepertoireScriptsEmbarques(repertoireHtml)

const ressourceTchat = "interfaceTchat.html";
const code =  "A1";
const chemin = "/prototype"

serveurApplications.specifierApplicationAServir(code, chemin,repertoireHtml, ressourceTchat)