import * as express from 'express';
import { ReseauMutable } from '../../bibliotheque/applications/reseau';

import { chemin, creerServeurApplicationsExpress, ServeurApplications } from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, FormatIdentifiable, GenerateurIdentifiants, identifiant, Identifiant } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { FormatMessageARTchat, FormatMessageEnvoiTchat, FormatSommetTchat } from '../commun/echangesTchat';
import { PREFIXE_TCHAT, CODE, SUFFIXE_ANNEAU, SUFFIXE_ETOILE, ENVOI } from '../commun/routes';
import { traductionEnvoiEnAR } from './echangesServeurTchat';
import { creerGenerateurReseauEtoile } from './reseauTchat';

const generateurIdentifiantsMessages : 
GenerateurIdentifiants<'message'> = creerGenerateurIdentifiantParCompteur(CODE + "-" + "tchat-etoile-");

const serveurApplications: ServeurApplications<express.Request, express.Response> = creerServeurApplicationsExpress(8080);

serveurApplications.demarrer();

/*
* Service de l'application.
*/
serveurApplications.specifierRepertoireScriptsEmbarques("scripts");

serveurApplications.specifierApplicationAServir(PREFIXE_TCHAT, CODE, SUFFIXE_ETOILE, "html", "appliTchatEtoile.html");

/*
* Définition du réseau en étoile.
*/
/*
const reseau : ReseauMutable<FormatSommetTchat, express.Response> = creerGenerateurReseauEtoile(CODE, 3, ["coco", "lulu", "zaza"]).engendrer();
*/
/*
* Service de réception d'un message (POST).
*/

function traitementPOST(msg : FormatMessageEnvoiTchat) : FormatMessageARTchat {
    return traductionEnvoiEnAR(msg, generateurIdentifiantsMessages.produire('message'));
}
function traductionEntreePost(requete : express.Request, reponse : express.Response) : Option<FormatMessageEnvoiTchat>{
    const msg = <FormatMessageEnvoiTchat>requete.body;
    if(("type" in msg) && msg.type === "envoi"){
        return option(msg);
    }
    return rienOption<FormatMessageEnvoiTchat>();
}
function traduireSortiePOST(msg : FormatMessageARTchat, canalSortie: express.Response) : void {
    canalSortie.send(msg);
} 

/*
serveurApplications.specifierTraitementRequetePOST<FormatMessageEnvoiTchat, FormatMessageARTchat>(PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ANNEAU, ENVOI), traitementPOST, traductionEntreeCorps, traduireSortie);
*/

/*

function traductionEntreeConstante(cste : string, requete: express.Request): TypeEntree {
    return {
        messageEntree: cste,
        ID: identifiant("sommet", "id1")
    };
}

function traductionEntreeCorps(requete: express.Request): TypeEntree {
    return <TypeEntree>requete.body;
}



function traduireSortie(s : TypeSortie, reponse : express.Response) : void {
    reponse.send(s);
}

serveurApplications.specifierTraitementRequeteGET<TypeEntree, TypeSortie>("c", "d", "e", traitement, (req) => traductionEntreeConstante("salut GET", req), traduireSortie);


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

*/