import { GenerateurReseau, ReseauMutableParEnveloppe } from "../../bibliotheque/applications/reseau";
import { CanalPersistantEcritureJSON } from "../../bibliotheque/communication/connexion";
import { creerEnsembleMutableIdentifiantsVide, EnsembleIdentifiants, EnsembleMutableIdentifiants } from "../../bibliotheque/types/ensembleIdentifiants";
import { creerFileMutableVideIdentifiantsPrioritaires, FileMutableIdentifiantsPrioritaires } from "../../bibliotheque/types/fileIdentifiantsPrioritaires";
import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant } from "../../bibliotheque/types/identifiant";
import { creerTableauMutableVide } from "../../bibliotheque/types/tableau";

import { creerTableIdentificationMutableVide, TableIdentification, TableIdentificationMutable } from "../../bibliotheque/types/tableIdentification";
import { FormatUtilisateurTchat } from "../commun/echangesTchat";
import { modificationActivite } from "./echangesServeurTchat";

export class ReseauMutableTchat<
    C extends CanalPersistantEcritureJSON>
    extends ReseauMutableParEnveloppe<FormatUtilisateurTchat, C> {

    constructor(
        utilisateurs: TableIdentificationMutable<'sommet', FormatUtilisateurTchat>,
        adjacence:
            TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>
    ) {
        super(utilisateurs, adjacence, modificationActivite);
    }

    /**
     * Initie la file des inactifs. La priorité est égale au nombre de voisins inactifs.
     */
    initierFileDesInactifs(): void {
        // Tous les utilisateurs sont initialement inactifs.
        this.itererutilisateurs((id, s) => {
            const p = this.voisinsInactifs(id).taille();
            this.etat().fileInactifs.ajouter(id, p);
        });
    }

    retirerutilisateurDeFile(): Identifiant<'sommet'> {
        const ID = this.etat().fileInactifs.retirer();
        this.voisinsInactifs(ID).iterer((id) => {
            const p = this.voisinsInactifs(id).taille();
            this.etat().fileInactifs.modifier(id, p, p - 1);
        });
        return ID;
    }
    ajouterutilisateurAFile(ID_util: Identifiant<'sommet'>): void {
        const voisinsInactifs = this.voisinsInactifs(ID_util);
        const pID = voisinsInactifs.taille();
        this.etat().fileInactifs.ajouter(ID_util, pID);
        this.voisinsInactifs(ID_util).iterer((id) => {
            const p = voisinsInactifs.taille();
            this.etat().fileInactifs.modifier(id, p, p + 1);
        });
    }

}

export function creerReseauMutableTchat<
    C extends CanalPersistantEcritureJSON>
    (
        utilisateurs: TableIdentificationMutable<'sommet', FormatUtilisateurTchat>,
        fileInactifs: FileMutableIdentifiantsPrioritaires<'sommet'>,
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
        const fileInactifs: FileMutableIdentifiantsPrioritaires<'sommet'> = creerFileMutableVideIdentifiantsPrioritaires('sommet');

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

        return creerReseauMutableTchat(utilisateurs, fileInactifs, adjacence);
    }
}

export function creerGenerateurReseauAnneau<C extends CanalPersistantEcritureJSON>(
    code: string,
    nombreTchats: number,
    noms: ReadonlyArray<string>): GenerateurReseau<FormatUtilisateurTchat, C, ReseauMutableTchat<C>> {
    return new GenerateurReseauAnneau<C>(code, nombreTchats, noms);
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
        const fileInactifs: FileMutableIdentifiantsPrioritaires<'sommet'> = creerFileMutableVideIdentifiantsPrioritaires('sommet');

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

        return creerReseauMutableTchat(utilisateurs, fileInactifs, adjacence);
    }
}

export function creerGenerateurReseauEtoile<C extends CanalPersistantEcritureJSON>(
    code: string,
    nombreTchats: number,
    noms: ReadonlyArray<string>): GenerateurReseau<FormatUtilisateurTchat, C, ReseauMutableTchat<C>> {
    return new GenerateurReseauEtoile<C>(code, nombreTchats, noms);
}