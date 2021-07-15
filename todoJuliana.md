# Tchat

## interface

- BUG - L'entrée du texte d'un message entraîne un petit mouvement des panneaux.
- AMELIORATION - Décaler à gauche les messages reçus et à droite les messages envoyés.

# Distribution

## Réseau 

- des domaines en anneau
- des utilisateurs en étoile autur d'un domaine

```
    dom 1 <-> dom 2 <-> dom3
                |
            ---------
            |   |   |
            U1  U2  U3              
```

- aucun lien direct entre les utilisateurs d'un même domaine

# Accueil

## Connexion

Le client, un administrateur, envoie son code d'accès. Le serveur vérifie le code et renvoie une clé d'accès, permettant d'accéder à deux tchats (anneau et étoile) et un jeu de distribution. Le client affiche la clé d'accès.

## Accueil

Le client, un joueur, envoie la clé d'accès. Le serveur vérifie la clé d'accès et renvoie une configuration des jeux, décrivant les caractéristiques des jeux, deux tchats (anneau et étoile) et un jeu de distribution. Le client affiche un menu proposant les jeux, éventuellment avec des informations associées aux jeux. 