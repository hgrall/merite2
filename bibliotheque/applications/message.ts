import { dateMaintenant, FormatDateFr } from "../types/date";
import { Identifiant } from "../types/identifiant";

export interface FormatMessage<TypeMsg, CorpsMsg> {
    readonly ID: Identifiant<'message'>;
    readonly type: TypeMsg;
    readonly corps: CorpsMsg;
    readonly date: FormatDateFr
}

/**
 * Corps d'un message d'erreur. L'erreur a pour origine
 * le client. 
 * Structure :
 * - erreur : la description de l'erreur.
 */
export interface FormatErreur {
    readonly erreur: string;
}

/** 
 * Message au format JSON contenant une erreur.
 * - ID : identifiant
 * - type : 'erreur',
 * - corps : l'erreur,
 * - date : la date lors de l'émission.
*/
export type FormatMessageErreur = FormatMessage<'erreur', FormatErreur>;

/**
 * Corps d'un message d'avertissement. Un avertissement 
 * impose un comportement au client.
 * Structure :
 * - avertissement : la description de l'avertissement.
 */
export interface FormatAvertissement {
    readonly avertissement : string;
}

/** 
 * Message au format JSON contenant un avertissement pour le client.
 * - ID : identifiant
 * - type : 'avertissement',
 * - corps : l'avertissement,
 * - date : la date lors de l'émission.
*/
export type FormatMessageAvertissement = FormatMessage<'avertissement', FormatAvertissement>;

export function erreur(ID_msg : Identifiant<'message'>, description : string) : FormatMessageErreur {
    return {
        ID: ID_msg,
        type: 'erreur',
        corps: {
            erreur : description
        },
        date: dateMaintenant().toJSON()
    };
}

export function avertissement(ID_msg : Identifiant<'message'>, description : string) : FormatMessageAvertissement {
    return {
        ID: ID_msg,
        type: 'avertissement',
        corps: {
            avertissement : description
        },
        date: dateMaintenant().toJSON()
    };
}
