import { Enveloppe, TypeEnveloppe } from "../types/enveloppe";
import { FormatIdentifiable, Identifiant } from "../types/identifiant";
import {
    creerTableIdentificationMutableVide,
    FormatTableIdentification,
    TableIdentification,
    TableIdentificationMutable
} from "../types/tableIdentification";
import { creerFileMutableVideIdentifiantsPrioritaires, FileMutableIdentifiantsPrioritaires, FormatFileIdentifiantsPrioritaires } from "../types/fileIdentifiantsPrioritaires";
import { Activable, jamais } from "../types/typesAtomiques"
import { noeud, Noeud } from "./noeud";
import { CanalPersistantEcritureJSON } from "../communication/connexion";
import { EnsembleIdentifiants } from "../types/ensembleIdentifiants";


/**
 * Etat d'un réseau composé
 * - d'un table mutable d'identification de utilisateurs,
 * - d'un file mutable de utilisateurs inactifs, munis d'une priorité,
 * - d'une table d'adjacence, associant à un identifiant de utilisateur
 *   un ensemble d'identifiants de utilisateurs voisins,
 * - d'une table de connexions, 
 *   associant à un identifiant de utilisateur un canal.
 * @param FS format des utilisateurs identifiables et activables.
 * @param C canal en écriture du serveur vers un client hôte d'un utilisateur actif.
 */
export interface EtatReseau<
    FS extends FormatIdentifiable<'sommet'> & Activable,
    C extends CanalPersistantEcritureJSON> {
    readonly utilisateurs: TableIdentificationMutable<'sommet', FS>;
    readonly fileInactifs: FileMutableIdentifiantsPrioritaires<'sommet'>;
    readonly adjacence: TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>;
    readonly connexions: TableIdentificationMutable<'sommet', C>;
}


/**
 * Format d'un réseau composé
 * - d'une table de utilisateurs, identifiables et activables,
 * - d'un file de utilisateurs inactifs, munis d'une priorité,
 * - d'une table d'adjacence, associant à un identifiant de utilisateur
 *   un tableau d'identifiants de utilisateurs voisins.
 * @param FS format des utilisateurs identifiables et activables
 */
export interface FormatReseau<
    FS extends FormatIdentifiable<'sommet'> & Activable> {
    readonly utilisateurs: FormatTableIdentification<'sommet', FS>;
    readonly fileInactifs: FormatFileIdentifiantsPrioritaires<'sommet'>;
    readonly adjacence: FormatTableIdentification<'sommet', ReadonlyArray<string>>;
}

/**
 * Etiquettes utilisées pour la représentation des réseaux.
 * TODO à compléter à l'usage.
 */
export type EtiquetteReseau = 'utilisateurs' | 'inactifs' | 'adjacence';

/**
 * Interface pour un réseau, paramétrée par le type des utilisateurs.
 * Le réseau contient :
 * - une table d'identification pour les utilisateurs,identifiables et activables,
 * - une table d'adjacence pour tous les utilisateurs,
 * - une table de connexions pour les utilisateurs actifs distants,
 * - une file de utilisateurs inactifs, munis d'une priorité.
 * Le calcul de la priorité se fait dynamiquement 
 * suivant la configuration du réseau. 
 * Cette classe abstraite doit être étendue par 
 * - l'initialisation de la file,
 * - le retrait de la file,
 * - l'ajout à la file. 
 * @param FS type décrivant les utilisateurs en JSON.
 * @param C type décrivant les connexions (serveur vers client)
 */
export interface ReseauMutable<
    FS extends FormatIdentifiable<'sommet'> & Activable,
    C extends CanalPersistantEcritureJSON> extends TypeEnveloppe<EtatReseau<FS, C>,
    FormatReseau<FS>, EtiquetteReseau> {
    /**
     * Initie la file des inactifs avec leur priorité. 
     * Méthode appelée lors de la construction, 
     * à implémenter dans chaque réseau concret.
     */
    initierFileDesInactifs(): void;
    /**
     * Détermine si le  réseau possède l'utilisateur identifié par l'argument.
     * @param ID_util identité de l'utilisateur.
     * @returns true si le réseau possède ce utilisateur, false sinon.
     */
    possedeutilisateur(ID_util: Identifiant<'sommet'>): boolean;

    /**
     * Détermine si les deux utilisateurs identifiés par les arguments sont voisins.
     * Précondition : les utilisateurs appartiennent au réseau.
     * @param ID_util1 identité de l'utilisateur.
     * @param ID_util2 identité de l'utilisateur.
     */
    sontVoisins(ID_util1: Identifiant<'sommet'>,
        ID_util2: Identifiant<'sommet'>): boolean;

    /**
     * utilisateur actif identifié par l'argument.
     * Précondition : l'utilisateur est présent.
     * @param ID_util identité de l'utilisateur.
     * @returns la description de l'utilisateur.
     */
    utilisateur(ID_util: Identifiant<'sommet'>): FS;

    /**
     * Connexion associée au utilisateur identifié par l'argument.
     * Précondition : l'utilisateur est actif.
     * @param ID_util 
     */
    connexion(ID_util: Identifiant<'sommet'>): C;

    /**
     * Détermine si le réseau possède un utilisateur actif.
     * @returns true si le réseau possède un utilisateur actif, false sinon.
     */
    aUnutilisateurActif(): boolean;

    /**
     * Détermine si le réseau possède un utilisateur inactif.
     * @returns true si le réseau possède un utilisateur inactif, false sinon.
     */
    aUnutilisateurInactif(): boolean;

    /**
     * Active un utilisateur inactif.
     * C'est l'utilisateur le plus prioritaire qui est activé.
     * Précondition : le réseau possède un utilisateur inactif.
     * @returns utilisateur activé.
     */
    activerutilisateur(connexion: C): Identifiant<'sommet'>;

    /**
     * Retire l'utilisateur de la file. Méthode abstraite à implémenter 
     * dans chaque classe concrète suivant les règles de priorité.
     * Attention : 
     * le retrait de la file se fait alors que l'utilisateur est encore
     * considéré comme inactif. Tout calcul de priorités dépendant 
     * de la table d'adjacence et de la description des utilisateurs 
     * donne donc la priorité avant l'activation de l'utilisateur. 
     * @returns identifiant de l'utilisateur à retirer de la file
     */
    retirerutilisateurDeFile(): Identifiant<'sommet'>;

    /**
     * Inactive l'utilisateur identifié par l'argument.
     * Précondition : le réseau possède ce utilisateur actif. 
     * @param ID_util identité de l'utilisateur à inactiver.
     */
    inactiverutilisateur(ID_util: Identifiant<'sommet'>): void;

    /**
     * Ajoute l'utilisateur à la file. Méthode abstraite à implémenter 
     * dans chaque classe concrète suivant les règles de priorité.
     * Attention : 
     * l'ajout de la file se fait alors que l'utilisateur est encore
     * considéré comme actif. Tout calcul de priorités dépendant 
     * de la table d'adjacence et de la description des utilisateurs 
     * donne donc la priorité avant l'inactivation de l'utilisateur.  
     * 
     * @param ID_util identifiant de l'utilisateur à ajouter à la file
     */
    ajouterutilisateurAFile(ID_util: Identifiant<'sommet'>): void;

    /**
     * Nombre total de utilisateurs inactifs dans le réseau.
     */
    nombreInactifs(): number;

    /**
     * Nombre total de utilisateurs inactifs dans le réseau.
     */
    nombreActifs(): number;

    /**
     * Noeud de cente l'utilisateur identifié par l'argument.
     * @param identifant de l'utilisateur
     * @returns noeud de centre l'utilisateur identifié
     */
    noeud(ID_util: Identifiant<'sommet'>): Noeud<FS>;
    /**
     * Diffuse la configuration formée de la représentation JSON 
     * du noeud. 
     * @param ID_util utilisateur au centre du noeud 
     */
    diffuserConfigurationAuxVoisins(ID_util: Identifiant<'sommet'>): void;

    /**
     * Itère sur tous les utilisateurs actifs en leur appliquant une fonction.
     * @param f procédure à appliquer a chaque association (identifant, utilisateur actif).
     */
    itererutilisateurs(f: (ID_util: Identifiant<'sommet'>, s: FS) => void): void;

    /**
     * Voisins de l'utilisateur identifié par l'argument.
     */
    voisins(ID_util: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'>;

    /**
     * Voisins actifs de l'utilisateur identifié par l'argument.
     */
    voisinsActifs(ID_util: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'>;

    /**
     * Voisins inactifs de l'utilisateur identifié par l'argument.
     */
    voisinsInactifs(ID_util: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'>;

}

export abstract class ReseauMutableParEnveloppe<
    FS extends FormatIdentifiable<'sommet'> & Activable,
    C extends CanalPersistantEcritureJSON>
    extends Enveloppe<EtatReseau<FS, C>,
    FormatReseau<FS>, EtiquetteReseau>
    implements ReseauMutable<FS, C>
{

    constructor(
        utilisateurs: TableIdentificationMutable<'sommet', FS>,
        adjacence:
            TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>,
        private modificationActivite: (s: FS) => FS
    ) {
        super({
            utilisateurs: utilisateurs,
            fileInactifs: creerFileMutableVideIdentifiantsPrioritaires('sommet'),
            adjacence: adjacence,
            connexions: creerTableIdentificationMutableVide<'sommet', C>('sommet')
        });
        this.initierFileDesInactifs();
    }
    /**
     * Initie la file des inactifs. Méthode appelée lors de la construction, à implémenter dans chaque réseau concret.
     */
    abstract initierFileDesInactifs(): void;
    net(e: EtiquetteReseau): string {
        switch (e) {
            case "utilisateurs":
                return this.etat().utilisateurs.representation();
            case "adjacence":
                return this.etat().adjacence.representation();
            case "inactifs":
                return this.etat().fileInactifs.representation();
        }
        return jamais(e);
    }

    representation(): string {
        return `utilisateurs : ${this.net("utilisateurs")} - Adjacence : ${this.net("adjacence")}`;
    }
    toJSON(): FormatReseau<FS> {
        return {
            utilisateurs: this.etat().utilisateurs.toJSON(),
            fileInactifs: this.etat().fileInactifs.toJSON(),
            adjacence: this.etat()
                .adjacence.application((id, x) => x.toJSON().ensemble).toJSON()
        };
    }

    possedeutilisateur(ID_util: Identifiant<'sommet'>): boolean {
        return this.etat().utilisateurs.contient(ID_util);
    }

    sontVoisins(ID_util1: Identifiant<'sommet'>, ID_util2: Identifiant<'sommet'>): boolean {
        return this.etat().adjacence.valeur(ID_util1).contient(ID_util2);
    }

    utilisateur(ID_util: Identifiant<'sommet'>): FS {
        return this.etat().utilisateurs.valeur(ID_util);
    }

    connexion(ID_util: Identifiant<'sommet'>): C {
        return this.etat().connexions.valeur(ID_util);
    }

    aUnutilisateurActif(): boolean {
        return this.etat().utilisateurs.selectionAssociationSuivantCritere((id, s) => s.actif).estPresent();
    }

    aUnutilisateurInactif(): boolean {
        return this.etat().utilisateurs.selectionAssociationSuivantCritere((id, s) => !(s.actif)).estPresent();
    }

    activerutilisateur(connexion: C): Identifiant<'sommet'> {
        //Sélectionne l'utilisateur le plus prioritaire et met à jour la file.
        const ID_util = this.retirerutilisateurDeFile();
        // Active l'utilisateur.
        const utilisateur = this.etat().utilisateurs.valeur(ID_util);
        this.etat().utilisateurs.modifier(ID_util, this.modificationActivite(utilisateur));
        // Enregistre la connexion.
        this.etat().connexions.ajouter(ID_util, connexion);
        return ID_util;
    }

    abstract retirerutilisateurDeFile(): Identifiant<'sommet'>;

    inactiverutilisateur(ID_util: Identifiant<'sommet'>): void {
        // Ajoute l'utilisateur à la file des inactifs et met à jour la file.
        this.ajouterutilisateurAFile(ID_util);
        // Inactive l'utilisateur.
        const utilisateur = this.etat().utilisateurs.valeur(ID_util);
        this.etat().utilisateurs.modifier(ID_util, this.modificationActivite(utilisateur));
        // Retire la connexion associée au utilisateur.
        this.etat().connexions.retirer(ID_util);
    }

    abstract ajouterutilisateurAFile(ID_util: Identifiant<'sommet'>): void;

    nombreInactifs(): number {
        return this.etat().fileInactifs.taille();
    }

    nombreActifs(): number {
        return this.etat().utilisateurs.taille() - this.nombreInactifs();
    }

    /**
     * Noeud de cente l'utilisateur identifié par l'argument.
     * @param identifant de l'utilisateur
     * @returns noeud de centre l'utilisateur identifié
     */
    noeud(ID_util: Identifiant<'sommet'>): Noeud<FS> {
        const tableVoisins: TableIdentificationMutable<'sommet', FS> = creerTableIdentificationMutableVide('sommet');
        this.voisins(ID_util).iterer((id) => tableVoisins.ajouter(id, this.etat().utilisateurs.valeur(id)));
        return noeud({
            centre: this.etat().utilisateurs.valeur(ID_util),
            voisins: tableVoisins.toJSON()
        }
        );
    }

    diffuserConfigurationAuxVoisins(ID_util: Identifiant<'sommet'>): void {
        this.voisins(ID_util).iterer((id) => {
            if (this.utilisateur(id).actif) {
                const canalVoisin = this.connexion(id);
                canalVoisin.envoyerJSON('config', this.noeud(id));
            }
        });
    }

    itererutilisateurs(f: (ID_util: Identifiant<'sommet'>, s: FS) => void): void {
        this.etat().utilisateurs.iterer(f);
    }

    voisins(ID_util: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'> {
        return this.etat().adjacence.valeur(ID_util);
    }

    /**
     * Voisins actifs de l'utilisateur identifié par l'argument.
     */
    voisinsActifs(ID_util: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'> {
        return this.etat().adjacence.valeur(ID_util).crible((id) => this.etat().utilisateurs.valeur(id).actif);
    }

    /**
     * Voisins inactifs de l'utilisateur identifié par l'argument.
     */
    voisinsInactifs(ID_util: Identifiant<'sommet'>): EnsembleIdentifiants<'sommet'> {
        return this.etat().adjacence.valeur(ID_util).crible((id) => !(this.etat().utilisateurs.valeur(id).actif));
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