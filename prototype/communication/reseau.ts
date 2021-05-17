import * as express from "express";
import {GrapheMutableParTablesIdentification} from "../../bibliotheque/types/graphe";
import {
    FormatIdentifiable, Identifiant, GenerateurIdentifiants, creerGenerateurIdentifiantParCompteur, identifiant
} from "../../bibliotheque/types/identifiant";
import {
    creerTableIdentificationMutableVide,
} from "../../bibliotheque/types/tableIdentification";
import {
    FormatTableau
} from "../../bibliotheque/types/tableau";
import {dateMaintenant} from "../../bibliotheque/types/date";


interface FormatSommetsInnactives extends FormatIdentifiable<"sommet">{
    readonly ID: Identifiant<"sommet">;
}

abstract class Reseau {

    graphe: GrapheMutableParTablesIdentification<FormatSommetsInnactives, express.Response>;
    generateurIdentifiants: GenerateurIdentifiants<"sommet">;

    abstract traitementOvertureConnectionLongue(connexion: express.Response): void;
    abstract traitementFermetureConnectionLongue(idNoeud: Identifiant<"sommet">): void;
    abstract genererReseau(taille:number): void;
    diffuserMessage<M>( message: M): void {
        this.graphe.itererActifs((identifiant)=> {
            this.envoyerMessage(identifiant, message)
        });
        console.log("* " + dateMaintenant().representationLog()
            + `- Le message ${message} a été diffusé`);
    }

    envoyerMessage<M>(idRecepteur: Identifiant<"sommet">, message: M): void {
        if(this.graphe.aSommetActif(idRecepteur)) {
            const recepteur = this.graphe.sommetActif(idRecepteur);
            recepteur.connexion.write(message);
        }
        else{
            // TODO : Lancer erreur
        }
    }

    envoyerMessageAVoisins<M>(idEmmiteur: Identifiant<"sommet">, message: M): void {
        if(this.graphe.aSommetActif(idEmmiteur)) {
            this.graphe.itererVoisins(idEmmiteur, (idRecepteur)=>{
                if(this.graphe.aSommetActif(idRecepteur)) {
                    const recepteur = this.graphe.sommetActif(idRecepteur);
                    recepteur.connexion.write(message);
                }
            })
        }
        else{
            // TODO : Lancer erreur
        }
    }
}

export class ReseauEtoile extends Reseau{

    constructor(taille: number ) {
        super();
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur("prototype");
        this.genererReseau(taille);
        console.log("* " + dateMaintenant().representationLog()
            + ` - Le reseau a ete créée avec le graph: ${this.graphe.representation()}`);

    }


    traitementFermetureConnectionLongue(idNoeud: Identifiant<"sommet">): void {
        if(this.graphe.aSommetActif(idNoeud)) {
            this.graphe.inactiverSommet(idNoeud);
            console.log("* " + dateMaintenant().representationLog()
                + "Fermeture d'une connection longue");
            console.log("* " + dateMaintenant().representationLog()
                + ` - Graphe: ${this.graphe.representation()} `);
        }
        else {
            // TODO : Lancer erreur
        }
    }

    traitementOvertureConnectionLongue(connexion: express.Response): Identifiant<"sommet"> {
        console.log("* " + dateMaintenant().representationLog()
            + " Ouverture connection longue");
        return this.graphe.activerSommet(connexion);
    }

    genererReseau(taille:number): void {
        const identifiants= Array(taille).fill(null);

        identifiants.forEach((_, index)=>{
            identifiants[index] = this.generateurIdentifiants.produire("sommet")

        });

        const inactifs = creerTableIdentificationMutableVide<"sommet",FormatSommetsInnactives>("sommet");
        const tableAdjacence = creerTableIdentificationMutableVide<'sommet', FormatTableau<Identifiant<'sommet'>>>("sommet");

        identifiants.forEach((identifiant)=>{
            inactifs.ajouter(identifiant,{ID: identifiant})
            tableAdjacence.ajouter(identifiant,{taille: taille, tableau: identifiants})
        })

        this.graphe = new GrapheMutableParTablesIdentification(
            inactifs,
            tableAdjacence
        );
    }
}


export class ReseauAnneau extends Reseau{

    constructor(taille: number ) {
        super();
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur("prototype");
        this.genererReseau(taille);
        console.log("* " + dateMaintenant().representationLog()
            + ` - Le reseau a ete créée avec le graph: ${this.graphe.representation()}`);

    }

    traitementFermetureConnectionLongue(idNoeud: Identifiant<"sommet">): void {
        if(this.graphe.aSommetActif(idNoeud)) {
            this.graphe.inactiverSommet(idNoeud);
            console.log("* " + dateMaintenant().representationLog()
                + "Fermeture d'une connection longue");
            console.log("* " + dateMaintenant().representationLog()
                + ` - Graphe: ${this.graphe.representation()} `);
        }
        else {
            // TODO : Lancer erreur
        }
    }

    traitementOvertureConnectionLongue(connexion: express.Response): Identifiant<"sommet"> {
        console.log("* " + dateMaintenant().representationLog()
            + " Ouverture connection longue");
        return this.graphe.activerSommet(connexion);
    }

    genererReseau(taille:number): void {
        const identifiants= Array(taille).fill(null);

        identifiants.forEach((_, index)=>{
            identifiants[index] = this.generateurIdentifiants.produire("sommet")

        });

        const inactifs = creerTableIdentificationMutableVide<"sommet",FormatSommetsInnactives>("sommet");
        const tableAdjacence = creerTableIdentificationMutableVide<'sommet', FormatTableau<Identifiant<'sommet'>>>("sommet");

        identifiants.forEach((identifiant)=>{
            inactifs.ajouter(identifiant,{ID: identifiant})
        })

        // Rempli la table d'adjacence de tous les sommets sauf le premier et le dernier
        for (let i = 1; i < identifiants.length-1; i++) {
            tableAdjacence.ajouter(identifiants[i], {taille: 2, tableau: [identifiants[i-1], identifiants[i+1]]})
        }
        // Ajoute la table d'adjacence pour le premier sommet
        tableAdjacence.ajouter(identifiants[0], {taille:2, tableau:[identifiants[identifiants.length-1], identifiants[1]]})
        // Ajoute la table d'adjacence pour le dernier sommet
        tableAdjacence.ajouter(identifiants[identifiants.length-1], {taille:2, tableau:[identifiants[identifiants.length-2], identifiants[0]]})

        this.graphe = new GrapheMutableParTablesIdentification(
            inactifs,
            tableAdjacence
        );
    }
}