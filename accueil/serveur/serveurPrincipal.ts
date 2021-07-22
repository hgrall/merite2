import * as express from 'express';
import { logger } from '../../bibliotheque/administration/log';
import { ConnexionExpress } from '../../bibliotheque/communication/connexion';

import {
    chemin,
    creerServeurApplicationsExpress,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { ENVOI_DISTRIB, PREFIXE_ACCES, PREFIXE_ACCUEIL, PREFIXE_CONNEXION, RECEPTION_DISTRIB, RECEPTION_TCHAT } from './routes';
import { ConfigurationJeux } from '../commun/configurationJeux';
import { cleAccesAleatoire, configurationJeuxParNom, nomConfigurationJeuxParCodeAcces } from './acces';
import { creerServiceTchat } from '../../tchat/serveur/serviceTchat';
import {creerServiceDistribution} from "../../distribution/serveur/serviceDistribution";

const serveurApplications: ServeurApplications<express.Request, express.Response> = creerServeurApplicationsExpress(8080);



serveurApplications.demarrer();

const repertoireHtml: string = "build";
serveurApplications.specifierRepertoireScriptsEmbarques(repertoireHtml);

/*
* Service de l'application de connexion pour les administrateurs.
*/
serveurApplications.specifierApplicationInitaleAServir(PREFIXE_CONNEXION, repertoireHtml, "interfaceConnexion.html");


/*
* Service de l'application d'accueil pour les joueurs.
*/
serveurApplications.specifierApplicationInitaleAServir(PREFIXE_ACCUEIL, repertoireHtml, "interfaceAccueil.html");

/*
* Traitement de la connexion pour un administrateur.
*/

let clesAccesActives: {
    [cleAcces: string]: {
        codeAcces: string,
        configuration: ConfigurationJeux
    }
} = {};

function initialiserJeux(codeAcces: string, cleAcces: string) {
    const config = 
        configurationJeuxParNom [
            nomConfigurationJeuxParCodeAcces[codeAcces]];
    clesAccesActives[cleAcces] = {
        codeAcces: codeAcces,
        configuration: config 
    };
    // TODO suivant la configuration associée à codeAcces, 
    // initialiser les jeux.
    creerServiceTchat(config.tchat_anneau, cleAcces).servirTchat(serveurApplications, repertoireHtml, "interfaceTchat.html");
    creerServiceTchat(config.tchat_etoile, cleAcces).servirTchat(serveurApplications, repertoireHtml, "interfaceTchat.html");
    creerServiceDistribution(config.distribution, cleAcces).servirDistribution(serveurApplications, repertoireHtml, "interfaceDistribution.html");
}

function traitementConnexion(codeAcces: string)
    : string {
    const cleAcces = cleAccesAleatoire();
    initialiserJeux(codeAcces, cleAcces);
    return cleAcces;

}

function traductionEntreeConnexion(canal: ConnexionExpress): Option<string> {
    const codeAcces = canal.canalEntree().query.code as string;
    if (codeAcces === undefined) {
        const desc = "Connexion de l'administrateur - Le code d'accès doit être la valeur du paramètre 'code' de la requête.";
        canal.envoyerJSONCodeErreur(400, desc);
        logger.error(desc);
        return rienOption<string>();
    }
    if (codeAcces in nomConfigurationJeuxParCodeAcces) {
        return option(codeAcces);
    } else {
        const desc = "Connexion de l'administrateur - Le code d'accès n'est pas valable.";
        canal.envoyerJSONCodeErreur(403, desc);
        logger.error(desc);
        return rienOption<string>();
    }
}

function traduireSortieConnexion(sortieConnexion: string, canal: ConnexionExpress): void {
    canal.envoyerJSON(sortieConnexion);
}

serveurApplications.specifierTraitementRequeteAuthentification(chemin(PREFIXE_CONNEXION, PREFIXE_ACCES), traitementConnexion, traductionEntreeConnexion, traduireSortieConnexion);

/*
* Traitement de l'authentification pour un utilisateur.
*/


function traitementAccueil(config: ConfigurationJeux)
    : ConfigurationJeux {

    return config;
}

function traductionEntreeAccueil(canal: ConnexionExpress): Option<ConfigurationJeux> {
    const cleAcces = canal.canalEntree().query.cle as string;
    if (cleAcces === undefined) {
        const desc = "Authentification requise - La clé d'accès doit être la valeur du paramètre 'cle' de la requête.";
        canal.envoyerJSONCodeErreur(400, desc);
        logger.error(desc);
        return rienOption<ConfigurationJeux>();
    }
    if (cleAcces in clesAccesActives) {
        return option(clesAccesActives[cleAcces].configuration);
    } else {
        const desc = "Echec de l'authentification - La clé d'accès est invalide.";
        canal.envoyerJSONCodeErreur(403, desc);
        logger.error(desc);
        return rienOption<ConfigurationJeux>();
    }
}

function traduireSortieAccueil(sortieAccueil: ConfigurationJeux, canal: ConnexionExpress): void {
    canal.envoyerJSON(sortieAccueil);
}

serveurApplications.specifierTraitementRequeteAuthentification(chemin(PREFIXE_ACCUEIL, PREFIXE_ACCES), traitementAccueil, traductionEntreeAccueil, traduireSortieAccueil)