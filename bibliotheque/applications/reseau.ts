import { Enveloppe, TypeEnveloppe } from "../types/enveloppe";
import { FormatIdentifiable, Identifiant } from "../types/identifiant";
import { FormatTableau, Tableau } from "../types/tableau";
import {
    creerTableIdentificationMutableVide,
    FormatTableIdentification,
    TableIdentification,
    TableIdentificationMutable
} from "../types/tableIdentification";
import { FileMutableAPriorite, FormatFileAPriorite } from "../types/fileAPriorite";
import { Activable, jamais, Prioritarisable } from "../types/typesAtomiques";
import { noeud, Noeud } from "./noeud";
import { CanalPersistantEcritureJSON } from "../communication/connexion";

/**
 * Etat d'un réseau composé
 * - d'un tableau mutable de sommets actifS,
 * - d'un tableau mutable de sommets inactifs,
 * - d'une table d'adjacence, associant à un identifiant de sommet
 *   un tableau d'identifiants de sommets voisins
 *  (présents ou absents).
 * @param FS format JSON des sommets
 */
export interface EtatReseau<
    FS extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable,
    C extends CanalPersistantEcritureJSON> {
    readonly sommets: TableIdentificationMutable<'sommet', FS>;
    readonly fileInactifs: FileMutableAPriorite<Identifiant<'sommet'>>;
    readonly adjacence: TableIdentification<'sommet', Tableau<Identifiant<'sommet'>>>;
    readonly connexions: TableIdentificationMutable<'sommet', C>;
}


/**
 * Format JSON d'un réseau composé
 * - d'un tableau de sommets actifs,
 * - d'un tableau de sommets inactifs,
 * - d'une table d'adjacence, associant à un identifiant de sommet
 *   un tableau d'identifiants de sommets voisins
 *  (présents ou absents).
 * TODO JSON vs non JSON
 * @param FS format JSON des sommets
 */
export interface FormatReseau<
    FS extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable> {
    readonly sommets: FormatTableIdentification<'sommet', FS>;
    readonly fileInactifs: FormatFileAPriorite<Identifiant<'sommet'>>;
    readonly adjacence: FormatTableIdentification<'sommet', FormatTableau<Identifiant<'sommet'>>>;
}

/**
 * Etiquettes utilisées pour la représentation des réseaux.
 * TODO à compléter à l'usage.
 */
export type EtiquetteReseau = 'sommets' | 'fileInactifs' | 'voisins';

/**
 * Interface pour un réseau, paramétrée par le type des sommets.
 * Le réseau définit une table d'adjacence pour tous les sommets.
 * Les sommets peuvent être actifs ou inactifs.
 * TODO à enrichir et raffiner suivant l'usage.
 * @param FS type décrivant les sommets en JSON.
 * @param C type décrivant les connexions (serveur vers client)
 */
export interface ReseauMutable<
    FS extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable,
    C extends CanalPersistantEcritureJSON> extends TypeEnveloppe<EtatReseau<FS, C>,
    FormatReseau<FS>, EtiquetteReseau> {
    /**
     * Détermine si le  réseau possède le sommet identifié par l'argument.
     * @param ID_sommet identité du sommet.
     * @returns true si le réseau possède ce sommet, false sinon.
     */
    possedeSommet(ID_sommet: Identifiant<'sommet'>): boolean;

    /**
     * Détermine si les deux sommets identifiés par les arguments sont voisins.
     * Précondition : les sommets appartiennent au réseau.
     * @param ID_sommet1 identité du sommet.
     * @param ID_sommet2 identité du sommet.
     */
    sontVoisins(ID_sommet1: Identifiant<'sommet'>,
        ID_sommet2: Identifiant<'sommet'>): boolean;

    /**
     * Sommet actif identifié par l'argument.
     * Précondition : le sommet est présent.
     * @param ID_sommet identité du sommet.
     * @returns la description du sommet.
     */
    sommet(ID_sommet: Identifiant<'sommet'>): FS;

    /**
     * Connexion associée au sommet identifié par l'argument.
     * Précondition : le sommet est actif.
     * @param ID_sommet 
     */
    connexion(ID_sommet: Identifiant<'sommet'>): C;

    /**
     * Détermine si le réseau possède un sommet actif.
     * @returns true si le réseau possède un sommet actif, false sinon.
     */
    aUnSommetActif(): boolean;

    /**
     * Détermine si le réseau possède un sommet inactif.
     * @returns true si le réseau possède un sommet inactif, false sinon.
     */
    aUnSommetInactif(): boolean;

    /**
     * Active un sommet inactif.
     * C'est le sommet le plus prioritaire qui est activé.
     * Précondition : le réseau possède un sommet inactif.
     * @returns Sommet activé.
     */
    activerSommet(connexion: C): Identifiant<'sommet'>;

    /**
     * Inactive le sommet identifié par l'argument.
     * Précondition : le réseau possède ce sommet actif. 
     * @param ID_sommet identité du sommet à inactiver.
     */
    inactiverSommet(ID_sommet: Identifiant<'sommet'>): void;

    /**
     * Nombre total de sommets inactifs dans le réseau.
     */
    nombreInactifs(): number;

    /**
     * Nombre total de sommets inactifs dans le réseau.
     */
    nombreActifs(): number;

    /**
     * Noeud de cente le sommet identifié par l'argument.
     * @param identifant du sommet
     * @returns noeud de centre le sommet identifié
     */
    noeud(ID_sommet: Identifiant<'sommet'>) : Noeud<FS>;
    /**
     * Diffuse la configuration formée de la représentation JSON 
     * du noeud. 
     * @param ID_sommet sommet au centre du noeud 
     */
    diffuserConfigurationAuxVoisins(ID_sommet : Identifiant<'sommet'>) : void; 

    /**
     * Itère sur tous les sommets actifs en leur appliquant une fonction.
     * @param f function a appliquer a chaque association (identifant, sommet actif).
     */
    itererSommets(f: (ID_sommet: Identifiant<"sommet">, s: FS) => void): void;

    /**
     * Voisins du sommet identifié par l'argument.
     */
    voisins(ID_sommet: Identifiant<'sommet'>): Tableau<Identifiant<'sommet'>>;

}

class ReseauMutableParEnveloppe<
    FS extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable,
    C extends CanalPersistantEcritureJSON>
    extends Enveloppe<EtatReseau<FS, C>,
    FormatReseau<FS>, EtiquetteReseau>
    implements ReseauMutable<FS, C>
{

    constructor(
        sommets: TableIdentificationMutable<'sommet', FS>,
        fileInactifs: FileMutableAPriorite<Identifiant<'sommet'>>,
        adjacence:
            TableIdentification<'sommet', Tableau<Identifiant<'sommet'>>>,
        private modificationActivite : (s : FS) => FS
    ) {
        super({
            sommets: sommets,
            fileInactifs: fileInactifs,
            adjacence: adjacence,
            connexions: creerTableIdentificationMutableVide('sommet')
        });
    }

    toJSON(): FormatReseau<FS> {
        return {
            sommets: this.etat().sommets.toJSON(),
            fileInactifs: this.etat().fileInactifs.toJSON(),
            adjacence: this.etat().adjacence.application((x) => x.toJSON()).toJSON()
        };
    }

    possedeSommet(ID_sommet: Identifiant<"sommet">): boolean {
        return this.etat().sommets.contient(ID_sommet);
    }

    sontVoisins(ID_sommet1: Identifiant<"sommet">, ID_sommet2: Identifiant<"sommet">): boolean {
        return this.etat().adjacence.valeur(ID_sommet1).contient(ID_sommet2);
    }

    sommet(ID_sommet: Identifiant<"sommet">): FS {
        return this.etat().sommets.valeur(ID_sommet);
    }

    connexion(ID_sommet: Identifiant<"sommet">): C {
        return this.etat().connexions.valeur(ID_sommet);
    }

    aUnSommetActif(): boolean {
        return this.etat().sommets.selectionCleSuivantCritere((s) => s.actif).estPresent();
    }

    aUnSommetInactif(): boolean {
        return this.etat().sommets.selectionCleSuivantCritere((s) => !(s.actif)).estPresent();
    }

    activerSommet(connexion: C): Identifiant<"sommet"> {
        //Sélectionne le sommet le plus prioritaire.
        const ID_sommet = this.etat().fileInactifs.retirer();
        const sommet = this.etat().sommets.valeur(ID_sommet);
        this.etat().sommets.modifier(ID_sommet, this.modificationActivite(sommet));
        this.etat().connexions.ajouter(ID_sommet, connexion);
        /* console.log("* " + dateMaintenant().representationLog()
            + "- Le sommet " + ID_sommet.val + " a été activé");
        console.log("* " + dateMaintenant().representationLog()
            + ` - Sommets : ${this.net("sommets")}`); */
        return ID_sommet;
    }

    inactiverSommet(ID_sommet: Identifiant<"sommet">): void {
        const sommet = this.etat().sommets.valeur(ID_sommet);
        this.etat().sommets.modifier(ID_sommet, this.modificationActivite(sommet));
        this.etat().connexions.retirer(ID_sommet);
        this.etat().fileInactifs.ajouter(ID_sommet, sommet.priorite);
        // console.log("* " + dateMaintenant().representationLog()
        //     + "- Le sommet " + ID_sommet.val + " a été inactivé.");
        // console.log("* " + dateMaintenant().representationLog()
        //     + ` - Sommets : ${this.net("sommets")}`);
    }

    nombreInactifs(): number {
        return this.etat().fileInactifs.taille();
    }

    nombreActifs(): number {
        return this.etat().sommets.taille() - this.nombreInactifs();
    }

    /**
     * Noeud de cente le sommet identifié par l'argument.
     * @param identifant du sommet
     * @returns noeud de centre le sommet identifié
     */
    noeud(ID_sommet: Identifiant<'sommet'>) : Noeud<FS> {
        const tableVoisins : TableIdentificationMutable<'sommet', FS> = creerTableIdentificationMutableVide('sommet');
        this.voisins(ID_sommet).iterer((i, id) => tableVoisins.ajouter(id, this.etat().sommets.valeur(id)));
        return noeud({
            centre : this.etat().sommets.valeur(ID_sommet),
            voisins : tableVoisins.toJSON()
        }
        );
    }

    diffuserConfigurationAuxVoisins(ID_sommet : Identifiant<'sommet'>) : void {
        this.voisins(ID_sommet).iterer((i, id) => {
            if (this.sommet(id).actif) {
                const canalVoisin = this.connexion(id);
                canalVoisin.envoyerJSON('config', this.noeud(id));
            }
        });
    }

    itererSommets(f: (ID_sommet: Identifiant<"sommet">, s: FS) => void): void {
        this.etat().sommets.iterer(f);
    }

    voisins(ID_sommet: Identifiant<"sommet">): Tableau<Identifiant<"sommet">> {
        return this.etat().adjacence.valeur(ID_sommet);
    }

    net(e: EtiquetteReseau): string {
        switch (e) {
            case "sommets":
                return this.etat().sommets.representation();
            case "voisins":
                return this.etat().adjacence.representation();
            case "fileInactifs":
                return this.etat().fileInactifs.representation();
        }
        return jamais(e);
    }

    representation(): string {
        return `Sommets : ${this.net("sommets")} - Voisins : ${this.net("voisins")}`;
    }
}

export function creerReseauMutable<
    FS extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable,
    C extends CanalPersistantEcritureJSON>
    (
        sommets: TableIdentificationMutable<'sommet', FS>,
        fileInactifs: FileMutableAPriorite<Identifiant<'sommet'>>,
        adjacence:
            TableIdentification<'sommet', Tableau<Identifiant<'sommet'>>>,
        modificationActivite : (s : FS) => FS
    ): ReseauMutable<FS, C> {
    return new ReseauMutableParEnveloppe(sommets, fileInactifs, adjacence, modificationActivite);
}

/**
 * Interface pour un générateur de réseau.
 */
export interface GenerateurReseau<
    FS extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable,
    C extends CanalPersistantEcritureJSON> {
    engendrer(): ReseauMutable<FS, C>;
}