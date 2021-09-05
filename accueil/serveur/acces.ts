/*
 * Accès : 
 * - code d'accès
 * - clés d'accès,
 * - TODO.
 */

import { entierAleatoire, normalisationNombre } from "../../bibliotheque/types/nombres";
import { configurationClassiqueJeux, ConfigurationJeux } from "../commun/configurationJeux";

function initialisationNomConfigurationParCodeAcces(): { [code: string]: string } {
    let r : { [code: string]: string } = {};
    if (process.env.CODES != null){
        let codesValides = process.env.CODES.split(",");
        if (process.env.CONFIGS != null){
            let configs = process.env.CONFIGS.split(",");
            for(let i = 0; i < codesValides.length; i++){
                r[codesValides[i]] = configs[i];
            }
        }
    }
    return r;
}

export const nomConfigurationJeuxParCodeAcces
    : { [code: string]: string }
    = initialisationNomConfigurationParCodeAcces();

export const configurationJeuxParNom
    : { [nom: string]: ConfigurationJeux } =
{
    'classique': configurationClassiqueJeux()
};

export function cleAccesAleatoire() : string {
    const n = entierAleatoire(Math.pow(16, 6) - 1);
    return normalisationNombre(n, 6, 16);
}