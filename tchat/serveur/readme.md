# Serveur de tchat en étoile

- Répertoire des scripts : `scripts`
- Application à servir : `html/appliTchatEtoile.html` à l'adresse `localhost:8080/tchat/code/etoile`
- Réseau de 3 tchats avec coco, lulu et zaza.
- POST en `/tchat/code/etoile/envoi`.
    - erreur notifiée au client si le format JSON du message reçu n'est pas correct.
    - erreur si un des destinataires n'est pas un voisin.
    - avertissement si un des destinataires n'est plus connecté.
    - filtrage des destinataires, des voisins actifs.
    - transformation du message envoyé par le client en un accusé de réception et un tableau de messages en transit.
    - envoi de l'accusé de réception et des messages en transit.
- GET persistant en `/tchat/code/etoile/reception`
    - avertissement notifié au client lorsque la connexion est impossible, tous les sommets étant actifs.
    - activation d'un sommet et envoi de la configuration initiale.
    - diffusion de la nouvelle configuration aux voisins actifs.
    - enregistrement du traitement lors de la déconnexion : 
      - inactivation du sommet,
      - diffusion de la nouvelle configuration aux voisins actifs. 
