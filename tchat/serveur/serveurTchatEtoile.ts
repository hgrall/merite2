import * as express from 'express';
import { ReseauMutable } from '../../bibliotheque/applications/reseau';

import { chemin, creerServeurApplicationsExpress, ServeurApplications } from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, FormatIdentifiable, GenerateurIdentifiants, identifiant, Identifiant } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { creerTableauMutableParEnveloppe, tableau, Tableau, TableauMutable } from '../../bibliotheque/types/tableau';
import { FormatMessageARTchat, FormatMessageEnvoiTchat, FormatMessageTransitTchat, FormatSommetTchat } from '../commun/echangesTchat';
import { PREFIXE_TCHAT, CODE, SUFFIXE_ETOILE, ENVOI, RECEPTION } from '../commun/routes';
import { traductionEnvoiEnAR, traductionEnvoiEnTransit } from './echangesServeurTchat';
import { creerGenerateurReseauEtoile } from './reseauTchat';

const generateurIdentifiantsMessages:
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

const reseau: ReseauMutable<FormatSommetTchat, express.Response> = creerGenerateurReseauEtoile<express.Response>(CODE, 3, ["coco", "lulu", "zaza"]).engendrer();

/*
* Service de réception d'un message (POST).
*/

function traitementPOST(msg: FormatMessageEnvoiTchat): [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>] {
    const idsDest: Tableau<Identifiant<'sommet'>> = tableau(msg.corps.ID_destinataires.tableau);
    const ar = traductionEnvoiEnAR(msg, generateurIdentifiantsMessages.produire('message'));
    const msgsTransit =
        idsDest
            .filtre((id) => reseau.sommet(id).actif)
            .application((id) => traductionEnvoiEnTransit(msg, generateurIdentifiantsMessages.produire('message'), id));
    return [ar, msgsTransit];
}
function traductionEntreePost(requete: express.Request, reponse: express.Response): Option<FormatMessageEnvoiTchat> {
    const msg = <FormatMessageEnvoiTchat>requete.body;
    if (("type" in msg) && msg.type === "envoi") {
        return option(msg);
    }
    return rienOption<FormatMessageEnvoiTchat>();
}
function traduireSortiePOST(msgs: [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>], canalSortie: express.Response): void {
    canalSortie.json(msgs[0]);
    msgs[1].iterer((i, msg) => {
        const canal = reseau.connexion(msg.corps.ID_destinataire);
        canal.write('event: transit\n');
        canal.write('data: ${JSON.stringify(msg)}\n\n');
    });
}

serveurApplications.specifierTraitementRequetePOST<FormatMessageEnvoiTchat, [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>]>(PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, ENVOI), traitementPOST, traductionEntreePost, traduireSortiePOST);

/*
* Service de connexion persistance pour permettre une communication du serveur vers chaque client connecté.
*/

export function traiterGETpersistant(requete: express.Request, reponse: express.Response): void {
    if (!reseau.aUnSommetInactif()) {
        // TODO message d'erreur : réseau complet
    }
    // Envoi de la configuration initiale 
    const ID_sommet = reseau.activerSommet(reponse);
    const noeud = reseau.noeud(ID_sommet);
    // TODO une abstraction serait utile
    reponse.write('event: config\n');
    reponse.write('data: ${JSON.stringify(noeud)}\n\n');
    // Traitement de la fermeture de la déconnexion
    requete.on("close", () => {
        reseau.inactiverSommet(ID_sommet);
    });

}

serveurApplications.specifierTraitementRequeteGETLongue(PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, RECEPTION), traiterGETpersistant);



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