Jeu de distribution - Description de la structure générale et du protocole de communication

# Consigne

- adresse du domaine
- utilisateur destinataire
- mot binaire à envoyer (le premier et le dernier étant des zéros pour rendre flou les limites)
- taille de la trame : 
      taille(|domaine|) + Max(taille(|utilisateursParDomaine|)) 
    + INUTILES_TRAME + COEUR_TRAME, soit TRAME bits

# Réseau

- sommets : utilisateurs ou domaines
  - utilisateur
    - identifiant
    - drapeau d'activité
    - nom binaire
    - consigne 
  - domaine
    - identifiant
    - drapeau d'activité
    - nom binaire

- Domaines en anneau
- Utilisateurs en étoile autour d'un domaine

# Protocole de communication

Formulation chimique
- !X : signifie que X est persistant.
  - !X & A -> B équivalent à : X & A -> X & B

## Hypothèses

Pannes envisagées
- perte de message
- non préservation de l'ordre d'émission à réception, lors de la communication du serveur à un client

Hypothèses pour la définition du protocole
- aucune perte de messages
- préservation à réception de l'ordre d'émission pour les communications du serveur à un client 

Le protocole http ne garantit aucune de ces propriétés. Cependant, la plupart du temps, ces propriétés sont vérifiées.

Détection des pannes 
- Si une panne est observée, elle doit être signalée au serveur.

Tolérance aux pannes - Actuellement non implémentée.
- Lorsqu'une panne est signalée, le serveur doit restaurer l'état de chaque utilisateur du domaine de l'utilisateur ayant signalé la panne.
- Etat du serveur : pour chaque domaine, la liste des messages présents, et pour chaque utilisateur, l'envoi et les tentatives d'interprétations, réussies ou non. 

## Client (un utilisateur dans un domaine)

### Canaux 

Fournis
- ok `accuserEnvoi[idEmetteur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)` 
- ok `recevoir[idEmetteur](idMsg, idEmetteur, idDomOrigine, idDomDestination, contenu)`
- ok `accuserSuccesVerrouiller[idVerrouilleur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)` 
- ok `accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `inactiver[idUtil](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `libérer[idUtil](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)`
- ok `informerTransmission(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok? `gagner(idMsg, idEmetteur, idDomOrigine, idDomVerrouilleur, interprétation)`
- ok? `perdre(idMsg, idEmetteur, idDomOrigine, idDomVerrouilleur, essaiInterprétation)`

Requis
- ok `envoyer(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)`
- ok `verrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `déverrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `transmettre(idMsg, idVerrouilleur, idDomVerrouilleur, idDomDest, contenu)`
- ok? `vérifier(idMsg, idVerrouilleur, idDomOrigine, idDomVerrouilleur, contenu)`

### Etat

Compteur pour l'identification des messages
- `IdentificationMsg(n, idMsg)` : `idMsg` identifie le `n`-ième message.

Identité de l'utilisateur et de son domaine
- `!Utilisateur(idUtil, idDom)` 

Ensemble de messages avec des statuts différents 
- ok `Transit(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)*`
- ok `Verrouillable(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)*`
- ok `Actif(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)*`
- ok `Inactif(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)*`
- ok `Transmis(idMsg, idUtil, idDomOrigine, idDomDest, contenu)*` 
- ok `Envoi(idMsgClient, idUtil, idDomOrigine, idDomDest, contenu)`
- ok `AREnvoi(idMsgServeur, idUtil, idDomOrigine, idDomDest, contenu)`
- ok? `Essai(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)*`
- ok? `Gain(idMsg, idGagnant, idDomOrigine, idDomGagnant, interprétationCorrecte)*`
- ok? `Perte(idMsg, idPerdant, idDomOrigine, idDomPerdant, interprétationIncorrecte)*`

Actions sur les messages
- état `Actif` : 
  - transmettre
  - vérifier (après interprétation)
  - déverrouiller
- état `Transit` :
  - ok verrouiller
- état `Verrouillable` : 
  - ok aucune action
- état `Inactif`:
  - ok aucune action
- états `Envoi`, `AREnvoi`:
  - ok aucune action
- états `Transmis, Gain, Parte, Essai` :
  - omettre  
  
### Entrées

interactions avec l'utilisateur

- ok `EntréeEnvoi(idDomDest, contenu)`
- ok `EntréeVerrouillage(idMsg)`
- ok `EntréeDéverrouillage(idMsg)`
- ok `EntréeTransmission(idMsg, idDomDest)`
- ok? `EntréeInterprétation(idMsg, contenu)`

- `EntréeIgnorer(idMsg)`

### Règles

ok Vérifié - Envoi
```
  // L'utilisateur demande au serveur de transmettre le message qu'il doit envoyer
  //   (a priori un unique message), après avoir indiqué le domaine voisin
  //   destinataire et le contenu.
      !Utilisateur(idEmetteur, idDomOrigine) 
    & EntréeEnvoi(idDomDest, contenu) 
    & ¬Envoi(...)
    & Identifiant(n, idMsg)
  ->  envoyer(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu) 
    & Envoi(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu) 
    & Identifiant(n+1, idMsg')
```

ok Vérifié - Envoi - Accuser réception
```
  // L'utilisateur affiche l'accusé de réception de son message initial. 
  // L'identifiant du message devient celui du serveur.
      accuserEnvoi[idUtil](idMsgS, idEmetteur, idDomOrigine, idDomDest, contenu)
    & Envoi(idMsgC, idEmetteur, idDomOrigine, idDomDest, contenu) 
  ->  AREnvoi(idMsgS, idEmetteur, idDomOrigine, idDomDest, contenu)
```

ok - Vérifié - Envoi - Recevoir en Transit
```
  // L'utilisateur reçoit un message du serveur et le place en transit. Les autres
  // utilisateurs du domaine 'dom' ont reçu le même message.
      recevoir[idUtil](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu) 
    & !Utilisateur(idUtil, idDomDest)
  ->  Transit(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
```

ok Vérifié - Verrouiller
```
  // L'utilisateur demande au serveur de verrouiller un message en transit.
      Transit(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu) 
    & EntréeVerrouillage(idMsg)
    & !Utilisateur(idVerrouilleur, idDomDest) 
  ->  verrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)
    & Verrouillable(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu) 
```

ok Vérifié - Verrouiller - Succès
```
  // L'utilisateur active un message après un verrouillage réussi côté serveur.
      accuserSuccesVerrouiller[idVerrouilleur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
    & !Utilisateur(idVerrouilleur, idDomDest)
    & Verrouillable(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
  ->  Actif(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
```

ok Vérifié - Verrouiller - Echec (403) - Remarque : si le message n'est pas déjà inactif, alors une erreur de communication est survenue : l'ordre des messages n'a pas été préservé.
```
  // L'utilisateur reçoit du serveur une notification d'échec de verrouillage.
      accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)
    & & !Utilisateur(idCandidatVerrouilleur, idDomDest)
    & Inactif(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu) // Nécessairement, le message est inactif.
  ->  Inactif(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu) 
```

ok Vérifié - Verrouiller - Inactiver après succès
```
  // L'utilisateur reçoit un message d'inactivation, suite au verrouillage par un autre utilisateur.
      inactiver[idUtil](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu) 
    & !Utilisateur(idUtil, idDomDest)
    & (Transit(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)  
        | Verrouillable(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu))
  ->  Inactif(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)  
```

ok Vérifié - Déverrouiller
```
  // L'utilisateur demande au serveur de déverrouiller le message.
      Actif(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu) 
    & EntréeDéverrouillage(idMsg)
    & !Utilisateur(idUtil, idDomDest) 
  ->  déverrouiller(idMsg, idUtil, idDomOrigine, idDomDest, contenu) 
    & Transit(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu) 
```

ok Vérifié - Déverrouiller - Libérer
```
  // L'utilisateur reçoit un message d'inactivation, suite au verrouillage par un autre utilisateur.
      libérer[idUtil](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)  
    & !Utilisateur(idUtil, idDomDest)
    & Inactif(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)  
  ->  Transit(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)  
```

ok Vérifié - Transmettre
```
  // L'utilisateur demande au serveur de transmettre un message en transit
  // à la destination indiquée (un domaine voisin).
      Actif(idMsg, idEmetteur, idDomOrigine, idDom, contenu) 
    & EntréeTransmission(idMsg, idDomDest)
    & !Utilisateur(idUtil, idDom) 
  ->  transmettre(idMsg, idUtil, idDom, idDomDest, contenu)
    & Transmis(idMsg, idUtil, idDomOrigine, idDomDest, contenu) 
```

ok Vérifié - Transmettre - Informer les autres utilisateurs de la transmission.
```
  // L'utilisateur demande au serveur de transmettre un message en transit
  // à la destination indiquée (un domaine voisin).
      informerTransmission(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)
    & Inactif(idMsg, idVerrouilleur, idDomOrigine, idDom, contenu) 
  ->  Transmis(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu) 
```

ok Vérifié - Vérifier - Envoyer au serveur une interprétation.
```
  // L'utilisateur demande au serveur de vérifier que son interprétation du message est correcte.
      Actif(idMsg, idEmetteur, idDomOrigine, idDom, contenu) 
    & EntréeInterprétation(idMsg, interprétation)
    & !Utilisateur(idUtil, idDom) 
  ->  vérifier(idMsg, idUtil, idDomOrigine, idDom, interprétation)
    & Essai(idMsg, idEmetteur, idDomOrigine, idDom, contenu) 
```

ok Vérifié? - Vérifier - Gagner par une interprétation correcte.
```
      gagner(idMsg, idEmetteur, idDomOrigine, idDom, interprétation)
    & !Essai(idMsg, idEmetteur, idDomOrigine, idDom, contenu) 
    & !Utilisateur(idUtil, idDom) 
  ->  Gain(idMsg, idUtil, idDomOrigine, idDom, interprétation) 
```

ok Vérifié? - Vérifier - Informer les autres du gain.
```
      gagner(idMsg, idEmetteur, idDomOrigine, idDom, interprétation)
    & Inactif(idMsg, idVerrouilleur, idDomOrigine, idDom, contenu) 
  ->  Inactif(idMsg, idEmetteur, idDomOrigine, idDom, contenu)   
    & Gain(idMsg, idVerrouilleur, idDomOrigine, idDom, interprétation) 
```

ok Vérifié? - Vérifier - Perdre par une interprétation incorrecte.
```
      perdre(idMsg, idEmetteur, idDomOrigine, idDom, interprétation)
    & Essai(idMsg, idEmetteur, idDomOrigine, idDom, contenu) 
    & !Utilisateur(idUtil, idDom) 
  ->  Perte(idMsg, idUtil, idDomOrigine, idDom, interprétation)
    & Transit(idMsg, idEmetteur, idDomOrigine, idDom, contenu)  
```

ok Vérifié? - Vérifier - Informer les autres de la perte.
```
      perdre(idMsg, idEmetteur, idDomOrigine, idDom, interprétation)
    & Inactif(idMsg, idVerrouilleur, idDomOrigine, idDom, contenu) 
  ->  Transit(idMsg, idEmetteur, idDomOrigine, idDom, contenu)   
    & Perte(idMsg, idVerrouilleur, idDomOrigine, idDom, interprétation) 
```

## Serveur

### Canaux 

Fournis
- ok `envoyer(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)`
- ok `verrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `déverrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`  
- ok `transmettre(idMsg, idVerrouilleur, idDomVerrouilleur, idDomDest, contenu)`
- ok? `vérifier(idMsg, idVerrouilleur, idDomOrigine, idDomVerrouilleur, contenu)`

Requis
- ok `accuserEnvoi[idEmetteur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)` 
- ok `recevoir[idEmetteur](idMsg, idEmetteur, idDomOrigine, idDomDestination, contenu)`
- ok `accuserSuccesVerrouiller[idVerrouilleur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)` 
- ok `accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `inactiver[idUtil](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `libérer[idUtil](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)`
- ok `informerTransmission(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok? `gagner(idMsg, idEmetteur, idDomOrigine, idDomVerrouilleur, interprétation)`
- ok? `perdre(idMsg, idEmetteur, idDomOrigine, idDomVerrouilleur, essaiInterprétation)`

### Etat

ok Compteur pour l'identification des messages
- `IdentificationMsg(n, idMsg)` : `idMsg` identifie le `n`-ième message.

ok Table des messages par domaine indiquant le contenu des messages et le possible verrouillage
- `TableMessages(idDomaine, idMsg, type, idUtil, idDomOrigine, idDomDest, contenu, verrou? : PERSONNE | idUtilisateur)`

ok Diffusion générique d'un message à une liste d'utilisateurs d'un domaine via le canal `k`
- `Diffusion[k](idMsg, idDomaineOrigine, idDomaineDestination, contenu, listeUtilisateurs)` : ajout de la liste pour réaliser une itération sur ses éléments.

ok Réseau
- `ReseauAnneau(idDomaine, idDomaine)` : domaines en anneau
- `ReseauEtoile(idDom, listeUtil)` : utilisateurs en étoile autour d'un domaine

Table donnant le message à recevoir par utilisateur
- `MessageARecevoir(idUtilisateurDestinataire, contenu)`

### Règles

ok Vérifié Diffuser - Diffusion générique sur le canal `k` (dépendant de l'utilisateur).
```
  // Récurrence sur les utilisateurs de la liste lu. ok
      Diffusion[k](idMsg, idUtil, origine, dest, contenu, u::lu)
  ->  Diffusion[k](idMsg, idUtil, origine, dest, contenu, lu) 
    & k[u](idMsg, idUtil, origine, dest, contenu) 

      Diffusion[k](idMsg, idUtil, origine, dest, contenu, nil) 
  ->  vide
```

ok Vérifié - Envoyer - Accuser réception et diffuser en transit.
```
  // A réception du message initial, le serveur accuse réception et initie la transmission
  // en autorisant le verrouillage pour le domaine destinataire puis
  // en démarrant la diffusion du message aux utilisateurs. 
      envoyer(idMsgC, idEmetteur, idDomOrigine, idDomDest, contenu)
    & IdentificationMsg(n, idMsgS)      // Nouvelle identification du message par le serveur
    & !ReseauEtoile(idDomDest, lu)
  ->  accuserEnvoi[idEmetteur](idMsgS, idEmetteur, idDomOrigine, idDomDest, contenu) // AR : même message que celui envoyé.
    & IdentificationMsg(n+1, idMsgS')   // Génération de idMsgS'
    & TableMessages(idDomOrigine, idMsgS, Envoi, idEmetteur, idDomOrigine, idDomDest, contenu)
    & TableMessages(idDomDest, idMsgS, Transit, idEmetteur, idDomOrigine, idDomDest, contenu, PERSONNE)
    & Diffusion[recevoir](idMsgS, idEmetteur, idDomOrigine, idDomDest, contenu, lu) // diffusion vers 'idDomDest'
```

ok Vérifié - Verrouiller - Accuser le succès et diffuser aux autres utilisateurs pour inactiver.
```
  // Le serveur verrouille le message à la demande d'un utilisateur et accuse réception.
      verrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu) 
    & TableMessages(idDomDest, idMsg, Transit, idEmetteur, idDomOrigine, idDomDest, contenu, PERSONNE)
    & !ReseauEtoile(dest, lu)
  ->  accuserSuccesVerrouiller[idVerrouilleur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)
    & TableMessages(idDomDest, idMsg, Transit, idEmetteur, idDomOrigine, idDomDest, contenu, idVerrouilleur)
    & Diffusion[inactiver](idMsg, Inactif, idVerrouilleur, idDomOrigine, idDomDest, contenu)
```

ok Vérifié - Verrouiller - Accuser l'échec
```
  // Le serveur ne verrouille pas le message si un utilisateur du
  //   domaine verrouille déjà le message. 
      verrouiller(idMsg, idCandidatVerrouilleur, idDomOrigine, idDomDest, contenu) 
    & !TableMessages(idDomDest, idMsg, Transit, idEmetteur, idDomOrigine, idDomDest, contenu, idVerrouilleur)
    & (idVerrouilleur != PERSONNE)
  ->  accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)
    & Diffusion[inactiver](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu, crible(lu, (u => u != idVerrouilleur)))
```

ok Vérifié - Déverrouiller - Diffuser aux autres utilisateurs pour libérer (aucun accusé).
```
  // Le serveur verrouille le message à la demande d'un utilisateur et accuse réception.
      déverrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu) 
    & TableMessages(idDomDest, idMsg, Transit, idEmetteur, idDomOrigine, idDomDest, contenu, idVerrouilleur)
    & !ReseauEtoile(idDomDest, lu)
  ->  TableMessages(idDomDest, idMsg, Transit, idEmetteur, idDomOrigine, idDomDest, contenu, PERSONNE)
    & Diffusion[libérer](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu, crible(lu, (u => u != idVerrouilleur)))
```

ok Vérifié - Transmettre - Diffuser au domaine destinataire le message en transit 
et informer les autres utilisateurs du domaine de la transmission
```
  // Le serveur transmet le message reçu s'il est verrouillé par l'émetteur.
      transmettre(idMsg, idVerrouilleur, idDomVerrouilleur, idDomDest, contenu)
    & TableMessages(idDomVerrouilleur, idMsg, Transit, idEmetteur, idDomOrigine, idDomVerrouilleur, contenu, idVerrouilleur)
    & !ReseauEtoile(idDomDest, luDest)
    & !ReseauEtoile(idDomVerrouilleur, luDom)
  ->  TableMessages(idDomDest, idMsg, Transit, idVerrouilleur, idDomVerrouilleur, idDomDest, contenu, PERSONNE)  
    & Diffusion[recevoir](idMsg, idVerrouilleur, idDomVerrouilleur, idDomDest, contenu, luDest) // diffusion en transit
    & TableMessages(idDomVerrouilleur, idMsg, Transmis, idVerrouilleur, idDomOrigine, idDomDest, contenu, PERSONNE)
    & Diffusion[informerTransmission](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu, crible(luDom, (u => u != idVerrouilleur)))) // diffusion pour informer les autres utilisateurs
```

ok Vérifié - Vérifier - Accuser le succès, en diffusant à l'auteur de l'interprétation et aux autres utilisateurs.
```
  // Le serveur vérifie que l'utilisateur interprète correctement le
  //   message si celui-ci est verrouillé par l'utilisateur et indique
  //   qu'il a gagné  le cas échéant.
      vérifier(idMsg, idVerrouilleur, idDomOrigine, idDomVerrouilleur, interprétation)
    & TableMessages(idDomVerrouilleur, idMsg, Transit, idEmetteur, idDomOrigine, idDomVerrouilleur, contenu, idVerrouilleur)
    & !MessageARecevoir(idVerrouilleur, interprétation)
    & !ReseauEtoile(idDomVerrouilleur, luDom)
  ->  Diffusion[gagner](idMsg, idEmetteur, idDomOrigine, idDomVerrouilleur, interprétation, luDom)
    & TableMessages(idDomVerrouilleur, idMsg, Gain, idEmetteur, idDomOrigine, idDomVerrouilleur, contenu, idVerrouilleur)
```

ok Vérifié - Vérifier - Accuser l'échec, en diffusant à l'auteur de l'interprétation et aux autres utilisateurs.
```
  // Le serveur vérifie que l'utilisateur interprète correctement le
  //   message si celui-ci est verrouillé par l'utilisateur et indique
  //   qu'il a gagné  le cas échéant.
      vérifier(idMsg, idVerrouilleur, idDomOrigine, idDomVerrouilleur, essaiInterprétation)
    & !TableMessages(idDomVerrouilleur, idMsg, Transit, idEmetteur, idDomOrigine, idDomVerrouilleur, contenu, idVerrouilleur)
    & !MessageARecevoir(idVerrouilleur, interprétation)
    & (essaiInterprétation != interprétation)
    & !ReseauEtoile(idDomVerrouilleur, luDom)
  ->  Diffusion[perdre](idMsg, idEmetteur, idDomOrigine, idDomVerrouilleur, essaiInterprétation, luDom)
    & TableMessages(idDomVerrouilleur, idMsg, Perte, idEmetteur, idDomOrigine, idDomVerrouilleur, essaiInterprétation, idVerrouilleur)
```



## TODO Traduction des canaux

Un canal se traduit pratiquement en
- une liaison via une connexion http
- un type de messages.

- Canaux du serveur
 - `envoyer(idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : INIT
 - `verrouiller(idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : VERROU
  
- Canaux du client
  - `accuserEnvoi[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : INIT
  - `recevoir[idUtilisateur](idMsg, idUtil, idDomOrigine, idDomDestination, contenu)` : TRANSIT
  - `accuserSuccesVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : VERROU
  - `accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)` : 403 VERROU
  - `inactiver[idUtil](idMsg)` : INACTIF



# ??? Message (immutable)

- ID : identité du message
- ID_utilisateur : identifiant d'un utilisateur, émetteur du message
  (dans le cas d'une communication client vers serveur) ou destinataire
  du message (dans le cas d'une communication serveur vers client)
- ID_origine : identifiant d'un domaine correspondant à l'origine du message
- ID_dest : identifiant d'un domaine correspondant à la destination du message
- type : INIT | VERROU | SUIVANT | ESSAI | LIBE | TRANSIT | ACTIF |
  GAIN | PERTE | DESTRUCT
- contenu : mot binaire de TRAME bits ou mot binaire de 7 bits
- date

## ??? Traitements 

- TODO initialisation (client vers serveur) - canal envoyer 
  - constructeur
  - INIT
  - identifiant du message inconnu
  - reste connu  
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine origine

- DONE diffusion (serveur vers client) - canal recevoir
  - méthode
  - TRANSIT
  - + identifiant du message
  - + utilisateur destinataire
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine destinataire

- DONE verrouillage (client vers serveur) - canal verrouiller
  - méthode 
  - VERROU
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine destinataire

- DONE destruction (serveur vers client) - canal détruire
  - méthode
  - DESTRUCT
  - + utilisateur destinataire
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine destinataire

- DONE echec du verrouillage (serveur vers client) - canal non décrit
  - méthode
  - ECHEC_VERROU
  - + utilisateur possédant le verrou
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine destinataire
    
- DONE activation (serveur vers client) - canal activer
  - méthode 
  - ACTIF
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine destinataire


- DONE essai (client vers serveur) - canal verifier
  - méthode
  - ESSAI
  - + mot binaire de 7 bits
  - invariant
    - mot de 7 bits
    - domaines voisins
    - utilisateur du domaine destinataire
    
- DONE transmission (client vers serveur) - canal transmettre
  - méthode
  - SUIVANT
  - + domaine de destination (entrée)
  - + domaine origine (ancien domaine de destination)
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine origine  

- DONE liberation (client vers serveur) - canal deverrouiller
  - méthode
  - LIBE
  - invariant
    - mot de TRAME bits
    - domaines voisins
    - utilisateur du domaine destinataire

- DONE gain (serveur vers client) - canal gagner
  - méthode 
  - GAIN
  - + utilisateur émetteur
  - + domaine émetteur
  - invariant
    - mot de 7 bits
    - utilisateur émetteur du domaine émetteur
    
- DONE perte (serveur vers client) - canal perdre
  - méthode
  - PERTE
  - invariant
    - mot de 7 bits
    - domaines voisins
    - utilisateur du domaine destinataire


## ??? Interface

- message actif : 
  - contenu 
  - trois boutons
    - libérer
    - transmettre
    - interpréter
- message en transit :
  - contenu
  - deux boutons
    - verrouiller
    - ignorer
      - confirmer
      - annuler

# ??? Erreur

- message
- date

# ??? Sur le peuplement des domaines et le réseau

- creerAnneau : Mot* -> Reseau
- PopulationParDomaine (Mutable)

