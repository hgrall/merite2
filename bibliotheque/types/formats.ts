import {
    Unite
} from "./typesAtomiques";

import {
    Enveloppe, TypeEnveloppe
} from "./enveloppe";
import {FormatIdentifiable, Identifiant} from "./identifiant";
import {FormatDateFr} from "./date";
import {FormatSommetTchat} from "./sommet";
import {FormatTableIdentification} from "./tableIdentification";

/**
 * Interface JSON servant de marqueur pour les configurations initiales.
 * Elle possède une clé pour permettre la discrimination : cette
 * clé est inutilisable par les autres interfaces.
 * Cette interface pourrait être complétée à l'avenir.
 */
export interface FormatConfigurationInitiale {
    readonly "configurationInitiale": Unite
};
/**
 * Interface JSON servant de marqueur pour les erreurs redhibitoires.
 * Elle possède une clé pour permettre la discrimination : cette
 * clé est inutilisable par les autres interfaces.
 * Cette interface pourrait être complétée à l'avenir.
 */
export interface FormatErreurRedhibitoire {
    readonly "erreurRedhibitoire": Unite
}

/**
 * Interface JSON servant de marqueur pour les messages.
 */
export interface FormatMessage {
    readonly ID: Identifiant<'message'>,
    readonly ID_emetteur: Identifiant<'sommet'>,
    readonly type: string,
    readonly contenu: string,
    readonly date: FormatDateFr
}

/**
 * Enumération des différents types d'informations presents dans le jeu.
 */
export enum TypeInformationTchat {
   NOUVELLE_CONNEXION = 'NOUVELLE_CONNEXION'
}

/**
 * Interface JSON servant de marqueur pour les messages d'information.
 */
export interface FormatInformation {
    readonly ID_Destinataire: Identifiant<'sommet'>,
    readonly type: TypeInformationTchat,
    readonly date: FormatDateFr
}

/**
 * Interface pour les messages abstraitss.
 *
 * @param FMsg type représentant en JSON les messages.
 * @param EtMsg étiquettes utiles pour la représentation d'un message.
 */
export interface Message<
    FMsg extends FormatMessage,
    EtMsg extends string
    >
    extends TypeEnveloppe<FMsg, EtMsg> { }

/**
 * Message abstrait enveloppe d'une structure JSON.
 * Une implémentation s'obtient en définissant les méthodes "net"
 * et "representation".
 *
 * @param FMsg type représentant en JSON les messages.
 * @param EtMsg étiquettes utiles pour la représentation d'un message.
 */
export abstract class MessageParEnveloppe<
    FMsg extends FormatMessage,
    EtMsg extends string
    >
    extends Enveloppe<FMsg, EtMsg>
    implements Message<FMsg, EtMsg> {
    constructor(etat: FMsg) {
        super( etat);
    }
}

/**
 * Interface pour les configurations abstraitess.
 *
 * @param FConf type représentant en JSON les configurations.
 * @param EtConf étiquettes utiles pour la représentation
 *   d'une configuration.
 */
export interface Configuration<
    FConf extends FormatConfigurationInitiale,
    EtConf extends string
    >
    extends TypeEnveloppe<FConf, EtConf> { }

/**
 * Configuration abstraite enveloppe d'une structure JSON.
 * Une implémentation s'obtient en définissant les méthodes "net"
 * et "representation".
 *
 * @param FConf type représentant en JSON les configurations.
 * @param EtConf étiquettes utiles pour la représentation
 *   d'une configuration.
 */
export abstract class ConfigurationParEnveloppe<
    FConf extends FormatConfigurationInitiale,
    EtConf extends string
    >
    extends Enveloppe<FConf, EtConf>
    implements Configuration<FConf, EtConf> {
    constructor(etat: FConf) {
        super( etat);
    }
}

/**
 * Interface pour les erreurs rédhibitoires abstraitess.
 *
 * @param FErr type représentant en JSON les erreurs.
 * @param EtErr étiquettes utiles pour la représentation d'une erreur.
 */
export interface ErreurRedhibitoire<
    FErr extends FormatErreurRedhibitoire,
    EtErr extends string
    >
    extends TypeEnveloppe<FErr, EtErr> { }


/**
 * Erreur rédhibitoire abstraite enveloppe d'une structure JSON.
 * Une implémentation s'obtient en définissant les méthodes "net"
 * et "representation".
 *
 * @param FErr type représentant en JSON les erreurs.
 * @param EtErr étiquettes utiles pour la représentation d'une erreur.
 */

export abstract class ErreurRedhibitoireParEnveloppe<
    FErr extends FormatErreurRedhibitoire,
    EtErr extends string
    >
    extends Enveloppe<FErr, EtErr>
    implements ErreurRedhibitoire<FErr, EtErr> {
    constructor(etat: FErr) {
        super( etat);
    }
}

/**
 * Interface pour les informations abstraitess.
 *
 * @param FInfo type représentant en JSON les informations.
 * @param EtInfo étiquettes utiles pour la représentation d'une information.
 */
export interface Information<
    FInfo extends FormatInformation,
    EtInfo extends string
    >
    extends TypeEnveloppe<FInfo, EtInfo> { }


/**
 * Information abstraite enveloppe d'une structure JSON.
 * Une implémentation s'obtient en définissant les méthodes "net"
 * et "representation".
 *
 * @param FInfo type représentant en JSON les information.
 * @param EtInfo étiquettes utiles pour la représentation d'une information.
 */

export abstract class InformationParEnveloppe<
    FInfo extends FormatInformation,
    EtInfo extends string
    >
    extends Enveloppe<FInfo,  EtInfo>
    implements Information<FInfo, EtInfo> {
    constructor(etat: FInfo) {
        super( etat);
    }
}


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
    readonly "voisinsActifs": FormatTableIdentification<'sommet', FSI>;
}


