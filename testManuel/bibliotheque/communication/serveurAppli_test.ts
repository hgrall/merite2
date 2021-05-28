import * as express from 'express';

/*
Tests 
1. curl http://localhost:8080/c/d/e : {"messageSortie":"salut GET","ID":{"val":"id1","sorte":"sommet"}}

2. curl -X POST -H "Content-Type: application/json" -d @entree.json http://localhost:8080/c/d/e : {"messageSortie":"salut GET","ID":{"val":"id1","sorte":"sommet"}}

3. navigateur - http://localhost:8080/a/b/c : page html COUCOU 21! + console "coucou le script!"

4.1 navigateur - http://localhost:8080/x/y/z : connexion longue etablie
4.2 curl -X POST -H "Content-Type: application/json" -d @entree.json http://localhost:8080/x/y/z : {"messageSortie":"salut POST 1","ID":{"val":"id1","sorte":"sommet"}}
4.3 répéter 4.2 : navigateur "connexion longue etablie - salut POST 1 - salut POST 2 - salut POST 3 - salut POST 4 - salut POST 5 - salut POST 6"
*/

import { creerServeurApplicationsExpress, ServeurApplications } from "../../../bibliotheque/communication/serveurApplications";

import { FormatIdentifiable, identifiant, Identifiant } from "../../../bibliotheque/types/identifiant";

const serveurApplications: ServeurApplications<express.Request, express.Response> = creerServeurApplicationsExpress(8080);

serveurApplications.demarrer();

serveurApplications.specifierRepertoireScriptsEmbarques("scripts");

serveurApplications.specifierApplicationAServir("a", "b", "c", "html", "appliTest.html");


interface TypeEntree extends FormatIdentifiable<"sommet"> {
    readonly messageEntree: string;
}

interface TypeSortie extends FormatIdentifiable<"sommet"> {
    readonly messageSortie: string;
}



function traductionEntreeConstante(cste : string, requete: express.Request): TypeEntree {
    return {
        messageEntree: cste,
        ID: identifiant("sommet", "id1")
    };
}

function traductionEntreeCorps(requete: express.Request): TypeEntree {
    return <TypeEntree>requete.body;
}

function traitement(e : TypeEntree) : TypeSortie {
    return {
        messageSortie : e.messageEntree,
        ID: e.ID
    };
}

function traduireSortie(s : TypeSortie, reponse : express.Response) : void {
    reponse.send(s);
}

serveurApplications.specifierTraitementRequeteGET<TypeEntree, TypeSortie>("c", "d", "e", traitement, (req) => traductionEntreeConstante("salut GET", req), traduireSortie);

serveurApplications.specifierTraitementRequetePOST<TypeEntree, TypeSortie>("c", "d", "e", traitement, traductionEntreeCorps, traduireSortie);

let canalSortie : express.Response;

serveurApplications.specifierTraitementRequeteGETLongue("x", "y", "z", (ce, cs) => {
    cs.write("connexion longue etablie");
    canalSortie = cs;});

let compteur = 0;

function traitementCompteur(e : TypeEntree) : TypeSortie {
    compteur++;
    return {
        messageSortie : e.messageEntree + " " + compteur,
        ID: e.ID
    };
}

function traduireSortiePOST(s : TypeSortie, reponse : express.Response) : void {
    reponse.send(s);
    canalSortie.write(" - " + s.messageSortie);
}

serveurApplications.specifierTraitementRequetePOST<TypeEntree, TypeSortie>("x", "y", "z", traitementCompteur, traductionEntreeCorps, traduireSortiePOST);

/*
const traitementDesFlux = (request: express.Request, response: express.Response) => {
    response.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache, no-store",
    });
    const id_sommet = reseauEtoile.traitementOvertureConnectionLongue(response);
    if (id_sommet != undefined) {
        request.on("close", () => {
            reseauEtoile.traitementFermetureConnectionLongue(id_sommet);
        });
    }
}

serveurApplications.specifierTraitementRequeteGETLongue<DataType, DataTypeSortie>(
    "/listen",
    "A1",
    "",
    traductionEntree,
    traitementDesFlux
);

const traitementPOST = (data: DataType): DataTypeSortie => {
    return new DataTypeSortie(data, data.id, data.message);
};

const traducctionEntreePost = (request: express.Request): DataType => {
    return new DataType(request.body.message, identifiant("sommet", request.body.id));
};

const traducctionSortiePost = (sortie: DataTypeSortie, canalSortie: express.Response) => {
    console.log(sortie.id);
    reseauEtoile.envoyerMessageAVoisins(sortie.id, sortie);
    canalSortie.send(`data: ${JSON.stringify(sortie)} \n\n`)
};

serveurApplications.specifierTraitementRequetePOST<DataType, DataTypeSortie>(
    "/send",
    "A1",
    "",
    traitementPOST,
    traducctionEntreePost,
    traducctionSortiePost
)

const traducctionSortieGET = (sortie: DataTypeSortie, canalSortie: express.Response) => {
    canalSortie.json(DataTypeSortie);
};


const traitementGET = (entree: DataType): DataTypeSortie => {
    return new DataTypeSortie(entree, entree.id, "Salida");
};


serveurApplications.specifierTraitementRequeteGET<DataType, DataTypeSortie>(
    "/get",
    "A1",
    "",
    traitementGET,
    traductionEntree,
    traducctionSortieGET
) */
