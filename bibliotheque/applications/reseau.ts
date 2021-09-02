import { Enveloppe, TypeEnveloppe } from "../types/enveloppe";
import { FormatIdentifiable, Identifiant } from "../types/identifiant";
import {
    creerTableIdentificationMutableVide,
    FormatTableIdentification,
    TableIdentification,
    TableIdentificationMutable
} from "../types/tableIdentification";
import { creerFileMutableVideIdentifiantsPrioritaires, FileMutableIdentifiantsPrioritaires, FormatFileIdentifiantsPrioritaires } from "../types/fileIdentifiantsPrioritaires";
import { Activable, jamais, modificationActivite } from "../types/typesAtomiques"
import { noeud, Noeud } from "./noeud";
import { CanalPersistantEcritureJSON } from "../communication/connexion";
import { EnsembleIdentifiants } from "../types/ensembleIdentifiants";


/**
 * Etat d'un réseau composé
 * - d'une table mutable d'identification de sommets,
 * - d'une file mutable de sommets inactifs déconnectés,
 *  munis d'une priorité,
 * - d'une table d'adjacence, associant à un identifiant 
 * de sommet un ensemble d'identifiants de sommets voisins,
 * - d'une table de connexions, 
 *   associant à un identifiant de sommet un canal.
 * Un sommet peut être actif ou non, connecté ou non. 
 * Un sommet déconnecté est nécessairement inactif. 
 * Un sommet connecté peut être actif ou non. 
 * @param FS format des sommets identifiables et activables.
 * @param C canal en écriture du serveur vers un client hôte d'un sommet actif.
 */
export interface EtatReseau<
    FS extends FormatIdentifiable<'sommet'> & Activable,
    C extends CanalPersistantEcritureJSON> {
    readonly sommets: TableIdentificationMutable<'sommet', FS>;
    readonly fileInactifsDeconnectes: FileMutableIdentifiantsPrioritaires<'sommet'>;
    readonly adjacence: TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>;
    readonly connexions: TableIdentificationMutable<'sommet', C>;
}


/**
 * Format d'un réseau composé
 * - d'une table de sommets, identifiables et activables,
 * - d'un file de sommets inactifs et déconnectés,
 *  munis d'une priorité,
 * - d'une table d'adjacence, associant à un identifiant 
 * de sommet un tableau d'identifiants de sommets voisins.
 * @param FS format des sommets identifiables et activables.
 */
export interface FormatReseau<
    FS extends FormatIdentifiable<'sommet'> & Activable> {
    readonly sommets: FormatTableIdentification<'sommet', FS>;
    readonly fileInactifsDeconnectes: FormatFileIdentifiantsPrioritaires<'sommet'>;
    readonly adjacence: FormatTableIdentification<'sommet', ReadonlyArray<string>>;
}

/**
 * Etiquettes utilisées pour la représentation des réseaux.
 * TODO à compléter à l'usage.
 */
export type EtiquetteReseau = 'sommets' | 'inactifs' | 'adjacence';

/**
 * Interface pour un réseau, paramétrée par le type des sommets et le type des canaux de communication.
 * Le réseau contient :
 * - une table d'identification pour les sommets,
 * identifiables et activables,
 * - une table d'adjacence pour tous les sommets,
 * - une table de connexions pour les sommets actifs distants,
 * - une file de sommets inactifs et déconnectés, 
 * munis d'une priorité.
 * Le calcul de la priorité se fait dynamiquement suivant la
 * configuration du réseau. 
 * Cette classe abstraite doit être étendue par 
 * - l'initialisation de la file,
 * - le retrait de la file,
 * - l'ajout à la file. 
 * @param FS type décrivant les sommets en JSON.
 * @param C type décrivant les connexions (serveur vers client)
 */
export interface ReseauMutable<
    FS extends FormatIdentifiable<'sommet'> & Activable,
    C extends CanalPersistantEcritureJSON> extends TypeEnveloppe<EtatReseau<FS, C>,
    FormatReseau<FS>, EtiquetteReseau> {
    /**
     * Initie la file des déconnectés inactifs avec leur priorité. 
     * Méthode abstraite appelée lors de la construction, 
     * à implémenter dans chaque réseau concret.
     */
    initialiserFileDesInactifsDeconnectes(): void;
    /**
     * Détermine si le  réseau possède le sommet identifié par l'argument.
     * @param ID_sommet identité de le sommet.
     * @returns true si le réseau possède ce sommet, false sinon.
     */
    possedeSommet(ID_sommet: Identifiant<'sommet'>): boolean;

    /**
     * Détermine si les deux sommets identifiés par les arguments sont voisins.
     * Précondition : les sommets appartiennent au réseau.
     * @param ID_sommet1 identité de le sommet.
     * @param ID_sommet2 identité de le sommet.
     */
    sontVoisins(ID_sommet1: Identifiant<'sommet'>,
        ID_sommet2: Identifiant<'sommet'>): boolean;

    /**
     * Sommet identifié par l'argument.
     * Précondition : le sommet est présent dans le réseau.
     * @param ID_sommet identité de le sommet.
     * @returns la description de le sommet.
     */
    sommet(ID_sommet: Identifiant<'sommet'>): FS;

    /**
     * Connexion associée au sommet identifié par l'argument.
     * Précondition : le sommet est connecté.
     * @param ID_sommet 
     */
    connexion(ID_sommet: Identifiant<'sommet'>): C;

    /**
     * Connecte un sommet inactif déconnecté.
     * C'est le sommet le plus prioritaire qui est connecté. 
     * Cette méthode a pour effet :
     * - de retirer le sommet prioritaire de la file des sommets inactifs déconnectés,
     * - d'ajouter à la table des connexions une nouvelle 
     * association (identifiant du sommet, connexion associée
     * au sommet).
     * Le sommet peut devenir actif ou non : voir l'implémentation 
     * du retrait de la file.
     * Précondition : le réseau possède au moins un sommet inactif déconnecté.
     * @param connexion canal de communication qui sera associé au sommet.
     * @returns identifiant du sommet connecté.
     */
    connecterSommet(connexion: C): Identifiant<'sommet'>;

    /**
     * Retire le sommet de la file. Méthode abstraite à implémenter 
     * dans chaque classe concrète suivant les règles de priorité.
     * Cette méthode a aussi pour effet de modifier les priorités et 
     * l'activité des sommets, d'une manière propre à chaque réseau.
     * @returns identifiant du sommet à retirer de la file
     */
    retirerSommetDeFile(): Identifiant<'sommet'>;

    /**
     * Déconnecte le sommet identifié par l'argument. 
     * Le sommet devient inactif et est ajouté à la file des inactifs * déconnectés. La table des connexions est aussi mise à jour.
     * Précondition : le sommet est connecté dans le réseau. 
     * @param ID_sommet identité de le sommet à inactiver.
     */
    deconnecterSommet(ID_sommet: Identifiant<'sommet'>): void;

    /**
     * Ajoute le sommet à la file des inactifs déconnectés. 
     * Méthode abstraite à implémenter dans chaque classe concrète 
     * suivant les règles de priorité.
     * Cette méthode a aussi pour effet de modifier les priorités et 
     * l'activité des sommets, d'une manière propre à chaque réseau.
     * Précondition : le sommet est inactif.
     * @param ID_sommet identifiant de le sommet à ajouter à la file
     */
    ajouterSommetAFile(ID_sommet: Identifiant<'sommet'>): void;

    /**
     * Nombre total de sommets inactifs déconnectés dans le réseau.
     */
    nombreInactifsDeconnectes(): number;

    /**
     * Détermine si le réseau possède un sommet inactif et déconnecté.
     */
    aUnSommetInactifDeconnecte() : boolean;

    /**
     * Nombre total de sommets inactifs dans le réseau.
     */
    nombreTotalInactifs(): number;


    /**
     * Nombre total de sommets actifs dans le réseau.
     */
    nombreActifs(): number;

    /**
     * Noeud de cente le sommet identifié par l'argument.
     * @param identifant de le sommet
     * @returns noeud de centre le sommet identifié
     */
    noeud(ID_sommet: Identifiant<'sommet'>): Noeud<FS>;
    

    /**
     * Itère sur tous les sommets en leur appliquant une fonction. 
     * @param f procédure à appliquer a chaque association (identifant, sommet actif).
     */
    itererSommets(f: (ID_sommet: Identifiant<'sommet'>, s: FS) => void): void;

    /**
     * Voisins de le sommet identifié par l'argument.
     */
    voisins(ID_sommet: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'>;
    /**
     * Crible des voisins d'un sommet.
     * @param ID_sommet identifiant du sommet.
     * @param prop prédicat s'appliquant à un couple (identifiant, sommet identifié).
     * @return ensemble des identifiants des sommets appartenant au crible.
     */
    cribleVoisins(
        ID_sommet: Identifiant<'sommet'>,
        prop: (ID: Identifiant<'sommet'>, s: FS) => boolean): EnsembleIdentifiants<'sommet'>;
    /**
     * Taille du crible des voisins d'un sommet.
     * @param ID_sommet identifiant du sommet.
     * @param prop prédicat s'appliquant à un couple (identifiant, sommet identifié).
     * @returns taille du crible.
     */
    tailleCribleVoisins(
        ID_sommet: Identifiant<'sommet'>,
        prop: (ID: Identifiant<'sommet'>, s: FS) => boolean): number

}

export abstract class ReseauMutableParEnveloppe<
    FS extends FormatIdentifiable<'sommet'> & Activable,
    C extends CanalPersistantEcritureJSON>
    extends Enveloppe<EtatReseau<FS, C>,
    FormatReseau<FS>, EtiquetteReseau>
    implements ReseauMutable<FS, C>
{

    constructor(
        sommets: TableIdentificationMutable<'sommet', FS>,
        adjacence:
            TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>,
    ) {
        super({
            sommets: sommets,
            fileInactifsDeconnectes: creerFileMutableVideIdentifiantsPrioritaires('sommet'),
            adjacence: adjacence,
            connexions: creerTableIdentificationMutableVide<'sommet', C>('sommet')
        });
        this.initialiserFileDesInactifsDeconnectes();
    }
    /**
     * Initie la file des inactifs. Méthode appelée lors de la construction, à implémenter dans chaque réseau concret.
     */
    abstract initialiserFileDesInactifsDeconnectes(): void;
    net(e: EtiquetteReseau): string {
        switch (e) {
            case "sommets":
                return this.etat().sommets.representation();
            case "adjacence":
                return this.etat().adjacence.representation();
            case "inactifs":
                return this.etat().fileInactifsDeconnectes.representation();
        }
        return jamais(e);
    }

    representation(): string {
        return `Sommets : ${this.net("sommets")} - Adjacence : ${this.net("adjacence")}`;
    }
    toJSON(): FormatReseau<FS> {
        return {
            sommets: this.etat().sommets.toJSON(),
            fileInactifsDeconnectes: this.etat().fileInactifsDeconnectes.toJSON(),
            adjacence: this.etat()
                .adjacence.application((id, x) => x.toJSON().ensemble).toJSON()
        };
    }

    possedeSommet(ID_sommet: Identifiant<'sommet'>): boolean {
        return this.etat().sommets.contient(ID_sommet);
    }

    sontVoisins(ID_sommet1: Identifiant<'sommet'>, ID_sommet2: Identifiant<'sommet'>): boolean {
        return this.etat().adjacence.valeur(ID_sommet1).contient(ID_sommet2);
    }

    sommet(ID_sommet: Identifiant<'sommet'>): FS {
        return this.etat().sommets.valeur(ID_sommet);
    }

    connexion(ID_sommet: Identifiant<'sommet'>): C {
        return this.etat().connexions.valeur(ID_sommet);
    }

    aUnSommetActif(): boolean {
        return this.etat().sommets.selectionAssociationSuivantCritere((id, s) => s.actif).estPresent();
    }

    aUnSommetInactif(): boolean {
        return this.etat().sommets.selectionAssociationSuivantCritere((id, s) => !(s.actif)).estPresent();
    }

    connecterSommet(connexion: C): Identifiant<'sommet'> {
        //Sélectionne le sommet le plus prioritaire et met à jour la file.
        const ID_sommet = this.retirerSommetDeFile();
        // Enregistre la connexion.
        this.etat().connexions.ajouter(ID_sommet, connexion);
        return ID_sommet;
    }

    abstract retirerSommetDeFile(): Identifiant<'sommet'>;

    deconnecterSommet(ID_sommet: Identifiant<'sommet'>): void {
        // Inactive le sommet.
        const sommet = this.etat().sommets.valeur(ID_sommet);
        this.etat().sommets.modifier(ID_sommet, modificationActivite(sommet));
        // Retire la connexion associée au sommet.
        this.etat().connexions.retirer(ID_sommet);
        // Ajoute le sommet à la file des inactifs déconnectés.
        this.ajouterSommetAFile(ID_sommet);
    }

    abstract ajouterSommetAFile(ID_sommet: Identifiant<'sommet'>): void;

    nombreInactifsDeconnectes(): number {
        return this.etat().fileInactifsDeconnectes.taille();
    }

    aUnSommetInactifDeconnecte() : boolean {
        return this.nombreInactifsDeconnectes() > 0;
    }

    /**
    * Nombre total de sommets inactifs dans le réseau.
    */
    nombreTotalInactifs(): number {
        return this.etat().sommets.taille() - this.nombreActifs();
    }


    nombreActifs(): number {
        let r = 0;
        this.etat().sommets.iterer((id, val) => { if (val.actif) { r++; } });
        return r;

    }

    /**
     * Noeud de cente le sommet identifié par l'argument.
     * @param identifant du sommet
     * @returns noeud de centre le sommet identifié
     */
    noeud(ID_sommet: Identifiant<'sommet'>): Noeud<FS> {
        const tableVoisins: TableIdentificationMutable<'sommet', FS> = creerTableIdentificationMutableVide('sommet');
        this.voisins(ID_sommet).iterer((id) => tableVoisins.ajouter(id, this.etat().sommets.valeur(id)));
        return noeud({
            centre: this.etat().sommets.valeur(ID_sommet),
            voisins: tableVoisins.toJSON()
        }
        );
    }

    itererSommets(f: (ID_sommet: Identifiant<'sommet'>, s: FS) => void): void {
        this.etat().sommets.iterer(f);
    }

    voisins(ID_sommet: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'> {
        return this.etat().adjacence.valeur(ID_sommet);
    }

    cribleVoisins(
        ID_sommet: Identifiant<'sommet'>,
        prop: (ID: Identifiant<'sommet'>, s: FS) => boolean): EnsembleIdentifiants<'sommet'> {
        return this.etat().adjacence.valeur(ID_sommet).crible((ID) => prop(ID, this.etat().sommets.valeur(ID)));
    }

    tailleCribleVoisins(
        ID_sommet: Identifiant<'sommet'>,
        prop: (ID: Identifiant<'sommet'>, s: FS) => boolean): number {
        let r = 0;
        this.etat().adjacence.valeur(ID_sommet).iterer(
            (ID) => {
                const s = this.etat().sommets.valeur(ID);
                if (prop(ID, s)) {
                    r++;
                }
            }
        )
        return r;
    }



}

/**
 * Interface pour un générateur de réseau.
 */
export interface GenerateurReseau<
    FS extends FormatIdentifiable<'sommet'> & Activable,
    C extends CanalPersistantEcritureJSON,
    R extends ReseauMutable<FS, C>> {
    engendrer(): R;
}