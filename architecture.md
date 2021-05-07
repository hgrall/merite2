# Protocole général

Interaction initiale
- navigateur -> serveur : demande de la page d'accueil avec formulaire du code d'accès
- serveur -> navigateur : envoi de la page d'accueil 

Page d'accueil
- accueil : affichage de la page d'authentification par un code d'accès
- accueil -> serveur : vérification du code entré
- serveur : vérification de la validité du code d'accès en s'appuyant sur une variable d'environnement sous  heroku (ou des constantes localement)
  - si le code est valide, pour le premier code reçu :
    - initialisation des jeux associés à ce code, spécifique de chaque école : par jeu, une configuration, un réseau
    - initialisation des serveurs de connexion (un serveur par jeu) : par serveur, un port (à vérifier, l'usage d'un port unique semblant possible), un réseau de noeuds à connecter, initialement complet, un réseau de neuds connectés, initialement vide
- serveur -> accueil : envoi du résultat de la vérification du code
- accueil : 
  - si le code n'est pas valide, affichage d'alerte avec le message d'erreur
  - si le code est valide, affichage du menu permettant de choisir le jeu (la partie d'administration pouvant être placée dans une page dédiée, permettant de modifier la configuration des jeux, de les réinitialiser et d'observer leur état)
- accueil -> serveur : demande d'un jeu
- serveur -> accueil : envoi d'un jeu (sans aucune vérification, pour simplifier)

Jeu
- jeu : au montage, en vue de l'établissement d'une connexion longue avec le serveur, enregistrement des traitements suivant le type des évènements reçus
  - configuration locale initiale
  - informations liées aux connexions au jeu
  - messages du jeu
  - erreurs éventuelles
- jeu -> serveur : demande de connexion longue
- serveur : enregistrement des traitements à l'ouverture, à la fermeture 
  - à l'ouverture, si possible, retrait d'un noeud du réseau à connecter (associé au code et au jeu) et ajout d'un noeud dans le réseau connecté
  - à la fermeture, retrait du noeud du réseau connecté (associé au code et au jeu) et ajout du noeud dans le réseau à connecter
- serveur -> jeu : accusé de réception de la connexion longue
- serveur -> jeu : envoi de la configuration initiale et des informations de connexion si l'ajout au réseau est possible, d'un message d'erreur sinon
- serveur -> autres jeux : diffusion des informations de connexion et de déconnexion 
- jeu source -> serveur : envoi d'un message de jeu
- serveur : vérification du message suivant le protocole associé au jeu
- serveur -> jeu destinataire : si le message est valide, transfert du message reçu en utilisant la connexion longue 
- serveur -> jeu source : si le message est invalide, envoi d'un message d'erreur

# Composants

TODO (à actualiser) Serveur d'applications - Voir `bibliotheque/communication/serveurApplications`
- servir une application (html + js) en enregistrant le traitement d'une requête GET
- servir une API (json) en enregistrant le traitement de requêtes GET, PUT ou POST
- servir des connexions longues en enregistrant les traitements à l'ouverture, la fermeture et en permettant la communication du serveur vers le client
- contrôler l'accès
- générer des serveurs de connexions agrégeant ce serveur d'applications
- démarrer en écoutant un port
  
Noeud (correspondant à un client)
- identifiant
- information (de type variable): configuration initiale, canal, etc.  

Graphe
- liste de noeuds
- table associant à un noeud ses voisins (une liste de noeuds)
- ajouter un noeud (liste et table à mettre à jour)
- retirer un noeud (liste et table à mettre à jour)
- composante connexe (liste de noeud)

Réseau associé à un jeu
- un graphe virtuel `GV`, formé de noeuds à connecter, intialement total
- un graphe réel `GR`, formé de noeuds connectés, initialement vide
- traitement à l'ouverture d'une connexion longue
  1. mise à jour des graphes : `GV--`, `GR++` - générique
  2. enregistrement de la connexion longue dans le graphe réel `GR` - générique
  3. envoi à tous les autres clients de la composante connexe de l'information de connexion - spécifique au graphe
  4. envoi au client de sa configuration initiale - spécifique au jeu
- traitement à la fermeture de la connexion longue
  1. mise à jour des graphes : `GV++`, `GR--` - générique
  2. envoi à tous les autres clients de la composante connexe de l'information de déconnexion - spécifique au graphe
- protocole de communication   
  - utilisation d'un service POST et du graphe réel pour communiquer

