import * as winston from 'winston';

/*
* Système de gestion des logs Winston : 
* - https://github.com/winstonjs/winston
* > npm install winston @types/winston
* 
*/

/**  
* Définition des niveaux de gravité.
* Niveau 0 : le plus grave. 
* Voir https://datatracker.ietf.org/doc/html/rfc5424.
* A chaque niveau, on peut créer un fichier de log et 
* contrôler la génération des logs, 
* suivant l'environnement (développement ou production).
*/
const niveaux = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};
/** 
* Fonction définissant la gravité maximale à  prendre en compte.
* Le résultat dépend de la
* présence de la variable d'environnement PRODUCTION. TODO
* @returns 'debug' en développement, 'avertissement' en production.
*/
const niveauMaximal = () => {
    const env = process.env.PRODUCTION || 'développement';
    const estEnDev = (env === 'développement');
    return (estEnDev ? 'debug' : 'warn');
}

/** 
 * Définition des couleurs différentes pour chaque niveau. 
*/
const couleurs = {
    error: 'red',
    warn: 'magenta',
    info: 'yellow',
    http: 'green',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'black'
};

/*
* Associe les couleurs définies ci-dessus aux niveaux de gravité.
*/
winston.addColors(couleurs);

/*
 * Format des entrées dans les logs.
 */
const format = winston.format.combine(
    // Horodatage
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // Colorisation
    winston.format.colorize({ all: true }),
    // Format
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

/** 
 * Destination des entrées de log : console ou fichier
 */
const destinationEntrees = [
    // Ecrire les entrées dans la console.
    new winston.transports.Console(),
    // Ecrire tous les messages d'erreur 
    // dans le fichier erreur.log.
    new winston.transports.File({
        filename: 'logs/erreur.log',
        level: 'error',
    }),
    // Ecrire toutes les entrées de log dans le fichier appli.log 
    // (y compris les messages d'erreur).
    new winston.transports.File({ filename: 'logs/appli.log' }),
];

/**
 * Destination des exceptions.
 */
const destinationExceptions = [
    // Ecrire les messages d'exceptions dans la console.
    new winston.transports.Console(),
    // Ecrire les messages d'exception dans un fichier.
    new winston.transports.File({ filename: 'logs/exceptions.log' })
];


/** 
 * Logger paramétré par :
 * - un niveau de gravité maximal,
 * - les différents niveaux de gravité, 
 * - le format,
 * - les destinations.
 * Le logger doit être utilisé pour réaliser les logs.
 */
export const logger = winston.createLogger({
    level: niveauMaximal(),
    levels: niveaux,
    format: format,
    transports: destinationEntrees,
    exceptionHandlers: destinationExceptions
});

logger.info("Démarrage du système de log : voir le répertoire 'logs'.");

