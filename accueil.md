#Acueil

Sous le dossier accueil on peut trouver le client des deux premiers écrans pour se connecter au jeu:

### - Écran de connexion : 
Permet l'obtention de la clé d’accès à travers du code d'accès. 

Cet écran est composé de deux écrans, une avec un formulaire où l'on tape le code d'accès et une autre où on peut récupérer la cle d'accès. La page à afficher est défini s'il le code d'accès de l'état du `Corps` est présent.

### Écran d'accueil : 

Permet l'affichage d'un menu avec des jeux associes a la clé d'accès. Cette partie et composé par deux écrans. Une où on tape la clé d'accès en utilisant le composant `AccessPage`, et une autre où on affiche les jeux associés a la clé d'accès avec le composant `JeuChoixPage`. Les jeux associés a chaque cle d'accès sont récupères via une requête d’authentication fait au serveur qui donne tous les informations de chaque jeu disponible. Actuellement, les jeux sont gérés via deux listes, une pour les jeux de tchat et autre avec les jeux de distribution. Ca pourrait être utile d'envoyer ces listes d'informations directement depuis le serveur pour pouvoir avoir un rendu plus adaptable.  Pour faire cela il faudrait changer `ConfigurationJeux` défini en `accueil/commun`. 
- Version actuelle :


    export interface ConfigurationJeux {
            tchat_etoile: ConfigurationJeuTchat
            tchat_anneau: ConfigurationJeuTchat
            distribution: ConfigurationJeuDistribution
    }
  
- Version adaptable:


    export interface ConfigurationJeux {
        jeuxTchat: ConfigurationJeuTchat[],
        jeuxDistribution: ConfigurationJeuDistribution[]
    }