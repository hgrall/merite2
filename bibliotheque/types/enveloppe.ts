/**
 * Interface pour les enveloppes. 
 * Type parent des types et classes développés décrivant l'état et
 * sa représentation.
 * Elle pourrait être complétée par :
 * - une méthode pour tester l'égalité,
 * - une méthode pour calculer une valeur de hachage.
 *
 * Le type T représente l'état. Il peut être immutable ou non. 
 * Il est structuré, souvent au format JSON. Dans ce cas, 
 * il peut être utilisé pour la sérialisation.
 *
 * Cette interface est implémentée par "Enveloppe".
 *
 * @param T type de l'état
 * @param E étiquettes utiles pour une représentation (cf. le méthode net).
 *
 */
export interface TypeEnveloppe<T, E extends string> {
    /**
     * Valeur de l'état.
     */
    val(): T;
    /**
     * Représentation en JSON de l'état après conversion.
     * @returns une chaîne représentant le document JSON.
     */
    brut(): string;
    /**
     * Représentation paramétrée spécifique.
     * @param etiquette une étiquette
     * @returns une chaîne de représentation.
     */
    net(etiquette: E): string;
    /**
     * Une représentation jugée utile spécifique.
     * @returns une chaîne de représentation.
     */
    representation(): string;
}

/**
 * Modèle générique pour une enveloppe sérialisable d'un état. Si le type T n'est pas un type JSON, il doit contenir une méthode toJSON():TEX, où TEX est un type JSON permettant de représenter les T.
 * @param T type de l'état
 * @param E étiquettes utiles pour une représentation (cf. le méthode net).
 */
export abstract class Enveloppe<T, E extends string> implements TypeEnveloppe<T, E> {

    /**
     * Constructeur appelé par les sous-classes. 
     * Attention : si l'état est mutable,
     * bien noter qu'il est partagé entre l'appelant 
     * du constructeur et l'instance construite.
     * @param etat valeur initiale de l'état
     */
    constructor(private etat: T) {
    }
    /**
     * Valeur de l'état.
     */
    val(): T {
        return this.etat;
    }
    /**
     * Représentation en JSON de l'état après conversion.
     * @returns une chaîne représentant le document JSON.
     */
    brut(): string {
        return JSON.stringify(this.val());
    };
    /**
     * Représentation paramétrée à implémenter.
     * @returns une chaîne de représentation.
     */
    abstract net(etiquette: E): string;
    /**
     * Une représentation jugée utile à implémenter.
     * @returns une chaîne de représentation.
     */
    abstract representation(): string;
}


