import { Couleur } from "../../../bibliotheque/interface/couleur";
import { Identifiant } from "../../../bibliotheque/types/identifiant";
export interface Individu {
  readonly ID: Identifiant<'sommet'>;
  readonly nom: string;
  readonly fond: Couleur;
  readonly encre: Couleur;
}

export interface Message {
  readonly ID: Identifiant<'message'>;
  readonly emetteur: Individu;
  readonly destinataires: Individu[];
  readonly cachet: string;
  readonly contenu: string;
  readonly accuses: Couleur[]; // Couleurs des individus destinataires
}

