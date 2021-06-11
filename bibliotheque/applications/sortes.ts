import { Identifiant, identifiant } from "../types/identifiant";
import { Unite } from "../types/typesAtomiques";

/**
 * Ensemble des sortes pour les identifiants.
 * 
 * Définir un type union formé de singletons de type string. 
 * Les identifiants sont paramétrés par un type singleton appartenant
 * à cette union.
 */
export type SorteIdentifiant = 
"message" 
| "sommet"
| "consigne"
| "test"; 

