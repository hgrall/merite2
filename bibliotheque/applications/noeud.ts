import { Enveloppe, TypeEnveloppe } from "../types/enveloppe";
import { FormatIdentifiable, Identifiant } from "../types/identifiant";
import { FormatTableIdentification, TableIdentification, tableIdentification } from "../types/tableIdentification";
import { Activable, jamais, Prioritarisable } from "../types/typesAtomiques";

/**
 * Format pour les noeuds du réseau de tchat.
 * Structure :
 * - centre : un sommet
 * - voisins : une table d'identification au format pour les sommets actifs ou inactifs
 *
 * @param S type représentant les sommets en JSON.
 */
export interface FormatNoeud<S extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable> {
    readonly centre: S;
    readonly voisins: FormatTableIdentification<'sommet', S>;
}

/**
 * Etat d'un noeud, formé d'un sommet, le centre, et de sommets voisins.
 */

export interface EtatNoeud<S extends FormatIdentifiable<'sommet'> & Prioritarisable> {
    readonly centre: S;
    readonly voisins: TableIdentification<'sommet', S>;
}
/**
 * 
 * @param n noeud au format
 */
function etatNoeud<S extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable>(n: FormatNoeud<S>): EtatNoeud<S> {
    return {
        centre: n.centre,
        voisins: tableIdentification<'sommet', S>('sommet', n.voisins)
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
 * @param S type représentant un sommet en JSON.
 */
export interface Noeud<S extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable>
    extends TypeEnveloppe<EtatNoeud<S>, FormatNoeud<S>, EtiquetteNoeud> {
    /**
     * Teste si le sommet identifié par l'argument est voisin de ce noeud.
     * @param ID_sommet identifiant du sommet potentiellement voisin.
     * @returns true si le sommet identifié par ID_sommet est voisin, false sinon.
     */
    aPourVoisin(ID_sommet: Identifiant<'sommet'>): boolean;

    /**
     * Itère une procédure sur chaque voisin du noeud.
     *
     * @param proc procédure appelée à chaque itération, prenant en entrée l'identifiant
     *   du sommet et le sommet.
     */
    itererVoisins(proc: (ID_sommet: Identifiant<'sommet'>, v: S) => void): void;

    /**
     * Nombre de connexions actives.
     */
    nombreConnexionsActives() : number;
}

class NoeudParEnveloppe<S extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable>
extends Enveloppe<EtatNoeud<S>, FormatNoeud<S>, EtiquetteNoeud>
implements Noeud<S> {
    constructor(en : EtatNoeud<S>){
        super(en);
    }
    aPourVoisin(ID_sommet: Identifiant<"sommet">): boolean {
        return this.etat().voisins.contient(ID_sommet);
    }
    itererVoisins(proc: (ID_sommet: Identifiant<"sommet">, v: S) => void): void {
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
            centre : this.etat().centre,
            voisins : this.etat().voisins.toJSON()
        };
    }
     /**
     * Nombre de connexions actives.
     */
    nombreConnexionsActives() : number {
        let r = 0;
        this.itererVoisins((id, s) => {if(s.actif) r++;});
        return r;
    }
}

/**
 * Fabrique d'un noeud à partir d'un noeud au format.
 * @param n noeud au format
 * @return noeud
 */
export function noeud<S extends FormatIdentifiable<'sommet'> & Prioritarisable & Activable>(n: FormatNoeud<S>): Noeud<S> {
    return new NoeudParEnveloppe<S>(etatNoeud(n));
}



