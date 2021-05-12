import {ServeurApplicationsExpress} from "../../bibliotheque/communication/serveurApplications";
import * as express from 'express';
import * as e from "express";
import {ReseauPrototype} from "./reseau";

const serveurApplications = new ServeurApplicationsExpress(8080);

class DataType {
    constructor(public message: string, public id: string ) {};
}

class DataTypeSortie {
    constructor(public entree: DataType, public id: string, public messageSortie: string){};
}

serveurApplications.demarrer();

const reseauPrototype = new ReseauPrototype(10);

const traitement = (data: DataType) => {

};

const traductionEntree = (request: express.Request) : DataType => {
    return new DataType(request.body.message, request.body.id);
};

const traitementDesFlux = (request: express.Request, response: express.Response) => {
    reseauPrototype.traitementOvertureConnectionLongue(request.body.id, response);
    request.on("close", () => {
        reseauPrototype.traitementFermetureConnectionLongue(request.body.id);
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
    return new DataTypeSortie(data, "10", data.message);
};

const traducctionEntreePost = (request: express.Request): DataType =>{
    return new DataType(request.body.message, request.body.id);
};

const traducctionSortiePost = ( sortie: DataTypeSortie, canalSortie: express.Response) =>{

};

serveurApplications.specifierTraitementRequetePOST<DataType,DataTypeSortie>(
    "/send",
    "A1",
    "",
    traitementPOST,
    traducctionEntreePost,
    traducctionSortiePost
)
