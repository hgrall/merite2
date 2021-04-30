/**
 * Interface pour les enveloppes. Type parent des types et classes développés
 * décrivant leur représentation et leur sérialisabilité.
 * Elle pourrait être complétée par :
 * - une méthode pour tester l'égalité,
 * - une méthode pour calculer une valeur de hachage.
 *
 * Le type TEX est immutable : son usage dans l'interface n'est donc pas
 * restreint. Il est utilisé pour la sérialisation au format JSON.
 *
 * Cette interface est implémentée par "Enveloppe".
 *
 * @param TEX type de sortie pour la sérialisation
 *        (format JSON en lecture seulement).
 * @param E étiquettes utiles pour une représentation (cf. le méthode net).
 *
 */
export interface TypeEnveloppe<TEX, E extends string> {
    /**
     * Conversion de l'état en une valeur sérialisable.
     */
    val(): TEX;
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
 * Modèle générique d'une enveloppe d'un état. Classe mère de la plupart des classes développées.
 * Elle pourrait être complétée par :
 * - une méthode pour tester l'égalité,
 * - une méthode pour calculer une valeur de hachage.
 *
 * Le type TIN peut être au format JSON ou non, 
 * être mutable ou non : s'il est mutable, il est confiné.
 * Ainsi, toute méthode ayant une occurrence positive 
 * de TIN est protected.
 * En effet, elle pourrait permettre d'obtenir l'état mutable et 
 * de réaliser un effet de bord sur l'état s'il est mutable. C'est aux sous-classes de contrôler le confinement souhaité.
 * Le type TEX est immutable : son usage n'est donc pas restreint. 
 * Il est utilisé pour la sérialisation au format JSON.
 *
 * Cette classe abstraite doit être étendue. 
 * Pour l'extension, procéder ainsi :
 * - définir une interface pour un type de données, 
 * par dérivation de TypeEnveloppe,
 * - définir le type TIN pour représenter l'état, 
 * le type TEX pour le format de sérialisation et
 * le type E pour les étiquettes utiles pour représenter ces données,
 * - définir une classe implémentant cette interface 
 * par héritage de Enveloppe, avec un constructeur appelant le
 *  constructeur parent en précisant la fonction 
 * de conversion de TIN vers TEX,
 * - implémenter les méthodes de l'interface et 
 * les méthodes abstraites de Enveloppe (net et représenter),
 * - définir des fabriques utiles appelant le constructeur.
 * @param TIN type d'entrée utilisé pour représenter l'état.
 * @param TEX type de sortie pour la sérialisation (format JSON en lecture seulement).
 * @param E étiquettes utiles pour une représentation (cf. le méthode net).
 *
 */

export abstract class Enveloppe<TIN, TEX, E extends string> implements TypeEnveloppe<TEX, E> {
    /**
     * Représentation de l'état par un seul attribut, une structure.
     */
    private structure: TIN;
    /**
     * Attribut définissant la fonction de conversion de TIN vers TEX.
     */
    protected etatEnVal: (x: TIN) => TEX;

    /**
     * Constructeur appelé par les sous-classes. Attention : si l'état est mutable,
     * bien noter qu'il est partagé entre l'appelant du constructeur et l'instance construite.
     * @param etatEnVal fonction de conversion de TIN vers TEX
     * @param etat valeur initiale de l'état
     */
    constructor(etatEnVal: (x: TIN) => TEX, etat: TIN) {
        this.structure = etat;
        this.etatEnVal = etatEnVal;
    }
    /**
     * Accesseur en lecture à l'état, protégé.
     * @returns l'état
     */
    protected etat(): TIN {
        return this.structure;
    }
    /**
     * Conversion de l'état en une valeur sérialisable.
     */
    val(): TEX {
        return this.etatEnVal(this.structure);
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
