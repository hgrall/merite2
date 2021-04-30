# Protocole général

Interaction initiale
- navigateur -> serveur : demande de la page d'accueil avec formulaire du code d'accès
- serveur -> navigateur : envoi de la page d'accueil

Page d'accueil
- accueil : affichage de service de authentication avec le code d'accès.
- accueil -> serveur : vérification du code entré
- serveur : Le serveur vérifie si le code d'entre est correct en s'appuyant des variables heroku
    - si le code est valide:
        - Initialisation des jeux du tchat et distribution associés à ce code (Le code est unique par école et permet de gérer la configuration des jeux désirée)
        - Assignation des ports à chaque serveur de connexion dédié à chaque jeu
        - Initialisation des serveurs de connexion avec leur configuration (Taille de réseau, son réseau )

- serveur -> accueil : envoi du résultat de la vérification du code
- accueil :
    - si le code n'est pas valide, affichage d'alerte avec le message d'erreur
    - si le code est valide, affichage du menu pour choisir parmi les différents jeux et le panneau d'administration (À voir extension pour changer la configuration du jeu et gérer les états du jeu)
- accueil -> serveur : demande d'un jeu
- serveur -> accueil :
    - si le réseau est incomplet envoi d'un jeu en fonction de la capacité des jeux actifs
    - si le réseau est complet envoi du message d'erreur

Jeu
- jeu : au montage, établissement d'une connexion longue avec le serveur et réception d'une configuration locale pour le jeu
    - jeu -> serveur : demande de connexion longue
        - serveur : retrait d'un nœud du réseau à connecter (associé au code et au jeu) et ajout d'un nœud dans le réseau connecté
        - jeu : enregistrement des traitements suivant le type des évènements reçus
            - configuration locale initiale
            - informations liées aux connexions au jeu (Notamment pour redirectionner les connexions avec la capacité de chaque jeu)
            - messages du jeu si le réseau est complet (pour le jeux de distribution il y existe plusieurs types différents des messages)
            - erreurs éventuelles
    - serveur -> jeu : envoi de la configuration initiale
    - serveur -> jeu : envoi des informations de connexion (Nombre d'utilisateurs connectés)
    - serveur -> jeu : envoi du nombre des connexions au tous les utilisateurs connectés au moment d'une nouvelle connexion au déconnexion.
    - jeu -> serveur : envoi du message de communication via requête POST
        - serveur : vérifie si les informations du message sont corrects et ses destinataires sont dans le réseau
        - serveur : redirection du message aux destinataires concernés
    - jeu -> serveur : déconnexion du jeu :
        - serveur: mise à jour du nombre d'utilisateurs actifs.
        - serveur: mise à jour du réseau connecté et à connecter.
        - serveur -> jeu : envoi du nombre des connexions à tous les utilisateurs connectées au jeu.

# Composants

Serveur d'applications - Voir `bibliotheque/communication/serveurApplications`
    - Point d'entrée de l'application
    - Hébergement de la page d'accueil et les pages des jeux
    - Création des serveurs de connexion des jeux de chaque école

 Serveur de connexions - Voir `bibliotheque/communication/serveurConnexions`
    - Traitement des connexions longues pour l'envoie des messages
    - Routage des messages envoyés en fonction de leur destinataires
    - Envoi des informations et configurations des jeux

