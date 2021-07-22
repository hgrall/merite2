/**
 * TODO à compléter.
 */
import { pseudos } from "../../tchat/serveur/pseudos";

export type TypeTchat = 'etoile' | 'anneau';

export interface ConfigurationJeuTchat {
    prefixe: string;
    suffixe: string;
    post: {
        envoi: string;
    };
    getPersistant: string;
    type: TypeTchat;
    taille: number;
    pseudos: ReadonlyArray<string>;
}

export type TypeDistribution = 'anneau_etoile';

export interface ConfigurationJeuDistribution {
    prefixe: string;
    suffixe: string;
    post: {
        envoi: string;
        verrouillage: string;
        deverrouillage: string;
    };
    getPersistant: string;
    type: TypeDistribution;
    nombreDomaines: number;
    effectifParDomaine: ReadonlyArray<number>
}


export interface ConfigurationJeux {
    tchat_etoile: ConfigurationJeuTchat;
    tchat_anneau: ConfigurationJeuTchat;
    distribution: ConfigurationJeuDistribution;
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
            post: {
                envoi: "envoi"
            },
            getPersistant: "reception",
            type: "etoile",
            taille: taille,
            pseudos: pseudos.slice(0, taille)
        },
        tchat_anneau: {
            prefixe: "tchat",
            suffixe: "anneau",
            post: {
                envoi: "envoi"
            },
            getPersistant: "reception",
            type: "anneau",
            taille: taille,
            pseudos: pseudos.slice(0, taille)
        },
        distribution: {
            prefixe: 'jeu',
            suffixe: 'distribution',
            post: {
                envoi: "envoyer",
                verrouillage: "verrouiller",
                deverrouillage: "deverrouiller",
            },
            getPersistant: "reception",
            type: "anneau_etoile",
            nombreDomaines: 5,
            effectifParDomaine: [3, 3, 3, 3, 3]
        }
    }
}