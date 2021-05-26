import {
    FormatMessage, MessageParEnveloppe, Message,
    FormatConfigurationInitiale, ConfigurationParEnveloppe, Configuration,
    FormatErreurRedhibitoire, ErreurRedhibitoireParEnveloppe, ErreurRedhibitoire
} from "./types/formats";

import {
    Unite, jamais
} from "./types/typesAtomiques";

import {
    FormatDateFr, dateEnveloppe, dateMaintenant,
} from "./types/date";

import {
    FormatIdentifiable,
    Identifiant
} from "./types/identifiant";
import {
    FormatSommetTchat, sommetTchat,
} from "./types/sommet";
import {TableIdentificationMutable} from "./types/tableIdentification";
import {TableauParEnveloppe} from "./types/tableau";


/**
 * Description JSON d'une configuration pour le prototype.
 * Structure :
 * - configurationInitiale : marqueur des configurations
 * - centre : sommet
 * - voisins : table de sommets voisins contenant l'
 * - date : date en français
 */
export interface FormatConfigurationTchat<FSI extends FormatIdentifiable<"sommet">,C> extends FormatConfigurationInitiale {
    readonly "centre": FormatSommetTchat,
    readonly "date": FormatDateFr,
    readonly "nombreConnexions" : number,
    readonly "id": Identifiant<"sommet">,
    readonly "voisinsActifs": TableIdentificationMutable<'sommet', FSI>;
}

/**
 * Etiquettes utiles pour représenter une configuration.
 */
export type EtiquetteConfigurationTchat = 'centre' | 'date' |'nombreConnexions';

/**
 * Interface pour les configurations initiales du prototype.
 */
export interface ConfigurationTchat <FSI extends FormatIdentifiable<"sommet">,C>
    extends Configuration<FormatConfigurationTchat<FSI,C>, EtiquetteConfigurationTchat> {
}

/**
 * Configuration initiale d'un client du prototype implémentée
 * par une enveloppe.
 */
export class ConfigurationTchatParEnveloppe <FSI extends FormatIdentifiable<"sommet">,C>
    extends ConfigurationParEnveloppe<
        FormatConfigurationTchat<FSI,C>,
        EtiquetteConfigurationTchat>
    implements ConfigurationTchat<FSI,C> {

    /**
     * Représentation nette du centre et des voisins, ainsi que de la date.
     * - centre : nom (ID)
     * - voisins : {
     *     "ID": "nom",
     *     etc. }
     * - date : 12:53:53, le 02/02/2017 par exemple
     * @param e une étiquette, "centre" ou "voisins"
     */
    net(e: EtiquetteConfigurationTchat): string {
        let config = this.val();
        switch (e) {
            case 'centre': return sommetTchat(config.centre).representation();
            case 'date': return dateEnveloppe(config.date).representation();
            case 'nombreConnexions':  return  ""+ config.nombreConnexions;
        }
        return jamais(e);
    }

    /**
     * Représentation de la configuration sous la forme suivante :
     * - "(centre : nom (ID); voisins : { "ID" : "nom", etc. }) crée à heure, le date".
     */
    representation(): string {
        let cc = this.net('centre');
        let dc = this.net('date');
        return "(centre : " + cc + " ; " +  ") créée à " + dc;
    }
}
/**
 * Fabrique d'une configuration initiale d'un client du prototype,
 * à partir de sa description en JSON.
 * @param c description de la configuration en JSON
 */
export function configurationTchat<FSI extends FormatIdentifiable<"sommet">,C>(c: FormatConfigurationTchat<FSI,C>) {
    return new ConfigurationTchatParEnveloppe(c);
}

/**
 * Fabrique d'une configuration initiale d'un client du prototype,
 * à partir d'un noeud et d'une date, au format JSON.
 * @param n description du noeud au format JSON
 * @param date date en français au format JSON
 * @param nombreConnexions nombre de connexions actives dans le reseau
 * @param voisinsActifs
 */
export function configurationDeSommetTchat<FSI extends FormatIdentifiable<"sommet">, C>(
    n: FormatSommetTchat,
    date: FormatDateFr,
    nombreConnexions: number,
    voisinsActifs: TableIdentificationMutable<'sommet', FSI>
): ConfigurationTchatParEnveloppe<FSI,C> {
    return new ConfigurationTchatParEnveloppe({
        "id": n.ID,
        "configurationInitiale": Unite.ZERO,
        "centre": n,
        "date": date,
        "nombreConnexions" : nombreConnexions,
        "voisinsActifs": voisinsActifs
    });
}

/**
 * Description JSON d'une erreur pour le prototype.
 * Structure :
 * - erreurRedhibitoire : marqueur des erreurs
 * - messageErreurs : message d'erreur
 * - date : date en français
 */
export interface FormatErreurTchat extends FormatErreurRedhibitoire {
    readonly "messageErreur": string,
    readonly "date": FormatDateFr
}

/**
 * Etiquettes utiles pour représenter une erreur.
 */
export type EtiquetteErreurTchat = 'messageErreur' | 'date';

/**
 * Interfaces pour les erreurs du prototype.
 */
export interface ErreurTchat
    extends ErreurRedhibitoire<FormatErreurTchat, EtiquetteErreurTchat> {
}

/**
 * Erreur d'un client du prototype implémentée
 * par une enveloppe.
 */
export class ErreurTchatParEnveloppe
    extends ErreurRedhibitoireParEnveloppe<FormatErreurTchat, EtiquetteErreurTchat>
    implements ErreurTchat {
    /**
     * Représentation nette du message d'erreur, ainsi que de la date.
     * - messageErreur : texte
     * - date : 12:53:53, le 02/02/2017 par exemple
     * @param e une étiquette, "centre" ou "voisins"
     */
    net(e: EtiquetteErreurTchat): string {
        let erreur = this.val();
        switch (e) {
            case 'messageErreur': return erreur.messageErreur;
            case 'date': return dateEnveloppe(erreur.date).representation();
        }
        return jamais(e);
    }
    /**
     * Représentation de l'erreur sous la forme suivante :
     * - "[date : message d'erreur]".
     */
    representation(): string {
        return "[" + this.net('date') + " : " + this.net('messageErreur') + "]";
    }
}

/**
 * Fabrique d'une erreur d'un client du prototype,
 * à partir de sa description en JSON.
 * @param c description de l'erreur en JSON
 */
export function erreurTchat(err: FormatErreurTchat): ErreurTchatParEnveloppe {
    return new ErreurTchatParEnveloppe(err);
}

/**
 * Fabrique d'une erreur d'un client du prototype,
 * à partir d'un texte, le message d'erreur, et d'une date, au format JSON.
 * @param n texte du message d'erreur
 * @param date date en français au format JSON
 */
export function erreurTchatDeMessage(msg: string, date: FormatDateFr): ErreurTchatParEnveloppe {
    return new ErreurTchatParEnveloppe({
        "erreurRedhibitoire": Unite.ZERO,
        "messageErreur": msg,
        "date": date
    });
}



/**
 * Enumération des différents types de messages pour le prototype.
 */
export const TypeMessageTchat =  {
    COM: 'COM',
    TRANSIT:  'TRANSIT',
    AR:  'AR',
    ERREUR_CONNEXION:  'ERREUR_CONNEXION',
    ERREUR_EMET:  'ERREUR_EMET',
    ERREUR_DEST:  'ERREUR_DEST',
    ERREUR_TYPE:  'ERREUR_TYPE',
    INTERDICTION:  'INTERDICTION',
    INFO:  'INFO'
} as const

/**
 * Description JSON d'un message avec plusieurs destinataires pour le prototype.
 * Structure :
 * - ID_destinataires : liste de tous les destinataires du message,
 * la liste peux être composée de tous les voisins actives de l'émetteur
 * ou bien de juste un voisin spécifique.
 */
export interface FormatMessageTchat extends FormatMessage {
    readonly ID_destinataires: TableauParEnveloppe<Identifiant<"sommet">>;
}

/**
 * Etiquettes utiles pour représenter un message. TODO Ajouter ID.
 */
export type EtiquetteMessageTchat = 'type' | 'date' | 'ID_de' | 'ID_à'| 'contenu';


/**
 * Interface pour les messages de prototype.
 */
export interface MessageTchat extends Message<FormatMessageTchat, EtiquetteMessageTchat> {

    /**
     * Conversion du message en un message de transit (serveur vers destinataire).
     */
    transit(): MessageTchatParEnveloppe;

    /**
     * Conversion du message en un message accusant réception (serveur vers émetteur).
     */
    avecAccuseReception(): MessageTchatParEnveloppe;
}


/**
 * Message de prototype implémenté par une enveloppe.
 */
export class MessageTchatParEnveloppe
    extends MessageParEnveloppe<FormatMessageTchat, EtiquetteMessageTchat>
    implements MessageTchat {
    /**
     * Représentation nette :
     * - type : une constante de TypeMessageTchat
     * - date : représentation de la date ("heure, le date")
     * - ID_de : ID du sommet émétteur
     * - ID_à : ID du sommet destinataire
     * - contenu : le contenu du message
     * @param e étiquette
     */
    net(e: EtiquetteMessageTchat): string {
        let msg = this.val();
        switch (e) {
            case 'type': return msg.type;
            case 'date': return dateEnveloppe(msg.date).representation();
            case 'ID_de': return msg.ID_emetteur.val;
            case 'contenu': return msg.contenu;
            case "ID_à": return  msg.ID_destinataires.representation();
        }
        return jamais(e);
    }
    /**
     * Représentation du message sous la forme suivante :
     * - "date, de ... à ... (type) - contenu".
     */
    representation(): string {
        let dem = this.net('ID_de');
        let typem = this.net('type');
        let datem = this.net('date');
        let cm = this.net('contenu');
        return datem + ", de " + dem + " (" + typem + ") - " + cm;
    }
    /**
     * Création d'un nouveau message, de même structure, sauf le type qui devient TRANSIT.
     */
    transit(): MessageTchatParEnveloppe {
        let msg = this.val();
        return new MessageTchatParEnveloppe({
            ID: msg.ID,
            ID_emetteur: msg.ID_emetteur,
            ID_destinataires: msg.ID_destinataires,
            type: TypeMessageTchat.TRANSIT,
            contenu: msg.contenu,
            date: msg.date
        });
    }
    /**
     * Création d'un nouveau message, de même structure, sauf le type qui devient AR.
     */
    avecAccuseReception(): MessageTchatParEnveloppe {
        let msg = this.val();
        return new MessageTchatParEnveloppe({
            ID: msg.ID,
            ID_emetteur: msg.ID_emetteur,
            ID_destinataires: msg.ID_destinataires,
            type: TypeMessageTchat.AR,
            contenu: msg.contenu,
            date: msg.date
        });
    }

}

/**
 * Fabrique d'un message de prototype à partir de sa description en JSON.
 *
 * @param m description d'un mesage de prototype en JSON
 */
export function messageTchat(m: FormatMessageTchat) {
    return new MessageTchatParEnveloppe(m);
}

/**
 * Fabrique d'un message correspondnat à une erreur de connexion.
 * @param id identifiant du message
 * @param idEmetteur identifiant de l'émetteur
 * @param messageErreur message d'erreur
 */
export function creerMessage(id: Identifiant<'message'>,
                                       idEmetteur: Identifiant<'sommet'>,
                                       texte: string, date: FormatDateFr, type: string,  idDestinataires: TableauParEnveloppe<Identifiant<"sommet">>){
    return new MessageTchatParEnveloppe({
        ID: id,
        ID_emetteur: idEmetteur,
        ID_destinataires: idDestinataires,
        type: type,
        contenu: texte,
        date: date
    })
}
/**
 * Fabrique d'un message d'information
 * @param id identifiant du message
 * @param idEmetteur identifiant de l'émetteur
 * @param idDestinataire identifiant du destinataire
 * @param texte contenu
 * @param date date (en français)
 */
export function creerMessageInformation(id: Identifiant<'message'>,
                                   idEmetteur: Identifiant<'sommet'>,
                                   texte: string, date: FormatDateFr,
                                   idDestinataires: TableauParEnveloppe<Identifiant<"sommet">>): MessageTchat {
    return new MessageTchatParEnveloppe({
        ID: id,
        ID_emetteur: idEmetteur,
        ID_destinataires: idDestinataires,
        type: TypeMessageTchat.INFO,
        contenu: texte,
        date: date
    });
}
