import * as express from 'express';
import { logger } from '../administration/log';

export interface CanalLecture {
    lire<T>(): T;
}

export interface CanalEcritureJSON {
    envoyerJSON<T>(x: T): void;
}

export interface CanalPersistantEcritureJSON {
    envoyerJSON<T>(etiquette : string, x: T): void;
}

export interface Deconnectable {
    enregistrerTraitementDeconnexion(traiter: () => void): void;
}

export interface ConnexionConcrete<EConcret, SConcret> {
    canalEntree(): EConcret;
    canalSortie(): SConcret;
}

export interface Connexion<EConcret, SConcret> extends ConnexionConcrete<EConcret, SConcret>, CanalLecture, CanalEcritureJSON {}

export interface ConnexionLongue<EConcret, SConcret> extends ConnexionConcrete<EConcret, SConcret>, CanalPersistantEcritureJSON, Deconnectable {}

export type ConnexionExpress = Connexion<express.Request, express.Response>;

class ConnexionParExpress implements ConnexionExpress {
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

export type ConnexionLongueExpress = ConnexionLongue<express.Request, express.Response>;

class ConnexionLongueParExpress implements ConnexionLongueExpress {
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

export function connexionExpress(requete: express.Request, reponse: express.Response): ConnexionExpress {
    return new ConnexionParExpress(requete, reponse);
}

export function connexionLongueExpress(requete: express.Request, reponse: express.Response): ConnexionLongueExpress {
    return new ConnexionLongueParExpress(requete, reponse);
}