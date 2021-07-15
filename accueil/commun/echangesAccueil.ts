import { PREFIXE_TCHAT, SUFFIXE_ANNEAU, SUFFIXE_ETOILE } from "../serveur/routes";

/**
 * TODO à compléter.
 */
export interface ConfigurationJeux {
    tchat_etoile: string;
    tchat_anneau: string;
    distribution: string;
}

/**
 * TODO à compléter.
 */
export function configurationClassiqueJeux(): ConfigurationJeux {
    return {
        tchat_etoile: "tchat en étoile",
        tchat_anneau: "tchat en anneau",
        distribution: "jeu de distribution"
    };
}