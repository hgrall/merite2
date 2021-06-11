import { Map, Set, Record } from 'immutable';


import { Enveloppe, TypeEnveloppe } from "../types/enveloppe";
import { FormatIdentifiable, identifiant, Identifiant } from "../types/identifiant";
import { FormatTableIdentification, tableIdentification, TableIdentification } from "../types/tableIdentification";
import { Activable, jamais } from "../types/typesAtomiques";


/**
 * Format pour les noeuds du réseau de tchat.
 * Structure :
 * - centre : un utilisateur
 * - voisins : une table d'identification au format pour les utilisateurs actifs ou inactifs
 *
 * @param S type représentant les utilisateurs en JSON.
 */
export interface FormatNoeud<
    S extends FormatIdentifiable<'sommet'> & Activable> {
    readonly centre: S;
    readonly voisins: FormatTableIdentification<'sommet', S>;
}

/**
 * Etat d'un noeud, formé d'un utilisateur, le centre, et de utilisateurs voisins.
 */

export interface EtatNoeud<
    S extends FormatIdentifiable<'sommet'>> {
    readonly centre: S;
    readonly voisins: TableIdentification<'sommet', S>;
}
/**
 * 
 * @param n noeud au format
 */
function etatNoeud<
    S extends FormatIdentifiable<'sommet'> & Activable>
    (n: FormatNoeud<S>): EtatNoeud<S> {
    return {
        centre: n.centre,
        voisins: tableIdentification('sommet', Map(n.voisins.identification).mapEntries(([id, v]) => [identifiant('sommet',id), v]))
    };
}

/**
 * Etiquettes pour les noeuds :
 * - centre,
 * - voisins.
 */
export type EtiquetteNoeud = 'centre' | 'voisins';

/**
 * Interface structurelle définissant un noeud.
 *
 * @param S type représentant un utilisateur en JSON.
 */
export interface Noeud<
    
    S extends FormatIdentifiable<'sommet'> & Activable>
    extends TypeEnveloppe<EtatNoeud<S>, FormatNoeud<S>, EtiquetteNoeud> {
    /**
     * Teste si l'utilisateur identifié par l'argument est voisin de ce noeud.
     * @param ID_util identifiant de l'utilisateur potentiellement voisin.
     * @returns true si l'utilisateur identifié par ID_util est voisin, false sinon.
     */
    aPourVoisin(ID_util: Identifiant<'sommet'>): boolean;

    /**
     * Itère une procédure sur chaque voisin du noeud.
     *
     * @param proc procédure appelée à chaque itération, prenant en entrée l'identifiant
     *   de l'utilisateur et l'utilisateur.
     */
    itererVoisins(proc: (ID_util: Identifiant<'sommet'>, v: S) => void): void;

    /**
     * Nombre de connexions actives.
     */
    nombreVoisinsActifs(): number;
}

class NoeudParEnveloppe<
    S extends FormatIdentifiable<'sommet'> & Activable>
    extends Enveloppe<EtatNoeud<S>, FormatNoeud<S>, EtiquetteNoeud>
    implements Noeud<S> {
    constructor(en: EtatNoeud<S>) {
        super(en);
    }
    aPourVoisin(ID_util: Identifiant<'sommet'>): boolean {
        return this.etat().voisins.contient(ID_util);
    }
    itererVoisins(proc: (ID_util: Identifiant<'sommet'>, v: S) => void): void {
        this.etat().voisins.iterer(proc);
    }
    net(e: EtiquetteNoeud): string {
        switch (e) {
            case 'centre': return JSON.stringify(this.etat().centre);
            case 'voisins': return this.etat().voisins.representation();
        }
        return jamais(e);
    }
    representation(): string {
        return `Centre : ${this.net("centre")} - Voisins : ${this.net("voisins")}`;
    }
    toJSON(): FormatNoeud<S> {
        return {
            centre: this.etat().centre,
            voisins: this.etat().voisins.toJSON()
        };
    }
    /**
    * Nombre de connexions actives.
    */
    nombreVoisinsActifs(): number {
        let r = 0;
        this.itererVoisins((id, s) => { if (s.actif) r++; });
        return r;
    }
}

/**
 * Fabrique d'un noeud à partir d'un noeud au format.
 * @param n noeud au format
 * @return noeud
 */
export function noeud<
    
    S extends FormatIdentifiable<'sommet'> & Activable>
    (n: FormatNoeud<S>): Noeud<S> {
    return new NoeudParEnveloppe<S>(etatNoeud(n));
}



