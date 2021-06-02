import * as express from 'express';
import * as http from 'http';
import * as bodyParser from "body-parser";
import * as shell from "shelljs";

import {
    dateMaintenant
} from "../types/date";
import { Option } from '../types/option';
import { Connexion, connexionExpress, ConnexionLongue, connexionLongueExpress } from './connexion';
import { intercepteurHttp } from '../administration/logHttp';
import { logger } from '../administration/log';

const SEPARATEUR: string = "/";

/**
 * Concaténation des châines en argument, en les séparant (en interne)
 * par SEPARATEUR.
 * @param ch tabeau de chaînes de caractères, donné sous la forme d'arguments dits "var args")
 */
export function chemin(...ch: string[]): string {
    return ch.filter(v => v !== "").join(SEPARATEUR);
}

/**
 * Concaténation des châines en argument, en les séparant (en interne)
 * par SEPARATEUR et en ajoutant SEPARATEUR au début. 
 * Le séparateur est requis pour indiquer un chemin d'URL. 
 * @param ch tabeau de chaînes de caractères, donné sous la forme d'arguments dits "var args")
 */
export function cheminURL(...ch: string[]): string {
    return SEPARATEUR + ch.filter(v => v !== "").join(SEPARATEUR);
}

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
 * @param EConcret type correspondant au canal d'entrée
 * @param SConcret type correspondant au canal de sortie
 */
export interface ServeurApplications<EConcret, SConcret> {
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
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http. Conformément à l'usage, 
     * le corps de la requête est supposé vide. La réponse est 
     * produite par la procédure en utilisant la sortie du
     * traitement. La requête est supposée pure et idempotente.
     * 
     * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
     * @param S format JSON pour les sorties (allant au client, sortant du serveur)
     * @param prefixe chemin de l'URL
     * @param traitement fonction transformant une entrée en sortie lors de la réception d'une requête d'authentification
     * @param traductionEntree fonction traduisant la requête reçue en une entrée
     * @param traduireSortie procédure transformant la sortie en une réponse
     */
    specifierTraitementRequeteAuthentification<E, S>(
        prefixe: string,
        traitement: ((entree: E) => S),
        traductionEntree: (canal: Connexion<EConcret, SConcret>) => Option<E>,
        traduireSortie: (s: S, canal: Connexion<EConcret, SConcret>) => void,
    ): void;

    /**
     * Spécifie l'application à servir étant donné un code 
     * et un chemin. L'application est désignée par son nom et son
     * répertoire.
     * - méthode http : GET
     * - url : prefixe/code/suffixe
     * - réponse : envoi du fichier repertoire/application
     *   
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param repertoire répertoire contenant l'application
     * @param application nom du fichier de l'application à servir
     */
    specifierApplicationAServir(prefixe: string, code: string,
        suffixe: string, repertoire: string, application: string): void;

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
     * le corps de la requête est supposé vide. La réponse est 
     * produite par la procédure en utilisant la sortie du
     * traitement. La requête est supposée pure et idempotente.
     *  
     * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
     * @param S format JSON pour les sorties (allant au client, sortant du serveur)
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement fonction transformant une entrée en sortie 
     * @param traductionEntree fonction traduisant la requête reçue en une entrée
     * @param traduireSortie procédure transformant la sortie en une réponse
     */
    specifierTraitementRequeteGET<E, S>(
        prefixe: string, code: string, suffixe: string, traitement: ((entree: E) => S),
        traductionEntree: (canal : Connexion<EConcret, SConcret>) => Option<E>,
        traduireSortie: (s: S, canal : Connexion<EConcret, SConcret>) => void,
    ): void;

    /**
     * Spécifie le traitement d'une requête POST.
     * Requête :
     * - méthode http : POST
     * - url : prefixe/code/suffixe
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête. La réponse
     *  est produite par la procédure en utilisant la sortie du
     * traitement. La requête est supposée impure et non idempotente.
     * 
     * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
     * @param S format JSON pour les sorties (allant au client, sortant du serveur)
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement fonction transformant une entrée en sortie 
     * @param traductionEntree fonction traduisant la requête reçue en une entrée
     * @param traduireSortie procédure transformant la sortie en une réponse
     **/
    specifierTraitementRequetePOST<E, S>(
        prefixe: string, code: string, suffixe: string,
        traitement: (entree: E) => S,
        traductionEntree: (canal : Connexion<EConcret, SConcret>) => Option<E>,
        traduireSortie: (s: S, canal : Connexion<EConcret, SConcret>) => void,
    ): void;

    /**
     * Spécifie le traitement d'une requête PUT.
     * Requête :
     * - méthode http : PUT
     * - url : prefixe/code/suffixe
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête. La réponse
     *  est produite par la procédure en utilisant la sortie du
     * traitement. La requête est supposée impure et idempotente.
     * 
     * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
     * @param S format JSON pour les sorties (allant au client, sortant du serveur)
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement fonction transformant une entrée en sortie 
     * @param traductionEntree fonction traduisant la requête reçue en une entrée
     * @param traduireSortie procédure transformant la sortie en une réponse
     **/
    specifierTraitementRequetePUT<E, S>(
        prefixe: string, code: string, suffixe: string,
        traitement: ((entree: E) => S),
        traductionEntree: (canal : Connexion<EConcret, SConcret>) => Option<E>,
        traduireSortie: (s: S, canal : Connexion<EConcret, SConcret>) => void,
    ): void;

    /**
     * Spécifie le traitement d'une requête GET persistante.
     * Requête :
     * - méthode http : GET
     * - url : prefixe/code/suffixe
     * - connexion maintenue en vie pour permettre au serveur
     * d'envoyer un flux de messages.
     * // TODO : distinguer ouverture de connexion, fermeture de connexion, envoi de messages
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitementConnexion procédure permettant de traiter la connexion persistante
     **/
    specifierTraitementRequeteGETLongue(
        prefixe: string, code: string, suffixe: string,
        traitementConnexion:
            (canal : ConnexionLongue<EConcret, SConcret>) => void,
    ): void;

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
class ServeurApplicationsExpress implements ServeurApplications<express.Request, express.Response> {
    /**
     * Répertoire de lancement du serveur (de travail donc) à partir duquel les chemins relatifssont donnés.
     */
    private repertoire: string;
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
     * @param port port utilisé par le serveur.
     */
    constructor(private port: number) {
        this.appli = express();
        this.appli.use(bodyParser.json());
        this.appli.use(intercepteurHttp);
        this.repertoire = shell.pwd();
        logger.info("Le serveur a pour répertoire de travail " + this.repertoire + ".");
    }

    /**
     * Démarre le serveur Express.
     * 
     * Celui-ci écoute un port (TCP), déterminé statiquement lors
     * d'une installation locale ou déterminé dynamiquement par
     * lors d'une installation distante chez un hébergeur (comme
     * Heroku). 
     * 
     * Log : "Le serveur écoute le port ...".
     */
    demarrer(): void {
        this.serveur =
            this.appli.listen(this.port, () => {
                logger.info("Le serveur écoute le port " + this.port + " de l'hôte (local ou heroku).");
            });
    }
    /**
     * Paramètre l'application Express pour utiliser 
     * le répertoire passé en argument comme réservoir 
     * pour les scripts embarqués. 
     * @param rep chemin relatif vers le répertoire des scripts embarqués.
     */
    specifierRepertoireScriptsEmbarques(rep: string): void {
        logger.info("Le serveur utilise le répertoire suivant de scripts : " + rep + ".");
        this.appli.use(express.static(rep)); // répertoire local visible
    }

    /**
     * Spécifie le traitement des requêtes d'authentification.
     * Requête d'authentification :
     * - méthode http : GET
     * - url : prefixe?code=xxx TODO à intégrer directement dans l'implémentation
     * 
     * Log : "Le serveur enregistre le traitement d'une requête d'authentification.".
     * 
     * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
     * @param S format JSON pour les sorties (allant au client, sortant du serveur)
     * @param prefixe chemin de l'URL
     * @param traitement fonction transformant une entrée en sortie lors de la réception d'une requête d'authentification
     * @param traductionEntree fonction traduisant la requête reçue en une entrée
     * @param traduireSortie procédure transformant la sortie en une réponse
     */
    specifierTraitementRequeteAuthentification<E, S>(
        prefixe: string,
        traitement: ((entree: E) => S),
        traductionEntree: (canal : Connexion<express.Request, express.Response>) => Option<E>,
        traduireSortie: (s: S, canal : Connexion<express.Request, express.Response>) => void,
    ): void {
        const chUrl = cheminURL(prefixe);
        this.appli.get(
            chUrl,
            (requete: express.Request,
                reponse: express.Response) => {
                const canal = connexionExpress(requete, reponse);
                const optionEntree = traductionEntree(canal);
                if (optionEntree.estPresent()) {
                    const sortie = traitement(optionEntree.valeur());
                    traduireSortie(sortie, canal);
                }
            }
        );
        logger.info("Le serveur enregistre le traitement d'une requête d'authentification en " + chUrl + ".");
    }
    /**
     * Spécifie l'application à servir étant donné un code 
     * et un chemin. L'application est désignée par son nom et son
     * répertoire.
     * - méthode http : GET
     * - url : prefixe/code/suffixe
     * - réponse : envoi du fichier repertoire/application
     *   
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param cheminAppli chemin relatif menant à l'application
     * @param application nom du fichier de l'application à servir
     */
    specifierApplicationAServir(prefixe: string, code: string, suffixe: string, cheminAppli: string, application: string): void {
        const chUrl = cheminURL(prefixe, code, suffixe);
        const nomCompletAppli = chemin(cheminAppli, application);
        logger.info("Le serveur enregistre le service de l'application " + nomCompletAppli + " à l'adresse " + chUrl + ".");
        this.appli.get(
            chUrl,
            (requete: express.Request, response: express.Response) => {
                let options = {
                    root: chemin(this.repertoire, cheminAppli),
                };
                response.sendFile(application, options);
                logger.info("Le serveur envoie l'application " + chemin(options.root, application) + " après une requête en " + chUrl + ".");
            }
        );
    }
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
      * le corps de la requête est supposé vide. La réponse est 
      * produite par la procédure en utilisant la sortie du
      * traitement. La requête est supposée pure et idempotente.
      *
      * Effet dans la console : "Le serveur enregistre le traitement d'une requête GET.".
      * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
      * @param S format JSON pour les sorties (allant au client, sortant du serveur)
      * @param prefixe préfixe du chemin de l'URL
      * @param code code identifiant l'école
      * @param suffixe suffixe du chemin de l'URL
      * @param traitement fonction transformant une entrée en sortie 
      * @param traductionEntree fonction traduisant la requête reçue en une entrée
      * @param traduireSortie procédure transformant la sortie en une réponse
      */
    specifierTraitementRequeteGET<E, S>(
        prefixe: string, code: string, suffixe: string,
        traitement: ((entree: E) => S),
        traductionEntree: (canal : Connexion<express.Request, express.Response>) => Option<E>,
        traduireSortie: (s: S, canal : Connexion<express.Request, express.Response>) => void,
    ): void {
        const chUrl = cheminURL(prefixe, code, suffixe);
        
        this.appli.get(
            chUrl,
            (requete: express.Request, reponse: express.Response) => {
                const canal = connexionExpress(requete, reponse);
                const optionEntree = traductionEntree(canal);
                if (optionEntree.estPresent()) {
                    const sortie = traitement(optionEntree.valeur());
                    traduireSortie(sortie, canal);
                }
            }
        );
        logger.info("Le serveur enregistre le traitement d'une requête GET en " + chUrl + ".");
    }

    /**
     * Spécifie le traitement d'une requête POST.
     * Requête :
     * - méthode http : POST
     * - url : prefixe/code/suffixe
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête. La réponse
     *  est produite par la procédure en utilisant la sortie du
     * traitement. La requête est supposée impure et non idempotente.
     *
     * Effet dans la console : "Le serveur enregistre le traitement d'une requête POST.". 
     *  
     * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
     * @param S format JSON pour les sorties (allant au client, sortant du serveur)
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement fonction transformant une entrée en sortie 
     * @param traductionEntree fonction traduisant la requête reçue en une entrée
     * @param traduireSortie procédure transformant la sortie en une réponse
     **/
    specifierTraitementRequetePOST<E, S>(
        prefixe: string, code: string, suffixe: string, traitement: ((entree: E) => S),
        traductionEntree: (canal : Connexion<express.Request, express.Response>) => Option<E>,
        traduireSortie: (s: S, canal : Connexion<express.Request, express.Response>) => void,
    ): void {
        const chUrl = cheminURL(prefixe, code, suffixe);
        this.appli.post(
            chUrl,
            (requete: express.Request, reponse: express.Response) => {
                const canal = connexionExpress(requete, reponse);
                const optionEntree = traductionEntree(canal);
                if (optionEntree.estPresent()) {
                    const sortie = traitement(optionEntree.valeur());
                    traduireSortie(sortie, canal);
                }
            }
        );
        logger.info("Le serveur enregistre le traitement d'une requête POST en " + chUrl + ".");
    }
    /**
     * Spécifie le traitement d'une requête PUT.
     * Requête :
     * - méthode http : PUT
     * - url : prefixe/code/suffixe
     * 
     * L'entrée pour le traitement est d'un format sous-type de E. 
     * Elle est calculée à partir de la requête : partie requête 
     * formée d'associations (clé, valeur) de l'URL, 
     * en-tête de la requête http et corps de la requête. La réponse
     *  est produite par la procédure en utilisant la sortie du
     * traitement. La requête est supposée impure et idempotente.
     *
     * Effet dans la console : "Le serveur enregistre le traitement d'une requête PUT.". 
     *  
     * @param E format JSON pour les entrées (venant du client, entrant dans le serveur)
     * @param S format JSON pour les sorties (allant au client, sortant du serveur)
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitement fonction transformant une entrée en sortie 
     * @param traductionEntree fonction traduisant la requête reçue en une entrée
     * @param traduireSortie procédure transformant la sortie en une réponse
     **/
    specifierTraitementRequetePUT<E, S>(
        prefixe: string, code: string, suffixe: string, traitement: ((entree: E) => S),
        traductionEntree: (canal : Connexion<express.Request, express.Response>) => Option<E>,
        traduireSortie: (s: S, canal : Connexion<express.Request, express.Response>) => void,
    ): void {
        const chUrl = cheminURL(prefixe, code, suffixe);
        this.appli.put(
            chUrl,
            (requete: express.Request, reponse: express.Response) => {
                const canal = connexionExpress(requete, reponse);                
                const optionEntree = traductionEntree(canal);
                if (optionEntree.estPresent()) {
                    const sortie = traitement(optionEntree.valeur());
                    traduireSortie(sortie, canal);
                }
            }
        );
        logger.info("Le serveur enregistre le traitement d'une requête PUT en " + chUrl + ".");
    }
    /**
     * Spécifie le traitement d'une requête GET persistante.
     * Requête :
     * - méthode http : GET
     * - url : prefixe/code/suffixe
     * - connexion maintenue en vie pour permettre au serveur
     * d'envoyer un flux de messages.
     *
     * Effet dans la console : "Le serveur enregistre le traitement d'une requête GET persistante.". 
     * 
     * TODO Améliorations à prévoir à partir de l'expérience. On pourrait décomposer le traitement en plusieurs parties et fournir une abstraction pour ele canal de communication serveur-client (enveloppe de la réponse de la requête persistante).
     * 
     * @param prefixe préfixe du chemin de l'URL
     * @param code code identifiant l'école
     * @param suffixe suffixe du chemin de l'URL
     * @param traitementConnexion procédure permettant de traiter la connexion persistante
     **/
    specifierTraitementRequeteGETLongue(
        prefixe: string, code: string, suffixe: string,
        traitementConnexion: (canal : ConnexionLongue<express.Request, express.Response>) => void):
        void {

        const chUrl = cheminURL(prefixe, code, suffixe);
        this.appli.get(
            chUrl,
            (requete: express.Request, reponse: express.Response) => {
                reponse.writeHead(200, {
                    "Content-Type": "text/event-stream", // Guillemets nécessaires à cause du tiret
                    Connection: "keep-alive",
                    "Cache-Control": "no-cache, no-store",
                });
                logger.http("GET " + requete.url + " - Connection persistante établie.");
                traitementConnexion(connexionLongueExpress(requete, reponse));
            }
        );
        logger.info("Le serveur enregistre le traitement d'une requête GET persistante en " + chUrl + ".");
    }
}

export function creerServeurApplicationsExpress(port: number): ServeurApplications<express.Request, express.Response> {
    return new ServeurApplicationsExpress(port);
}