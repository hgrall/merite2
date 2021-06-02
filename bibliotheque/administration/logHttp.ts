import * as morgan from "morgan";

import { logger } from "./log";

/*
* Utilisation de Morgan, 
* un intercepteur pour réaliser des logs d'événements http. 
* - documentation : https://github.com/expressjs/morgan
* - installation : npm install morgan @types/morgan
*/

/**
 * Redéfinition de la fonction d'écriture : utilisation 
 * de logger.http.
 */
const flux: morgan.StreamOptions = {
  write: (message) => logger.http(message),
};

/**
 * Fonction définissant la condition d'absence de log http.
 * Les log http ne sont réalisés que lors du développement.
 */
const sansLogHttp : () => boolean = () => {
  const env = process.env.PRODUCTION || "développement"; // TODO
  return (env !== "développement");
};

/**
 * Intercepteur http.
 */
export const intercepteurHttp = morgan(
  // Format.
  ":method :url :status :res[content-length] - :response-time ms",
  // Options.
  { stream: flux, skip: sansLogHttp }
);

