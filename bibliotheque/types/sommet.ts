import {
    FormatIdentifiable,
} from "../types/identifiant"
import {
    Enveloppe, TypeEnveloppe
} from "../types/enveloppe"
import {TableIdentificationMutable} from "./tableIdentification";
import {jamais} from "./typesAtomiques";

/**
 * Interface pour un sommet abstrait d'un réseau,
 * dérivée de TypeEnveloppe.
 * La sorte pour les identifiants de sommets est 'sommet'.
 *
 * @param TEX type de sortie représentant un sommet.
 * @param E étiquettes utiles pour une représentation d'un sommet.
 */
export interface Sommet<
    TEX extends FormatIdentifiable<'sommet'>,
    E extends string
    >
    extends TypeEnveloppe<TEX, E> {
}

/**
 * Sommet abstrait d'un réseau, dérivé d'Enveloppe.
 * La sorte pour les identifiants de sommets est 'sommet'.
 *
 * @param T type représentant un sommet.
 * @param TEX type de sortie représentant un sommet.
 * @param E étiquettes utiles pour une représentation d'un sommet.
 */
export abstract class SommetParEnveloppe<
    T extends FormatIdentifiable<'sommet'>,
    E extends string
    >
    extends Enveloppe<T,  E>
    implements Sommet<T, E> {
}


/**
 * Format JSON pour un sommet du réseau de tchat.
 * Structure :
 * - ID : identifiant
 * - pseudo : nom
 * - voisins: {identifiant: pseudo}
 */
export interface FormatSommetTchat extends FormatIdentifiable<'sommet'> {
    readonly pseudo: string,
    readonly voisins:  TableIdentificationMutable<'sommet', string>
}
/**
 * Etiquettes pour un sommet du réseau de tchat.
 */
export type EtiquetteSommetTchat = 'ID' | 'nom';

/**
 * Interface pour un sommet du réseau de tchat dérivée de Sommet et
 * l'étendant par des accesseurs en lecture.
 */
export interface SommetTchat
    extends Sommet<FormatSommetTchat, EtiquetteSommetTchat> {
    /**
     * Identifiant du sommet.
     */
    identifiant(): string;
    /**
     * Pseudo de l'utilisateur associé au sommet.
     */
    pseudo(): string;

    /**
     * Table avec les voisins du sommet.
     */
    voisins(): TableIdentificationMutable<'sommet', string>;
}

/**
 * Sommet du réseau de tchat implémenté par une enveloppe.
 *
 */
export class SommetTchatParEnveloppe
    extends SommetParEnveloppe<FormatSommetTchat, EtiquetteSommetTchat>
    implements SommetTchat {

    /**
     * Constructeur à partir d'un sommet au format JSON.
     * @param etat sommet au format JSON
     */
    constructor(etat: FormatSommetTchat) {
        super( etat);
    }

    voisins(): TableIdentificationMutable<'sommet', string>{
        return this.val().voisins;
    }
    /**
     * Représentation nette à partir des étiquettes "nom" et "ID".
     * @param e
     */
    net(e: EtiquetteSommetTchat): string {
        let s = this.val();
        switch (e) {
            case 'nom': return s.pseudo;
            case 'ID': return s.ID.val;
        }
        return jamais(e);
    }
    /**
     * Représentation sous la forme "nom (ID)".
     */
    representation(): string {
        return this.net('nom') + " (" + this.net('ID') + ")";
    }

    /**
     * Identifiant du sommet.
     */
    identifiant(): string {
        return this.val().ID.val;
    }
    /**
     * Pseudo de l'utilisateur associé au sommet.
     */
    pseudo(): string {
        return this.val().pseudo;
    }

}

/**
 * Fabrique d'un sommet.
 * @param s sommet au format JSON.
 */
export function sommetTchat(s: FormatSommetTchat) {
    return new SommetTchatParEnveloppe(s);
}

