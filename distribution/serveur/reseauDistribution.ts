import { GenerateurReseau, ReseauMutable, ReseauMutableParEnveloppe } from "../../bibliotheque/applications/reseau";
import { CanalPersistantEcritureJSON } from "../../bibliotheque/communication/connexion";
import { binaire, FormatBinaire, mot, Mot, motAleatoire, tailleEnBinaire } from "../../bibliotheque/types/binaire";
import { creerEnsembleMutableIdentifiantsVide, ensembleIdentifiants, EnsembleIdentifiants, EnsembleMutableIdentifiants } from "../../bibliotheque/types/ensembleIdentifiants";
import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants, Identifiant, sontIdentifiantsEgaux } from "../../bibliotheque/types/identifiant";
import { quotient } from "../../bibliotheque/types/nombres";
import { creerTableauMutableVide, TableauMutable } from "../../bibliotheque/types/tableau";
import { creerTableIdentificationMutableVide, TableIdentification, TableIdentificationMutable } from "../../bibliotheque/types/tableIdentification";
import { modificationActivite } from "../../bibliotheque/types/typesAtomiques";
import {
    COEUR_TRAME,
    estDomaine,
    estUtilisateur,
    FormatConsigne,
    FormatDomaineDistribution,
    FormatSommetDistribution,
    FormatUtilisateurDistribution,
    INUTILES_TRAME
} from "../commun/echangesDistribution";

/**
 * Interface spécifique pour un réseau du jeu de distribution. 
 * Les méthodes facilitent la manipulation de la file.
 */
interface GrapheReseauDistribution {
    /**
     * Domaine de l'utilisateur.
     * @param ID_util identifiant de l'utilisateur.
     */
    domaine(ID_util: Identifiant<"sommet">): Identifiant<'sommet'>;
    /**
     * Utilisateurs inactifs voisins d'un utilisateur donné.
     * @param ID_util identifiant de l'utilisateur.
     * @returns ensemble des utilisateurs inactifs appartenant au même domaine que l'utilisateur identifié par ID_util et distincts de celui-ci. 
     */
    utilisateursInactifsVoisins(ID_util: Identifiant<"sommet">): EnsembleIdentifiants<"sommet">;
    /**
     * Nombre des utilisateurs actifs à 'intérieur du domaine d'un
     *  utilisateur donné.
     * @param ID_util identifiant de l'utilisateur.
     * @returns taille de l'ensemble des utilisateurs actifs appartenant au domaine de l'utilisateur ID_util. 
     */
    nombreUtilisateursActifsDeSonDomaine(ID_util: Identifiant<"sommet">): number;
    /**
     * Consigne dont l'utilisateur donné est le destinataire.
     * @param ID_dest identifiant du destinataire.
     * @returns consigne ayant pour destinataire l'utilisateur identifié par ID_dest.
     */
    consigneParDestination(ID_dest: Identifiant<'sommet'>): FormatConsigne;
}

/**
 * Réseau mutable  de distribution. La priorité pour un utilisateur 
 * inactif et déconnecté est donnée par le nombre d'utilisateurs
 * actifs dans son domaine. 
 */
export class ReseauMutableDistribution<
    C extends CanalPersistantEcritureJSON>
    extends ReseauMutableParEnveloppe<FormatSommetDistribution, C>
    implements ReseauMutable<FormatSommetDistribution, C>, GrapheReseauDistribution {

    constructor(
        sommets: TableIdentificationMutable<'sommet', FormatSommetDistribution>,
        adjacence:
            TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>,
        private consignesParDestination
            : TableIdentificationMutable<'sommet', FormatConsigne>
    ) {
        super(sommets, adjacence);
    }
    /**
     * Domaine de l'utilisateur.
     * @param ID_util identifiant de l'utilisateur.
     */
    domaine(ID_util: Identifiant<"sommet">): Identifiant<'sommet'> {
        return this.etat().adjacence.valeur(ID_util).selectionIdentifiant().valeur(); // 1 seul sommet adjacent : le domaine.
    }
    utilisateursInactifsVoisins(
        ID_util: Identifiant<"sommet">): EnsembleIdentifiants<"sommet"> {
        const ID_dom = this.domaine(ID_util);
        return this.cribleVoisins(ID_dom, (ID, s) => estUtilisateur(s) && !s.actif && !sontIdentifiantsEgaux(ID, ID_util));
    }
    nombreUtilisateursActifsDeSonDomaine(ID_util: Identifiant<"sommet">): number {
        const ID_dom = this.domaine(ID_util);
        return this.tailleCribleVoisins(ID_dom, (ID, s) => estUtilisateur(s) && s.actif);
    }

    /**
     * Initie la file des inactifs déconnectés. Cette file contient
     * initialement tous les utilisateurs. 
     * La priorité est égale au nombre d'utilisateurs actifs du domaine:
     * zéro initialement. 
     */
    initierFileDesInactifsDeconnectes(): void {
        this.itererSommets((id, s) => {
            if (estUtilisateur(s)) {
                this.etat().fileInactifsDeconnectes.ajouter(id, 0);
            }
        });
    }

    retirerSommetDeFile(): Identifiant<'sommet'> {
        const ID_util = this.etat().fileInactifsDeconnectes.retirer();
        const p = this.nombreUtilisateursActifsDeSonDomaine(ID_util);
        this.utilisateursInactifsVoisins(ID_util).iterer((ID) => {
            this.etat().fileInactifsDeconnectes.modifier(ID, p, p + 1);
        });
        // Active le domaine s'il est inactif.
        if (this.nombreUtilisateursActifsDeSonDomaine(ID_util) === 0) {
            const ID_dom = this.domaine(ID_util);
            const dom = this.sommet(ID_dom);
            this.etat().sommets.modifier(
                ID_dom, modificationActivite(dom));
        }
        return ID_util;
    }
    ajouterSommetAFile(ID_util: Identifiant<'sommet'>): void {
        const p = this.nombreUtilisateursActifsDeSonDomaine(ID_util);
        this.etat().fileInactifsDeconnectes.ajouter(ID_util, p - 1);
        this.utilisateursInactifsVoisins(ID_util).iterer((ID) => {
            this.etat().fileInactifsDeconnectes.modifier(ID, p, p - 1);
        });
        // Désactive le domaine s'il devient inactif.
        if (p === 1) {
            const ID_dom = this.domaine(ID_util);
            const dom = this.sommet(ID_dom);
            this.etat().sommets.modifier(
                ID_dom, modificationActivite(dom));
        }
    }

    /**
     * Consigne dont l'utilisateur donné est le destinataire.
     * @param ID_dest identifiant du destinataire.
     * @returns consigne ayant pour destinataire l'utilisateur identifié par ID_dest.
     */
    consigneParDestination(ID_dest: Identifiant<'sommet'>): FormatConsigne {
        return this.consignesParDestination.valeur(ID_dest);
    }

    tailleDeSonDomaine(ID_util: Identifiant<"sommet">): number {
        const ID_dom = this.domaine(ID_util);
        return this.tailleCribleVoisins(ID_dom, (ID, s) => estUtilisateur(s));
    }
    domainesVoisins(ID_dom: Identifiant<"sommet">): TableIdentificationMutable<"sommet", FormatSommetDistribution> {
        const id_voisins = this.cribleVoisins(ID_dom, (ID, s) => estDomaine(s))
        let voisins = creerTableIdentificationMutableVide<"sommet",FormatSommetDistribution>("sommet");
        id_voisins.iterer(ID_sorte => {
            voisins.ajouter(ID_sorte, this.sommet(ID_sorte))
        })
        return voisins;
    }
}

export function creerReseauMutableDistribution<
    C extends CanalPersistantEcritureJSON>
    (
        sommets: TableIdentificationMutable<'sommet', FormatSommetDistribution>,
        adjacence:
            TableIdentification<'sommet', EnsembleIdentifiants<'sommet'>>,
        consignesParDestination
            : TableIdentificationMutable<'sommet', FormatConsigne>
    ): ReseauMutableDistribution<C> {
    return new ReseauMutableDistribution(sommets, adjacence, consignesParDestination);
}

class GenerateurReseauDistribution<C extends CanalPersistantEcritureJSON> implements GenerateurReseau<FormatSommetDistribution, C, ReseauMutableDistribution<C>>{

    private generateurIdentifiantsDomaine
        : GenerateurIdentifiants<'sommet'>;
    private generateurIdentifiantsUtilisateur
        : GenerateurIdentifiants<'sommet'>;
    private generateurIdentifiantsConsigne
        : GenerateurIdentifiants<'consigne'>;
    private sommets: TableIdentificationMutable<'sommet', FormatSommetDistribution>;
    private adjacence:
        TableIdentificationMutable<'sommet', EnsembleMutableIdentifiants<'sommet'>>;
    private consignesParDestination
        : TableIdentificationMutable<'sommet', FormatConsigne>;
    private tailleTrame: number;
    private utilisateurs: TableauMutable<Identifiant<'sommet'>>;
    private domaines: TableauMutable<Identifiant<'sommet'>>;
    private nomsUtil: TableIdentificationMutable<"sommet", FormatBinaire>;

    constructor(
        code: string,
        private nombreDomaines: number,
        private effectifParDomaine: ReadonlyArray<number>
    ) {
        this.generateurIdentifiantsDomaine
            = creerGenerateurIdentifiantParCompteur(
                code + "-" + "dom-");
        this.generateurIdentifiantsUtilisateur
            = creerGenerateurIdentifiantParCompteur(
                code + "-" + "util-");
        this.generateurIdentifiantsConsigne
            = creerGenerateurIdentifiantParCompteur(
                code + "-" + "csg-");

        this.sommets = creerTableIdentificationMutableVide('sommet');
        this.adjacence
            = creerTableIdentificationMutableVide('sommet');
        this.consignesParDestination = creerTableIdentificationMutableVide('sommet');
        this.domaines
            = creerTableauMutableVide<Identifiant<'sommet'>>();
        this.tailleTrame
            = tailleTrame(nombreDomaines, effectifParDomaine);
        this.utilisateurs
            = creerTableauMutableVide<Identifiant<'sommet'>>();
        this.nomsUtil 
            = creerTableIdentificationMutableVide<'sommet', FormatBinaire>('sommet');

    }

    engendrerDomaines(): void {
        // Les domaines en anneau
        // 1. tables des sommets
        for (let i = 0; i < this.nombreDomaines; i++) {
            // domaine j
            const s: FormatDomaineDistribution = {
                ID: this.generateurIdentifiantsDomaine.produire('sommet'),
                domaine: binaire(i).tableauBinaire(),
                actif: false
            }
            this.sommets.ajouter(s.ID, s);
            this.domaines.ajouterEnFin(s.ID);
        }
        // 2. adjacence
        for (let i = 0; i < this.nombreDomaines; i++) {
            const voisins
                = creerEnsembleMutableIdentifiantsVide('sommet');
            voisins.ajouter(this.domaines.valeur((i + this.nombreDomaines - 1) % this.nombreDomaines));
            voisins.ajouter(this.domaines.valeur((i + 1) % this.nombreDomaines));
            this.adjacence.ajouter(this.domaines.valeur(i), voisins);
        }
    }

    engendrerUtilisateurs() {
        for (let i = 0; i < this.nombreDomaines; i++) {
            const ID_dom = this.domaines.valeur(i);
            const voisinsDom = this.adjacence.valeur(ID_dom);
            for (let j = 0; j < this.effectifParDomaine[i]; j++) {
                const ID_util
                    = this.generateurIdentifiantsUtilisateur.produire('sommet');
                this.utilisateurs.ajouterEnFin(ID_util);
                voisinsDom.ajouter(ID_util);
                const voisinsUtil 
                    = creerEnsembleMutableIdentifiantsVide('sommet');
                voisinsUtil.ajouter(ID_dom);
                this.adjacence.ajouter(ID_util, voisinsUtil);
                this.nomsUtil.ajouter(ID_util, binaire(j).tableauBinaire());
            }
            this.adjacence.ajouter(ID_dom, voisinsDom);
        }
    }

    engendrerConsignes() {
        const nombreUtil = this.effectifParDomaine.reduce((r, e) => r + e, 0);
        const moitieNombreUtil = quotient(nombreUtil, 2);
        for (let i = 0; i < nombreUtil; i++) {
            const opp = (i + moitieNombreUtil) % nombreUtil;
            const ID_util = this.utilisateurs.valeur(i);
            const ID_dest = this.utilisateurs.valeur(opp);
            const ID_domDest = this.adjacence.valeur(ID_dest).selectionIdentifiant().valeur(); // un singleton
            const adresseDest = (this.sommets.valeur(ID_domDest) as FormatDomaineDistribution).domaine;
            const c: FormatConsigne = {
                ID: this.generateurIdentifiantsConsigne.produire('consigne'),
                adresse: adresseDest,
                destinataire: this.nomsUtil.valeur(ID_dest),
                mot: generationAleatoireMotConsigne().tableauBinaire(),
                tailleTrame: this.tailleTrame
            }
            const s: FormatUtilisateurDistribution = {
                ID: ID_util,
                actif: false,
                utilisateur: this.nomsUtil.valeur(ID_util),
                consigne: c
            }
            this.sommets.ajouter(ID_util, s);
            this.consignesParDestination.ajouter(ID_dest, c);
        }
    }

    engendrer(): ReseauMutableDistribution<C> {
        this.engendrerDomaines();
        this.engendrerUtilisateurs();
        this.engendrerConsignes();

        return creerReseauMutableDistribution(this.sommets, this.adjacence, this.consignesParDestination);
    }

    /*TODO test(reseau : ReseauMutableDistribution<C>, ID_util : Identifiant<'sommet'>) : Noeud<FormatSommetDistribution> {
        let ID_dom = reseau.domaine(ID_util);
        return reseau.noeud(ID_dom);
    }*/

    
}

export function creerGenerateurReseauDistribution<C extends CanalPersistantEcritureJSON>(
    code: string,
    nombreDomaines: number,
    effectifParDomaine: ReadonlyArray<number>)
    : GenerateurReseau<
        FormatSommetDistribution, C, ReseauMutableDistribution<C>> {
    return new GenerateurReseauDistribution<C>(code, nombreDomaines, effectifParDomaine);
}

/**
 * Générateur de mot binaire aléatoire, de taille l'argument transmis,
 * complété à gauche et à droite par un zéro.
 * @returns mot binaire de taille 't + 2', commençant et finissant par 0, d'intérieur aléatoire.
 */
export function generationAleatoireMotConsigne(): Mot {
    let m = motAleatoire(COEUR_TRAME - 2).tableauBinaire();
    let res = [0];
    for (let j of m) {
        res.push(j);
    }
    res.push(0);
    return mot(res);
}

/**
 * Fonction calculant la taille de la trame. 
 * Une trame contient :
 * - des bits inutiles de remplissage, dont le nombre est fixé
 *  par une constante,
 * - le coeur de la trame (message ou payload), dont la taille
 * est fixée par une constante,
 * - le nom binaire du domaine de destination,
 * - le nom binaire du destinataire.
 * @param nombreDomaines 
 * @param effectifParDomaine 
 */
function tailleTrame(nombreDomaines: number, effectifParDomaine: ReadonlyArray<number>): number {
    let total = INUTILES_TRAME + COEUR_TRAME;
    total = total + tailleEnBinaire(nombreDomaines);
    let m = 0;
    for (let e of effectifParDomaine) {
        let t = tailleEnBinaire(e);
        if (t > m) {
            m = t;
        }
    }
    total = total + m;
    return total;
}