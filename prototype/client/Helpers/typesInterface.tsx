import { Couleur } from "../../../bibliotheque/interface/couleur";
import { Identifiant } from "../../../bibliotheque/types/identifiant";
import {Tableau} from "../../../bibliotheque/types/tableau";

export interface Individu {
  readonly ID: Identifiant<'sommet'>;
  readonly nom: string;
  readonly fond: Couleur;
  readonly encre: Couleur;
  readonly inactif:boolean;
}

export interface ToutIndividu {
  readonly IDVoisins: Tableau<Identifiant<'sommet'>>;
  readonly nom: string;
  readonly fond: Couleur;
  readonly encre: Couleur;
  readonly inactif:boolean;
}

export interface Message {
  readonly ID: Identifiant<'message'>;
  readonly emetteur: Individu;
  readonly destinataire: Individu|ToutIndividu;
  readonly cachet: string;
  readonly contenu: string;
  readonly accuses: Couleur[]; // Couleurs des individus destinataires
}

