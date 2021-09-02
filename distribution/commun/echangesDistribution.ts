/*
 * Sommets et noeuds du jeu de distribution.
 * Un sommet est soit un utilisateur, soit un domaine.
 * Les domaines forment un réseau en anneau. 
 * A chaque domaine sont associés des utilisateurs 
 * (les clients, à connecter).
 */

import { FormatNoeud, Noeud } from "../../bibliotheque/applications/noeud";
import { FormatBinaire } from "../../bibliotheque/types/binaire";
import { FormatMessage } from "../../bibliotheque/communication/communicationGenerique";
import { FormatTableIdentification } from "../../bibliotheque/types/tableIdentification";
import { FormatIdentifiable, Identifiant } from "../../bibliotheque/types/identifiant";
import { Activable, Deux } from "../../bibliotheque/types/typesAtomiques";
import { dateMaintenant } from "../../bibliotheque/types/date";

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
    tailleTrame: number): FormatConsigne {
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
    readonly consigne: FormatConsigne;
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
    utilisateur: FormatBinaire,
    consigne: FormatConsigne) {
    return {
        ID: ID_utilisateur,
        actif: actif,
        utilisateur: utilisateur,
        consigne: consigne
    };
}

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
    actif: boolean,
    domaine: FormatBinaire): FormatDomaineDistribution {
    return {
        ID: ID_dom,
        actif: actif,
        domaine: domaine
    };
}

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
export function estUtilisateur(s: FormatSommetDistribution): s is FormatUtilisateurDistribution {
    return ("utilisateur" in s);
}

/**
 * Teste si le sommet est un domaine.
 * @param s sommet au format.
 * @returns un prédicat de typage.
 */
export function estDomaine(s: FormatSommetDistribution): s is FormatDomaineDistribution {
    return !estUtilisateur(s);
}

/** 
 * Noeud pour un sommet de distribution.
*/
export type NoeudSommetDistribution = Noeud<FormatSommetDistribution>;
/**
 * Format d'un noeud pour un sommet de distribution.
 */
export type FormatNoeudSommetDistribution = FormatNoeud<FormatSommetDistribution>;



/**
 * Type des messages pour la distribution.
 * - Transit(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
 * - Verrouillable(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
 * - Actif(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
 * - Inactif(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu
 * - Transmis(idMsg, idUtil, idDomOrigine, idDomDest, contenu)
 * - Envoi(idMsgClient, idUtil, idDomOrigine, idDomDest, contenu)
 * - AREnvoi(idMsgServeur, idUtil, idDomOrigine, idDomDest, contenu)
 * - Essai(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
 * - Gain(idMsg, idGagnant, idDomOrigine, idDomGagnant, interprétationCorrecte)
 * - Perte(idMsg, idPerdant, idDomOrigine, idDomPerdant, interprétationIncorrecte)
 */
export enum TypeMessageDistribution {
    TRANSIT = "transit",
    VERROUILLABLE = "verrouillable",
    ACTIF = "actif",
    INACTIF = "inactif",
    TRANSMIS = "transmis",
    ENVOI = "envoi",
    AR_ENVOI = "arEnvoi",
    ESSAI = "essai",
    GAIN = "gain",
    PERTE = "perte"
}

/**
 * Corps d'un message pour la distribution.
 * - utilisateur émetteur
 * - domaine d'origine
 * - domaine de destination
 * - contenu (binaire)
 * Remarque : l'interprétation des champs peut varier. 
 * Voir le protocole pour ces variations.
 */
export interface FormatCorpsMessageDistribution {
    readonly ID_utilisateur_emetteur: Identifiant<'sommet'>;
    readonly ID_origine: Identifiant<'sommet'>; // domaine
    readonly ID_destination: Identifiant<'sommet'>; // domaine
    readonly contenu: ReadonlyArray<Deux>;
}

/** 
 * Message au format JSON du jeu de distribution.
 * - ID : identifiant
 * - type : un des types des messages de distribution,
 * - corps : le message,
 * - date : la date lors de l'émission.
*/
export type FormatMessageDistribution = FormatMessage<TypeMessageDistribution, FormatCorpsMessageDistribution>;

/**
 * Fabrique d'un message en transit.
 * TODO 
 * @param e 
 * @param ID_util_dest 
 * @param ID_msg 
 * @returns 
 */
export function messageTransit(
    e: FormatMessageDistribution,
    ID_util_dest: Identifiant<'sommet'>,
    ID_msg: Identifiant<'message'>): FormatMessageDistribution {
    return {
        ID: ID_msg,
        type: TypeMessageDistribution.TRANSIT,
        corps: {
            ID_utilisateur_emetteur: ID_util_dest,
            ID_origine: e.corps.ID_origine,
            ID_destination: e.corps.ID_destination,
            contenu: e.corps.contenu
        },
        date: dateMaintenant().toJSON()
    };
}

/**
 * Fabrique d'un message verrouillable (transitoire).
 * TODO
 * @param msg 
 * @returns 
 */
export function messageVerrou(
    msg: FormatMessageDistribution): FormatMessageDistribution {
    return {
        ID: msg.ID,
        type: TypeMessageDistribution.VERROUILLABLE,
        corps: msg.corps,
        date: dateMaintenant().toJSON()
    };
}

/**
 * Fabrique d'un message actif.
 * TODO
 * @param msg 
 * @returns 
 */
export function messageActif(
    msg: FormatMessageDistribution): FormatMessageDistribution {
    return {
        ID: msg.ID,
        type: TypeMessageDistribution.ACTIF,
        corps: msg.corps,
        date: dateMaintenant().toJSON()
    };
}

/**
 * Fabrique d'un message inactif.
 * @param msg 
 * @returns 
 */
export function messageInactif(
    msg: FormatMessageDistribution): FormatMessageDistribution {
    return {
        ID: msg.ID,
        type: TypeMessageDistribution.INACTIF,
        corps: msg.corps,
        date: dateMaintenant().toJSON()
    };
}

/**
 * Format d'une configuration de distribution.
 * - utilisateur : identité de l'utilisateur 
 * - noeud associé au domaine de l'utilisateur : domaine, domaines voisins, utilisateurs du domaine
 * - nombre d'utilisateurs actifs dans le domaine,
 * - nombre total d'utilisateurs dans le domaine.
 */
export interface FormatConfigurationDistribution {
    readonly utilisateur: Identifiant<'sommet'>;
    readonly noeudDomaine: FormatNoeudSommetDistribution;
    readonly nombreUtilisateursActifsDuDomaine: number;
    readonly tailleDomaine: number;
}
/**
 * Fabrique d'une configuration.
 * @param utilisateur 
 * @param noeudDomaine 
 * @param nombreUtilisateursActifsDuDomaine 
 * @param tailleDomain 
 * @returns 
 */
export function configurationDistribution(
    utilisateur: Identifiant<'sommet'>,
    noeudDomaine: FormatNoeudSommetDistribution,
    nombreUtilisateursActifsDuDomaine: number,
    tailleDomaine: number,
): FormatConfigurationDistribution {
    return {
        utilisateur: utilisateur,
        noeudDomaine: noeudDomaine,
        nombreUtilisateursActifsDuDomaine: nombreUtilisateursActifsDuDomaine,
        tailleDomaine: tailleDomaine,
    }
}

/**
 * Type des canaux fournis par le serveur du jeu de distribution.
 */
 export enum CanalServeur {
    ENVOI = "envoyer",
    VERROU = "verrouiller"
}

/**
 * Type des canaux fournis par le client du jeu de distribution.
 */
 export enum CanalClient {
    RECEPTION = "recevoir",
    INACTIVATION = "inactiver"
}