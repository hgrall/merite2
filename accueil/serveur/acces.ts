/*
 * Accès : 
 * - code d'accès
 * - clés d'accès,
 * - TODO.
 */

import { entierAleatoire, normalisationNombre } from "../../bibliotheque/types/nombres";
import { configurationClassiqueJeux, ConfigurationJeux } from "../commun/configurationJeux";

function initialisationNomConfigurationParCodeAcces(): { [code: string]: string } {
    return {
        'a100bc': 'classique',
        'b100bc': 'classique'
    }; // TODO sur Heroku, utiliser une variable d'environnement
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