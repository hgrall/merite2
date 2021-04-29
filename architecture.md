# Protocole général

Interaction initiale
- navigateur -> serveur : demande de la page d'accueil
- serveur -> navigateur : envoi de la page d'accueil 

Page d'accueil
- accueil : affichage de l'accès contrôlé par un code
- accueil -> serveur : vérification du code entré
- serveur : 
  - si le code est valide, pour le premier code reçu, initialisation des jeux associés à ce code (par jeu : configuration, réseau, serveur de connexions) 
- serveur -> accueil : envoi du résultat de la vérification du code
- accueil : 
  - si le code n'est pas valide, aucun changement
  - si le code est valide, affichage du menu
- accueil -> serveur : demande d'un jeu
- serveur -> accueil : envoi d'un jeu

Jeu
- jeu : au montage, établissement d'une connexion longue avec le serveur et réception d'une configuration locale pour le jeu
  - jeu -> serveur : demande de connexion longue
    - jeu : enregistrement des traitements suivant le type des évènements reçus
      - configuration locale initiale
      - informations liées aux connexions au jeu
      - messages du jeu
      - erreurs éventuelles
  - serveur -> jeu : accusé de réception de la connexion longue
  - serveur : si possible, retrait d'un noeud du réseau à connecter (associé au code et au jeu) et ajout d'un noeud dans le réseau connecté
  - serveur -> jeu : envoi de la configuration initiale 
  - serveur -> jeu : envoi des informations de connexion  

# Composants

Serveur d'applications - Voir `bibliotheque/communication/serveurApplications`
- 