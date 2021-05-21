import {ServeurApplicationsExpress} from "../../bibliotheque/communication/serveurApplications";
import * as express from 'express';
import {ReseauAnneau, ReseauEtoile} from "./reseau";
import {Identifiant} from "../../bibliotheque/types/identifiant";

const serveurApplications = new ServeurApplicationsExpress(8080);

class DataType {
    constructor(public message: string, public id: Identifiant<"sommet"> ) {};
}
// changer a interface
class DataTypeSortie {
    constructor(public entree: DataType, public id: Identifiant<"sommet">, public messageSortie: string){};
}

const noms: ReadonlyArray<string> = ["dede", "fifi", "jojo", "lulu", "zaza"];

serveurApplications.demarrer();
const reseauEtoile = new ReseauAnneau(5, noms);

const traductionEntree = (request: express.Request) : DataType => {
    return new DataType(request.body.message, request.body.id);
};

const traitementDesFlux = (request: express.Request, response: express.Response) => {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
            Connection: "keep-alive",
           "Cache-Control": "no-cache, no-store",
         });
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

const traitementPOST = (data: DataType): DataTypeSortie =>  {
    return new DataTypeSortie(data, data.id, data.message);
};

const traducctionEntreePost = (request: express.Request): DataType =>{
    return new DataType(request.body.message, request.body.id);
};

const traducctionSortiePost = ( sortie: DataTypeSortie, canalSortie: express.Response) =>{
    reseauEtoile.envoyerMessage(sortie.id, sortie);
    canalSortie.send(`data: ${JSON.stringify(sortie)} \n\n`)
};

serveurApplications.specifierTraitementRequetePOST<DataType,DataTypeSortie>(
    "/send",
    "A1",
    "",
    traitementPOST,
    traducctionEntreePost,
    traducctionSortiePost
)

const traducctionSortieGET = ( sortie: DataTypeSortie, canalSortie: express.Response) =>{
    canalSortie.json(DataTypeSortie);
};


const traitementGET = ( entree: DataType) : DataTypeSortie => {
   return new DataTypeSortie( entree, entree.id,"Salida");
};


serveurApplications.specifierTraitementRequeteGET<DataType,DataTypeSortie>(
    "/get",
    "A1",
    "",
    traitementGET,
    traductionEntree,
    traducctionSortieGET
)