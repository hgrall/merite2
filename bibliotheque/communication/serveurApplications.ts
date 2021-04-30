import * as express from 'express';
import * as http from 'http';


import {
    dateMaintenant
} from "../types/date";
/*
import { TableMutable } from '../types/table';
*/

/**
 * Serveur d'applications Web. 
 * 
 * Une application est une page Web contenant du code Javascript.
 * Spécification :
 * - FAIT : servir une application (html + js) en enregistrant le 
 * traitement d'une requête GET
 * - servir une API (json) en enregistrant le traitement 
 * de requêtes GET, PUT ou POST
 * - servir des connexions longues en enregistrant 
 * les traitements à l'ouverture, la fermeture et 
 * en permettant la communication du serveur vers le client
 * - contrôler l'accès
 * - générer des serveurs de connexions agrégeant 
 * ce serveur d'applications
 * - FAIT démarrer en écoutant un port
 * 
 * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
 * @param S format JSON pour les sorties (allant au client, sortant du serveur)
 */
export interface ServeurApplications<E, S> {
    /**
     * Démarre le serveur.
     */
    demarrer(): void;

    /**
     * Spécifie le répertoire des scripts embarqués.
     * @param rep chemin relatif vers le répertoire des scripts embarqués.
     */
    specifierRepertoireScriptsEmbarques(rep: string): void;

    /**
     * Spécifie le traitement des requêtes d'authentification.
     * Requête d'authentification :
     * - méthode http : GET
     * - url : chemin?code=xxx
     * 
     * L'entrée pour le traitement est du format suivant :
     * - { code : string }
     * @param chemin chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête d'authentification
     */
    specifierTraitementRequeteAuthentification(chemin: string, traitement : ((entree : E) => S)) : void;


    /**
     * Spécifie l'application à servir étant donné un code 
     * et un chemin. L'application est désignée par son nom et son
     * répertoire.
     */
    specifierApplicationAServir(code : string,
        chemin : string, repertoire: string, application : string): void;
    
    /**
     * Spécifie le traitement d'une requête GET.
     * Requête :
     * - méthode http : GET
     * - url : chemin?code=xxx
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http. Conformément à l'usage, 
     * le corps de la requête est supposé vide.
     *  
     * @param code code identifiant l'école
     * @param chemin chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête GET adressée à ce chemin
     * */ 
    specifierTraitementRequeteGET(code : string, chemin : string, traitement : ((entree : E) => S)) : void;

    /**
     * Spécifie le traitement d'une requête POST.
     * Requête :
     * - méthode http : POST
     * - url : chemin?code=xxx
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête.
     * 
     * @param code code identifiant l'école
     * @param chemin chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête POST adressée à ce chemin
     * */ 
    specifierTraitementRequetePOST(code : string, chemin : string, traitement : ((entree : E) => S)) : void;

    /**
     * Spécifie le traitement d'une requête PUT.
     * Requête :
     * - méthode http : PUT
     * - url : chemin?code=xxx
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête.
     * 
     * @param code code identifiant l'école
     * @param chemin chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête PUT adressée à ce chemin
     * */ 
    specifierTraitementRequetePUT(code : string, chemin : string, traitement : ((entree : E) => S)) : void;

    
}

/**
 * Serveur d'applications web implémenté grâce à Express
 * (cf. http://expressjs.com/en/api.html).
 * 
 * Lorsqu'une requête GET d'authentification arrive, 
 * - la fonction entreeAuth produit un E, 
 * - la fonction de traitement de l'authentification 
 *   est appliquée à ce E, et produit un F,
 * - ce F est renvoyé en réponse. 
 * Lorsqu'une requête de type X (GET, POST ou PUT) arrive,
 * - la fonction entreeX produit un E, 
 * - la fonction de traitement pour X
 *   est appliquée à ce E, et produit un F,
 * - ce F est renvoyé en réponse. 
 * 
 * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
 * @param S format JSON pour les sorties (allant au client, sortant du serveur)
 */
export class ServeurApplicationsExpress<E, S> implements ServeurApplications<E, S> {

    private cheminAuth : string;
    private traitementAuth : (entree: E) => S;
    /**
     * Application express sous-jacente.
     */
    private appli: express.Application;

    /**
     * Serveur Http produit par l'application et écoutant le port indiqué.
     */
    private serveur: http.Server;

    /**
     * Constructeur initialisant l'application Express et le port avec celui passé en argument.
     * @param entreeAuth
     * @param entreeGet 
     * @param entreePOST 
     * @param entreePUT 

     * @param port port utilisé par le serveur.
     */
    constructor(
        private entreeAuth : (requete : express.Request) => E,
        private entreeGet : (requete : express.Request) => E,
        private entreePOST : (requete : express.Request) => E,   
        private entreePUT : (requete : express.Request) => E,
        private port: number) {
        this.appli = express();
        this.port = port;
    }
    /**
     * Configure le routage des requêtes à partir des spécifications de traitement et initialise le serveur Http à partir de l'application Express et du port.
     */
    demarrer(): void {
        this.serveur =
            this.appli.listen(this.port, () => {
                console.log("* " + dateMaintenant().representationLog()
                    + " - Le serveur écoute le port " + this.port + " de l'hôte (local ou heroku).");
            });
    }
    /**
     * Paramètre l'application Express pour utiliser 
     * le répertoire passé en argument comme réservoir 
     * pour les scripts embarqués. 
     * @param rep chemin relatif vers le répertoire des scripts embarqués.
     */
    specifierRepertoireScriptsEmbarques(rep: string): void {
        this.appli.use(express.static(rep)); // répertoire local visible
    }

    specifierTraitementRequeteAuthentification(chemin: string, traitement: (entree: E) => S): void {
        throw new Error('Method not implemented.');
    }
    specifierApplicationAServir(code: string, chemin: string, repertoire: string, application: string): void {
        throw new Error('Method not implemented.');
    }
    specifierTraitementRequeteGET(code: string, chemin: string, traitement: (entree: E) => S): void {
        throw new Error('Method not implemented.');
    }
    specifierTraitementRequetePOST(code: string, chemin: string, traitement: (entree: E) => S): void {
        throw new Error('Method not implemented.');
    }
    specifierTraitementRequetePUT(code: string, chemin: string, traitement: (entree: E) => S): void {
        throw new Error('Method not implemented.');
    }


    /**
     * Paramètre l'application Express pour réagir à une requête GET
     * sur le chemin indiqué.
     * @param chemin chemin de la requête Http.
     * @param reaction procédure de réaction.
     */
    private enregistrerReponseARequeteGET(
        chemin: string, reaction: (i: Interaction) => void): void {
        this.appli.get(chemin,
            (requete: express.Request,
                reponse: express.Response,
                suite: express.NextFunction) => {
                reaction(new InteractionExpress(requete, reponse, suite));
            });
    }
    /**
     * TODO
     */
    specifierRessourceAServir(
        chemin: string, repertoire: string, ressource: string): void {
        this.enregistrerReponseARequeteGET(chemin, (i: Interaction) => {
            console.log("* " + dateMaintenant().representationLog()
                + " - Service de " + ressource + " en " + chemin);
            i.servirFichier(repertoire, ressource);
        });
    }
}

