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
 * - servir des applications (html + js) en enregistrant le 
 * traitement d'une requête GET,
 * - servir une API (json) en enregistrant le traitement 
 * de requêtes GET, PUT ou POST,
 * - contrôler l'accès,
 * - générer des serveurs de connexions agrégeant 
 * ce serveur d'applications,
 * - démarrer en écoutant un port.
 * 
 * Le serveur utilise
 * - un répertoire pour les scripts,
 * - un préfixe pour les chemins,
 * - un code pour contrôler les accès,
 * - des chemins de la forme `préfixe/code/suffixe` pour 
 * désigner les ressources.
 *  
 * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
 * @param S format JSON pour les sorties (allant au client, sortant du serveur)
 */
export interface ServeurApplications<E, S> {
    /**
     * Démarre le serveur.
     * 
     * Celui-ci écoute un port (TCP), déterminé statiquement lors
     * d'une installation locale ou déterminé dynamiquement par
     * lors d'une installation distante chez un hébergeur (comme
     * Heroku). 
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
     * - url : prefixe?code=xxx
     * 
     * L'entrée pour le traitement est du format suivant :
     * - { code : string }
     * @param prefixe chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête d'authentification
     */
    specifierTraitementRequeteAuthentification(prefixe: string, traitement : ((entree : E) => S)) : void;


    /**
     * Spécifie l'application à servir étant donné un code 
     * et un chemin. L'application est désignée par son nom et son
     * répertoire.
     */
    specifierApplicationAServir(prefixe : string, code : string,
        suffixe : string, repertoire: string, application : string): void;
    
    /**
     * Spécifie le traitement d'une requête GET.
     * Requête :
     * - méthode http : GET
     * - url : prefixe/code/suffixe
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http. Conformément à l'usage, 
     * le corps de la requête est supposé vide.
     *  
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête GET adressée à ce chemin
     * */ 
    specifierTraitementRequeteGET(prefixe : string, code : string,
        suffixe : string, traitement : ((entree : E) => S)) : void;

    /**
     * Spécifie le traitement d'une requête POST.
     * Requête :
     * - méthode http : POST
     * - url : prefixe/code/suffixe
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête.
     * 
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête POST adressée à ce chemin
     * */ 
    specifierTraitementRequetePOST(prefixe : string, code : string,
        suffixe : string, traitement : ((entree : E) => S)) : void;

    /**
     * Spécifie le traitement d'une requête PUT.
     * Requête :
     * - méthode http : PUT
     * - url : prefixe/code/suffixe
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête.
     * 
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement traitement lors de la réception d'une requête PUT adressée à ce chemin
     * */ 
    specifierTraitementRequetePUT(prefixe : string, code : string,
        suffixe : string, traitement : ((entree : E) => S)) : void;

    genererServeurConnexions(prefixe : string, code : string,
        suffixe : string) : ServeurConnexion<E, S>;
}

/**
 * Interface provisoire décrivant un réseau de communication.
 * Un réseau est un graphe entre des noeuds, pouvant 
 * posséder plusieurs composantes connexes. Les noeuds 
 * sont localisés sur le serveur ou sur les clients.
 * Chaque jeu (associé à un code) possède son graphe propre :
 * - un graphe pour les tchats en anneau,
 * - un graphe pour les tchats en étoile,
 * - un graphe pour le jeu de distribution,
 * - etc. 
 */
interface Reseau<S> {
    estVide() : boolean;
    estComplet() : boolean;
    envoyer(clientDestinataire: string, message : S) : void; 
}

interface ServeurConnexion<E, S> {
    code() : string;
    chemin() : string;
    serveurApplications() : ServeurApplications<E, S>;
    specifierTraitementRequeteEntrante(sousChemin : string, traitement : ((entree : E) => void)) : void;
    specifierTraitementOuvertureConnexionLongue(sousChemin : string, traitement : ((entree : E) => void)) : void;
    specifierTraitementFermetureConnexionLongue(sousChemin : string, traitement : ((entree : E) => void)) : void; 
    reseauConnecte() : Reseau<S>
}

/**
 * Serveur d'applications web implémenté grâce à Express
 * (cf. http://expressjs.com/en/api.html).
 * 
 * Lorsqu'une requête GET d'authentification arrive, 
 * - la fonction entreeAuth produit un E, 
 * - la fonction de traitement de l'authentification 
 *   est appliquée à ce E, et produit un S,
 * - ce S est renvoyé en réponse. 
 * Lorsqu'une requête de type X (GET, POST ou PUT) arrive,
 * - la fonction entreeX produit un E, 
 * - la fonction de traitement pour X
 *   est appliquée à ce E, et produit un S,
 * - ce S est renvoyé en réponse. 
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
     * @param entreeGET 
     * @param entreePOST 
     * @param entreePUT 

     * @param port port utilisé par le serveur.
     */
    constructor(
        private entreeAuth : (requete : express.Request) => E,
        private entreeGET : (requete : express.Request) => E,
        private entreePOST : (requete : express.Request) => E,   
        private entreePUT : (requete : express.Request) => E,
        private port: number) {
        this.appli = express();
        this.port = port;
    }
    genererServeurConnexions(code: string, chemin: string): ServeurConnexion<E, S> {
        // TODO
        throw new Error('Method not implemented.');
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
        this.appli.get(
            chemin,
            (requete: express.Request,
                reponse: express.Response) => {
                    let entree = this.entreeAuth(requete);
                    let sortie = traitement(entree);
                    reponse.json(sortie);
                }
        );
    }
    specifierApplicationAServir(code: string, chemin: string, repertoire: string, application: string): void {
        this.appli.get(
            chemin,
            (requete: express.Request, response: express.Response) => {
                // TODO : ajouter répertoire
                response.sendFile(application, chemin);
            }
        );
    }
    specifierTraitementRequeteGET(prefixe : string, code : string,
        suffixe : string, traitement: (entree: E) => S): void {
        this.appli.get(
            prefixe + "/" + code + "/" + suffixe,
            (requete: express.Request, response: express.Response) => {
                let entree = this.entreeGET(requete);
                let sortie = traitement(entree);
                response.json(sortie);
            }
        )
    }
    specifierTraitementRequetePOST(prefixe : string, code : string,
        suffixe : string,  traitement: (entree: E) => S): void {
        this.appli.post(
            prefixe + "/" + code + "/" + suffixe,
            (requete: express.Request, response: express.Response) => {
                let entree = this.entreePOST(requete);
                let sortie = traitement(entree);
                response.json(sortie);
            }
        )
    }
    specifierTraitementRequetePUT(prefixe : string, code : string,
        suffixe : string, traitement: (entree: E) => S): void {
        this.appli.put(
            prefixe + "/" + code + "/" + suffixe,
            (requete:express.Request, response: express.Response) => {
                let entree = this.entreePUT(requete);
                let sortie = traitement(entree);
                response.json(sortie);
            }
        );
    }

    
}

