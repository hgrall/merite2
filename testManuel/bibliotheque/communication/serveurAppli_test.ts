import * as express from 'express';
import { logger } from '../../../bibliotheque/administration/log';
import { Connexion, ConnexionLongue } from '../../../bibliotheque/communication/connexion';

/*
Tests 
1. curl http://localhost:8080/c/d/e : {"messageSortie":"salut GET","ID":{"val":"id1","sorte":'sommet'}}

2. curl -X POST -H "Content-Type: application/json" -d @entree.json http://localhost:8080/c/d/e : {"messageSortie":"salut GET","ID":{"val":"id1","sorte":'sommet'}}

3. navigateur - http://localhost:8080/a/b/c : page html COUCOU 21! + console "coucou le script!"

4.1 navigateur - http://localhost:8080/x/y/z : connexion longue etablie
4.2 curl -X POST -H "Content-Type: application/json" -d @entree.json http://localhost:8080/x/y/z : {"messageSortie":"salut POST 1","ID":{"val":"id1","sorte":'sommet'}}
4.3 répéter 4.2 : navigateur "connexion longue etablie - salut POST 1 - salut POST 2 - salut POST 3 - salut POST 4 - salut POST 5 - salut POST 6"
*/

import { creerServeurApplicationsExpress, ServeurApplications } from "../../../bibliotheque/communication/serveurApplications";

import { FormatIdentifiable, identifiant, Identifiant } from "../../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../../bibliotheque/types/option';

const serveurApplications: ServeurApplications<express.Request, express.Response> = creerServeurApplicationsExpress(8080);

serveurApplications.demarrer();

serveurApplications.specifierRepertoireScriptsEmbarques("scripts");

serveurApplications.specifierApplicationAServir("a", "b", "c", "testManuel/bibliotheque/communication/html", "appliTest.html");


interface TypeEntree extends FormatIdentifiable<'sommet'> {
    readonly messageEntree: string;
}

interface TypeSortie extends FormatIdentifiable<'sommet'> {
    readonly messageSortie: string;
}



function traductionEntreeConstante(cste : string, canal : Connexion<express.Request, express.Response>): Option<TypeEntree> {
    return option({
        messageEntree: cste,
        ID: identifiant('sommet', "id1")
    });
}

function traductionEntreeCorps(canal : Connexion<express.Request, express.Response>): Option<TypeEntree> {
    const msg : TypeEntree = canal.lire();
    if("messageEntree" in msg){
        logger.info('Requête POST - Message en entrée : ' + msg.messageEntree);
        return option(msg);
    }
    logger.info('Requête POST - Message en entrée incorrect.');
    return rienOption();
}

function traitement(e : TypeEntree) : TypeSortie {
    return {
        messageSortie : e.messageEntree,
        ID: e.ID
    };
}

function traduireSortie(s : TypeSortie, canal: Connexion<express.Request, express.Response>) : void {
    logger.info("méthode json utilisée");
    canal.envoyerJSON(s);
}

serveurApplications.specifierTraitementRequeteGET<TypeEntree, TypeSortie>("c", "d", "e", traitement, (c) => traductionEntreeConstante("salut GET", c), traduireSortie);

serveurApplications.specifierTraitementRequetePOST<TypeEntree, TypeSortie>("c", "d", "e", traitement, traductionEntreeCorps, traduireSortie);

let canalSortie : ConnexionLongue<express.Request, express.Response>;

serveurApplications.specifierTraitementRequeteGETLongue("x", "y", "z", (c) => {
    c.envoyerJSON('essai', "connexion longue etablie");
    canalSortie = c;
    c.enregistrerTraitementDeconnexion(() => {logger.info("Déconnexion du client ! ");})
});

let compteur = 0;

function traitementCompteur(e : TypeEntree) : TypeSortie {
    compteur++;
    return {
        messageSortie : e.messageEntree + " " + compteur,
        ID: e.ID
    };
}

function traduireSortiePOST(s : TypeSortie, canal : Connexion<express.Request, express.Response>) : void {
    canal.envoyerJSON(s);
    canalSortie.envoyerJSON('essai', " - " + s.messageSortie);
}

serveurApplications.specifierTraitementRequetePOST<TypeEntree, TypeSortie>("x", "y", "z", traitementCompteur, traductionEntreeCorps, traduireSortiePOST);

