import * as express from 'express';
import { logger } from '../../bibliotheque/administration/log';
import { ReseauMutable } from '../../bibliotheque/applications/reseau';
import { ConnexionExpress, ConnexionLongueExpress } from '../../bibliotheque/communication/connexion';

import { chemin, creerServeurApplicationsExpress, ServeurApplications } from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { tableau, Tableau } from '../../bibliotheque/types/tableau';
import { FormatMessageARTchat, FormatMessageEnvoiTchat, FormatMessageTransitTchat, FormatSommetTchat } from '../commun/echangesTchat';
import { PREFIXE_TCHAT, CODE, SUFFIXE_ETOILE, ENVOI, RECEPTION } from '../commun/routes';
import { avertissement, erreurTchat, traductionEnvoiEnAR, traductionEnvoiEnTransit } from './echangesServeurTchat';
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

function estAccessible(ID_emetteur: Identifiant<'sommet'>, ID_destinataire: Identifiant<'sommet'>) {
    if (!reseau.sontVoisins(ID_emetteur, ID_destinataire)) {
        logger.error("Le message du client est incohérent : le destinataire n'est pas un voisin.")
        return false;
    }
    if (!reseau.sommet(ID_destinataire).actif) {
        logger.warn(`Le destinataire ${ID_destinataire.val} n'est plus connecté.`);
        return false;
    }
    return true;
}

function traitementPOST(msg: FormatMessageEnvoiTchat)
    : [FormatMessageARTchat, Tableau<FormatMessageTransitTchat>] {
    const idsDestinatairesEffectifs =
        tableau(msg.corps.ID_destinataires.tableau)
            .filtre((id) => estAccessible(msg.corps.ID_emetteur, id));
    const ar = traductionEnvoiEnAR(msg, idsDestinatairesEffectifs, generateurIdentifiantsMessages.produire('message'));
    const msgsTransit =
        idsDestinatairesEffectifs
            .application((id) => traductionEnvoiEnTransit(msg, generateurIdentifiantsMessages.produire('message'), id));
    return [ar, msgsTransit];
}

function traductionEntreePost(canal: ConnexionExpress): Option<FormatMessageEnvoiTchat> {
    const msg: FormatMessageEnvoiTchat = canal.lire();
    if (("type" in msg) && msg.type === "envoi") {
        // Le message reçu est supposé correct,
        // en première approximation.
        return option(msg);
    }
    const desc = "Le format JSON du message reçu n'est pas correct. Le type du message est 'envoi'.";
    canal.envoyerJSON(erreurTchat(generateurIdentifiantsMessages.produire('message'), desc));
    logger.error(desc);
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
        const desc = "La connexion est impossible : tous les sommets sont actifs."
        logger.warn(desc);
        canal.envoyerJSON(
            'avertissement',
            avertissement(generateurIdentifiantsMessages.produire('message'), desc));
        return;
    }
    // Envoi de la configuration initiale 
    const ID_sommet = reseau.activerSommet(canal);
    const noeud = reseau.noeud(ID_sommet);
    canal.envoyerJSON('config', noeud);
    // Envoi de la nouvelle configuration aux voisins actifs
    reseau.diffuserConfigurationAuxVoisins(ID_sommet);
    // Enregistrement du traitement lors de la déconnexion
    canal.enregistrerTraitementDeconnexion(() => {
        reseau.inactiverSommet(ID_sommet);
        reseau.diffuserConfigurationAuxVoisins(ID_sommet);
    });
}

serveurApplications
    .specifierTraitementRequeteGETLongue(
        PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, RECEPTION), traiterGETpersistant
    );


