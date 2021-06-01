/**
 * Type de cardinal un contenant ZERO (valant 0).
 * Remarque : Les enum sont des sous-types de number.
 */
export enum Unite { ZERO }
/**
 * Type de cardinal deux contenant ZERO et UN (valant 0 et 1 respectivement).
 * Remarque : Les enum sont des sous-types de number.
 */
export enum Deux {
    ZERO,
    UN
}

/**
 * Interface exprimant la propriété d'être mesurable et mutable.
 * Attributs :
 * - taille : entier naturel
 */
export interface MesurableMutable {
    taille: number
}

/**
 * Interface exprimant la propriété d'être mesurable.
 * Attribut :
 * - taille : entier naturel
 */
export interface Mesurable {
    readonly taille: number
}

/**
 * Interface exprimant la propriété d'être prioritarisable.
 * Attribut :
 * - priorité : entier naturel.
 */

export interface Prioritarisable {
    readonly priorite : number;
}

/**
 * Interface exprimant la propriété d'être activable.
 * Attribut :
 * - actif : booléen.
 */
export interface Activable {
    readonly actif : boolean;
}

/**
 * TODO inutile Interface exprimant la propriété d'être activable et mutable.
 * Attribut :
 * - actif : booléen.
 */
/*export interface ActivableMutable {
    actif : boolean;
}*/


/**
 * Fonction renvoyant une erreur exprimant l'impossibilité d'une exécution.
 * Le système de types attribue le type "never" à une expression
 * lorsqu'il s'agit de code inaccessible.
 * Exemple : code inaccessible après un filtrage exhaustif.
 *
 * Documentation :
 * - never is a subtype of and assignable to every type.
 * - No type is a subtype of or assignable to never (except never itself).
 * - In a function expression or arrow function with no return type annotation,
 *   if the function has no return statements, or only return statements with expressions of type never,
 *   and if the end point of the function is not reachable (as determined by control flow analysis),
 *   the inferred return type for the function is never.
 * - In a function with an explicit never return type annotation,
 *   all return statements (if any) must have expressions of type never and the end point of the function must not be reachable.
 *
 * @param x expression inaccessible
 */
export function jamais(x: never): never {
    throw new Error("* Erreur impossible : " + x);
}
