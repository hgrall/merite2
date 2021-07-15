import * as express from 'express';
import { logger } from '../../bibliotheque/administration/log';
import { ConnexionExpress } from '../../bibliotheque/communication/connexion';

import {
    creerServeurApplicationsExpress,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { PREFIXE_ACCUEIL, PREFIXE_CONNEXION } from './routes';
import { ConfigurationJeux } from '../commun/echangesAccueil';
import { cleAccesAleatoire, configurationJeuxParNom, nomConfigurationJeuxParCodeAcces } from './acces';

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
    clesAccesActives[cleAcces] = {
        codeAcces: codeAcces,
        configuration: configurationJeuxParNom[nomConfigurationJeuxParCodeAcces[codeAcces]]
    };
    // TODO suivant la configuration associée à codeAcces, 
    // initialiser les jeux.
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

serveurApplications.specifierTraitementRequeteAuthentification(PREFIXE_CONNEXION, traitementConnexion, traductionEntreeConnexion, traduireSortieConnexion);

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

function traduireSortieAccueil(sortieAuth: ConfigurationJeux, canal: ConnexionExpress): void {
    canal.envoyerJSON(sortieAuth);
}

serveurApplications.specifierTraitementRequeteAuthentification(PREFIXE_ACCUEIL, traitementAccueil, traductionEntreeAccueil, traduireSortieAccueil)