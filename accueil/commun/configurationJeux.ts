/**
 * TODO à compléter.
 */

export type TypeTchat = 'etoile' | 'anneau';

export interface ConfigurationJeuTchat {
    prefixe: string;
    suffixe: string;
    type: TypeTchat;
    taille: number;
    pseudos: ReadonlyArray<string>;
}

export interface ConfigurationJeux {
    tchat_etoile: ConfigurationJeuTchat;
    tchat_anneau: ConfigurationJeuTchat;
    distribution: string;
}




/**
 * TODO à compléter.
 */
export function configurationClassiqueJeux(): ConfigurationJeux {
    const taille = 5;
    return {
        tchat_etoile: {
            prefixe: "tchat",
            suffixe: "etoile",
            type: "etoile",
            taille: taille,
            pseudos: pseudos.slice(0, taille)
        },
        tchat_anneau: {
            prefixe: "tchat",
            suffixe: "anneau",
            type: "anneau",
            taille: taille,
            pseudos: pseudos.slice(0, taille)
        },
        distribution: "jeu de distribution"
    };
}