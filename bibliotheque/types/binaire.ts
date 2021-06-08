/*
- mots binaires formés de ZERO (valant 0) et UN (valant 1).
*/

import { Deux, jamais, Mesurable } from './typesAtomiques';
import { entierAleatoire } from './nombres';
import { Enveloppe, TypeEnveloppe } from './enveloppe';
import * as im from 'immutable';
import e = require('express');

/**
 * Schéma JSON pour représenter des mots en binaire :
 * - { taille: Naturel, tableau: [(Deux.ZERO | Deux.UN), ...] }.
 * Remaque : Deux.Zero == 0, Deux.UN == 1.
 */
export interface FormatMot extends Mesurable {
    readonly mot : ReadonlyArray<Deux>;
}

export type EtatMot = im.List<Deux>;

export type EtiquetteMot = "taille" | "mot";

export interface Mot extends TypeEnveloppe<EtatMot, FormatMot, EtiquetteMot> {
  /**
   * Représentation sous la forme "ZERO | UN.ZERO | UN. etc.".
   * @return une représentation binaire littérale utilisant Zero et UN, et un point pour séparateur.
   */
  base2Litteral(): string;
  /**
   * Représentation sous la forme "(0 | 1)*".
   * @return la représentation binaire utilisant 0 et 1, sans séparateur.
   */
  base2(): string;
  /**
   * Représentation sous la forme d'un entier naturel décimal.
   * @return la valeur (en base 10, comme number).
   */
  base10(): number;
  /**
   * Tableau JSON composé de ZERO et de UN.
   * @return le tableau de {ZERO, UN}.
   */
  tableauBinaire(): ReadonlyArray<Deux>;
  /**
   * Taille du mot binaire.
   */
  taille(): number;
  /**
    * Valeur du bit en position index. Précondition : la position est entre zéro et la
     * longueur moins un.
     * @param index position dans le mot, la position zéro étant à gauche.
     */
  bit(index: number): Deux;
}

/**
 * Classe représentant des mots en binaire par
 * un tableau.
 * - Tableau de {ZERO, UN}.
 */
class MotParListe extends Enveloppe<EtatMot, FormatMot, EtiquetteMot> implements Mot {
  
  /**
   * Constructeur à partir d'un état.
   *
   * @param etat état d'un mot.
   */
  constructor(etat: EtatMot) {
    super(etat);
  }

  net(e: EtiquetteMot): string {
    switch (e) {
      case 'taille': return JSON.stringify(this.taille());
      case 'mot': return JSON.stringify(this.tableauBinaire());
  }
  return jamais(e);
  }
  toJSON(): FormatMot {
    return { taille : this.taille(), mot : this.etat().toJSON() };
  }
  
  taille(): number {
    return this.etat().size;
  }
  /**
   * Utilisation de la représentation nette "valeurs".
   * @return une représentation du tableau de {0 , 1}.
   */
  representation(): string {
    return this.net('mot');
  }

  /**
   * Application pour convertir en ZERO (0) ou UN (1), puis réduction pour
   * concaténer et séparer par un point et troncature
   * pour enlever le point initial.
   * @return une représentation binaire littérale utilisant Zero et UN,
   * et un point pour séparateur.
   */
  base2Litteral(): string {
    return this.etat().join(".");
  }
  /**
   * Application pour convertir en chaîne puis réduction pour concaténer.
   * @return la représentation binaire utilisant 0 et 1, sans séparateur.
   */
  base2(): string {
    return this.etat().join("");
  }
  /**
   * Représentation sous la forme d'un entier naturel décimal.
   * @return la valeur (en base 10, comme number).
   */
  base10(): number {
    return parseInt(this.base2(), 2);
  }
  /**
   * Alias de l'attribut tableau de l'état.
   * @return le tableau de {ZERO, UN}.
   */
  tableauBinaire(): ReadonlyArray<Deux> {
    return this.etat().toJSON();
  }
  /**
   * Alias de valeur.
   * @param index position dans le mot, la position zéro étant à gauche.
   */
  bit(index: number): Deux {
    return this.etat().get(index, 0);
  }
}

/**
 * Fabrique d'un mot binaire à partir d'un tableau de {0, 1} ou de {ZERO, UN}.
 * @param mot
 * @returns un mot binaire formé à partir du tableau mot.
 */
export function mot(tab2: ReadonlyArray<Deux>): Mot {
  return new MotParListe(im.List(tab2));
}

/**
 * Taille de l'entier naturel en base deux.
 * @param n entier naturel (précondition : n >= 0).
 * @returns taille de n en base deux.
 */
export function tailleEnBinaire(n: number): number {
  return n.toString(2).length;
}

/**
 * Fabrique d'un mot binaire à partir d'un entier naturel.
 * @param n un entier naturel (précondition : n >= 0).
 * @returns un mot binaire formé à partir de l'entier naturel.
 */
export function binaire(n: number): Mot {
  let s: string[] = Array.from(n.toString(2));
  return mot(
    s.map((v, i, t) => {
      switch (v) {
        case '0':
          return Deux.ZERO;
        case '1':
          return Deux.UN;
        default:
          throw new Error('[Erreur : binaire(' + n.toString + ') non défini.');
      }
    })
  );
}
/**
 * Concaténation de deux mots binaires.
 * - L'ensemble des mots binaires forme un monoïde.
 * @param mot1 premier mot
 * @param mot2 second mot
 * @returns la concaténation mot1.mot2.
 */
export function concatenationMot(mot1: Mot, mot2: Mot): Mot {
  var tab1 = mot1.tableauBinaire();
  var tab2 = mot2.tableauBinaire();
  var total = tab1.concat(tab2);
  return mot(total);
}

/**
 * Fabrique des premiers mots binaires.
 * @param n entier naturel égal au successeur du maximum.
 * @returns tableaux de mots binaires contenant 0, ..., n-1.
 */
export function premiersBinaires(n: number): ReadonlyArray<Mot> {
  return Array(n).fill(0).map((v, i, tab) => binaire(i));
}

/**
 * Fabrique d'un mot binaire aléatoire de taille fixée.
 * @param taille longueur du mot
 * @returns un mot de longueur taille dont les bits sont calculés aléatoirement.
 */
export function motAleatoire(taille: number): Mot {
  let r = [];
  for (let i = 0; i < taille; i++) {
    r.push(entierAleatoire(2));
  }
  return mot(r);
}

/**
 * Test de l'égalité de deux mots.
 * @param premier mot
 * @param second mot
 * @returns true si les mots sont égaux, faux sinon.
 */
export function egaliteMots(mot1: Mot, mot2: Mot): boolean {
  if (mot1.taille() !== mot2.taille()) {
    return false;
  }
  for (let i = 0; i < mot1.taille(); i++) {
    if (mot1.bit(i) !== mot2.bit(i)) {
      return false;
    }
  }
  return true;
}

