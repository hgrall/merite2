Types : répertoire de types utiles

# Conversion en JSON

# La bibliothèque 

## Enveloppe - Vérifié

`TypeEnveloppe` : Type parent de tous les types ou presque de l'application. Il fournit des méthodes de représentation, sous la forme de chaînes de caractères ou de JSON. Il définit une enveloppe d'un état, d'un type JSON ou non. Il est paramétré par deux types :
- le type de l'état, qui doit être convertible en JSON,
- le type JSON de représentation du type, utilisé par la méthode `toJSON`.

Si le type de l'état n'est pas du JSON, il doit comporter une méthode `toJSON()`. 

L'implémentation abstraite `Enveloppe` peut être étendue pour définir une implémentation d'une interface héritant de l'interface `TypeEnveloppe`. Ce n'est pas nécessaire mais pratique lorsqu'on dispose d'un type à la JSON pour l'état.  

## Dates - Vérifié

Type représentant des dates en Français.

## Identifiants - Vérifié

Types JSON représentant les identifiants. La liste des sortes autorisées d'identifiants doit être mise à jour. L'interface `FormatIdentifiable` doit être utilisée pour les types qu'on veut identifier : elle fournit un champ `ID` pour un identifiant. Un générateur d'identifiants par compteur est aussi fourni.

## Nombres - Vérifié

Fonctions numériques diverses : représentation normale en complétant avec des zéros à gauche, tirage aléatoire.

## Option - Vérifié

Une option est soit vide, soit pleine, contenant alors une valeur.

## Table

Une table associe à une clé (de type `string`) une valeur. Il existe une version mutable et une version immutable.

Usage
- 