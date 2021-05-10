import { TypeEnveloppe } from "./enveloppe";
import { FormatIdentifiable, Identifiant } from "./identifiant";
import { FormatTableau } from "./tableau";
import { creerTableIdentificationMutableVide, FormatTableIdentification, TableIdentification, TableIdentificationMutable } from "./tableIdentification";


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
export interface FormatGraphe<
    FSA extends FormatIdentifiable<'sommet'>,
    FSI extends FormatIdentifiable<'sommet'>> {
    readonly actifs : FormatTableIdentification<'sommet', FSA>;
    readonly inactifs : FormatTableIdentification<'sommet', FSI>;
    readonly adjacence : FormatTableIdentification<'sommet', FormatTableau<Identifiant<'sommet'>>>;
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
export interface GrapheMutable<
    FSA extends FormatIdentifiable<'sommet'>,
    FSI extends FormatIdentifiable<'sommet'>>
    extends TypeEnveloppe<
    FormatGraphe<FSA, FSI>,
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
    sommetActif(ID_sommet: Identifiant<'sommet'>): FSA;
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
     * Active un sommet inactif.
     * @returns ID_sommet identité du sommet activé.
     */
    activerSommet() : Identifiant<'sommet'>;
    /**
     * Inactive le sommet identifié par l'argument.
     * @param ID_sommet identité du sommet à inactiver.
     */
    inactiverSommet(ID_sommet : Identifiant<'sommet'>) : void;
    /**
     * Nombre total de sommets dans le graphe.
     */
    taille(): number;
    // TODO autres méthodes d'accès (concernant l'adjacence) 
}

export class GrapheMutableParTablesIdentification<
FSA extends FormatIdentifiable<'sommet'>,
FSI extends FormatIdentifiable<'sommet'>> 
implements GrapheMutable<FSA, FSI> {
    private actifs : TableIdentificationMutable<'sommet', FSA>;
    constructor(
        private inactifs : TableIdentificationMutable<'sommet', FSI>,
        private tableAdjacence : 
        TableIdentification<'sommets', FormatTableau<Identifiant<'sommet'>>>
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
        throw new Error("Method not implemented.");
    }
    sommetActif(ID_sommet: Identifiant<"sommet">): FSA {
        return this.actifs.valeur(ID_sommet);
    }
    sommetInactif(ID_sommet: Identifiant<"sommet">): FSI {
        throw new Error("Method not implemented.");
    }
    aUnSommetActif(): boolean {
        throw new Error("Method not implemented.");
    }
    aUnSommetInactif(): boolean {
        throw new Error("Method not implemented.");
    }
    activerSommet(): Identifiant<"sommet"> {
        throw new Error("Method not implemented.");
    }
    inactiverSommet(ID_sommet: Identifiant<"sommet">): void {
        throw new Error("Method not implemented.");
    }
    taille(): number {
        throw new Error("Method not implemented.");
    }
    val(): FormatGraphe<FSA, FSI> {
        throw new Error("Method not implemented.");
    }
    brut(): string {
        throw new Error("Method not implemented.");
    }
    net(etiquette: EtiquetteGraphe): string {
        throw new Error("Method not implemented.");
    }
    representation(): string {
        throw new Error("Method not implemented.");
    }
    
} 