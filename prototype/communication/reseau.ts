import * as express from "express";
import {Graphe, GrapheConnexions, NoeudConnexions} from "./graphe";
import {Identification, creerIdentificationParCompteur} from "../../bibliotheque/types/identifiant";

interface Reseau <C,Conf>{
    grapheVirtuelle: Graphe<Conf> ;
    grapheReel: Graphe<C>;

    traitementOvertureConnectionLongue(idNoeud: Identification<"sommet">, connexion: express.Response): void;
    traitementFermetureConnectionLongue(idNoeud: Identification<"sommet">): void;
    envoyerMessage<M>(idRecepteur: Identification<"sommet">,message:M):void;
    diffuserMessage<M>(idEmisseur: Identification<"sommet">, message:M):void;
}

// tslint:disable-next-line:no-any
export class ReseauPrototype implements Reseau<express.Response, any>{

    grapheReel: Graphe<express.Response>;
    //TODO: A implementer et a generer avec les configurations pour chaque noeud
    // tslint:disable-next-line:no-any
    grapheVirtuelle: Graphe<any>;

    constructor(grapheReel: Graphe<express.Response>) {
        this.grapheReel = grapheReel;
    }

    diffuserMessage<M>(idEmisseur: Identification<"sommet">, message: M): void {
        const noeud = this.grapheReel.noeuds.get(idEmisseur);
        if(noeud!==undefined) {
            noeud.itererVoisins((ID_sommet, v)=>{
                v.information.write(message);
            });
        }
    }

    envoyerMessage<M>(idRecepteur: Identification<"sommet">, message: M): void {
        const noeud = this.grapheReel.noeuds.get(idRecepteur);
        if(noeud!==undefined) {
            noeud.information.write(message);
        }
    }

    traitementFermetureConnectionLongue(idNoeud: Identification<"sommet">): void {
        const noeud = this.grapheReel.noeuds.get(idNoeud);
        if(noeud!==undefined) {
            noeud.information.write(noeud);
        }
        //TODO: Ajouter noeud a grapheVirtuelle
    }

    traitementOvertureConnectionLongue(idNoeud: Identification<"sommet">, connexion: express.Response): void {
        //TODO: Enlever noeud du grapheVirtuelle
        const noeud = new NoeudConnexions("reel", idNoeud,connexion);
        this.grapheReel.ajouterNoeud(noeud);
    }
}