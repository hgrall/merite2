/**
 * Représentation d'un entier n en complétant à gauche avec des 0 si besoin.
 * @param n entier à représenter.
 * @param taille taille minimale à obtenir pour la représentation.
 * @param base base utilisée pour la représentation
 * @returns une représentation en base 'base' de l'entier n, avec au moins 'taille' chiffres.
 */
export function normalisationNombre(n : number, taille : number, base : number = 10) : string {
    let r = n.toString(base);
    while(r.length < taille){
        r = "0" + r;
    }
    return r;
}

/**
 * Nombre tiré aléatoirement dans [0,max]. 
 * @param max la borne supérieure de l'intervalle (précondition : max >= 0).
 * @returns un entier naturel entre 0 et max.
 */
export function entierAleatoire(max: number): number {
	return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Quotient de la division eudlidienne.
 */
export function quotient(numerateur : number, denominateur : number) : number {
    return Math.floor(numerateur / denominateur);
}