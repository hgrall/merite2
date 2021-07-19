import {
    ReseauMutable, AssembleurReseau, ReseauMutableParTableDeNoeuds,
    AssembleurReseauEnAnneau, Reseau, FormatReseau,
} from "../../bibliotheque/reseau/reseaux";

import {
    NoeudMutable
} from "../../bibliotheque/reseau/noeuds";


import {
    Identification, creerIdentificationParCompteur, Identifiant
} from "../../bibliotheque/types/identifiant";

import {
    NoeudDistribution,
    FormatDomaine,
    noeudDistribution,
    creerNoeudMutableSansVoisinsJeu1Distribution,
    PopulationLocaleMutable,
    creerPopulationLocaleMutableVide,
    FormatUtilisateur,
    FormatPopulationLocale,
    FormatConsigne,
    PopulationLocale,
    Consigne,
    Utilisateur,
    populationLocale,
    utilisateur,
    consigne,
    creerCopiePopulationLocaleMutable,
    INUTILES_TRAME,
    COEUR_TRAME,
} from "../commun/echangesJeu1Distribution";
import {
    premiersBinaires, mot, motAleatoire, Mot, tailleEnBinaire
} from "../../bibliotheque/types/binaire";
import {
    FABRIQUE_TABLEAU_JSON, creerTableauMutableVide
} from "../../bibliotheque/types/tableau";
import {
    FormatTableIdentification,
    TableIdentificationMutable,
    creerTableIdentificationMutableVide,
    tableIdentification,
    TableIdentification
} from "../../bibliotheque/types/tableIdentification";
import { TypeEnveloppe, Enveloppe } from "../../bibliotheque/types/enveloppe";
import { jamais } from "../../bibliotheque/types/typesAtomiques";
import { divEuclidienne } from "../../bibliotheque/types/entier";
import { Option, rienOption, option } from "../../bibliotheque/types/option";

/**
 * Interface définissant le réseau du jeu 1 de distribution en paramétrant
 * Reseau par le format des sommets.
 */
export interface ReseauJeu1Distribution extends Reseau<FormatDomaine> {
    /**
     * Noeud suivant le noeud "n" après "etapes" sauts, en passant par le voisin
     * identifié par "idVoisin". Si "etapes" vaut zéro, ou sinon, si "idvoisin"
     * n'identifie pas un voisin, c'est "n" qui est renvoyé.
     * @param n noeud du réseau.
     * @param idVoisin identifiant d'un voisin du noeud.
     * @param etapes nombre de sauts.
     */
    suivant(n: NoeudDistribution, idVoisin: Identifiant<"sommet">,
        etapes: number): NoeudDistribution;
    itererSuivantAnneau(
        proc: (n: NoeudDistribution, idVoisin: Identifiant<"sommet">) => void): void;
}

/**
 * Interface mutable définissant le réseau du jeu 1 de distribution en paramétrant
 * ReseauMutable par le format des sommets.
 */
export interface ReseauMutableJeu1Distribution
    extends ReseauJeu1Distribution, ReseauMutable<FormatDomaine> { }


/**
 * Implémentation du réseau du en paramétrant
 * ReseauMutableParTableDeNoeuds par le format des sommets et
 * en redéfinissant la représentation.
 */
class ReseauJeu1DistributionMutableParTableDeNoeuds
    extends ReseauMutableParTableDeNoeuds<FormatDomaine>
    implements ReseauMutableJeu1Distribution {
    /**
     * Représentation du réseau sous la forme :
     * - 'réseau de x noeuds : (centre : nom (ID) ; voisins : {"ID1" : "nom1", ...}) ...'
     */
    representation(): string {
        let detail = "";
        this.iterer((i, n) => { detail = detail + " " + noeudDistribution(n).representation(); });
        return "réseau de " + this.net('taille') + " noeuds :"
            + detail;
    }
    /**
     * Implémentation récursive.
     * @param n noeud du réseau.
     * @param idVoisin identifiant d'un voisin du noeud.
     * @param etapes nombre de sauts.
     */
    suivant(n: NoeudDistribution, idVoisin: Identifiant<"sommet">, etapes: number):
        NoeudDistribution {
        if (etapes < 1)
            return n;
        if (!n.aPourVoisin(idVoisin))
            return n;
        const nouveauNoeud = noeudDistribution(this.valeur(idVoisin));
        let nouvelIdVoisin = n.val().centre.ID; // Mauvaise initialisation : le bon
        // voisin est l'autre voisin du nouveau noeud.
        // L'itération ci-dessous corrige.
        nouveauNoeud.itererVoisins((id, v) => {
            if (id.val !== nouvelIdVoisin.val) {
                nouvelIdVoisin = id;
            }
        });
        return this.suivant(
            nouveauNoeud,
            nouvelIdVoisin,
            etapes - 1
        );
    }
    itererSuivantAnneau(
        proc: (n: NoeudDistribution, idVoisin: Identifiant<"sommet">) => void)
        : void {
        if (this.estVide())
            return;
        let nd = noeudDistribution(this.image()[0]);
        let idVoisin = nd.val().centre.ID; // Initialisation erronée corrigée par
        // l'itération ci-dessous.
        tableIdentification("sommet", nd.val().voisins.identification)
            .iterer((id, dom) => {
                idVoisin = id;
            });
        let sauts = 0;
        while (sauts < this.taille()) {
            proc(nd, idVoisin);
            sauts++;
            let mauvaisIdVoisin = nd.val().centre.ID;
            nd = noeudDistribution(this.noeud(idVoisin));
            tableIdentification("sommet", nd.val().voisins.identification)
                .iterer((id, dom) => {
                    if (id !== mauvaisIdVoisin) {
                        idVoisin = id;
                    }
                });
        }
    }

}

/**
 * Fabrique un réseau mutable vide pour le jeu 1 de distribution.
 */
export function creerReseauMutableVideJeu1Distribution():
    ReseauMutableJeu1Distribution {
    return new ReseauJeu1DistributionMutableParTableDeNoeuds();
}

/**
 * Implémentation d'un assembleur de réseau en anneau pour le jeu 1 de
 * distribution
 * - en paramétrant AssembleurReseauEnEtoile par le format des sommets,
 * - en implémentant la fabrique d'un réseau mutable vide.
 */
export class AssembleurReseauEnAnneauJeu1Distribution
    extends AssembleurReseauEnAnneau<FormatDomaine, ReseauMutableJeu1Distribution>
    implements AssembleurReseau<FormatDomaine, ReseauMutableJeu1Distribution> {

    /**
     * Constructeur à partir du nombre de domaines
     * et d'une fabrique de noeuds sans voisins.
     * @param nombreDomaines nombre de domaines.
     * @param fabriqueNoeudSansVoisins une fabrique de noeuds sans voisins.
     */
    constructor(
        private nombreDomaines: number,
        fabriqueNoeudSansVoisins: (centre: FormatDomaine) => NoeudMutable<FormatDomaine>
    ) {
        super(nombreDomaines, fabriqueNoeudSansVoisins);
    }
    /**
     * Fabrique un réseau mutable vide.
     */
    creerReseauMutableVide(): ReseauMutableJeu1Distribution {
        return creerReseauMutableVideJeu1Distribution();
    }
}

/**
 * Fabrique un assembleur de réseau en anneau pour le jeu 1 de distribution,
 * à partir du nombre de domaines
 * @param nombreDomaines nombre de domaines
 */
export function creerAssembleurReseauEnAnneauJeu1Distribution(
    nombreDomaines: number): AssembleurReseauEnAnneauJeu1Distribution {
    return new AssembleurReseauEnAnneauJeu1Distribution(
        nombreDomaines, creerNoeudMutableSansVoisinsJeu1Distribution);
}

/**
 * Fabrique d'un réseau en anneau pour le jeu 1 de distribution,
 * à partir du nombre de domaines et d'un préfixe pour les identifiants des
 * domaines. L'implémentation utilise
 * l'assembleur associé et une identification par compteur. Les noms des domaines
 * sont les représentations binaires des entiers naturels inférieurs au nombre
 * de domaines (0, 1, 10, 11, etc.).
 * @param nombreDomaines nombre de domaines.
 * @param prefixeIdentifiants préfixe des identifiants de domaines.
 */
export function reseauEnAnneauJeu1Distribution(
    nombreDomaines: number,
    prefixeIdentifiants: string): ReseauJeu1Distribution {
    let assembleur: AssembleurReseauEnAnneauJeu1Distribution =
        creerAssembleurReseauEnAnneauJeu1Distribution(nombreDomaines);
    let identification: Identification<'sommet'>
        = creerIdentificationParCompteur(prefixeIdentifiants);
    let nomsDomaines
        = FABRIQUE_TABLEAU_JSON.melange(premiersBinaires(nombreDomaines));
    for (let m of nomsDomaines.tableau) {
        let dom: FormatDomaine =
        {
            "nom": m.tableauBinaire(),
            "ID": identification.identifier('sommet')
        };
        assembleur.ajouterSommet(dom);
    }
    return assembleur.assembler();
}

/**
 * Fabrique une population locale mutable à partir de l'effectif et d'un préfixe
 * pour les identifiants des utilisateurs. Les utilisateurs
 * ont pour nom les représentations binaires des entiers naturels inférieurs
 * à l'effectif (0, 1, 10, 11, etc.).
 * @param effectif nombre d'utilisateurs dans la population
 * @param prefixeIdentifiants préfixe des utilisateurs
 */
export function creerPopulationLocaleMutableJeu1Distribution(
    effectif: number,
    prefixeIdentifiants: string): PopulationLocaleMutable {
    let pop = creerPopulationLocaleMutableVide();
    let identification: Identification<'utilisateur'>
        = creerIdentificationParCompteur(prefixeIdentifiants);
    let nomsUtilisateurs = premiersBinaires(effectif);
    for (let m of nomsUtilisateurs) {
        let u: FormatUtilisateur =
        {
            "pseudo": m.tableauBinaire(),
            "ID": identification.identifier('utilisateur')
        };
        pop.ajouterUtilisateur(u);
    }
    return pop;
}

export interface FormatConfigurationServeurJeu1Distribution {
    readonly reseau: FormatReseau<FormatDomaine>;
    readonly populations: FormatTableIdentification<'sommet',
    FormatPopulationLocale>;
    readonly consignesEmission:
    FormatTableIdentification<'utilisateur', FormatConsigne>;
    readonly attendusReception:
    FormatTableIdentification<'utilisateur', FormatConsigne>;
    readonly tailleTrame: number;
}

interface EtatConfigurationServeur {
    reseau: ReseauJeu1Distribution;
    populations: TableIdentificationMutable<'sommet',
    PopulationLocale, FormatPopulationLocale>;
    consignesEmission: TableIdentificationMutable<'utilisateur',
    Consigne, FormatConsigne>;
    attendusReception: TableIdentificationMutable<'utilisateur',
    Consigne, FormatConsigne>;
    tailleTrame: number;
}

/**
 * Etiquettes utilisées pour la représentation des configurations du serveur.
 */
export type EtiquetteConfigurationServeur
    = 'reseau' | 'populations' | 'consignesEmission' | 'attendusReception';

export interface ConfigurationServeurJeu1Distribution
    extends TypeEnveloppe<
    FormatConfigurationServeurJeu1Distribution, EtiquetteConfigurationServeur> {
    engendrerPopulations(effectifs: ReadonlyArray<number>): void;
    engendrerConsignes(): void;
    reseau(): ReseauJeu1Distribution;
    populations(): TableIdentification<'sommet', FormatPopulationLocale>;
    consignesEmission(): TableIdentification<'utilisateur', FormatConsigne>;
    attendusReception(): TableIdentification<'utilisateur', FormatConsigne>;
}

function etatVersFormatConfigurationServeur(e: EtatConfigurationServeur):
    FormatConfigurationServeurJeu1Distribution {
    let r = e.reseau.val();
    let pop = e.populations.val();
    let cE = e.consignesEmission.val();
    let cR = e.attendusReception.val();
    let t = e.tailleTrame;
    let res = {
        reseau: r,
        populations: pop,
        consignesEmission: cE,
        attendusReception: cR,
        tailleTrame: t
    };
    return res;
}

function generationEtatInitial(
    nombreDomaines: number,
    prefixeIdentifiants: string): EtatConfigurationServeur {
    let r = reseauEnAnneauJeu1Distribution(nombreDomaines, prefixeIdentifiants);
    let pop = creerTableIdentificationMutableVide('sommet',
        (pop: PopulationLocale) => pop.val());
    let cE = creerTableIdentificationMutableVide('utilisateur',
        (c: Consigne) => c.val());
    let cR = creerTableIdentificationMutableVide('utilisateur',
        (c: Consigne) => c.val());
    let etat = {
        reseau: r,
        populations: pop,
        consignesEmission: cE,
        attendusReception: cR,
        tailleTrame: 0
    };
    return etat;
}

interface FormatUtilisateurComplet {
    utilisateur: FormatUtilisateur;
    ID_dom: Identifiant<'sommet'>;
}

interface UtilisateurComplet {
    utilisateur: Utilisateur;
    ID_dom: Identifiant<'sommet'>;
}

class ConfigurationServeurParEnveloppe
    extends Enveloppe<EtatConfigurationServeur, FormatConfigurationServeurJeu1Distribution,
    EtiquetteConfigurationServeur>
    implements ConfigurationServeurJeu1Distribution {

    constructor(nombreDomaines: number, prefixeIdentifiants: string) {
        super(etatVersFormatConfigurationServeur,
            generationEtatInitial(nombreDomaines, prefixeIdentifiants));
    }

    net(e: EtiquetteConfigurationServeur) {
        let c = this.etat();
        switch (e) {
            case 'reseau':
                return c.reseau.representation();
            case 'populations':
                return c.populations.representation();
            case 'consignesEmission':
                return c.consignesEmission.representation();
            case 'attendusReception':
                return c.consignesEmission.representation();
        }
        return jamais(e);
    }

    representation(): string {
        return "configuration du serveur : (réseau : "
            + this.net("reseau")
            + ") (populations : "
            + this.net("populations")
            + ") (consignes : "
            + this.net("consignesEmission")
            + ")";
    }
    engendrerPopulations(effectifs: ReadonlyArray<number>): void {
        const r = this.etat().reseau;
        const pops = this.etat().populations;
        const idsDom = r.identifiantsNoeuds();
        for (let d of idsDom) {
            const numeroDom = mot(r.noeud(d).centre.nom).base10();
            pops.ajouter(d,
                creerPopulationLocaleMutableJeu1Distribution(
                    effectifs[numeroDom],
                    "@" + d.val + ":"));
        }
        this.etat().tailleTrame = tailleTrame(r.taille(), effectifs);
    }
    /**
     * Engendre les consignes en utilisant l'algorithme suivant.
     * - Itération sur les noeuds du réseau en suivant l'anneau pour remplir
     *   une pile d'utilisateurs et une pile de consignes en correspondance.
     *   - Premier cas : nombre pair de domaines
     *     - Ajouter la population du noeud courant à la pile des émetteurs.
     *     - Ajouter les attendus associés, qui indiquent seulement les émetteurs
     *          (utilisateur et domaine).
     *     - Ajouter la population du noeud opposé à la pile des récepteurs.
     *     - Ajouter les consignes, qui indiquent seulement les récepteurs
     *          (utilisateur et domaine).
     *     - Itération finale : vider les quatre piles en remplissant les deux
     *          tables : utilisateur émetteur avec consigne mise à jour,
     *          utilisateur récepteur avec attendu mis à jour. La mise à jour
     *          consiste à définir le mot à envoyer ou à recevoir, par le
     *          résultat d'un appel à "generationAleatoireMotConsigne".
     *   - Second cas : nombre impair de domaines
     *     - Première itération : divide la population du noeud opposé en deux,
     *     - TODO
     *   - Itération finale :
     */
    engendrerConsignes(): void {
        const r = this.etat().reseau;
        const pops = this.etat().populations;
        const tailleT = this.etat().tailleTrame;
        const idsDom = r.identifiantsNoeuds();
        const tabEmetteurs
            = creerTableauMutableVide<Utilisateur, FormatUtilisateur>(
                (u) => u.val());
        const tabRecepteurs
            = creerTableauMutableVide<Utilisateur, FormatUtilisateur>(
                (u) => u.val());
        const tabConsignes
            = creerTableauMutableVide<Consigne, FormatConsigne>(
                (c) => c.val());
        const tabAttendus
            = creerTableauMutableVide<Consigne, FormatConsigne>(
                (c) => c.val());
        const divDom = divEuclidienne(r.taille(), 2);
        if (divDom.reste === 0) {
            // Cas d'un nombre pair de domaines
            r.itererSuivantAnneau((n, idV) => {
                const pop = populationLocale(pops.valeur(n.val().centre.ID));
                pop.iterer((id, u) => {
                    tabEmetteurs.ajouterEnFin(utilisateur(u));
                    tabAttendus.ajouterEnFin(
                        consigne(
                            {
                                domaine: n.val().centre,
                                utilisateur: u,
                                mot: [0],
                                tailleTrame: tailleT
                            }
                        )
                    )
                });
                const noeudOpp = r.suivant(n, idV, divDom.quotient);
                const popOpp
                    = populationLocale(pops.valeur(noeudOpp.val().centre.ID));
                popOpp.iterer((id, u) => {
                    tabRecepteurs.ajouterEnFin(utilisateur(u));
                    tabConsignes.ajouterEnFin(
                        consigne(
                            {
                                domaine: noeudOpp.val().centre,
                                utilisateur: u,
                                mot: [0],
                                tailleTrame: tailleT
                            }
                        ));
                });
            });
            while (!tabEmetteurs.estVide()) {
                const m = generationAleatoireMotConsigne(5).tableauBinaire();
                let uE = tabEmetteurs.retirerEnFin();
                let uR = tabRecepteurs.retirerEnFin();
                let c = tabConsignes.retirerEnFin().avecNouveauMot(mot(m));
                let a = tabAttendus.retirerEnFin().avecNouveauMot(mot(m));
                this.etat().consignesEmission.ajouter(uE.val().ID, c);
                this.etat().attendusReception.ajouter(uR.val().ID, a);
            }
        } else {
            // Cas d'un nombre impair de domaines
            const demiPopOppAuNoeudInitial = creerPopulationLocaleMutableVide();
            let premierNoeud: Option<NoeudDistribution> = rienOption();
            r.itererSuivantAnneau((n, idV) => {
                const pop = populationLocale(pops.valeur(n.val().centre.ID));
                pop.iterer((id, u) => {
                    tabEmetteurs.ajouterEnFin(utilisateur(u));
                    tabAttendus.ajouterEnFin(
                        consigne(
                            {
                                domaine: n.val().centre,
                                utilisateur: u,
                                mot: [0],
                                tailleTrame: tailleT
                            }
                        )
                    )
                });
                const noeudOpp = r.suivant(n, idV, divDom.quotient);
                const popOpp
                    = creerCopiePopulationLocaleMutable(
                        populationLocale(pops.valeur(noeudOpp.val().centre.ID))
                    );
                if (premierNoeud.estVide()) {
                    for (let j = 0; j < divEuclidienne(popOpp.effectif(), 2).quotient; j++) {
                        const idU = popOpp.selectionUtilisateur();
                        const u = popOpp.utilisateur(idU);
                        popOpp.retirerUtilisateur(u.ID);
                        demiPopOppAuNoeudInitial.ajouterUtilisateur(u);
                    }
                    premierNoeud = option(noeudOpp);
                }
                popOpp.iterer((id, u) => {
                    tabRecepteurs.ajouterEnFin(utilisateur(u));
                    tabConsignes.ajouterEnFin(
                        consigne(
                            {
                                domaine: noeudOpp.val().centre,
                                utilisateur: u,
                                mot: [0],
                                tailleTrame: tailleT
                            }
                        ));
                });
            });
            demiPopOppAuNoeudInitial.iterer((id, u) => {
                tabRecepteurs.ajouterEnFin(utilisateur(u));
                tabConsignes.ajouterEnFin(
                    consigne(
                        {
                            domaine: premierNoeud.valeur().val().centre,
                            utilisateur: u,
                            mot: [0],
                            tailleTrame: tailleT
                        }
                    ));
            });
            while (!tabEmetteurs.estVide()) {
                const m = generationAleatoireMotConsigne(5).tableauBinaire();
                let uE = tabEmetteurs.retirerEnFin();
                let uR = tabRecepteurs.retirerEnFin();
                let c = tabConsignes.retirerEnFin().avecNouveauMot(mot(m));
                let a = tabAttendus.retirerEnFin().avecNouveauMot(mot(m));
                this.etat().consignesEmission.ajouter(uE.val().ID, c);
                this.etat().attendusReception.ajouter(uR.val().ID, a);
            }
        }
    }
    reseau(): ReseauJeu1Distribution {
        return this.etat().reseau;
    }
    populations(): TableIdentification<'sommet', FormatPopulationLocale> {
        return tableIdentification(
            'sommet', this.etat().populations.val().identification);
    }
    consignesEmission(): TableIdentification<'utilisateur', FormatConsigne> {
        return tableIdentification(
            'utilisateur', this.etat().consignesEmission.val().identification);
    }
    attendusReception(): TableIdentification<'utilisateur', FormatConsigne> {
        return tableIdentification(
            'utilisateur', this.etat().attendusReception.val().identification);
    }

}

export function creerConfigurationServeur(
    nombreDomaines: number, prefixeIdentifiants: string):
    ConfigurationServeurJeu1Distribution {
    return new ConfigurationServeurParEnveloppe(nombreDomaines, prefixeIdentifiants);
}

/*export function motNul(t: number): Mot {
    let res = [];
    for (let j = 0; j < t; j++) {
        res.push(0);
    }
    return mot(res);
} TODO rm */

/**
 * Générateur de mot binaire aléatoire, de taille l'argument transmis,
 * complété à gauche et à droite par un zéro.
 * @param t taille du coeur du mot binaire aléatoire.
 * @returns mot binaire de taille 't + 2', commençant et finissant par 0,
 *      de coeur aléatoire.
 */
export function generationAleatoireMotConsigne(t: number): Mot {
    let m = motAleatoire(t).tableauBinaire();
    let res = [0];
    for (let j of m) {
        res.push(j);
    }
    res.push(0);
    return mot(res);
}

function tailleTrame(nombreDomaines: number, effectifs: ReadonlyArray<number>) {
    let total = INUTILES_TRAME + COEUR_TRAME + 2;
    total = total + tailleEnBinaire(nombreDomaines);
    let m = 0;
    for (let e of effectifs) {
        let t = tailleEnBinaire(e);
        if (t > m) {
            m = t;
        }
    }
    total = total + m;
    return total;
}