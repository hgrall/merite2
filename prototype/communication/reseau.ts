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

class FormatSommetsActives implements FormatIdentifiable<"sommet">{
    readonly ID: Identifiant<"sommet">;
    constructor(id: Identifiant<"sommet">,public connexion:express.Response) {
        this.connexion = connexion;
        this.ID=id;
    };
}

interface FormatSommetsInnactives extends FormatIdentifiable<"sommet">{
    readonly ID: Identifiant<"sommet">;
}

interface Reseau {
    generateurIdentifiants: GenerateurIdentifiants<"sommet">;
    traitementOvertureConnectionLongue(connexion: express.Response): void;
    traitementFermetureConnectionLongue(idNoeud: Identifiant<"sommet">): void;
    envoyerMessage<M>(idRecepteur: Identifiant<"sommet">,message:M):void;
    diffuserMessage<M>(idEmisseur:Identifiant<"sommet">, message:M):void;
}


export class ReseauPrototype implements Reseau{

    graphe: GrapheMutableParTablesIdentification<FormatSommetsInnactives, express.Response>;
    generateurIdentifiants: GenerateurIdentifiants<"sommet">;

    constructor(taille: number ) {
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur("prototype");

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

        console.log("* " + dateMaintenant().representationLog()
            + ` - Le reseau a ete créée avec le graph: ${this.graphe.representation()}`);

    }

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
}