import { TypeTchat } from "../../accueil/commun/configurationJeux";
import { CanalGenerique } from "../../bibliotheque/communication/communicationGenerique";
import { GenerateurReseau, ReseauMutable, ReseauMutableParEnveloppe } from "../../bibliotheque/applications/reseau";
import { CanalPersistantEcritureJSON } from "../../bibliotheque/communication/connexion";
import { creerEnsembleMutableIdentifiantsVide, EnsembleIdentifiants, EnsembleMutableIdentifiants } from "../../bibliotheque/types/ensembleIdentifiants";
import { creerFileMutableVideIdentifiantsPrioritaires, FileMutableIdentifiantsPrioritaires } from "../../bibliotheque/types/fileIdentifiantsPrioritaires";
import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant } from "../../bibliotheque/types/identifiant";
import { creerTableauMutableVide } from "../../bibliotheque/types/tableau";

import { creerTableIdentificationMutableVide, TableIdentification, TableIdentificationMutable } from "../../bibliotheque/types/tableIdentification";
import { jamais, modificationActivite } from "../../bibliotheque/types/typesAtomiques";
import { FormatUtilisateurTchat } from "../commun/echangesTchat";

/**
 * Interface spécifique pour un réseau de tchat. Les méthodes 
 * facilitent la manipulation de la file.
 */
interface GrapheReseauTchat {
    /**
     * Voisins inactifs d'un sommet.
     * @param ID_sommet identifiant du sommet.
     * @returns ensemble des voisins inactifs.
     */
    voisinsInactifs(ID_sommet: Identifiant<"sommet">): EnsembleIdentifiants<"sommet">;
    /**
     * Nombe d'utilisateurs inactifs dans le tchat d'un utilisateur.
     * @param ID_sommet identifiant d'utilisateur
     * @returns nombre d'utilisateurs inactifs voisins de l'utilisateur identifié. 
     */
    nombreVoisinsInactifs(ID_sommet: Identifiant<"sommet">): number;
    /**
     * Met à jour la configuration des voisins actifs
     * de l'utilisateur passé en argument. La configuration
     * est formée de la représentation JSON du noeud associé au
     * voisin. 
     * @param ID_sommet identifiant du nouvel utilisateur.
     */
    mettreAJourConfigurationVoisinsActifs(ID_sommet: Identifiant<'sommet'>): void;
}

/**
 * Réseau mutable de tchat. La priorité pour un sommet 
 * (correspondant à un utilisateur du tchat) est déterminée 
 * par le nombre de sommets adjacents (voisins) inactifs. 
 */
export class ReseauMutableTchat<
    C extends CanalPersistantEcritureJSON>
    extends ReseauMutableParEnveloppe<FormatUtilisateurTchat, C>
    implements ReseauMutable<FormatUtilisateurTchat, C>, GrapheReseauTchat {

    constructor(
        utilisateurs: TableIdentificationMutable<'sommet', FormatUtilisateurTchat>,
        adjacence:
            TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>
    ) {
        super(utilisateurs, adjacence);
    }
    voisinsInactifs(ID_sommet: Identifiant<"sommet">): EnsembleIdentifiants<"sommet"> {
        return this.cribleVoisins(ID_sommet, (ID, s) => !s.actif);
    }
    nombreVoisinsInactifs(ID_sommet: Identifiant<"sommet">): number {
        return this.tailleCribleVoisins(ID_sommet, (ID, s) => !s.actif);
    }

    mettreAJourConfigurationVoisinsActifs(ID_sommet: Identifiant<'sommet'>): void {
        this.voisins(ID_sommet).iterer((id) => {
            if (this.sommet(id).actif) {
                const canalVoisin = this.connexion(id);
                canalVoisin.envoyerJSON(CanalGenerique.CONFIG, this.noeud(id));
            }
        });
    }

    /**
     * Initie la file des inactifs. La priorité est déterminée par 
     * le nombre de voisins inactifs.
     */
    initialiserFileDesInactifsDeconnectes(): void {
        // Tous les utilisateurs sont initialement inactifs.
        this.itererSommets((id, s) => {
            const p = this.nombreVoisinsInactifs(id);
            this.etat().fileInactifsDeconnectes.ajouter(id, p);
        });
    }
    /**
     * Retire l'identifiant prioritaire de la file des inactifs
     * déconnectés et le renvoie.
     * La méthode a pour effet :
     * - d'augmenter la priorité des utilisateurs inactifs 
     * voisins de celui prioritaire, en diminuant de un leur
     * classement,
     * - de rendre actif l'utilisateur prioritaire. 
     * @returns l'identifiant prioritaire.
     */
    retirerSommetDeFile(): Identifiant<'sommet'> {
        const ID = this.etat().fileInactifsDeconnectes.retirer();
        // Augmente la priorité des voisins inactifs.
        this.voisinsInactifs(ID).iterer((id) => {
            const p = this.nombreVoisinsInactifs(id);
            this.etat().fileInactifsDeconnectes.modifier(id, p, p - 1);
        });
        // Active le sommet prioritaire.
        const sommet = this.etat().sommets.valeur(ID);
        this.etat().sommets.modifier(ID, modificationActivite(sommet));
        return ID;
    }
    /**
     * Ajoute l'identifiant à la file des inactifs
     * déconnectés. Sa priorité est déterminée par le nombre de
     * voisins inactifs.
     * La méthode a pour effet :
     * - de diminuer la priorité des utilisateurs inactifs 
     * voisins de celui ajouté, en augmentant de un leur
     * classement.
     * Précondition : l'utilisateur est inactif.
     * @param ID_util identifiant de l'utilisateur.
     */
    ajouterSommetAFile(ID_util: Identifiant<'sommet'>): void {
        const voisinsInactifs = this.voisinsInactifs(ID_util);
        const pID = this.nombreVoisinsInactifs(ID_util);
        this.etat().fileInactifsDeconnectes.ajouter(ID_util, pID);
        voisinsInactifs.iterer((id) => {
            const p = this.nombreVoisinsInactifs(id);
            this.etat().fileInactifsDeconnectes.modifier(id, p - 1, p);
        });
    }

}

export function creerReseauMutableTchat<
    C extends CanalPersistantEcritureJSON>
    (
        utilisateurs: TableIdentificationMutable<'sommet', FormatUtilisateurTchat>,
        adjacence:
            TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>,
): ReseauMutableTchat<C> {
    return new ReseauMutableTchat(utilisateurs, adjacence);
}



class GenerateurReseauAnneau<C extends CanalPersistantEcritureJSON> implements GenerateurReseau<FormatUtilisateurTchat, C, ReseauMutableTchat<C>>{

    private generateurIdentifiants: GenerateurIdentifiants<'sommet'>;

    constructor(
        code: string,
        private nombreTchats: number,
        private noms: ReadonlyArray<string>) {
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur(code + "-" + "anneau-");
    }

    engendrer(): ReseauMutableTchat<C> {
        const tailleTchat = this.noms.length;
        const utilisateurs: TableIdentificationMutable<'sommet', FormatUtilisateurTchat> = creerTableIdentificationMutableVide('sommet');

        const adjacence:
            TableIdentificationMutable<'sommet', EnsembleIdentifiants<'sommet'>> = creerTableIdentificationMutableVide('sommet');

        for (let i = 0; i < this.nombreTchats; i++) {
            // Un tchat (une composante connexe du graphe)

            const utilisateursTchat = creerTableauMutableVide<Identifiant<'sommet'>>();
            for (let j = 0; j < tailleTchat; j++) {
                // utilisateurs
                const s: FormatUtilisateurTchat = {
                    ID: this.generateurIdentifiants.produire('sommet'),
                    pseudo: this.noms[j],
                    actif: false
                }
                utilisateurs.ajouter(s.ID, s);
                utilisateursTchat.ajouterEnFin(s.ID);
            }
            // adjacence
            for (let j = 0; j < tailleTchat; j++) {
                const voisins: EnsembleMutableIdentifiants<'sommet'> = creerEnsembleMutableIdentifiantsVide('sommet');
                voisins.ajouter(utilisateursTchat.valeur((j + tailleTchat - 1) % tailleTchat));
                voisins.ajouter(utilisateursTchat.valeur((j + 1) % tailleTchat));
                adjacence.ajouter(utilisateursTchat.valeur(j), voisins);
            }

        }

        return creerReseauMutableTchat(utilisateurs, adjacence);
    }
}

class GenerateurReseauEtoile<C extends CanalPersistantEcritureJSON> implements GenerateurReseau<FormatUtilisateurTchat, C, ReseauMutableTchat<C>>{

    private generateurIdentifiants: GenerateurIdentifiants<'sommet'>;

    constructor(
        code: string,
        private nombreTchats: number,
        private noms: ReadonlyArray<string>) {
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur(code + "-" + "etoile-");
    }

    engendrer(): ReseauMutableTchat<C> {
        const tailleTchat = this.noms.length;
        const utilisateurs: TableIdentificationMutable<'sommet', FormatUtilisateurTchat> = creerTableIdentificationMutableVide('sommet');
        
        const adjacence:
            TableIdentificationMutable<'sommet',
                EnsembleMutableIdentifiants<'sommet'>> = creerTableIdentificationMutableVide('sommet');

        for (let i = 0; i < this.nombreTchats; i++) {
            // Un tchat (une composante connexe du graphe)

            const utilisateursTchat = creerTableauMutableVide<Identifiant<'sommet'>>();
            for (let j = 0; j < tailleTchat; j++) {
                // utilisateurs
                const s: FormatUtilisateurTchat = {
                    ID: this.generateurIdentifiants.produire('sommet'),
                    pseudo: this.noms[j],
                    actif: false
                }
                utilisateurs.ajouter(s.ID, s);
                utilisateursTchat.ajouterEnFin(s.ID);
            }
            // adjacence
            for (let j = 0; j < tailleTchat; j++) {
                const voisins: EnsembleMutableIdentifiants<'sommet'> = creerEnsembleMutableIdentifiantsVide('sommet');
                for (let k = 0; k < tailleTchat; k++) {
                    if (j !== k) {
                        voisins.ajouter(utilisateursTchat.valeur(k));
                    }
                }
                adjacence.ajouter(utilisateursTchat.valeur(j), voisins);
            }

        }

        return creerReseauMutableTchat(utilisateurs, adjacence);
    }
}


export function creerGenerateurReseau<C extends CanalPersistantEcritureJSON>(
    type : TypeTchat, 
    code: string,
    nombreTchats: number,
    noms: ReadonlyArray<string>): GenerateurReseau<FormatUtilisateurTchat, C, ReseauMutableTchat<C>> {
        switch (type) {
            case 'etoile': return new GenerateurReseauEtoile<C>(code, nombreTchats, noms);
            case 'anneau': return new GenerateurReseauAnneau<C>(code, nombreTchats, noms);
        }
        return jamais(type);
}