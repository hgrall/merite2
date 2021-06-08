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
 * @param J type JSON pour représenter l'état
 * @param E étiquettes utiles pour une représentation (cf. le méthode net).
 *
 */
export interface TypeEnveloppe<T, J, E extends string> {
    /**
     * Valeur de l'état.
     */
    etat(): T;
    /**
     * Représentation brute de l'état. 
     * @returns une chaîne représentant l'état.
     */
    brut(): string;
    /**
     * Représentation paramétrée spécifique.
     * @param etiquette une étiquette
     * @returns une chaîne de représentation.
     */
    net(etiquette: E): string;
    /**
     * Une représentation spécifique jugée utile .
     * @returns une chaîne de représentation.
     */
    representation(): string;
    /**
     * Une représentation JSON de l'état.
     */
    toJSON() : J;
}

/**
 * Modèle générique pour une enveloppe sérialisable d'un état. Si le type T n'est pas un type JSON, il doit contenir une méthode toJSON():TEX, où TEX est un type JSON permettant de représenter les T.
 * @param T type de l'état
 * @param E étiquettes utiles pour une représentation (cf. le méthode net).
 */
export abstract class Enveloppe<T, J, E extends string> implements TypeEnveloppe<T, J, E> {

    /**
     * Constructeur appelé par les sous-classes. 
     * Attention : si l'état est mutable,
     * bien noter qu'il est partagé entre l'appelant 
     * du constructeur et l'instance construite.
     * @param etat valeur initiale de l'état
     */
    constructor(protected _etat: T) {
    }
    /**
     * Valeur de l'état.
     */
    etat(): T {
        return this._etat;
    }
    /**
     * Représentation de l'état par une chaîne.
     * C'est la méthode toJSON() qui est appelée puis 
     * JSON.stringify.
     * @returns une chaîne représentant le document JSON.
     */
    brut(): string {
        return JSON.stringify(this);
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
    /**
     * Une représentation JSON de l'état.
     */
    abstract toJSON() : J;
}


