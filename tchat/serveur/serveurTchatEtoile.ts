import * as express from 'express';
import { ReseauMutable } from '../../bibliotheque/applications/reseau';
import { Connexion, ConnexionExpress, ConnexionLongue, ConnexionLongueExpress } from '../../bibliotheque/communication/connexion';

import { chemin, creerServeurApplicationsExpress, ServeurApplications } from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { tableau, Tableau } from '../../bibliotheque/types/tableau';
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

const reseau: ReseauMutable<FormatSommetTchat, ConnexionLongueExpress> = creerGenerateurReseauEtoile<ConnexionLongueExpress>(CODE, 3, ["coco", "lulu", "zaza"]).engendrer();

/*
* Service de réception d'un message (POST).
*/

function traitementPOST(msg: FormatMessageEnvoiTchat)
    : [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>] {
    const idsDest = tableau(msg.corps.ID_destinataires.tableau);
    const ar = traductionEnvoiEnAR(msg, generateurIdentifiantsMessages.produire('message'));
    const msgsTransit =
        idsDest
            .filtre((id) => reseau.sommet(id).actif)
            .application((id) => traductionEnvoiEnTransit(msg, generateurIdentifiantsMessages.produire('message'), id));
    return [ar, msgsTransit];
}

function traductionEntreePost(canal: ConnexionExpress): Option<FormatMessageEnvoiTchat> {
    const msg: FormatMessageEnvoiTchat = canal.lire();
    if (("type" in msg) && msg.type === "envoi") {
        return option(msg);
    }
    canal.envoyerJSON({ erreur: "TODO mauvais format" });
    return rienOption<FormatMessageEnvoiTchat>();
}
function traduireSortiePOST(msgs: [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>], canal: ConnexionExpress): void {
    canal.envoyerJSON(msgs[0]);
    msgs[1].iterer((i, msg) => {
        const canalDest = reseau.connexion(msg.corps.ID_destinataire);
        canalDest.envoyerJSON('transit', msg);
    });
}

serveurApplications.specifierTraitementRequetePOST<
    FormatMessageEnvoiTchat,
    [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>]
>(
    PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, ENVOI),
    traitementPOST, traductionEntreePost, traduireSortiePOST
);

/*
* Service de connexion persistante pour permettre une communication du serveur vers chaque client connecté.
*/

export function traiterGETpersistant(canal: ConnexionLongueExpress): void {
    if (!reseau.aUnSommetInactif()) {
        canal.envoyerJSON(
            'config',
            { erreur: "TODO réseau complet" });
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
            if (reseau.sommet(id).actif) {
                const canal = reseau.connexion(id);
                canal.envoyerJSON('config', reseau.noeud(id));
            }
        });
    });
}

serveurApplications
    .specifierTraitementRequeteGETLongue(
        PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, RECEPTION), traiterGETpersistant
    );


