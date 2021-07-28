#Acueil

Sous le dossier accueil on peut trouver le client des deux premiers écrans pour se connecter au jeu:

### - Écran de connexion : 
Permet l'obtention de la clé d’accès grâce au code d'accès. 

Cet écran est composé de deux écrans, une avec un formulaire où l'on tape le code d'accès et une autre où l'on peut récupérer la clé d'accès. La page à afficher est définie s'il le code d'accès de l'état du `Corps` est présent.

### Écran d'accueil : 

Permet l'affichage d'un menu avec des jeux associés à la clé d'accès. Cette partie et composé par deux écrans. Une où l'on tape la clé d'accès en utilisant le composant `AccessPage`, et une autre où l'on affiche les jeux associés à la clé d'accès avec le composant `JeuChoixPage`. Les jeux associés à chaque clé d'accès sont récupérés via une requête d’authentification faite au serveur qui donne tous les informations de chaque jeu disponible. Actuellement, les jeux sont gérés via deux listes, une pour les jeux de tchat et une autre pour les jeux de distribution. Ca pourrait être utile d'envoyer ces listes d'informations directement depuis le serveur pour pouvoir avoir un rendu plus adaptable. Pour faire cela il faudrait changer `ConfigurationJeux` défini en `accueil/commun`. 
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