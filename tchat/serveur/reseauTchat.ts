import { creerReseauMutable, ReseauMutable, GenerateurReseau } from "../../bibliotheque/applications/reseau";
import { creerFileAPriorite, FileMutableAPriorite } from "../../bibliotheque/types/fileAPriorite";
import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant } from "../../bibliotheque/types/identifiant";
import { creerTableauMutableVide, TableauMutable } from "../../bibliotheque/types/tableau";
import { creerTableIdentificationMutableVide, TableIdentificationMutable } from "../../bibliotheque/types/tableIdentification";
import { FormatSommetTchat, modificationActivite } from "../commun/echangesTchat";



class GenerateurReseauAnneau<C> implements GenerateurReseau<FormatSommetTchat, C>{

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
            TableIdentificationMutable<'sommet', TableauMutable<Identifiant<'sommet'>>> = creerTableIdentificationMutableVide('sommet');

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
                const voisins: TableauMutable<Identifiant<'sommet'>> = creerTableauMutableVide();
                voisins.ajouterEnFin(sommetsTchat.valeur(( j + tailleTchat - 1)%tailleTchat));
                voisins.ajouterEnFin(sommetsTchat.valeur(( j + 1)%tailleTchat));
                adjacence.ajouter(sommetsTchat.valeur(j), voisins);
            }

        }

        return creerReseauMutable(sommets, fileInactifs, adjacence, modificationActivite);
    }
}

export function creerGenerateurReseauAnneau<C>(
    code: string,
    nombreTchats: number,
    noms: ReadonlyArray<string>): GenerateurReseau<FormatSommetTchat, C> {
    return new GenerateurReseauAnneau<C>(code, nombreTchats, noms);
}

class GenerateurReseauEtoile<C> implements GenerateurReseau<FormatSommetTchat, C>{

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
            TableIdentificationMutable<'sommet', TableauMutable<Identifiant<'sommet'>>> = creerTableIdentificationMutableVide('sommet');

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
                const voisins: TableauMutable<Identifiant<'sommet'>> = creerTableauMutableVide();
                for (let k = 0; k < tailleTchat; k++) {
                    if (j !== k) {
                        voisins.ajouterEnFin(sommetsTchat.valeur(k));
                    }
                }
                adjacence.ajouter(sommetsTchat.valeur(j), voisins);
            }

        }

        return creerReseauMutable(sommets, fileInactifs, adjacence, modificationActivite);
    }
}

export function creerGenerateurReseauEtoile<C>(
    code: string,
    nombreTchats: number,
    noms: ReadonlyArray<string>): GenerateurReseau<FormatSommetTchat, C> {
    return new GenerateurReseauEtoile<C>(code, nombreTchats, noms);
}