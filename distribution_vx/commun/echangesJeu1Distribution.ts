import {
  FormatMessage,
  MessageParEnveloppe,
  Message,
  FormatConfigurationInitiale,
  ConfigurationParEnveloppe,
  Configuration,
  FormatErreurRedhibitoire,
  ErreurRedhibitoireParEnveloppe,
  ErreurRedhibitoire,
  FormatInformation,
  InformationParEnveloppe
} from "../../bibliotheque/reseau/formats";

import {
  SommetParEnveloppe, Sommet,
  NoeudMutableParEnveloppe, NoeudParEnveloppe,
  NoeudMutable, Noeud,
  FormatNoeud, FormatNoeudMutable, EtiquetteNoeud
} from "../../bibliotheque/reseau/noeuds";

import {
  creerEnJSONNoeudMutableSansVoisins,
} from "../../bibliotheque/reseau/reseaux";

import {
  Unite, Deux, jamais
} from "../../bibliotheque/types/typesAtomiques";

import {
  FormatDateFr, dateEnveloppe, dateMaintenant, DateFr,
} from "../../bibliotheque/types/date";

import {
  table, EtiquetteTable,
} from "../../bibliotheque/types/table";

import {
  Identifiant, FormatIdentifiable, identifiant
} from "../../bibliotheque/types/identifiant";

import {
  FormatTableIdentification,
  TableIdentificationMutable,
  FormatTableIdentificationMutable,
  TableIdentificationMutableParEnveloppe
} from '../../bibliotheque/types/tableIdentification';

import { Enveloppe, TypeEnveloppe } from '../../bibliotheque/types/enveloppe';

import { Mot, mot } from '../../bibliotheque/types/binaire';
import { Option } from "../../bibliotheque/types/option";

/**
 * Sommet inconnu : identifiant indéfini utilisé dans des messages définis
 * partiellement.
 */
export const sommetInconnu: Identifiant<'sommet'> = { val: '???', sorte: 'sommet' };
/**
 * Message inconnu : identifiant indéfini utilisé dans des messages définis
 * partiellement.
 */
export const messageInconnu: Identifiant<'message'> = { val: '???', sorte: 'message' };
/**
 * Utilisateur inconnu : identifiant indéfini utilisé dans des messages définis
 * partiellement.
 */
export const utilisateurInconnu: Identifiant<'utilisateur'> = { val: '???', sorte: 'utilisateur' };

/**
 * Format JSON pour un sommet du réseau de distribution (jeu 1),
 * appelé domaine.
 * Remarque : la population du domaine n'appartient pas au domaine pour éviter
 * la découverte de la population des domaines voisins.
 *
 * Structure :
 * - ID : identifiant,
 * - nom : tableau de 0 et 1.
 */
export interface FormatDomaine extends FormatIdentifiable<'sommet'> {
  readonly nom: ReadonlyArray<Deux>;
}

/**
 * Etiquettes pertinentes pour décrire un domaine.
 */
export type EtiquetteDomaine = 'ID' | 'domaine';

/**
 * Interface pour un domaine dérivée de Sommet et
 * l'étendant par des accesseurs en lecture.
 */
export interface Domaine extends Sommet<FormatDomaine, EtiquetteDomaine> {
  /**
   * Identifiant du domaine.
   */
  identifiant(): string;
  /**
   * Nom du domaine donné par un mot en binaire.
   */
  motBinaire(): Mot;
}

/**
 * Domaine du réseau de distribution (jeu 1)
 * implémenté par une enveloppe.
 */
export class DomaineParEnveloppe
  extends SommetParEnveloppe<
  FormatDomaine, FormatDomaine, EtiquetteDomaine
  >
{
  /**
    * Constructeur à partir d'un domaine au format JSON.
    * @param etat domaine au format JSON
    */
  constructor(etat: FormatDomaine) {
    super(x => x, etat);
  }
  /**
    * Représentation nette à partir des étiquettes "domaine" et "ID".
    * @param e étiquette
    */
  net(e: EtiquetteDomaine): string {
    let s = this.val();
    switch (e) {
      case 'domaine':
        return this.motBinaire().representation();
      case 'ID':
        return s.ID.val;
    }
    return jamais(e);
  }
  /**
    * Représentation sous la forme "dom (ID)".
    */
  representation(): string {
    return this.net('domaine') + ' (' + this.net('ID') + ')';
  }
  /**
    * Description au format JSON.
    */
  val(): FormatDomaine {
    return this.etat();
  }
  /**
    * Identifiant du domaine.
    */
  identifiant(): string {
    return this.etat().ID.val;
  }
  /**
   * Nom du domaine donné par un mot en binaire.
   */
  motBinaire(): Mot {
    return mot(this.etat().nom);
  }
}

/**
 * Fabrique d'un domaine.
 * @param s domaine au format JSON.
 */
export function domaine(s: FormatDomaine): Domaine {
  return new DomaineParEnveloppe(s);
}

/**
 * Format JSON pour un noeud mutable du réseau de distribution (jeu 1).
 * Structure :
 * - mutable : etiquette
 * - ID : identifiant
 * - centre : un domaine
 * - voisins : une table mutable de domaines
 */
export interface FormatNoeudDistributionMutable
  extends FormatNoeudMutable<FormatDomaine> { }

/**
 * Interface définissant un noeud mutable d'un réseau de distribution.
 */
export interface NoeudDistributionMutable
  extends NoeudMutable<FormatDomaine> { }

/**
 * Noeud mutable implémenté par une enveloppe.
 */
class NoeudDistributionMutableParEnveloppe
  extends NoeudMutableParEnveloppe<FormatDomaine>
  implements NoeudDistributionMutable {

  /**
    * Représentation nette du centre et des voisins.
    * - centre : nom (ID)
    * - voisins : { "ID" : "[0 | 1, etc.]", etc. }
    * @param e une étiquette, "centre" ou "voisins"
    */
  net(e: EtiquetteNoeud): string {
    let s = this.val();
    switch (e) {
      case 'centre':
        return domaine(s.centre).representation();
      case 'voisins':
        return table(s.voisins.identification)
          .application((x) => mot(x.nom).representation())
          .representation();
    }
    return jamais(e);
  }
}

/**
 * Fabrique un noeud mutable de réseau de distribution,
 * à partir d'une description en JSON.
 * @param n description JSON du noeud
 */
export function creerNoeudDistributionMutable(
  n: FormatNoeudDistributionMutable): NoeudDistributionMutable {
  return new NoeudDistributionMutableParEnveloppe(n);
}

/**
 * Fabrique un noeud mutable à partir d'un domaine, sans voisins.
 * @param centre domaine au centre du noeud
 */
export function creerNoeudMutableSansVoisinsJeu1Distribution(
  centre: FormatDomaine): NoeudDistributionMutable {
  return new NoeudDistributionMutableParEnveloppe(creerEnJSONNoeudMutableSansVoisins(centre));
}

/**
 * Format JSON pour un noeud du réseau de distribution (jeu 1).
 * Structure :
 * - ID : identifiant
 * - centre : un sommet
 * - voisins : une table de sommets
 */
export interface FormatNoeudDistribution
  extends FormatNoeud<FormatDomaine> { }

/**
 * Interface définissant un noeud d'un réseau de distribution.
 */
export interface NoeudDistribution
  extends Noeud<FormatDomaine> { };

/**
 * Noeud implémenté par une enveloppe.
 */
class NoeudDistributionParEnveloppe
  extends NoeudParEnveloppe<FormatDomaine>
  implements NoeudDistribution {

  /**
    * Représentation nette du centre et des voisins.
    * - centre : nom (ID)
    * - voisins : { "ID" : "[0 | 1, etc.]", etc. }
    * @param e une étiquette, "centre" ou "voisins"
    */
  net(e: EtiquetteNoeud): string {
    let s = this.val();
    switch (e) {
      case 'centre':
        return domaine(s.centre).representation();
      case 'voisins':
        return table(s.voisins.identification)
          .application((x) => mot(x.nom).representation())
          .representation();
    }
    return jamais(e);
  }
}

/**
 * Fabrique d'un noeud de réseau de distribution,
 * à partir d'une description en JSON.
 * @param n description JSON du noeud
 */
export function noeudDistribution(
  n: FormatNoeudDistribution): NoeudDistribution {
  return new NoeudDistributionParEnveloppe(n);
}

/*
Exemple de description d'une configuration - TODO à actualiser
- noeud de centre : {
      "id":"id-1","domaine":[BLANC, NOIR, BLANC],
      "population" : { "nombre":4, utilisateurs : {"titi" : ...}}}
- noeud de voisins : {"id-2":{"id":"id-2","domaine":[NOIR, NOIR, BLANC]},
                      "id-0":{"id":"id-0","domaine":[BLANC, NOIR, NOIR]}}

*/
/**
 * Description en JSON d'un utilisateur peuplant un domaine.
 * Structure :
 * - ID : identifiant
 * - pseudo : tableau de 0 ou 1
 */
export interface FormatUtilisateur
  extends FormatIdentifiable<'utilisateur'> {
  readonly pseudo: ReadonlyArray<Deux>; // TODO ajouter d'autres caractéristiques
}

/**
 * Etiquettes pertinentes pour décrire un utilisateur.
 */
export type EtiquetteUtilisateur = 'ID' | 'pseudo';

/**
 * Interface définissant un utilisateur en étendant TypeEnvelppe
 * par un acesseur au pseudo.
 */
export interface Utilisateur
  extends TypeEnveloppe<FormatUtilisateur, EtiquetteUtilisateur> {
  /**
   * Pseudo de l'utilisateur décrit par un mot en binaire.
   */
  pseudo(): Mot;
}

/**
 * Utilisateur implémenté par une enveloppe.
 */
export class UtilisateurParEnveloppe
  extends Enveloppe<FormatUtilisateur, FormatUtilisateur, EtiquetteUtilisateur>
  implements Utilisateur {
  /**
   * Constructeur à partir d'une description en JSON de l'utilisateur.
   * @param u description en JSON de l'utilisateur.
   */
  constructor(u: FormatUtilisateur) {
    super(x => x, u);
  }
  /**
   * Description en JSON.
   */
  val(): FormatUtilisateur {
    return this.etat();
  }
  /**
   * Représentation nette de l'identifiant et du pseudo.
   * - ID : identifiant
   * - pseudo : [ 0 | 1, etc. ]
   * @param e une étiquette, "ID" ou "nom"
   */
  net(e: EtiquetteUtilisateur): string {
    let u = this.val();
    switch (e) {
      case 'ID':
        return u.ID.val;
      case 'pseudo':
        return mot(u.pseudo).representation();
    }
    return jamais(e);
  }
  /**
   * Représentation de l'utilisateur sous la forme suivante :
   * - "[0 | 1, etc.] (ID)".
   */
  representation(): string {
    return this.net('pseudo') + ' (' + this.net('ID') + ')';
  }
  /**
   * Accesseur en lecture au pseudo.
   * @returns mot binaire représentat le pseudo.
   */
  pseudo(): Mot {
    return mot(this.etat().pseudo);
  }

}

/**
 * Fabrique d'un utilisateur à partir de sa description en JSON.
 * @param u description en JSON d'un utilisateur
 */
export function utilisateur(u: FormatUtilisateur): Utilisateur {
  return new UtilisateurParEnveloppe(u);
}

/**
 * Description en JSON d'une population locale mutable.
 * Structure :
 * - mutable
 * - identification
 *   - mutable
 *   - taille : taille de la table
 *   - table : type indexé associant à l'identifiant d'un utilisateur
 *     sa description en JSON
 * - sorte : 'utilisateur'
 *
 */
export interface FormatPopulationLocaleMutable
  extends
  FormatTableIdentificationMutable<'utilisateur', FormatUtilisateur> { }

/**
 * Description en JSON d'une population locale.
 * Structure :
 * - identification
 *   - taille : taille de la table
 *   - table : type indexé associant à l'identifiant d'un utilisateur
 *     sa description en JSON
 * - sorte : 'utilisateur'
 *
 */
export interface FormatPopulationLocale
  extends
  FormatTableIdentification<'utilisateur', FormatUtilisateur> { }

/**
 * Fabrique en JSON une population locale mutable à partir d'une description
 * en JSON. Cette conversion n'est pas sûre : en conséquence,
 * garantir ou bien l'immutabilité de la table, ou bien un usage linéaire
 * de la table, qui n'est plus utilisée que comme table mutable.
 */
function creerEnJSONPopulationLocaleMutable(
  pop: FormatPopulationLocale): FormatPopulationLocaleMutable {
  const t = {
    "mutable": Unite.ZERO,
    "taille": pop.identification.taille,
    "table": pop.identification.table
  };
  return {
    "mutable": Unite.ZERO,
    "identification": t,
    "sorte": pop.sorte
  };
}

/**
 * Interface pour une population.
 * Une population est vue comme une table d'identification formée d'utilisateurs.
 */
export interface PopulationLocale
  extends TypeEnveloppe<FormatPopulationLocale, EtiquetteTable> {

  /**
   * Détermine si la population possède l'utilisateur identifié par l'argument.
   * @param ID_util identité de l'utilisateur.
   * @returns true si la population possède cet utilisateur, false sinon.
   */
  possedeUtilisateur(ID_util: Identifiant<'utilisateur'>): boolean;
  /**
   * Itère une procédure sur chaque association (identifiant, utilisateur)
   * de la population.
   * @param f procédure appelée à chaque itération.
   */
  iterer(f: (id: Identifiant<'utilisateur'>,
    n: FormatUtilisateur) => void): void;
  /**
   * Utilisateur associé à l'identifiant passé en argument.
   * Précondition : l'utilisateur appartient à la population.
   * @param ID_util identifiant de l'utilisateur.
   * @returns description en JSON de l'utilisateur.
   */
  utilisateur(ID_util: Identifiant<'utilisateur'>):
    FormatUtilisateur;
  /**
   * Tableau des identifiants des utilisateurs faisant partie de la population.
   */
  identifiantsUtilisateurs(): ReadonlyArray<Identifiant<'utilisateur'>>;
  /**
   * Sélection d'un utilisateur appartenant à la population.
   * Précondition : la population n'est pas vide. Si ce n'est pas le cas,
   * une exception est levée.
   * @returns l'identité de l'utilisateur sélectionné.
   */
  selectionUtilisateur(): Identifiant<'utilisateur'>;
  /**
   * Effectif de la population.
   */
  effectif(): number;
  /**
   * Détermine si la population est vide.
   */
  estVide(): boolean;
}

/**
 * Interface pour une population mutable.
 * Remarque : les utilisateurs sonts immutables.
 */
export interface PopulationLocaleMutable extends PopulationLocale {
  /**
   * Ajoute un utilisateur au réseau.
   * @param u description de l'utilisateur à ajouter en JSON.
   */
  ajouterUtilisateur(u: FormatUtilisateur): Option<FormatUtilisateur>;
  /**
   * Retire un utilisateur de la population, déterminé par son
   * identifiant.
   * @param ID_util identifiant de l'utilisateur à retirer en JSON.
   */
  retirerUtilisateur(ID_util: Identifiant<'utilisateur'>)
    : Option<FormatUtilisateur>;

}

/**
 * Classe représentant une population locale mutable, sous la forme d'une table
 * d'identification.
 */
export class PopulationLocaleMutableParTableIdentificationUtilisateurs
  extends TableIdentificationMutableParEnveloppe<'utilisateur',
  FormatUtilisateur, FormatUtilisateur>
  implements PopulationLocaleMutable {
  constructor(pop?: FormatPopulationLocaleMutable) {
    super('utilisateur', (x) => x, pop);
  }
  /**
   * Représentation de la population sous la forme :
   * - 'population de x utilisateurs : ([0 | 1, etc.] (ID)) ...'.
   */
  representation(): string {
    let detail = "";
    this.iterer((i, u) => { detail = detail + " " + utilisateur(u).representation(); });
    return this.effectif() + " utilisateurs :"
      + detail;
  }

  /**
   * Alias de "contient".
   * @param ID_util identité de l'utilisateur.
   * @returns true si la population possède cet utilisateur, false sinon.
   */
  possedeUtilisateur(ID_util: Identifiant<'utilisateur'>): boolean {
    return this.contient(ID_util);
  }
  /**
   * Alias de la méthode protégée "itererEtat".
   * @param f procédure appelée à chaque itération.
   */
  iterer(f: (id: Identifiant<'utilisateur'>,
    n: FormatUtilisateur) => void): void {
    this.itererEtat(f);
  }
  /**
   * Alias de la méthode protégée "valeurEtat".
   * Précondition : l'utilisateur appartient à la population.
   * @param ID_util identifiant de l'utilisateur.
   * @returns description en JSON de l'utilisateur.
   */
  utilisateur(ID_util: Identifiant<'utilisateur'>):
    FormatUtilisateur {
    return this.valeurEtat(ID_util);
  }
  /**
   * Alias de "domaine".
   */
  identifiantsUtilisateurs(): ReadonlyArray<Identifiant<'utilisateur'>> {
    return this.domaine();
  }
  /**
   * Alias de "selectionCle".
   * Précondition : la population n'est pas vide. Si ce n'est pas le cas,
   * une exception est levée.
   * @returns l'identité de l'utilisateur sélectionné.
   */
  selectionUtilisateur(): Identifiant<'utilisateur'> {
    return this.selectionCle();
  }
  /**
   * Alias de "taille".
   */
  effectif(): number {
    return this.taille();
  }

  /**
   * Délégation à "ajouter".
   * @param u description de l'utilisateur à ajouter en JSON.
   */
  ajouterUtilisateur(u: FormatUtilisateur): Option<FormatUtilisateur> {
    return this.ajouter(u.ID, u);
  }
  /**
   * Alias de "retirer".
   * @param ID_util identifiant de l'utilisateur à retirer en JSON.
   */
  retirerUtilisateur(ID_util: Identifiant<'utilisateur'>)
    : Option<FormatUtilisateur> {
    return this.retirer(ID_util);
  }
}

/**
 * Fabrique une population locale mutable vide.
 */
export function creerPopulationLocaleMutableVide(): PopulationLocaleMutable {
  return new PopulationLocaleMutableParTableIdentificationUtilisateurs();
}

/**
 * Fabrique une population locale mutable à partir d'une description en
 * JSON.
 * @param pop description en JSON de la population locale.
 */
export function creerCopiePopulationLocaleMutable(pop: PopulationLocale):
  PopulationLocaleMutable {
  let copie = creerPopulationLocaleMutableVide();
  pop.iterer((id, u) => {
    copie.ajouterUtilisateur(u);
  })
  return copie;
}

/**
 * Fabrique à partir d'une description JSON d'une population locale,
 * par conversion d'une population locale mutable.
 * @param pop description JSON de la population locale.
 */
export function populationLocale(pop: FormatPopulationLocale):
  PopulationLocale {
  return new PopulationLocaleMutableParTableIdentificationUtilisateurs(
    creerEnJSONPopulationLocaleMutable(pop));
}


/**
 * Description en JSON d'une consigne. Une consigne contient
 * le message à envoyer (un mot en binaire) et le destinataire,
 * un utilisateur dans un domaine.
 * Structure :
 * - domaine
 *   - ID : identifiant
 *   - nom : tableau de 0 et 1
 * - utilisateur
 *   - ID : identifiant
 *   - pseudo : tableau de 0 ou 1
 * - mot : tableau de 0 ou 1
 */
export interface FormatConsigne {
  readonly domaine: FormatDomaine,
  readonly utilisateur: FormatUtilisateur,
  readonly mot: ReadonlyArray<Deux>;
  readonly tailleTrame: number;
}

/**
 * Etiquettes utilisées pour la représentation des consignes.
 */
export type EtiquetteConsigne
  = 'ID_dom' | 'domaine' | 'ID_util' | 'utilisateur' | 'mot' | 'trame';

/**
 * Interface pour une consigne. Une consigne spécifie :
 * - le mot à envoyer,
 * - l'utilisateur destinataire,
 * - le domaine de l'utilisateur.
 */
export interface Consigne
  extends TypeEnveloppe<FormatConsigne, EtiquetteConsigne> {
  domaine(): Domaine;
  utilisateur(): Utilisateur;
  motAEnvoyer(): Mot;
  tailleTrame(): number;
  avecNouveauMot(m: Mot): Consigne;
}

/**
 * Consigne implémentée par une enveloppe.
 */
class ConsigneParEnveloppe
  extends Enveloppe<FormatConsigne, FormatConsigne, EtiquetteConsigne>
  implements Consigne {
  /**
   * Constructeur à partir d'une description en JSON de la consigne.
   * @param c description en JSON de la consigne.
   */
  constructor(c: FormatConsigne) {
    super((x) => x, c);
  }
  /**
   * Description en JSON.
   */
  val(): FormatConsigne {
    return this.etat();
  }
  /**
   * Représentation nette du domaine, de l'utilisateur et du mot à envoyer.
   * - ID_dom : identifiant du domaine
   * - domaine : [ 0 | 1, etc. ]
   * - ID_util : identifiant de l'utilisateur
   * - utilisateur : [ 0 | 1, etc. ]
   * @param e une étiquette, "ID_dom", "domaine", "ID_util", "utilisateur" ou
   *          "mot".
   */
  net(e: EtiquetteConsigne): string {
    let c = this.val();
    switch (e) {
      case 'ID_dom':
        return c.domaine.ID.val;
      case 'domaine':
        return mot(c.domaine.nom).representation();
      case 'ID_util':
        return c.utilisateur.ID.val;
      case "utilisateur":
        return mot(c.utilisateur.pseudo).representation();
      case "mot":
        return mot(c.mot).representation();
      case 'trame':
        return String(c.tailleTrame);
    }
    return jamais(e);
  }
  /**
   * Représentation de l'utilisateur sous la forme suivante :
   * - "envoyer le mot binaire [0 | 1, ...] à l'utilisateur [0 | 1, ...] (id)
   *    du domaine [0 | 1, ...] (id) dans une trame de x chiffres binaires.".
   */
  representation(): string {
    return "envoyer le mot binaire " + this.net('mot')
      + " à l'utilisateur "
      + this.net('utilisateur') + ' du domaine '
      + this.net('domaine') + ' dans une trame de '
      + this.net('trame') + ' chiffres binaires.';
  }
  /**
   * Accesseur en lecture au domaine de destination.
   * @returns domaine de destination.
   */
  domaine(): Domaine {
    return domaine(this.etat().domaine);
  }
  /**
   * Accesseur en lecture à l'utilisateur destinataire.
   * @returns utilisateur destinataire.
   */
  utilisateur(): Utilisateur {
    return utilisateur(this.etat().utilisateur);
  }
  /**
   * Accesseur en lecture au mot à envoyer.
   * @returns mot binaire à envoyer.
   */
  motAEnvoyer(): Mot {
    return mot(this.etat().mot);
  }
  /**
   * Accesseur en en lecture à la taille de la trame.
   */
  tailleTrame(): number {
    return this.etat().tailleTrame;
  }
  /**
   * Fabrique d'une consigne avec un nouveau mot.
   */
  avecNouveauMot(m: Mot): Consigne {
    let c = this.val();
    return new ConsigneParEnveloppe({
      domaine: c.domaine,
      utilisateur: c.utilisateur,
      mot: m.tableauBinaire(),
      tailleTrame: c.tailleTrame
    });
  }
}

/**
 * Fabrique d'une consigne à partir de sa description en JSON.
 * @param c description en JSON d'une consigne.
 */
export function consigne(c: FormatConsigne): Consigne {
  return new ConsigneParEnveloppe(c);
}



/**
 * Description en JSON d'une configuration initiale
 * pour un utilisateur du réseau de distribution (jeu 1). Une configuration
 * contient :
 * - un domaine, le centre,
 * - une population locale,
 * - un utilisateur, membre de cette population,
 * - des domaines voisins,
 * - une date de création,
 * - une consigne de jeu.
 * Structure :
 * - centre
 *   - ID : identifiant
 *   - nom : tableau de 0 et 1
 * - population
 *   - identification
 *     - taille : taille de la table
 *     - table : type indexé associant à l'identifiant d'un utilisateur
 *       sa description en JSON
 *   - sorte : 'utilisateur'
 * - utilisateur
 *   - ID : identifiant
 *   - pseudo : tableau de 0 ou 1
 * - voisins
 *   - identification
 *     - taille : taille de la table
 *     - table : type indexé associant à l'identifiant d'un domaine
 *       sa description en JSON (ID et nom)
 *   - sorte : 'sommet'
 * - date
 * - consigne
 *   - domaine
 *     - ID : identifiant
 *     - nom : tableau de 0 et 1
 *   - utilisateur
 *     - ID : identifiant
 *     - pseudo : tableau de 0 ou 1
 *   - mot : tableau de 0 ou 1
 */
export interface FormatConfigurationDistribution extends FormatConfigurationInitiale {
  /**
   * Domaine de l'utilisateur.
   */
  readonly centre: FormatDomaine;
  /**
   * Population du domaine.
   */
  readonly population: FormatPopulationLocale;
  /**
   * Utilisateur associé.
   */
  readonly utilisateur: FormatUtilisateur;
  /**
   * Domaines voisins.
   */
  readonly voisins: FormatTableIdentification<'sommet', FormatDomaine>;
  /**
   * Date de création.
   */
  readonly date: FormatDateFr;
  /**
   * Consigne.
   */
  readonly consigne: FormatConsigne;
  /**
   * Message à recevoir
   */
  readonly messageARecevoir: FormatConsigne;

  /**
   * Taille Reseau
   */
  readonly tailleReseau: number;
}

/**
 * Etiquettes pertinentes pour représenter une configuration d'un utilisateur
 * du réseau de distribution.
 */
export type EtiquetteConfigurationDistribution = 'centre' | 'population'
  | 'utilisateur' | 'voisins' | 'date'
  | 'domaineCible' | 'utilisateurCible' | 'motCible';

/**
 * Interface pour les configurations initiales des utilisateurs du
 * réseau de distribution.
 */
export interface ConfigurationDistribution
  extends Configuration<
  FormatConfigurationDistribution, EtiquetteConfigurationDistribution
  > {
  /**
   * Noeud du réseau, soit un domaine et ses voisins.
   */
  noeud(): NoeudDistribution;
  /**
   * Population associé à ce noeud.
   */
  population(): PopulationLocale;
  /**
   * Utilisateur associé à cette configuration.
   */
  utilisateur(): Utilisateur;
  /**
   * Date de création.
   */
  date(): DateFr;
  /**
   * Consigne à suivre par l'utilisateur.
   */
  consigne(): Consigne;
  /**
   * Configuration obtenue en mettant à jour la date.
   */
  aJour(d: DateFr): ConfigurationDistribution;

}

/**
 * Configuration implémentée par une enveloppe.
 */
export class ConfigurationDistributionParEnveloppe
  extends ConfigurationParEnveloppe<
  FormatConfigurationDistribution,
  EtiquetteConfigurationDistribution>
  implements ConfigurationDistribution {

  /**
   * Constructeur à partir d'une description en JSON de la configuration.
   * @param c description en JSON de la configuration.
   */
  constructor(c: FormatConfigurationDistribution) {
    super(c);
  }

  /**
   * Représentation nette des attributs d'une configuration.u domaine, de l'utilisateur et du mot à envoyer.
   * - centre : "dom (ID)"
   * - population : "x utilisateurs : ([0 | 1, etc.] (ID)) ..."
   * - utilisateur : "[0 | 1, etc.] (ID)"
   * - voisins : '{
   *     "ID": "nom",
   *     etc. }'
   * - date : '12:53:53, le 02/02/2017' par exemple
   * - domaineCible : 'dom (ID)'
   * - utilisateurCible : '[ 0 | 1, etc. ] (ID)'
   * - motCible : '[ 0 | 1, etc. ]'
   * @param e une étiquette (voir EtiquetteConfigurationDistribution).
   */
  net(e: EtiquetteConfigurationDistribution): string {
    let config = this.val();
    switch (e) {
      case 'centre':
        return domaine(config.centre).representation();
      case 'population':
        return populationLocale(config.population).representation();
      case 'utilisateur':
        return utilisateur(config.utilisateur).representation();
      case 'voisins':
        return table(config.voisins.identification).application((x) => x.nom).representation();
      case 'date':
        return dateEnveloppe(config.date).representation();
      case 'domaineCible':
        return domaine(config.consigne.domaine).representation();
      case 'utilisateurCible':
        return utilisateur(config.consigne.utilisateur).representation();
      case 'motCible':
        return mot(config.consigne.mot).representation();
    }
    return jamais(e);
  }
  /**
   * Représentation d'une configuration sous la forme :
   * - "centre : dom (ID) ;
   * - population de x utilisateurs : ([0 | 1, etc.] (ID)) ... ;
   * - utilisateur : [0 | 1, etc.] (ID) ;
   * - voisins : { "ID": "nom", etc. } ;
   * - créé à: HH:MM:SS, le JJ/MM/AAAA ;
   * - consigne : envoi de [0 | 1, etc.] à utilisateur [0 | 1, etc.] (ID)
   *   dans domaine [0 | 1, etc.] (ID)"."
   */
  representation(): string {
    let c = this.net('centre');
    let pop = this.net('population');
    let util = this.net('utilisateur');
    let v = this.net('voisins');
    let d = this.net('date');
    let cDom = this.net('domaineCible');
    let cUtil = this.net('utilisateurCible');
    let cMot = this.net('motCible');
    return '(centre : ' + c
      + ' ; population de ' + pop
      + ' ; utilisateur : ' + util
      + ' ; voisins : ' + v
      + ' ; créé à : ' + d
      + ' ; consigne : envoi de ' + cMot + ' à utilisateur ' + cUtil + ' dans domaine ' + cDom
      + ')';
  }
  /**
   * Noeud associé à la configuration.
   */
  noeud(): NoeudDistribution {
    let centre = this.val().centre;
    let voisins = this.val().voisins;
    return noeudDistribution({ "centre": centre, "voisins": voisins });
  }
  /**
   * Population associée à la configuration.
   */
  population(): PopulationLocale {
    return populationLocale(this.etat().population);
  }
  /**
   * Utilisateur associé à la configuration.
   */
  utilisateur(): Utilisateur {
    return utilisateur(this.etat().utilisateur);
  }
  /**
   * Date de création.
   */
  date(): DateFr {
    return dateEnveloppe(this.etat().date);
  }
  /**
   * Consigne de jeu pour l'utilisateur.
   */
  consigne(): Consigne {
    return consigne(this.etat().consigne);
  }
  /**
   * Configuration obtenue en mettant à jour la date, qui devient celle de
   * construction.
   */
  aJour(d: DateFr): ConfigurationDistribution {
    const cfg = this.val();
    return compositionConfigurationJeu1(
      this.noeud().val(), cfg.population, cfg.utilisateur, d.val(),
      cfg.consigne, cfg.messageARecevoir, cfg.tailleReseau
    );
  }
}

/**
 * Fabrique d'une configuration pour le jeu 1 de distribution.
 * @param c la configuration.
 */
export function configurationJeu1Distribution(c: FormatConfigurationDistribution) {
  return new ConfigurationDistributionParEnveloppe(c);
}

/**
 * Fabrique d'une configuration à partir des différentes informations prises
 * séparément :
 * - noeud,
 * - population,
 * - utilisateur,
 * - date de création,
 * - consigne à respecter.
 * @param n noeud.
 * @param pop population locale.
 * @param u utilisateur.
 * @param date date de création.
 * @param consigne consigne à respecter.
 */
export function compositionConfigurationJeu1(
  n: FormatNoeudDistribution,
  pop: FormatPopulationLocale,
  u: FormatUtilisateur,
  date: FormatDateFr,
  consigne: FormatConsigne,
  messageARecevoir: FormatConsigne,
  tailleReseau: number,
): ConfigurationDistributionParEnveloppe {
  return new ConfigurationDistributionParEnveloppe({
    configurationInitiale: Unite.ZERO,
    centre: n.centre,
    population: pop,
    utilisateur: u,
    voisins: n.voisins,
    date: date,
    consigne: consigne,
    messageARecevoir: messageARecevoir,
    tailleReseau: tailleReseau
  });
}

/**
 * Type des erreurs pour le jeu 1 de distribution.
 * - Canaux du serveur
 *   - Rédhibitoire : RÉDHIBITOIRE
 *   - nombre de connexions insuffisants : NOM_CONNEXIONS
 */
export enum TypeErreurDistribution {
  REDHIBITOIRE= 0,
  NOM_CONNEXIONS= 1 ,
}

export interface FormatErreurDistribution extends FormatErreurRedhibitoire {
  readonly messageErreur: string;
  readonly date: FormatDateFr;
  readonly type: TypeErreurDistribution;
}

export type EtiquetteErreurDistribution = 'messageErreur' | 'date';

export class ErreurDistribution extends ErreurRedhibitoireParEnveloppe<FormatErreurDistribution, EtiquetteErreurDistribution> {

  net(e: EtiquetteErreurDistribution): string {
    let erreur = this.val();
    switch (e) {
      case 'messageErreur':
        return erreur.messageErreur;
      case 'date':
        return dateEnveloppe(erreur.date).representation();
    }
    return jamais(e);
  }
  representation(): string {
    return '[' + this.net('date') + ' : ' + this.net('messageErreur') + ']';
  }
}

export function erreurDistribution(err: FormatErreurDistribution): ErreurDistribution {
  return new ErreurDistribution(err);
}

export function compositionErreurDistribution(msg: string, date: FormatDateFr, type: TypeErreurDistribution): ErreurDistribution {
  return new ErreurDistribution({
    erreurRedhibitoire: Unite.ZERO,
    messageErreur: msg,
    date: date,
    type:type
  });
}
/**
 * Type des messages d'information pour le jeu 1 de distribution.
 * - NOM_CONNEXIONS : Nombre de connexions actives sur le serveur
 */
export enum TypeInformationDistribution {
  NOM_CONNEXIONS
}

/**
 * Description JSON d'un message d'information, qui contient les attributs suivants :
 * - type d'information',
 * - contenu du message,
 * - date
 */
export interface FormatInformationDistribution extends FormatInformation {
  readonly contenu: string;
  readonly date: FormatDateFr;
  readonly type: TypeInformationDistribution;

}

export type EtiquetteInformationDistribution = 'messageInformation' | 'date';

export class InformationDistribution extends InformationParEnveloppe<FormatInformationDistribution, EtiquetteInformationDistribution> {

  net(i: EtiquetteInformationDistribution): string {
    let information = this.val();
    switch (i) {
      case 'messageInformation':
        return information.contenu;
      case 'date':
        return dateEnveloppe(information.date).representation();
    }
    return jamais(i);
  }
  representation(): string {
    return '[' + this.net('date') + ' : ' + this.net('messageInformation') + ']';
  }
}

export function information(info: FormatInformationDistribution): InformationDistribution {
  return new InformationDistribution(info);
}

export function compositionInformationDistribution(msg: string, date: FormatDateFr, type: TypeInformationDistribution): InformationDistribution {
  return new InformationDistribution({
    information: Unite.ZERO,
    contenu: msg,
    date: date,
    type: type
  });
}


/*
Protocole : cf. structure.org
*/
/**
 * Nombre de bits inutiles dans la trame.
 */
export const INUTILES_TRAME: number = 1;
/**
 * Nombre de bits du coeur de la trame (du message inclus, ou payload).
 */
export const COEUR_TRAME: number = 5;

/**
 * Type des messages pour le jeu 1 de distribution.
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
 * Description JSON d'un message, qui contient les attributs suivants :
 * - identifiant du message,
 * - identifiant de l'utilisateur, soit l'émetteur, soit le destinataire,
 * - domaine origine,
 * - domaine destination,
 * - type du message,
 * - contenu du message,
 * - date (TODO de création, de modification ???).
 */
export interface FormatMessageDistribution
  extends FormatMessage, FormatIdentifiable<'message'> {
  readonly ID_utilisateur: Identifiant<'utilisateur'>;
  readonly ID_origine: Identifiant<'sommet'>;
  readonly ID_destination: Identifiant<'sommet'>;
  readonly type: TypeMessageDistribution;
  readonly contenu: ReadonlyArray<Deux>;
  readonly date: FormatDateFr;
}

export type EtiquetteMessageDistribution = 'ID' | 'type' | 'date' | 'ID_de' | 'ID_à' | 'contenu' | 'utilisateur';

// Structure
export class MessageDistribution
  extends MessageParEnveloppe<
  FormatMessageDistribution, EtiquetteMessageDistribution
  > {

  net(e: EtiquetteMessageDistribution): string {
    let msg = this.val();
    switch (e) {
      case 'ID':
        return msg.ID.val;
      case 'type':
        return TypeMessageDistribution[msg.type];
      case 'date':
        return dateEnveloppe(msg.date).representation();
      case 'ID_de':
        return msg.ID_origine.val;
      case 'ID_à':
        return msg.ID_destination.val;
      case 'contenu':
        return mot(msg.contenu).representation();
      case 'utilisateur':
        return msg.ID_utilisateur.val;
    }
    return jamais(e);
  }

  representation(): string {
    let idm = this.net('ID');
    let dem = this.net('ID_de');
    let am = this.net('ID_à');
    let typem = this.net('type');
    let datem = this.net('date');
    let cm = this.net('contenu');
    return idm + ' - ' + datem + ', de ' + dem + ' à ' + am + ' (' + typem + ') - ' + cm;
  }

  /**
   * Fabrique d'un message en ajoutant un identifiant de message pour accuser
   * réception d'un message initial.
   */
  avecIdentifiant(idMessage: Identifiant<'message'>) {
    let msg = this.val();
    return new MessageDistribution({
      ID: idMessage,
      ID_utilisateur: msg.ID_utilisateur,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: msg.type,
      contenu: msg.contenu,
      date: msg.date
    });
  }
  /**
   * Fabrique d'un message en ajoutant un identifiant de message pour accuser
   * réception d'un message initial.
   */
  avecType(typeMessage: TypeMessageDistribution) {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: msg.ID_utilisateur,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: typeMessage,
      contenu: msg.contenu,
      date: msg.date
    });
  }
  /**
   * Fabrique d'un message pour la diffusion vers les utilisateurs du domaine
   * destinataire. Voir le canal "recevoir" dans la spécification chimique.
   * @param idUtilDestinataire identifiant de l'utilisateur destinataire.
   */
  diffusion(
    idUtilDestinataire: Identifiant<'utilisateur'>
  ): MessageDistribution {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: idUtilDestinataire,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: TypeMessageDistribution.TRANSIT,
      contenu: msg.contenu,
      date: msg.date
    });
  }

  /**
   * Fabrique d'un message pour la destruction d'un message verrouillé.
   * Voir le canal "verrouiller" dans la spécification chimique.
   * @param idUtilDestinataire identifiant de l'utilisateur destinataire.
   */
  destruction(
    idUtilDestinataire: Identifiant<'utilisateur'>): MessageDistribution {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: idUtilDestinataire,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: TypeMessageDistribution.DESTRUCT,
      contenu: msg.contenu,
      date: msg.date
    });
  }

  /**
   * Fabrique d'un message pour l'échec d'un verrouillage.
   * Canal non décrit dans la spécification chimique.
   * @param idUtilVerrouillant identifiant de l'utilisateur verrouillant
   *  le message.
   */
  echecVerrouillage(
    idUtilVerrouillant: Identifiant<'utilisateur'>): MessageDistribution {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: idUtilVerrouillant,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: TypeMessageDistribution.ECHEC_VERROU,
      contenu: msg.contenu,
      date: msg.date
    });
  }

  /**
   * Fabrique d'un message pour l'activation.
   * Voir le canal "activer" dans la spécification chimique.
   */
  activation(): MessageDistribution {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: msg.ID_utilisateur,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: TypeMessageDistribution.ACTIF,
      contenu: msg.contenu,
      date: msg.date
    });
  }

  /**
   * Fabrique d'un message pour le déverrouillage.
   * Voir le canal "deverrouiller" dans la spécification chimique.
   */
  liberation(): MessageDistribution {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: msg.ID_utilisateur,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: TypeMessageDistribution.LIBE,
      contenu: msg.contenu,
      date: msg.date
    });
  }

  /**
   * Fabrique d'un message pour un gain après une interprétation correcte.
   * Voir le canal "gagner" dans la spécification chimique.
   * Précondition : le message est dans l'état ESSAI.
   */
  gain(
    idUtilOrigine: Identifiant<'utilisateur'>,
    idDomaineOrigine: Identifiant<'sommet'>
  ): MessageDistribution {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: idUtilOrigine,
      ID_origine: idDomaineOrigine,
      ID_destination: msg.ID_destination,
      type: TypeMessageDistribution.GAIN,
      contenu: msg.contenu,
      date: msg.date
    });
  }

  /**
   * Fabrique d'un message pour une perte après une interprétation incorrecte.
   * Voir le canal "perdre" dans la spécification chimique.
   * Précondition : le message est dans l'état ESSAI.
   */
  perte(): MessageDistribution {
    let msg = this.val();
    return new MessageDistribution({
      ID: msg.ID,
      ID_utilisateur: msg.ID_utilisateur,
      ID_origine: msg.ID_origine,
      ID_destination: msg.ID_destination,
      type: TypeMessageDistribution.PERTE,
      contenu: msg.contenu,
      date: msg.date
    });
  }
}

/**
 * Fabrique d'un message initial produit par l'utilisateur,
 * en spécifiant le contenu, un mot de TRAME bits.
 * @param id_emetteur identifiant de l'utilisateur émettant le message.
 * @param id_origine domaine de cet utilisateur.
 * @param id_destination  domaine voisin de destination.
 * @param contenu mot binaire de TRAME bits.
 */
export function messageInitial(
  id_emetteur: Identifiant<'utilisateur'>,
  id_origine: Identifiant<'sommet'>,
  id_destination: Identifiant<'sommet'>,
  contenu: Mot,
  date: DateFr
) {
  return new MessageDistribution({
    ID: messageInconnu,
    ID_utilisateur: id_emetteur,
    ID_origine: id_origine,
    ID_destination: id_destination,
    type: TypeMessageDistribution.INIT,
    contenu: contenu.tableauBinaire(),
    date: date.val()
  });
}

/**
 * Fabrique d'un message demandant le verrouillage d'un message en transit,
 * et produit par l'utilisateur.
 * @param identifiant identifiant du message.
 * @param id_demandeur identifiant de l'utilisateur demandant le verrouillage.
 * @param id_origine domaine de cet utilisateur.
 * @param id_destination  domaine voisin de destination.
 * @param contenu mot binaire de TRAME bits.
 * @param date date de création du message.
 */
export function messageDemandeVerrouillage(
  identifiant: Identifiant<'message'>,
  id_demandeur: Identifiant<'utilisateur'>,
  id_origine: Identifiant<'sommet'>,
  id_destination: Identifiant<'sommet'>,
  contenu: Mot,
  date: DateFr
) {
  return new MessageDistribution({
    ID: identifiant,
    ID_utilisateur: id_demandeur,
    ID_origine: id_origine,
    ID_destination: id_destination,
    type: TypeMessageDistribution.VERROU,
    contenu: contenu.tableauBinaire(),
    date: date.val()
  });
}

/**
 * Fabrique d'un message demandant le déverrouillage d'un message en traitement,
 * et produit par l'utilisateur.
 * @param identifiant identifiant du message.
 * @param id_demandeur identifiant de l'utilisateur demandant le verrouillage.
 * @param id_origine domaine de cet utilisateur.
 * @param id_destination  domaine voisin de destination.
 * @param contenu mot binaire de TRAME bits.
 * @param date date de création du message.
 */
export function messageDemandeDeverrouillage(
  identifiant: Identifiant<'message'>,
  id_demandeur: Identifiant<'utilisateur'>,
  id_origine: Identifiant<'sommet'>,
  id_destination: Identifiant<'sommet'>,
  contenu: Mot,
  date: DateFr
) {
  return new MessageDistribution({
    ID: identifiant,
    ID_utilisateur: id_demandeur,
    ID_origine: id_origine,
    ID_destination: id_destination,
    type: TypeMessageDistribution.LIBE,
    contenu: contenu.tableauBinaire(),
    date: date.val()
  });
}

/**
   * Fabrique d'un message pour une transmission.
   * Voir le canal "transmettre" dans la spécification chimique.
   * @param idDomaineDestinataire identifiant du domaine destinartaire.
   */
export function transmission(
  identifiant: Identifiant<'message'>,
  id_emetteur: Identifiant<'utilisateur'>,
  id_origine: Identifiant<'sommet'>,
  id_destination: Identifiant<'sommet'>,
  contenu: Mot,
  date: DateFr
): MessageDistribution {
  return new MessageDistribution({
    ID: identifiant,
    ID_utilisateur: id_emetteur,
    ID_origine: id_origine,
    ID_destination: id_destination,
    type: TypeMessageDistribution.SUIVANT,
    contenu: contenu.tableauBinaire(),
    date: date.val()
  });
}

/**
   * Fabrique d'un message pour un essai d'interprétation.
   * Voir le canal "verifier" dans la spécification chimique.
   * @param contenu mot binaire de sept bits représentant l'interprétation du
   *   message.
   */
export function essai(
  identifiant: Identifiant<'message'>,
  id_emetteur: Identifiant<'utilisateur'>,
  id_origine: Identifiant<'sommet'>,
  id_destination: Identifiant<'sommet'>,
  contenu: Mot,
  date: DateFr

): MessageDistribution {
  return new MessageDistribution({
    ID: identifiant,
    ID_utilisateur: id_emetteur,
    ID_origine: id_origine,
    ID_destination: id_destination,
    type: TypeMessageDistribution.ESSAI,
    contenu: contenu.tableauBinaire(),
    date: date.val()
  });
}

/**
 * Fabrique d'un message à partir d'une description en JSON.
 * @param msg description en JSON.
 */
export function messageDistribution(msg: FormatMessageDistribution) {
  return new MessageDistribution(msg);
}

