import { creerReseauMutable, ReseauMutable, GenerateurReseau } from "../../bibliotheque/applications/reseau";
import { CanalPersistantEcritureJSON } from "../../bibliotheque/communication/connexion";
import { creerEnsembleMutableIdentifiantsVide, EnsembleIdentifiants, EnsembleMutableIdentifiants } from "../../bibliotheque/types/ensembleIdentifiants";
import { creerFileAPriorite, FileMutableAPriorite } from "../../bibliotheque/types/fileAPriorite";
import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant } from "../../bibliotheque/types/identifiant";
import { creerTableauMutableVide, TableauMutable } from "../../bibliotheque/types/tableau";
import { creerTableIdentificationMutableVide, TableIdentificationMutable } from "../../bibliotheque/types/tableIdentification";
import { FormatSommetTchat } from "../commun/echangesTchat";
import { modificationActivite } from "./echangesServeurTchat";



class GenerateurReseauAnneau<C extends CanalPersistantEcritureJSON> implements GenerateurReseau<FormatSommetTchat, C>{

    private generateurIdentifiants: GenerateurIdentifiants<'sommet'>;

    constructor(
        code: string,
        private nombreTchats: number,
        private noms: ReadonlyArray<string>) {
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur(code + "-" + "anneau-");
    }

    engendrer(): ReseauMutable<FormatSommetTchat, C> {
        const tailleTchat = this.noms.length;
        const sommets: TableIdentificationMutable<'sommet', FormatSommetTchat> = creerTableIdentificationMutableVide('sommet');
        const fileInactifs: FileMutableAPriorite<Identifiant<'sommet'>> = creerFileAPriorite();

        const adjacence:
            TableIdentificationMutable<'sommet', EnsembleIdentifiants<'sommet'>> = creerTableIdentificationMutableVide('sommet');

        for (let i = 0; i < this.nombreTchats; i++) {
            // Un tchat (une composante connexe du graphe)

            const sommetsTchat = creerTableauMutableVide<Identifiant<'sommet'>>();
            for (let j = 0; j < tailleTchat; j++) {
                // sommets + liste avec priorité
                const s: FormatSommetTchat = {
                    ID: this.generateurIdentifiants.produire('sommet'),
                    priorite: i * tailleTchat + j,
                    pseudo: this.noms[j],
                    actif: false
                }
                sommets.ajouter(s.ID, s);
                fileInactifs.ajouter(s.ID, s.priorite);
                sommetsTchat.ajouterEnFin(s.ID);
            }
            // adjacence
            for (let j = 0; j < tailleTchat; j++) {
                const voisins: EnsembleMutableIdentifiants<'sommet'> = creerEnsembleMutableIdentifiantsVide('sommet');
                voisins.ajouter(sommetsTchat.valeur((j + tailleTchat - 1) % tailleTchat));
                voisins.ajouter(sommetsTchat.valeur((j + 1) % tailleTchat));
                adjacence.ajouter(sommetsTchat.valeur(j), voisins);
            }

        }

        return creerReseauMutable(sommets, fileInactifs, adjacence, modificationActivite);
    }
}

export function creerGenerateurReseauAnneau<C extends CanalPersistantEcritureJSON>(
    code: string,
    nombreTchats: number,
    noms: ReadonlyArray<string>): GenerateurReseau<FormatSommetTchat, C> {
    return new GenerateurReseauAnneau<C>(code, nombreTchats, noms);
}

class GenerateurReseauEtoile<C extends CanalPersistantEcritureJSON> implements GenerateurReseau<FormatSommetTchat, C>{

    private generateurIdentifiants: GenerateurIdentifiants<'sommet'>;

    constructor(
        code: string,
        private nombreTchats: number,
        private noms: ReadonlyArray<string>) {
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur(code + "-" + "etoile-");
    }

    engendrer(): ReseauMutable<FormatSommetTchat, C> {
        const tailleTchat = this.noms.length;
        const sommets: TableIdentificationMutable<'sommet', FormatSommetTchat> = creerTableIdentificationMutableVide('sommet');
        const fileInactifs: FileMutableAPriorite<Identifiant<'sommet'>> = creerFileAPriorite();

        const adjacence:
            TableIdentificationMutable<'sommet', 
            EnsembleMutableIdentifiants<'sommet'>> =  creerTableIdentificationMutableVide('sommet');

        for (let i = 0; i < this.nombreTchats; i++) {
            // Un tchat (une composante connexe du graphe)

            const sommetsTchat = creerTableauMutableVide<Identifiant<'sommet'>>();
            for (let j = 0; j < tailleTchat; j++) {
                // sommets + liste avec priorité
                const s: FormatSommetTchat = {
                    ID: this.generateurIdentifiants.produire('sommet'),
                    priorite: i * tailleTchat + j,
                    pseudo: this.noms[j],
                    actif: false
                }
                sommets.ajouter(s.ID, s);
                fileInactifs.ajouter(s.ID, s.priorite);
                sommetsTchat.ajouterEnFin(s.ID);
            }
            // adjacence
            for (let j = 0; j < tailleTchat; j++) {
                const voisins: EnsembleMutableIdentifiants<'sommet'> = creerEnsembleMutableIdentifiantsVide('sommet');
                for (let k = 0; k < tailleTchat; k++) {
                    if (j !== k) {
                        voisins.ajouter(sommetsTchat.valeur(k));
                    }
                }
                adjacence.ajouter(sommetsTchat.valeur(j), voisins);
            }

        }

        return creerReseauMutable(sommets, fileInactifs, adjacence, modificationActivite);
    }
}

export function creerGenerateurReseauEtoile<C extends CanalPersistantEcritureJSON>(
    code: string,
    nombreTchats: number,
    noms: ReadonlyArray<string>): GenerateurReseau<FormatSommetTchat, C> {
    return new GenerateurReseauEtoile<C>(code, nombreTchats, noms);
}