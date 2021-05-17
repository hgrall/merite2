import {ServeurApplicationsExpress} from "../../bibliotheque/communication/serveurApplications";
import * as express from 'express';
import * as e from "express";
import {ReseauPrototype} from "./reseau";
import {Identifiant} from "../../bibliotheque/types/identifiant";
import {json} from "express";

const serveurApplications = new ServeurApplicationsExpress(8080);

class DataType {
    constructor(public message: string, public id: Identifiant<"sommet"> ) {};
}

class DataTypeSortie {
    constructor(public entree: DataType, public id: Identifiant<"sommet">, public messageSortie: string){};
}

serveurApplications.demarrer();

const reseauPrototype = new ReseauPrototype(5);

const traitement = (data: DataType) => {

};

const traductionEntree = (request: express.Request) : DataType => {
    return new DataType(request.body.message, request.body.id);
};

const traitementDesFlux = (request: express.Request, response: express.Response) => {


      response.writeHead(200, {
        "Content-Type": "text/event-stream",
            Connection: "keep-alive",
           "Cache-Control": "no-cache",
         });


    const id_sommet = reseauPrototype.traitementOvertureConnectionLongue(response);
    request.on("close", () => {
        reseauPrototype.traitementFermetureConnectionLongue(id_sommet);
    });
}

serveurApplications.specifierTraitementRequeteGETLongue<DataType,DataTypeSortie>(
    "/listen",
    "A1",
    "",
    traitement,
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
    reseauPrototype.diffuserMessage(sortie.messageSortie);
    canalSortie.write(`data: ${JSON.stringify(sortie)} \n\n`)
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