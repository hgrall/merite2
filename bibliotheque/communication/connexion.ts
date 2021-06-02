import * as express from 'express';
import { logger } from '../administration/log';

export interface Connexion<EConcret, SConcret> {
    canalEntree(): EConcret;
    canalSortie(): SConcret;
    lire<T>(): T;
    envoyerJSON<T>(x: T): void;
}

export interface ConnexionLongue<EConcret, SConcret> {
    canalEntree(): EConcret;
    canalSortie(): SConcret;
    envoyerJSON<T>(etiquette: string, x: T): void;
    enregistrerTraitementDeconnexion(traiter: () => void): void;
}

class ConnexionExpress implements Connexion<express.Request, express.Response> {
    constructor(
        private requete: express.Request,
        private reponse: express.Response
    ) { }
    canalEntree(): express.Request {
        return this.requete;
    }
    canalSortie(): express.Response {
        return this.reponse;
    }
    lire<T>(): T {
        return <T>this.requete.body;
    }
    envoyerJSON<T>(x: T): void {
        this.reponse.json(x);
    }
}

class ConnexionLongueExpress implements ConnexionLongue<express.Request, express.Response> {
    constructor(
        private requete: express.Request,
        private reponse: express.Response
    ) { }
    canalEntree(): express.Request {
        return this.requete;
    }
    canalSortie(): express.Response {
        return this.reponse;
    }
    envoyerJSON<T>(etiquette: string, x: T): void {
        const msg = JSON.stringify(x);
        this.reponse.write('event: ' + etiquette + '\n');
        this.reponse.write(`data: ${msg}\n\n`);
        logger.http("GET " + this.requete.url + " - Envoi d'un événement " + etiquette + ".");
    }
    enregistrerTraitementDeconnexion(traiter: () => void): void {
        logger.info("Le serveur enregistre le traitement lors d'une déconnexion pour une requête GET persistante en " + this.requete.url + ".");
        this.requete.on('close', traiter); 
    }

}

export function connexionExpress(requete: express.Request, reponse: express.Response) {
    return new ConnexionExpress(requete, reponse);
}

export function connexionLongueExpress(requete: express.Request, reponse: express.Response) {
    return new ConnexionLongueExpress(requete, reponse);
}