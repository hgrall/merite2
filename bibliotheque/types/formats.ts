import {
    Unite
} from "./typesAtomiques";

import {
    Enveloppe, TypeEnveloppe
} from "./enveloppe";

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
 * Interface JSON servant de marqueur pour les informations.
 * Elle possède une clé pour permettre la discrimination : cette
 * clé est inutilisable par les autres interfaces.
 * Cette interface pourrait être complétée à l'avenir.
 */
export interface FormatInformation {
    readonly "information": Unite
}
/**
 * Interface JSON servant de marqueur pour les messages.
 * Elle ne possède pas de clé permettant la discrimination.
 * Pour discriminer, on vérifie l'absence des clés utilisées pour discriminer,
 * soit "configurationInitiale" et "erreurRedhibitoire".
 * Cette interface pourrait être complétée à l'avenir.
 */
export interface FormatMessage { }

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



