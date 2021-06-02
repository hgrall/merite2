import * as express from 'express';
import { ReseauMutable } from '../../bibliotheque/applications/reseau';
import { Connexion, ConnexionLongue } from '../../bibliotheque/communication/connexion';

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

const reseau: ReseauMutable<FormatSommetTchat, ConnexionLongue<express.Request, express.Response>> = creerGenerateurReseauEtoile<ConnexionLongue<express.Request, express.Response>>(CODE, 3, ["coco", "lulu", "zaza"]).engendrer();

/*
* Service de réception d'un message (POST).
*/

function traitementPOST(
    msg: FormatMessageEnvoiTchat)
    : [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>] {
    const idsDest: Tableau<Identifiant<'sommet'>> = tableau(msg.corps.ID_destinataires.tableau);
    const ar = traductionEnvoiEnAR(msg, generateurIdentifiantsMessages.produire('message'));
    const msgsTransit =
        idsDest
            .filtre((id) => reseau.sommet(id).actif)
            .application((id) => traductionEnvoiEnTransit(msg, generateurIdentifiantsMessages.produire('message'), id));
    return [ar, msgsTransit];
}
function traductionEntreePost(canal : Connexion<express.Request, express.Response>): Option<FormatMessageEnvoiTchat> {
    const msg : FormatMessageEnvoiTchat = canal.lire();
    if (("type" in msg) && msg.type === "envoi") {
        return option(msg);
    }
    return rienOption<FormatMessageEnvoiTchat>();
}
function traduireSortiePOST(msgs: [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>], canal : Connexion<express.Request, express.Response>): void {
    canal.envoyerJSON(msgs[0]);
    msgs[1].iterer((i, msg) => {
        const canal = reseau.connexion(msg.corps.ID_destinataire);
        canal.envoyerJSON('transit', msg);
    });
}

serveurApplications.specifierTraitementRequetePOST<FormatMessageEnvoiTchat, [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>]>(PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, ENVOI), traitementPOST, traductionEntreePost, traduireSortiePOST);

/*
* Service de connexion persistance pour permettre une communication du serveur vers chaque client connecté.
*/

export function traiterGETpersistant(canal : ConnexionLongue<express.Request, express.Response>): void {
    if (!reseau.aUnSommetInactif()) {
        // TODO message d'erreur : réseau complet
        return;
    }
    // Envoi de la configuration initiale 
    const ID_sommet = reseau.activerSommet(canal);
    const noeud = reseau.noeud(ID_sommet);
    canal.envoyerJSON('config', noeud);
    // Traitement de la fermeture de la déconnexion
    canal.enregistrerTraitementDeconnexion(() => {
        reseau.inactiverSommet(ID_sommet);
        reseau.itererVoisins(ID_sommet, (i, id) => {
            if(reseau.sommet(id).actif){
                const canal = reseau.connexion(id);
                canal.envoyerJSON('config', reseau.noeud(id));
            }
        });
    });

}

serveurApplications.specifierTraitementRequeteGETLongue(PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, RECEPTION), traiterGETpersistant);


