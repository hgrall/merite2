/**
 * TODO à compléter.
 */
import { pseudos } from "../../tchat/serveur/pseudos";

export type TypeTchat = 'etoile' | 'anneau';

export interface ConfigurationJeuTchat {
    readonly prefixe: string;
    readonly suffixe: string;
    readonly post: {
        readonly envoi: string;
    };
    readonly getPersistant: string;
    readonly type: TypeTchat;
    readonly taille: number;
    readonly pseudos: ReadonlyArray<string>;
}

export type TypeDistribution = 'anneau_etoile';

export interface ConfigurationJeuDistribution {
    readonly prefixe: string;
    readonly suffixe: string;
    readonly post: {
        readonly envoyer: string;
        readonly verrouiller: string;
        readonly deverrouillageTODO: string;
    };
    readonly getPersistant: {
        readonly chemin : string;
        readonly accuserEnvoi : string;
        readonly recevoir : string;
        readonly accuserSuccesVerrouiller : string;
        readonly accuserEchecVerrouiller : string;
        readonly inactiver : string;
    };
    readonly type: TypeDistribution;
    readonly nombreDomaines: number;
    readonly effectifParDomaine: ReadonlyArray<number>
}


export interface ConfigurationJeux {
    readonly tchat_etoile: ConfigurationJeuTchat;
    readonly tchat_anneau: ConfigurationJeuTchat;
    readonly distribution: ConfigurationJeuDistribution;
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
                envoyer: "envoi",
                verrouiller: "verrou",
                deverrouillageTODO: "deverrouiller",
            },
            getPersistant:  {
                chemin : "reception",
                accuserEnvoi : "arenvoi",
                recevoir : "transit",
                accuserSuccesVerrouiller : "succesVerrou",
                accuserEchecVerrouiller : "echecVerrou",
                inactiver : "verrou"
            },
            type: "anneau_etoile",
            nombreDomaines: 5,
            effectifParDomaine: [3, 3, 3, 3, 3]
        }
    }
}