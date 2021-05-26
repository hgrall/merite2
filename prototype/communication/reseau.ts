import * as express from "express";
import {GrapheMutableParTablesIdentification} from "../../bibliotheque/types/graphe";
import {
    Identifiant, GenerateurIdentifiants, creerGenerateurIdentifiantParCompteur,
} from "../../bibliotheque/types/identifiant";
import {
    creerTableIdentificationMutableVide,
} from "../../bibliotheque/types/tableIdentification";
import {
    FormatTableau, tableau, TableauParEnveloppe
} from "../../bibliotheque/types/tableau";
import {dateMaintenant} from "../../bibliotheque/types/date";
import {
    configurationDeSommetTchat,
} from "../../bibliotheque/echangesTchat";
import {FormatSommetTchat} from "../../bibliotheque/types/sommet";


abstract class Reseau {
    graphe: GrapheMutableParTablesIdentification<FormatSommetTchat, express.Response>;
    generateurIdentifiants: GenerateurIdentifiants<"sommet">;

    abstract genererReseau(taille: number, noms: ReadonlyArray<string>): void;

    /*diffuserMessage<M>(message: M): void {
        this.graphe.itererActifs((identifiant) => {
            this.envoyerMessage(identifiant, message)
        });
        console.log("* " + dateMaintenant().representationLog()
            + `- Le message ${JSON.stringify(message)} a été diffusé`);
    }*/

    traitementFermetureConnectionLongue(idNoeud: Identifiant<"sommet">): void {
        if (this.graphe.aSommetActif(idNoeud)) {
            this.graphe.inactiverSommet(idNoeud);
            console.log("* " + dateMaintenant().representationLog()
                + "Fermeture d'une connection longue");
            console.log("* " + dateMaintenant().representationLog()
                + ` - Graphe: ${this.graphe.representation()} `);
            // Envoie l'information de la nouvelle de-connexion a tous les sommets actifs
            this.graphe.itererActifs((ID_sommet => {
                const d = dateMaintenant();
                const sommetActif = this.graphe.sommetActif(ID_sommet);
                const config = configurationDeSommetTchat(sommetActif.sommetInactif, d.val(), this.graphe.tailleActifs(), sommetActif.voisinsActifs);
                this.envoyerMessageTransit(ID_sommet, config);
            }));
        } else {
            // TODO: Envoyer message d'erreur
        }
    }

    traitementOvertureConnectionLongue(connexion: express.Response): Identifiant<"sommet"> | undefined {
        console.log("* " + dateMaintenant().representationLog()
            + " - Ouverture connection longue");
        try {
            // Active le sommet a partir de la nouvelle connexion
            const nouveauSommetActif = this.graphe.activerSommet(connexion);
            // Envoie l'information de la nouvelle connexion a tous les sommets actifs
            const idSommetsActifs = [];
            this.graphe.itererActifs((ID_sommet => {
                idSommetsActifs.push(ID_sommet);
                const d = dateMaintenant();
                const sommetActif = this.graphe.sommetActif(ID_sommet);
                const config = configurationDeSommetTchat(sommetActif.sommetInactif, d.val(), this.graphe.tailleActifs(), sommetActif.voisinsActifs);
                this.envoyerMessageTransit(ID_sommet, config);
            }));
            return nouveauSommetActif.sommetInactif.ID;
        } catch (e) {
            // TODO: Envoyer message d'erreur
            console.log("* " + dateMaintenant().representationLog()
                + `- Erreur: ${e}`);
        }
    }

    envoyerMessage<M>(idRecepteurs: TableauParEnveloppe<Identifiant<"sommet">>, message: M): void {
        console.log("* " + dateMaintenant().representationLog()
            + ` - Message a envoyer: ${JSON.stringify(message)}`);
        try {
            idRecepteurs.iterer((_, id) => {
                if (this.graphe.aSommetActif(id)) {
                    const recepteur = this.graphe.sommetActif(id);
                    recepteur.connexion.write(JSON.stringify(message));
                    console.log("* " + dateMaintenant().representationLog()
                        + ` - Le message a ete envoyé à: ${id.val}`);
                } else {
                    // TODO: Envoyer message d'erreur
                }
            })
        } catch (e) {
            // TODO: Envoyer message d'erreur
            console.log("* " + dateMaintenant().representationLog()
                + `- Erreur: ${e}`);
        }
    }

    envoyerMessageTransit<M>(idRecepteur: Identifiant<"sommet">, message: M): void {
        console.log("* " + dateMaintenant().representationLog()
            + ` - Message a envoyer: ${JSON.stringify(message)}`);
        try {
            if (this.graphe.aSommetActif(idRecepteur)) {
                const recepteur = this.graphe.sommetActif(idRecepteur);
                recepteur.connexion.write(JSON.stringify(message));
                console.log("* " + dateMaintenant().representationLog()
                    + ` - Le message a ete envoyé à: ${idRecepteur.val}`);
            } else {
                // TODO: Envoyer message d'erreur
            }
        } catch (e) {
            // TODO: Envoyer message d'erreur
            console.log("* " + dateMaintenant().representationLog()
                + `- Erreur: ${e}`);
        }
    }
}

export class ReseauEtoile extends Reseau {

    constructor(taille: number, noms: ReadonlyArray<string>) {
        super();
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur("prototype");
        this.genererReseau(taille, noms);
        console.log("* " + dateMaintenant().representationLog()
            + ` - Le reseau a ete créée avec le graph: ${this.graphe.representation()}`);
    }

    genererReseau(taille: number, noms: ReadonlyArray<string>): void {

        const identifiants = Array(taille).fill(null);
        const pseudos = creerTableIdentificationMutableVide<"sommet", string>("sommet");

        // Creer des identifiants et des pseudos pour chaque sommet du reseau
        identifiants.forEach((_, index) => {
            const identifiant = this.generateurIdentifiants.produire("sommet");
            identifiants[index] = identifiant;
            pseudos.ajouter(identifiant, noms[index % noms.length])
        });

        const inactifs = creerTableIdentificationMutableVide<"sommet", FormatSommetTchat>("sommet");
        const tableAdjacence = creerTableIdentificationMutableVide<'sommet', FormatTableau<Identifiant<'sommet'>>>("sommet");

        identifiants.forEach((identifiant, index) => {
            inactifs.ajouter(identifiant, {ID: identifiant, pseudo: noms[index % noms.length], voisins: pseudos});
            tableAdjacence.ajouter(identifiant, {taille: taille, tableau: identifiants})
        });

        this.graphe = new GrapheMutableParTablesIdentification(
            inactifs,
            tableAdjacence
        );
    }
}


export class ReseauAnneau extends Reseau {

    constructor(taille: number, noms: ReadonlyArray<string>) {
        super();
        this.generateurIdentifiants = creerGenerateurIdentifiantParCompteur("prototype");
        this.genererReseau(taille, noms);
        console.log("* " + dateMaintenant().representationLog()
            + ` - Le reseau a ete créée avec le graph: ${this.graphe.representation()}`);
    }

    genererReseau(taille: number, noms: ReadonlyArray<string>): void {
        const identifiants = Array(taille).fill(null);
        const pseudos = creerTableIdentificationMutableVide<"sommet", string>("sommet");

        identifiants.forEach((_, index) => {
            const identifiant = this.generateurIdentifiants.produire("sommet");
            identifiants[index] = identifiant;
            pseudos.ajouter(identifiant, noms[index % noms.length])
        });

        const inactifs = creerTableIdentificationMutableVide<"sommet", FormatSommetTchat>("sommet");
        const tableAdjacence = creerTableIdentificationMutableVide<'sommet', FormatTableau<Identifiant<'sommet'>>>("sommet");

        identifiants.forEach((identifiant, index) => {
            inactifs.ajouter(identifiant, {
                ID: identifiant,
                pseudo: noms[index % noms.length],
                voisins: creerTableIdentificationMutableVide<"sommet", string>("sommet")
            })
        })

        // Rempli la table d'adjacence de tous les sommets sauf le premier et le dernier
        for (let i = 1; i < identifiants.length - 1; i++) {
            tableAdjacence.ajouter(identifiants[i], {taille: 2, tableau: [identifiants[i - 1], identifiants[i + 1]]})
        }
        // Ajoute la table d'adjacence pour le premier sommet
        tableAdjacence.ajouter(identifiants[0], {
            taille: 2,
            tableau: [identifiants[identifiants.length - 1], identifiants[1]]
        })
        // Ajoute la table d'adjacence pour le dernier sommet
        tableAdjacence.ajouter(identifiants[identifiants.length - 1], {
            taille: 2,
            tableau: [identifiants[identifiants.length - 2], identifiants[0]]
        })

        //Rempli les voisins de chaque sommet inactif en utilisant la table d'adjacence
        tableAdjacence.iterer((ID_sorte, val) => {
            val.tableau.forEach(voisin => {
                inactifs.valeur(ID_sorte).voisins.ajouter(voisin, pseudos.valeur(voisin));
            })
        })

        this.graphe = new GrapheMutableParTablesIdentification(
            inactifs,
            tableAdjacence
        );
    }
}