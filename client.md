##Architecture generale

Tout le code concernant le client du jeu distribution se trouve sous le dossier `distribution/client`. Le fichier `corps.tsx` est le point d'accès à tous les composants associes a ce jeu. 

Le client est divisé avec deux panneaux principaux. D'abord on peut trouver le panneau admin. Ce panneau contient toute l'information associée à la configuration du jeu (Domaine de l'utilisateur et son nom, ses domaines voisins, et le nombre de joueurs actifs dans le domain). 

L'autre panneau principal est le panneau messages. Ce panneau est divisé en deux zones, d'abord il y un container qui affiche tous les messages reçus et envoyés et puis il y a le formulaire qui est le champ de texte duquel on peut s'appuyer pour écrire les messages à envoyer.

##Connexion avec le serveur :
L'échange des messages avec le serveur se fait via des requêtes http. 

### Reception de messages : 
Une fois le composant `Corps` est créé le client établi une connexion longue avec le serveur via un EventSource. Ce EventSource ou fluxDeEvenements permet la reception des messages du serveur. La reception de ces messages est géré dans le `componentDidMount()` du `corps.tsx` en ajoutant un EventListener au FluxDeEvenements. Par example pour gérér la reception de la configuration le code à utiliser est `this.fluxDeEvenements.addEventListener(TypeMessage.CONFIG, (e: MessageEvent) => {}` où `TypeMessage.CONFIG` est l'étiquette utilisée pour les messages de configuration envoyés par le serveur, et `e: MessageEvent` contient le message envoyé.

### Envoi de messages : 

Pour envoyer un message au serveur il faut faire une requête POST. Ce requete cree un canal de communication different au EventSource et n'est pas une connexion longue puisque est utilisé juste pour l'envoi d'un message. 


## Gestion de messages :

Chaque message reçu du serveur est sauvegardé dans la liste Informations dans `corps.tsx`. Chaque Information represent un message. Les messages uniques sont sauvegardes dans cette liste et changent d'etat (transit, verrouillé, transmis, etc, AR) selon l'état du jeu. Pour chaque message reçu du serveur la methode `mettreAJourInformation(message: FormatMessageDistribution, nouveauType: TypeMessageInformant): void` doit être appelé, ce methode permet de mettre a jour la liste d'informations. Si la liste contient deja un message avec l'identifiant donné l'état du message est mis à jour sinon le nouveau message est ajouté.

La liste d'informations est affiché dans le PanneauMessages via des `ActionAffichable` chaque information est traité et affiché selon son type correspondant. Tous les composants pour chaque type d'information different se trouvent sous le dossier `Messages`.

## Ajout d'une nouvelle information :

Pour ajouter une nouvelle information il faut :

1. Si l'information provient de l'event stream établi avec le serveur il faut ajouter l'évent listener qui la traite dans le componentDidMount()` du `corps.tsx`

2. Une fois l'information est reçu il faut l'ajouter a la liste d'informations du 'Corps' via la methode `mettreAJourInformation(message: FormatMessageDistribution, nouveauType: TypeMessageInformant): void`

3. Pour afficher la nouvelle information il faut ajouter le nouveau composant de ce information dans le dossier `Messages`, puis dans PanneauMessages.tsx il faut gérer ce nouveau type d'information dans la fonction `baliseAction(a: ActionAffichable): JSX.Element {}` pour afficher le composant crée auparavant. 