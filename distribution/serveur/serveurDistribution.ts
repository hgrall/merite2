import * as express from 'express';
import {logger} from '../../bibliotheque/administration/log';
import {ConnexionLongueExpress} from '../../bibliotheque/communication/connexion';

import {
    chemin,
    creerServeurApplicationsExpress,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import {creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants} from "../../bibliotheque/types/identifiant";

import {avertissement} from "../../tchat/serveur/echangesServeurTchat";

import {CODE, PREFIXE_DISTRIBUTION, RECEPTION, SUFFIXE_JEU1} from "../../accueil/serveur/routes";
import {creerGenerateurReseauDistribution, ReseauMutableDistribution} from "./reseauDistribution";
import {
    FormatConfigDistribution,
    FormatUtilisateurDistribution,
    NoeudDomaineDistribution
} from "../commun/echangesDistribution";


const generateurIdentifiantsMessages:
    GenerateurIdentifiants<'message'> = creerGenerateurIdentifiantParCompteur(CODE + "-" + "distribution");

const serveurApplications: ServeurApplications<express.Request, express.Response> = creerServeurApplicationsExpress(8080);

serveurApplications.demarrer();

/*
* Service de l'application.
*/
const repertoireHtml: string = "build";
serveurApplications.specifierRepertoireScriptsEmbarques(repertoireHtml);

serveurApplications.specifierApplicationAServir(PREFIXE_DISTRIBUTION, CODE, SUFFIXE_JEU1, repertoireHtml, "interfaceDistribution.html");

/*
* Définition du réseau Distribution
*/

const reseau: ReseauMutableDistribution<ConnexionLongueExpress> = creerGenerateurReseauDistribution<ConnexionLongueExpress>(CODE, 5, [3, 3, 3, 3, 3]).engendrer();


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
    const sommetUtilisateur = reseau.sommet(ID_util) as FormatUtilisateurDistribution;
    const ID_domaine = reseau.domaine(ID_util);
    const noeudDomaine = reseau.noeud(ID_domaine) as NoeudDomaineDistribution;
    const nombreActifsDomain =  reseau.nombreUtilisateursActifsDeSonDomaine(ID_util);
    const tailleDomain =  reseau.tailleDeSonDomaine(ID_util);
    const domainesVoisins = reseau.domainesVoisins(ID_domaine);

    const config : FormatConfigDistribution = {
        noeudDomaine: noeudDomaine.toJSON(),
        utilisateur: sommetUtilisateur,
        utilisateursActifsDuDomaine: nombreActifsDomain,
        tailleDomaine: tailleDomain,
        domainesVoisins: domainesVoisins.toJSON()
    }
    canal.envoyerJSON('config', config);
    // Envoi de la nouvelle configuration aux voisins actifs
    //reseau.diffuserConfigurationAuxVoisins(ID_util);
    // Enregistrement du traitement lors de la déconnexion
    canal.enregistrerTraitementDeconnexion(() => {
        reseau.inactiverSommet(ID_util);
        reseau.diffuserConfigurationAuxVoisins(ID_util);
    });
}

serveurApplications
    .specifierTraitementRequeteGETLongue(
        PREFIXE_DISTRIBUTION, CODE, chemin(SUFFIXE_JEU1, RECEPTION), traiterGETpersistant
    );
