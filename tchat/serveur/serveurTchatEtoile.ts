import * as express from 'express';
import { isRight } from 'fp-ts/lib/Either'
import {logger} from '../../bibliotheque/administration/log';
import {ReseauMutable} from '../../bibliotheque/applications/reseau';
import {ConnexionExpress, ConnexionLongueExpress} from '../../bibliotheque/communication/connexion';

import {
    chemin,
    creerServeurApplicationsExpress,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import {creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants} from "../../bibliotheque/types/identifiant";
import {option, Option, rienOption} from '../../bibliotheque/types/option';
import {tableau, Tableau} from '../../bibliotheque/types/tableau';
import {
    FormatMessageARTchat,
    FormatMessageEnvoiTchat,
    FormatMessageTransitTchat,
    FormatUtilisateurTchat
} from '../commun/echangesTchat';
import {CODE, ENVOI, PREFIXE_ACCUEIL, PREFIXE_AUTH, PREFIXE_TCHAT, RECEPTION, SUFFIXE_ETOILE} from '../commun/routes';
import {avertissement, erreurTchat, traductionEnvoiEnAR, traductionEnvoiEnTransit} from './echangesServeurTchat';
import {creerGenerateurReseauEtoile} from './reseauTchat';
import {FormatMessageTchatValidator} from "../commun/verificationFormat";

const crypto = require('crypto');

const generateurIdentifiantsMessages:
    GenerateurIdentifiants<'message'> = creerGenerateurIdentifiantParCompteur(CODE + "-" + "tchat-etoile-");

const serveurApplications: ServeurApplications<express.Request, express.Response> = creerServeurApplicationsExpress(8080);

serveurApplications.demarrer();

/*
* Service de l'application.
*/
const repertoireHtml: string = "build";
serveurApplications.specifierRepertoireScriptsEmbarques(repertoireHtml);

serveurApplications.specifierApplicationAServir(PREFIXE_TCHAT, CODE, SUFFIXE_ETOILE, repertoireHtml, "interfaceTchat.html");

serveurApplications.specifierApplicationInitaleAServir(PREFIXE_ACCUEIL, repertoireHtml, "interfaceAccueil.html");

/*
* Définition du réseau en étoile.
*/

const reseau: ReseauMutable<FormatUtilisateurTchat, ConnexionLongueExpress> = creerGenerateurReseauEtoile<ConnexionLongueExpress>(CODE, 3, ["coco", "lulu", "zaza"]).engendrer();

/*
* Service de réception d'un message (POST).
*/

interface ReponseEnvoi {
    accuseReception: FormatMessageARTchat;
    messagesEnTransit: Tableau<FormatMessageTransitTchat>;
    destinationsIncoherentes: number;
    destinationsDeconnectees: number;
}

function traitementPOST(msg: FormatMessageEnvoiTchat)
    : ReponseEnvoi {
    const idsDestinataires = tableau(msg.corps.ID_destinataires);
    const idsDestinatairesVoisins =
        idsDestinataires
            .crible((i, id) => reseau.sontVoisins(msg.corps.ID_emetteur, id));
    const idsDestinatairesEffectifs =
        idsDestinatairesVoisins
            .crible((i, id) => reseau.sommet(id).actif);
    return {
        accuseReception: traductionEnvoiEnAR(msg,       idsDestinatairesEffectifs, generateurIdentifiantsMessages.produire('message')),
        messagesEnTransit: idsDestinatairesEffectifs
            .application((i, id) => traductionEnvoiEnTransit(msg, generateurIdentifiantsMessages.produire('message'), id)),
        destinationsIncoherentes: idsDestinataires.taille() - idsDestinatairesVoisins.taille(),
        destinationsDeconnectees: idsDestinatairesVoisins.taille() - idsDestinatairesEffectifs.taille()
    };
}

function traductionEntreePost(canal: ConnexionExpress): Option<FormatMessageEnvoiTchat> {
    const msg: FormatMessageEnvoiTchat = canal.lire();
    const message = FormatMessageTchatValidator.decode(canal.lire());
    if (isRight(message)) {
        // Le message reçu est supposé correct,
        // en première approximation.
        return option(msg);
    }
    const desc = "Le format JSON du message reçu n'est pas correct. Le type du message doit être 'envoi'. Erreur HTTP 400 : Bad Request.";
    canal.envoyerJSONCodeErreur(400, erreurTchat(generateurIdentifiantsMessages.produire('message'), desc));
    logger.error(desc);
    return rienOption<FormatMessageEnvoiTchat>();
}

function traduireSortiePOST(reponseEnvoi: ReponseEnvoi, canal: ConnexionExpress): void {
    if(reponseEnvoi.destinationsIncoherentes > 0){
        const desc = `Le message ${reponseEnvoi.accuseReception.corps.ID_envoi} du client est incohérent : des destinataires (${reponseEnvoi.destinationsIncoherentes}) ne sont pas voisins. Erreur HTTP 400 : Bad Request.`;
        logger.error(desc);
        canal.envoyerJSONCodeErreur(400, erreurTchat(generateurIdentifiantsMessages.produire('message'), desc) );
        return;
    }
    if(reponseEnvoi.destinationsDeconnectees > 0){
        logger.warn(`Le message ${reponseEnvoi.accuseReception.corps.ID_envoi} du client est adressé à des destinataires actuellement déconnectés. Total de déconnectés : ${reponseEnvoi.destinationsDeconnectees}.`);
    }
    canal.envoyerJSON(reponseEnvoi.accuseReception);
    reponseEnvoi.messagesEnTransit.iterer((i, msg) => {
        const canalDest = reseau.connexion(msg.corps.ID_destinataire);
        canalDest.envoyerJSON('transit', msg);
    });
}

serveurApplications.specifierTraitementRequetePOST<
    FormatMessageEnvoiTchat,
    ReponseEnvoi
>(
    PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, ENVOI),
    traitementPOST, traductionEntreePost, traduireSortiePOST
);

/*
* Service de connexion persistante pour permettre une communication du serveur vers chaque client connecté.
*/

export function traiterGETpersistant(canal: ConnexionLongueExpress): void {
    if (!reseau.aUnSommetInactifDeconnecte()) {
        const desc = "La connexion est impossible : tous les utilisateurs sont actifs."
        logger.warn(desc);
        canal.envoyerJSON(
            'avertissement',
            avertissement(generateurIdentifiantsMessages.produire('message'), desc));
        return;
    }
    // Envoi de la configuration initiale
    const ID_util = reseau.activerSommet(canal);
    const noeud = reseau.noeud(ID_util);
    canal.envoyerJSON('config', noeud);
    // Envoi de la nouvelle configuration aux voisins actifs
    reseau.diffuserConfigurationAuxVoisins(ID_util);
    // Enregistrement du traitement lors de la déconnexion
    canal.enregistrerTraitementDeconnexion(() => {
        reseau.inactiverSommet(ID_util);
        reseau.diffuserConfigurationAuxVoisins(ID_util);
    });
}

serveurApplications
    .specifierTraitementRequeteGETLongue(
        PREFIXE_TCHAT, CODE, chemin(SUFFIXE_ETOILE, RECEPTION), traiterGETpersistant
    );

interface SortieAuth {
    code: string,
    jeuxTchat: Jeu[],
    jeuxDistribution: Jeu[]
}
export interface Jeu {
    url: string,
    nom: string
}

function traitementAUTH(infoAuth:  SortieAuth)
    : SortieAuth {
    return infoAuth;
}


function traductionEntreeAUTH(canal: ConnexionExpress): Option<SortieAuth> {
    const code = canal.canalEntree().query.code as string;
    if (code != undefined) {
        const sha256 = crypto.createHash('sha256');
        // TODO: Les jeux disponibles devraient être définis par le serveur
        // TODO: changer le chemin de tous les jeux
        const sortie: SortieAuth = {
            code: sha256.update(code).digest('base64'),
            jeuxDistribution:
                [{nom:'Distribution', url:"http://localhost:8080/tchat/code/etoile"}],
            jeuxTchat:
                [{nom: 'Tchat étoile', url:"http://localhost:8080/tchat/code/etoile"},
                {nom:'Tchat anneau', url:"http://localhost:8080/tchat/code/etoile" }],

        }
        return option(sortie);
    }
    const desc = "Le code n'est pas donné dans le params de la requête.";
    // TODO: Ajouter erreur authentication
    canal.envoyerJSONCodeErreur(400, desc);
    logger.error(desc);
    return rienOption<SortieAuth>();
}

function traduireSortieAUTH(sortieAuth: SortieAuth, canal: ConnexionExpress): void {
    canal.envoyerJSON(sortieAuth);
}

serveurApplications.specifierTraitementRequeteAuthentification(PREFIXE_AUTH, traitementAUTH, traductionEntreeAUTH, traduireSortieAUTH)