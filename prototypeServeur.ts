import * as express from 'express';
import * as shell from "shelljs";
import {creerGenerateurIdentifiantParCompteur, identifiant, Identifiant} from "./bibliotheque/types/identifiant";
import {creerServeurApplicationsExpress} from "./bibliotheque/communication/serveurApplications";
import {creerTableIdentificationMutableVide} from "./bibliotheque/types/tableIdentification";
import {noeud, Noeud} from "./bibliotheque/applications/noeud";

const serveurApplications = creerServeurApplicationsExpress(8080);
const generateurIdentifiants = creerGenerateurIdentifiantParCompteur<"sommet">("sommet")

interface DataType {
    message: string,
    id: Identifiant<"sommet">,
    numConnexions: number
}

const noms: ReadonlyArray<string> = ["dede", "fifi", "jojo", "lulu", "zaza"];
const connexions = creerTableIdentificationMutableVide("sommet");

serveurApplications.demarrer();

const traitementConnexion = (request: express.Request, response: express.Response) => {
    // response.setHeader('Content-Type', 'text/event-stream');
    // response.setHeader('Cache-Control', 'no-cache');
    //
    // // only if you want anyone to access this endpoint
    // response.setHeader('Access-Control-Allow-Origin', '*');
    //
    // response.flushHeaders();
    //const id_sommet = reseauEtoile.traitementOvertureConnectionLongue(response);
    const nouveauIdentifiant = generateurIdentifiants.produire("sommet");
    connexions.ajouter(nouveauIdentifiant,response);

    response.write('event: config\n');
    response.write(`data: ${JSON.stringify({id: nouveauIdentifiant, numConnexions: connexions.taille()})}\n\n`);


    if (nouveauIdentifiant != undefined){
        request.on("close", () => {
            //reseauEtoile.traitementFermetureConnectionLongue(id_sommet);
            connexions.retirer(nouveauIdentifiant);
        });
    }
}

serveurApplications.specifierTraitementRequeteGETLongue(
    "listen",
    "A1",
    "",
    traitementConnexion
);



const traducctionSortiePost = ( sortie: DataType, canalSortie: express.Response) =>{
    connexions.iterer((_, val: express.Response) => {
        val.write(`data: msg \n\n`)
        val.write(`data: ${JSON.stringify(sortie)} \n\n`)
    })
    canalSortie.write(`data: msg \n\n`)
    canalSortie.write(`data: ${JSON.stringify(sortie)} \n\n`)
};


const traducctionEntree = (request: express.Request): DataType =>{
    console.log(request.body);
    return {message: request.body.contenu, id: request.body.identifiant, numConnexions: connexions.taille()};
};

const traitementPOST= (message: DataType): DataType =>  {
    return message;
};

serveurApplications.specifierTraitementRequetePOST<DataType,DataType>(
    "envoyer",
    "A1",
    "",
    traitementPOST,
    traducctionEntree,
    traducctionSortiePost
)

const repertoireHtml: string = "build";

serveurApplications.specifierRepertoireScriptsEmbarques(repertoireHtml)

const application = "interfaceTchat.html";
const code =  "A1";
const suffixe = "prototype"
const prefixe = "tchat"

serveurApplications.specifierApplicationAServir(prefixe,code, suffixe,repertoireHtml, application)