/*
 * Sommets et noeuds du jeu de distribution.
 * Un sommet est soit un utilisateur, soit un domaine.
 * Les domaines forment un réseau en anneau. 
 * A chaque domaine sont associés des utilisateurs 
 * (les clients, à connecter).
 */

import {
    Activable, Deux
} from "../../bibliotheque/types/typesAtomiques";

import {
    Identifiant, FormatIdentifiable} from "../../bibliotheque/types/identifiant";

import { FormatNoeud, Noeud } from "../../bibliotheque/applications/noeud";
import { FormatBinaire } from "../../bibliotheque/types/binaire";
import { FormatMessage } from "../../bibliotheque/applications/message";

/**
 * Nombre de bits inutiles dans la trame.
 */
export const INUTILES_TRAME: number = 1;
/**
 * Nombre de bits du coeur de la trame (du message inclus, 
 * ou payload). Doit être supérieur ou égal à deux 
 * (car les messages sont complétés par des zéros à gauche 
 * et à droite pour rendre flou la limite du message dans la trame).
 */
export const COEUR_TRAME: number = 7;

/**
 * Description en JSON d'une consigne. Une consigne contient
 * le message à envoyer et le destinataire,
 * un utilisateur dans un domaine, son adresse. 
 * Elle utilise le format binaire.
 * Structure :
 * - ID : identifiant de la consigne,
 * - adresse : nom du domaine destinataire,
 * - utilisateur : nom de l'utilisateur destinataire,
 * - mot : message à envoyer,
 * - tailleTrame : taille de la trame utilisée pour communiquer.
 */
export interface FormatConsigne extends FormatIdentifiable<'consigne'> {
    readonly adresse: FormatBinaire;
    readonly destinataire: FormatBinaire;
    readonly mot: FormatBinaire;
    readonly tailleTrame: number;
  }

/**
 * Fabrique d'une consigne, utilisant un format binaire.
 * @param ID_consigne identifiant de la consigne.
 * @param adresse domaine du destinataire.
 * @param destinataire nom du destinataire.
 * @param mot message à envoyer.
 * @param tailleTrame taille de la trame.
 */
export function consigneDistribution(
    ID_consigne: Identifiant<'consigne'>, 
    adresse: FormatBinaire,
    destinataire: FormatBinaire,
    mot: FormatBinaire,
    tailleTrame: number) : FormatConsigne {
    return {
        ID: ID_consigne,
        adresse: adresse,
        destinataire: destinataire,
        mot: mot,
        tailleTrame: tailleTrame
    };
}

/**
 * Format JSON pour un utilisateur du réseau de distribution. 
 * Structure :
 * - ID : identifiant.
 * - actif : booléen indiquant l'activité.
 * - utilisateur : nom de l'utilisateur au format binaire.
 * - consigne: consigne que doit appliquer l'utilisateur.
 */
export interface FormatUtilisateurDistribution extends FormatIdentifiable<'sommet'>, Activable {
    readonly utilisateur: FormatBinaire;
    readonly consigne : FormatConsigne;
}

/**
 * Fabrique d'un utilisateur.
 * @param ID_utilisateur identifiant de l'utilisateur.
 * @param actif true si l'utilisateur est actif, false sinon.
 * @param utilisateur nom de l'utilisateur au format binaire.
 * @param consigne que doit appliquer l'utilisateur.
 */
export function utilisateurDistribution(
    ID_utilisateur: Identifiant<'sommet'>, 
    actif: boolean, 
    utilisateur : FormatBinaire,
    consigne : FormatConsigne) {
    return {
        ID: ID_utilisateur,
        actif: actif,
        utilisateur: utilisateur,
        consigne : consigne
    };
}
/** 
 * Noeud pour un utilisateur.
*/
export type NoeudUtilisateurDistribution = Noeud<FormatUtilisateurDistribution>;
/**
 * Format d'un noeud pour un utilisateur.
 */
export type FormatNoeudUtilisateurDistribution = FormatNoeud<FormatUtilisateurDistribution>;

/**
 * Format JSON pour un domaine du réseau de distribution.
 * Structure :
 * - ID : identifiant du domaine.
 * - actif : booléen indiquant l'activité, un domaine étant actif si l'un de ses utilisateurs est connecté.
 * - domaine : nom du domaine au format binaire.
 */
export interface FormatDomaineDistribution extends FormatIdentifiable<'sommet'>, Activable {
    readonly domaine: FormatBinaire;
}

/**
 * Fabrique d'un domaine.
 * @param ID_dom identifiant du domaine.
 * @param actif booléen indiquant si le domaine est actif ou non (s'il a un utilisateur connecté au moins, ou non).
 * @param domaine nom du domaine au format binaire.
 */
export function domaineDistribution(
    ID_dom: Identifiant<'sommet'>, 
    actif : boolean,
    domaine : FormatBinaire): FormatDomaineDistribution {
    return {
        ID: ID_dom,
        actif : actif,
        domaine: domaine
    };
}
/** 
 * Noeud pour un domaine.
*/
export type NoeudDomaineDistribution = Noeud<FormatDomaineDistribution>;
/**
 * Format d'un noeud pour un domaine.
 */
export type FormatNoeudDomaineDistribution = FormatNoeud<FormatUtilisateurDistribution>;

/**
 * Type des sommets pour la distribution.
 * Un sommet est un utilisateur ou un domaine.
 */
export type FormatSommetDistribution = FormatUtilisateurDistribution | FormatDomaineDistribution; 

/**
 * Teste si le sommet est un utilisateur.
 * @param s sommet au format.
 * @returns un prédicat de typage.
 */
export function estUtilisateur(s : FormatSommetDistribution) : s is FormatUtilisateurDistribution {
    return ("utilisateur" in s);
}

export function estDomaine(s : FormatSommetDistribution) : s is FormatDomaineDistribution {
    return !estUtilisateur(s);
}

/**
 * Type des messages pour la distribution.
 * - Canaux du serveur
 *   - initier : INIT
 *   - verrouiller : VERROU
 *   - transmettre : SUIVANT
 *   - verifier : ESSAI
 *   - deverrouiller : LIBE
 * - Canaux du client
 *   - recevoir : TRANSIT
 *   - activer : ACTIF
 *   - gagner : GAGNE
 *   - perdre : PERDU
 *   - detruire : DESTRUCT
 */
export enum TypeMessageDistribution {
    INIT, // ok - S
    AR_INIT,
    VERROU, // ok - S
    SUIVANT, // ok - S
    AR_SUIVANT,
    ESSAI, // ok - S
    LIBE, // ok - S
    TRANSIT, // ok - C
    ACTIF, // ok - C
    GAIN, // ok - C
    PERTE, // ok - C
    DESTRUCT, // ok - C
    ECHEC_VERROU, // ok - C
    INFO
    //ADMIN,
    //NONCONF, // ok
    //SUCCES_INIT,
    //SUCCES_ACTIF,
    //INACTIF, // ok
    //IGNOR, // ok
    //FIN, // ok
    //SUCCES_TRANSIT,
    //ECHEC_TRANSIT,
    //SUCCES_FIN,
    //ECHEC_FIN,
    //ERREUR_CONNEXION, // TODO
    //ERREUR_EMET,
    //ERREUR_DEST,
    //ERREUR_TYPE,
    //INTERDICTION,
    //STATISTIQUES,
    //CONF,
    //CONNEXION
  }
  
  /**
   * Corps d'un message pour la distribution.
   * TODO   
   */
  export interface FormatMessageDistribution {
    readonly ID_utilisateur_emetteur: Identifiant<'sommet'>;
    readonly ID_origine: Identifiant<'sommet'>; // domaine
    readonly ID_destination: Identifiant<'sommet'>; // domaine
    readonly contenu: ReadonlyArray<Deux>;
  }
  
/** 
 * Message au format JSON contenant un envoi d'un client du tchat.
 * - ID : identifiant
 * - type : 'envoi',
 * - corps : l'envoi,
 * - date : la date lors de l'émission.
*/
export type FormatMessageInitialDistribution = FormatMessage<TypeMessageDistribution.INIT, FormatMessageDistribution>;
