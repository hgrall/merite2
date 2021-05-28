import {TypeEnveloppe} from "./enveloppe";
import {FormatIdentifiable, Identifiant} from "./identifiant";
import {creerTableauMutableVide, FormatTableau, TableauMutable, TableauMutableParEnveloppe} from "./tableau";
import {
    creerTableIdentificationMutableVide,
    FormatTableIdentification,
    TableIdentification,
    TableIdentificationMutable
} from "./tableIdentification";
import {dateMaintenant} from "./date";
import {creerTableMutableVide, TableMutable, TableMutableParEnveloppe} from "./table";

/**
 *  Format qui represente un sommet actif composée d'un sommet inactif
 *  duquel il s'est activé et de la connexion qui est le canal de communication avec le client
 */
export interface FormatSommetActif<FSI extends FormatIdentifiable<'sommet'>, C> {
    sommetInactif: FSI;
    voisinsActifs: FormatTableIdentification<'sommet', FSI>;
    connexion: C;
}

/**
 * Description JSON d'un graphe composée
 * - d'un tableau mutable de sommets actifs,
 * - d'un tableau mutable de sommets inactifs,
 * - d'une table d'adjacence, associant à un identifiant de sommet
 *   un tableau d'identifiants de sommets voisins
 *  (présents ou absents).
 * @param FSA format JSON des sommets actifs
 * @param FSI format JSON des sommets inactifs
 */
export interface FormatGraphe<FSI extends FormatIdentifiable<'sommet'>,
    C> {
    readonly actifs: FormatTableIdentification<'sommet', FormatSommetActif<FSI, C>>;
    readonly inactifs: FormatTableIdentification<'sommet', FSI>;
    readonly adjacence: FormatTableIdentification<'sommet', FormatTableau<Identifiant<'sommet'>>>;
}

/**
 * Etiquettes utilisées pour la représentation des graphes.
 * TODO à compléter à l'usage.
 */
export type EtiquetteGraphe = 'actifs' | 'inactifs' | 'voisins';

/**
 * Interface pour un graphe, paramétrée par le type des sommets.
 * Le graphe définit une table d'adjacence pour tous les sommets.
 * Les sommets peuvent être actifs ou inactifs.
 * @param FS type décrivant les sommets en JSON.
 */
export interface GrapheMutable<FSI extends FormatIdentifiable<'sommet'>, C>
    extends TypeEnveloppe<FormatGraphe<FSI, C>,
        EtiquetteGraphe> {
    /**
     * Détermine si le  graphe possède le sommet identifié par l'argument.
     * @param ID_sommet identité du sommet.
     * @returns true si le réseau possède ce sommet, false sinon.
     */
    possedeSommet(ID_sommet: Identifiant<'sommet'>): boolean;

    /**
     * Détermine si le sommet identifié par l'argument est actif.
     * @param ID_sommet identité du sommet.
     * @returns true si le réseau possède ce sommet et qu'il est actif, false sinon.
     */
    aSommetActif(ID_sommet: Identifiant<'sommet'>): boolean;

    /**
     * Détermine si le sommet identifié par l'argument est actif.
     * @param ID_sommet identité du sommet.
     * @returns true si le réseau possède ce sommet et qu'il est inactif, false sinon.
     */
    aSommetInactif(ID_sommet: Identifiant<'sommet'>): boolean;

    /**
     * Détermine si les deux sommets identifiés par les arguments sont voisins.
     * Précondition : les sommets appartiennent au graphe.
     * @param ID_sommet1 identité du sommet.
     * @param ID_sommet2 identité du sommet.
     */
    sontVoisins(ID_sommet1: Identifiant<'sommet'>,
                ID_sommet2: Identifiant<'sommet'>): boolean;

    /**
     * Sommet actif identifié par l'argument.
     * Précondition : le sommet appartient au graphe et est actif.
     * @param ID_sommet identité du sommet.
     * @returns description en JSON du sommet actif.
     */
    sommetActif(ID_sommet: Identifiant<'sommet'>): FormatSommetActif<FSI, C>;

    /**
     * Sommet inactif identifié par l'argument.
     * Précondition : le sommet appartient au graphe et est inactif.
     * @param ID_sommet identité du sommet.
     * @returns description en JSON du sommet inactif.
     */
    sommetInactif(ID_sommet: Identifiant<'sommet'>): FSI;

    /**
     * Détermine si le graphe possède un sommet actif.
     * @returns true si le graphe possède un sommet actif, false sinon.
     */
    aUnSommetActif(): boolean;

    /**
     * Détermine si le graphe possède un sommet inactif.
     * @returns true si le graphe possède un sommet inactif, false sinon.
     */
    aUnSommetInactif(): boolean;

    /**
     * Active un sommet inactif et mettre a jour la liste de voisins actifs de tous les sommets actifs
     * @returns Sommet activé.
     */
    activerSommet(connexion: C): FormatSommetActif<FSI, C> ;

    /**
     * Inactive le sommet identifié par l'argument.
     * @param ID_sommet identité du sommet à inactiver.
     */
    inactiverSommet(ID_sommet: Identifiant<'sommet'>): void;

    /**
     * Nombre total de sommets inactifs dans le graphe.
     */
    tailleInactifs(): number;

    /**
     * Nombre total de sommets inactifs dans le graphe.
     */
    tailleActifs(): number;

    /**
     * Itère les voisins du sommet identifie par l'argument et leur applique une fonction
     * @param ID_sommet identifiant du sommet auquel on veut itérer ses voisins
     * @param f function a appliquer a chaque sommet voisin
     */
    itererVoisins(ID_sommet: Identifiant<'sommet'>, f: (ID_sommet: Identifiant<'sommet'>)=> void): void;

    /**
     * Itère tous les sommets actifs dans le réseau
     * @param f function a appliquer a chaque sommet actif du réseau
     */
    itererActifs( f: (ID_sommet: Identifiant<"sommet">) => void): void;

    // TODO autres méthodes d'accès (concernant l'adjacence)
}

export class GrapheMutableParTablesIdentification<FSI extends FormatIdentifiable<'sommet'>, C>
    implements GrapheMutable<FSI, C> {
    private actifs: TableIdentificationMutable<'sommet', FormatSommetActif<FSI, C>>;
    constructor(
        private inactifs : TableIdentificationMutable<'sommet', FSI>,
        private tableAdjacence : 
        TableIdentification<'sommet', FormatTableau<Identifiant<'sommet'>>>
    ){
        this.actifs = creerTableIdentificationMutableVide('sommet');
    }

    possedeSommet(ID_sommet: Identifiant<"sommet">): boolean {
        return this.actifs.contient(ID_sommet)
            || this.inactifs.contient(ID_sommet);
    }

    aSommetActif(ID_sommet: Identifiant<"sommet">): boolean {
        return this.actifs.contient(ID_sommet);
    }

    aSommetInactif(ID_sommet: Identifiant<"sommet">): boolean {
        return this.inactifs.contient(ID_sommet);
    }

    sontVoisins(ID_sommet1: Identifiant<"sommet">, ID_sommet2: Identifiant<"sommet">): boolean {
        return this.tableAdjacence.valeur(ID_sommet1).tableau.find(
            (identifiant) => identifiant == ID_sommet2
        ) !== undefined
    }

    sommetActif(ID_sommet: Identifiant<"sommet">): FormatSommetActif<FSI, C> {
        return this.actifs.valeur(ID_sommet);
    }

    sommetInactif(ID_sommet: Identifiant<"sommet">): FSI {
        return this.inactifs.valeur(ID_sommet);
    }

    aUnSommetActif(): boolean {
        return this.actifs.taille() > 0;
    }

    aUnSommetInactif(): boolean {
        return this.inactifs.taille() > 0;
    }

    activerSommet(connexion: C): FormatSommetActif<FSI, C> {
        if(this.inactifs.estVide()){
            throw new Error("Le réseau est complete");
        }
        //Sélectionne un sommet inactif au hazard
        const ID_sommet = this.inactifs.selectionCle();
        const sommetInactif = this.inactifs.retirer(ID_sommet).valeur();

        //Initializer et remplir la table avec les  identifiants des voisins actifs
        const voisinsActifsMutable = creerTableIdentificationMutableVide<"sommet", FSI>("sommet");
        this.tableAdjacence.valeur(ID_sommet).tableau.forEach( idAdjacence => {
            voisinsActifsMutable.ajouter(idAdjacence, this.inactifs.valeur(idAdjacence));

        })
        const voisinsActifs: FormatTableIdentification<"sommet", FSI> = {sorte:"sommet", identification: voisinsActifsMutable.val()}

        //Crée un sommet actif a partir du sommet sélectionné
        const sommetActif = { connexion, sommetInactif, voisinsActifs };
        this.actifs.ajouter(ID_sommet, sommetActif);

        // Mise a jour des listes de voisins actifs de tous les sommets actifs avec le nouveau sommet actif
        this.actifs.iterer((id_actif, val1) => {
            if(this.tableAdjacence.valeur(id_actif).tableau.find(
                (identifiant) => identifiant.val == ID_sommet.val
            ) !== undefined){
                // Ajouter le nouveau sommet dans la liste de voisins actifs du sommets actifs
                this.actifs.valeur(id_actif).voisinsActifs.ajouter(ID_sommet, sommetInactif);
            }
        });


        console.log("* " + dateMaintenant().representationLog()
            + ` - Connexions inactives: ${this.net("inactifs")}`);
        console.log("* " + dateMaintenant().representationLog()
            + ` - Connexions actives: ${this.actifs.representation()}`);
        console.log("* " + dateMaintenant().representationLog()
            + "- Le sommet " + ID_sommet.val + " a été activé");
        return sommetActif;
    }

    inactiverSommet(ID_sommet: Identifiant<"sommet">): void {
        const sommetActif = this.actifs.retirer(ID_sommet).valeur();
        this.inactifs.ajouter(ID_sommet, sommetActif.sommetInactif);
        // Enlève le sommet a inactiver de la liste des voisins actifs de tous les sommets actifs
        this.itererActifs(idActif => {
            this.actifs.valeur(idActif).voisinsActifs.iterer((identifiant) => {
               if(identifiant == ID_sommet){
                   this.actifs.valeur(idActif).voisinsActifs.retirer(ID_sommet)
               }
           })
       })
        console.log("* " + dateMaintenant().representationLog()
            + "- Le sommet " + ID_sommet.val + " a été inactivé");
    }

    tailleInactifs(): number {
        return  this.inactifs.taille();
    }

    tailleActifs(): number {
        return  this.actifs.taille();
    }

    itererVoisins(ID_sommet: Identifiant<"sommet">, f: (ID_sommet: Identifiant<"sommet">) => void): void {
        this.tableAdjacence.valeur(ID_sommet).tableau.forEach(ID_sommet => {
            f(ID_sommet);
        });
    }

    itererActifs( f: (ID_sommet: Identifiant<"sommet">) => void): void {
        this.actifs.iterer(f);
    }

    val(): FormatGraphe<FSI, C> {
        return {actifs: this.actifs.val(), inactifs: this.inactifs.val(), adjacence: this.tableAdjacence.val()}
    }

    brut(): string {
        return JSON.stringify(this.val());
    }

    net(etiquette: EtiquetteGraphe): string {
        switch (etiquette) {
            case "actifs":
                return this.actifs.representation();
            case "inactifs":
                return this.inactifs.representation();
            case "voisins":
                return this.tableAdjacence.representation()
        }
    }

    representation(): string {
        return `Actifs: ${this.net("actifs")} Inactifs: ${this.net("inactifs")} Voisins: ${this.net("voisins")}`;
    }
} 