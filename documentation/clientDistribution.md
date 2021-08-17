##Architecture generale

Tout le code concernant le client du jeu "distribution" se trouve sous le dossier `distribution/client`. Le fichier `corps.tsx` est le point d'accès à tous les composants associés a ce jeu. 

Le client est divisé en deux panneaux principaux. D'abord on peut trouver le panneau admin. Ce panneau contient toute l'information associée à la configuration du jeu (Domaine de l'utilisateur et son nom, ses domaines voisins, et le nombre de joueurs actifs dans le domaine). 

L'autre panneau principal est le panneau messages. Ce panneau est divisé en deux zones: il y a d'une part un container qui affiche tous les messages reçus et envoyés et d'autre part le formulaire qui est le champ de texte duquel on peut s'appuyer pour écrire les messages à envoyer.

De plus, il y a d'autres dossiers avec le reste des composants du client, parmi ces dossiers on trouve :
    
- Avis : Ce sont des alertes qui peuvent être utilisées pendant le jeu, comme l'avis de gain ou de perte.
- Button : Dossier avec tous les boutons utilisés dans les autres composants.
- ChampDeTexte : Champ de texte où l'utilisateur peut écrire la trame binaire utilisée dans le jeu.
- Helpers : Dossier qui contient des méthodes utiles ou des definitions des types utilisés dans le client.
- Messages : Dossier avec les composants pour tous les états des messages possibles dans le jeu.

##Connexion avec le serveur :
L'échange des messages avec le serveur se fait via des requêtes http. 

### Réception de messages : 
Une fois le composant `Corps` créé, le client établit une connexion longue avec le serveur via un EventSource. Ce EventSource ou fluxDeEvenements permet la reception des messages du serveur. La réception de ces messages est gérée dans le `componentDidMount()` du `corps.tsx` en ajoutant un EventListener au FluxDeEvenements. Par exemple pour gérer la reception de la configuration, le code à utiliser est `this.fluxDeEvenements.addEventListener(TypeMessage.CONFIG, (e: MessageEvent) => {}` où `TypeMessage.CONFIG` est l'étiquette utilisée pour les messages de configuration envoyés par le serveur, et `e: MessageEvent` contient le message envoyé.

### Envoi de messages : 

Pour envoyer un message au serveur il faut faire une requête POST en utilisant la fonction requetePOST qui se trouve dans le fichier `bibliotheque/communication/communicationServeur.ts`. Cette requête crée un canal de communication différent au EventSource et n'est pas une connexion longue puisqu'elle est utilisée juste pour l'envoi d'un message. 


## Gestion de messages :

Chaque message reçu du serveur est sauvegardé dans la liste Informations dans `corps.tsx`. Chaque Information représente un message. Les messages uniques sont sauvegardés dans cette liste et changent d'etat (transite, verrouillé, transmis, etc, AR) selon l'état du jeu. Pour chaque message reçu du serveur la methode `mettreAJourInformation(message: FormatMessageDistribution, nouveauType: TypeMessageInformant): void` doit être appelée, cette méthode permet de mettre a jour la liste d'informations. Si la liste contient deja un message avec l'identifiant donné l'état du message est mis à jour sinon le nouveau message est ajouté.

La liste d'informations est affichée dans le PanneauMessages via des `ActionAffichable` chaque information est traitée et affichée selon son type correspondant. Tous les composants pour chaque type d'information différent se trouvent sous le dossier `Messages`.

## Ajout d'une nouvelle information :

Pour ajouter une nouvelle information il faut :

1. Si l'information provient de l'event stream établi avec le serveur il faut ajouter l'event listener qui la traite dans le `componentDidMount()` du `corps.tsx`

2. Une fois l'information reçue, il faut l'ajouter à la liste d'informations du 'Corps' via la methode `mettreAJourInformation(message: FormatMessageDistribution, nouveauType: TypeMessageInformant): void`

3. Pour afficher la nouvelle information il faut ajouter le nouveau composant de cette information dans le dossier `Messages`, puis dans PanneauMessages.tsx il faut gérer ce nouveau type d'information dans la fonction `baliseAction(a: ActionAffichable): JSX.Element {}` pour afficher le composant créé auparavant. 

4. Si le composant avec la nouvelle information a un bouton utilisé pour envoyer une information au serveur, il faut définir une fonction dans `Corps` qui fait l'appel POST pour se communiquer avec le serveur, puis il faut ajouter cette méthode dans le props de `PanneauMessages`, puis il faut l'ajouter dans le props du nouveau composant.   