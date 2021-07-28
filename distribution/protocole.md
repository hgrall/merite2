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
- ok `recevoir[idEmetteur](idMessage, idEmetteur, idDomOrigine, idDomDestination, contenu)`
- ok `accuserSuccesVerrouiller[idVerrouilleur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)` 
- ok `accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `inactiver[idUtil](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`

- `accuserDéverrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` 
- `libérer[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)`

- `gagner[idUtil](idMessage, idDom, contenu)`
- `perdre[idUtil](idMessage, idDom, contenu)`

Requis
- ok `envoyer(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)`
- ok `verrouiller(idMessage, idVerrouilleur, idDomOrigine, idDomDest, contenu)`

- `déverrouiller(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`

- `transmettre(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`
- `verifier(id, idUtil, idDom, contenu)`
- `deverrouiller(id, idUtil, idDomOrigine, idDomDest, contenu)`

### Etat

Compteur pour l'identification des messages
- `IdentificationMsg(n, idMsg)` : `idMsg` identifie le `n`-ième message.

Identité de l'utilisateur et de son domaine
- `!Utilisateur(idUtil, idDom)` 

Ensemble de messages avec des statuts différents 
- ok `Transit(idMessage, idEmetteur, idDomOrigine, idDomDest, contenu)*`
- ok `Verrouillable(idMessage, idEmetteur, idDomOrigine, idDomDest, contenu)*`
- ok `Actif(idMessage, idEmetteur, idDomOrigine, idDomDest, contenu)*`
- ok `Inactif(idMessage, idVerrouilleur, idDomOrigine, idDomDest, contenu)*`
- 
- `Gagné(idMessage, idUtil, idDomOrigine, idDom, contenu)*`
- `Perdu(idMessage, idUtil, idDomOrigine, idDom, contenu)*`

- ok `Envoi(idMessageClient, idUtil, idDomOrigine, idDomDest, contenu)`
- ok `AREnvoi(idMessageServeur, idUtil, idDomOrigine, idDomDest, contenu)`

Actions sur les messages
- état `Actif` : 
  - transmettre
  - vérifier (après interprétation)
  - déverrouiller
- état `Transit` :
  - verrouiller
- état `Verrouillable` : 
  - aucune action
- état `Inactif``:
  - aucune action
  
### Entrées

interactions avec l'utilisateur

- ok `EntreeEnvoi(idDomDestination, contenu)`
- `EntreeVerrou(idMessage)`
- `EntreeEnvoi(idMessage, idDest)`
- `EntreeEssai(idMessage, contenu)`
- `EntreeLibe(idMessage)`
- `EntreeIgnorer(idMessage)`

### Règles

ok Vérifié - Envoi
```
  // L'utilisateur demande au serveur de transmettre le message qu'il doit envoyer
  //   (a priori un unique message), après avoir indiqué le domaine voisin
  //   destinataire et le contenu.
      !Utilisateur(idEmetteur, idDomOrigine) 
    & EntreeEnvoi(idDomDest, contenu) 
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
    & EntreeVerrou(idMsg)
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


Vérifié - Déverrouillage
```
  // L'utilisateur demande au serveur de déverrouiller le message.
      Actif(idMsg, idUtil, origine, dest, contenu) 
    & EntreeLibe(id)
    & !Utilisateur(idUtil, dest) // inutile car invariant de Actif
  ->  déverrouiller(idMsg, idUtil, origine, dest, contenu)
    & Verrou(idMsg, idUtil, origine, dest, contenu) 
```

Vérifié - Déverrouillage
```
  // L'utilisateur active un message après un verrouillage réussi côté serveur.
      accuserDéverrouiller[idUtil](idMsg, idUtil, origine, dom, contenu)
    & !Utilisateur(idUtil, dom)
    & Verrou(idMsg, idUtil, origine, dom, contenu) 
  ->  Transit(idMsg, idUtil, origine, dom, contenu)
```

Vérifié - Déverrouillage
```
  // L'utilisateur reçoit un message d'inactivation, suite au verrouillage par un autre utilisateur.
      libérer[idUtil](idMsg, idUtil, origine, dom, contenu)
    & !Utilisateur(idUtil, dom)
    & Inactif(idMsg, idUtil, origine, dom, contenu)
  ->  Transit(idMsg, idUtil, origine, dom, contenu) 
```


```
  // L'utilisateur demande au serveur de transmettre le message à la destination
  //   indiquée (un domaine voisin).
      Actif(id, idUtil, origine, dest, contenu) & EntreeEnvoi(id, idDomVoisin)
      & !Utilisateur(idUtil, dest) // inutile car invariant de Actif
  ->  transmettre(id, idUtil, dest, idDomVoisin, contenu) // message de
                                                          //   dest vers idDomVoisin
```

```
  // L'utilisateur demande au serveur de vérifier que son interprétation du message est correcte.
      Actif(id, idUtil, origine, dest, contenu) & EntreeEssai(id, interpretation)
      & !Utilisateur(idUtil, dest) // inutile car invariant de Actif
  ->  verifier(id, idUtil, dest, interpretation)
```

```
  // L'utilisateur gagne la partie après vérification de l'interprétation
  //   par le serveur.
      gagner[idUtil](id, idDom, contenu)
      & !Utilisateur(idUtil, idDom)
  ->  Gagné(id, idUtil, idDom, contenu)
```

```
  // L'utilisateur perd la partie après vérification de l'interprétation
  //   par le serveur.
      perdre[idUtil](id, idDom, contenu)
      & !Utilisateur(idUtil, idDom)
  ->  Perdu(id, idUtil, idDom, contenu)
```



```
  // L'utilisateur détruit le message à la demande du serveur
  //   (après un verrouillage réussi) ou ne fait rien s'il a déjà été
  //   détruit par une demande de verrouillage qui a échoué.
      inactiver[idUtil](id) & Transit(id, idUtil, origine, dest, contenu)
      & !Utilisateur(idUtil, dest)
  ->  inactiver[idUtil](id) ??? & ¬Transit(id, idUtil, _, _, _)
```

```
  // L'utilisateur décide d'ignorer un message (qui disparaît simplement de son état).
  // Cette règle modifie l'état, sans aucune communication.
      Transit(id, idUtil, origine, dest, contenu) & EntreeIgnorer(id)
      & !Utilisateur(idUtil, dest) // inutile car invariant de Transit
  ->
```

## Serveur

### Canaux 

Fournis
- ok `envoyer(idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)`
- ok `verrouiller(idMessage, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
  
- `transmettre(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`
- `verifier(id, idUtil, idDom, contenu)`
- `deverrouiller(id, idUtil, idDomOrigine, idDomDest, contenu)`


Requis
- ok `accuserEnvoi[idEmetteur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)` 
- ok `recevoir[idEmetteur](idMessage, idEmetteur, idDomOrigine, idDomDestination, contenu)`
- ok `accuserSuccesVerrouiller[idVerrouilleur](idMsg, idEmetteur, idDomOrigine, idDomDest, contenu)` 
- ok `accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`
- ok `inactiver[idUtil](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)`


- `gagner[idUtil](idMessage, idDom, contenu)`
- `perdre[idUtil](idMessage, idDom, contenu)`

### Etat

ok Compteur pour l'identification des messages
- `IdentificationMsg(n, idMsg)` : `idMsg` identifie le `n`-ième message.

ok Table des messages par domaine indiquant le contenu des messages et le possible verrouillage
- `TableMessages(idDomaine, idMessage, type, idUtil, idDomOrigine, idDomDest, contenu, verrou? : PERSONNE | idUtilisateur)`

ok Diffusion générique d'un message à tous les utilisateurs d'un domaine via le canal `k`
- `Diffusion[k](idMessage, type, idDomaineOrigine, idDomaineDestination, contenu)` : diffusion du message `idMessage`
    de type `type` venant du domaine `idDomaineOrigine` et allant vers `idDomaineDestination` et de contenu `contenu`
- `Diffusion[k](idMessage, idDomaineOrigine, idDomaineDestination, contenu, listeUtilisateurs)` : ajout de la liste pour réaliser une itération sur ses éléments.

ok Réseau
- `ReseauAnneau(idDomaine, idDomaine)` : domaines en anneau
- `ReseauEtoile(idDom, listeUtil)` : utilisateurs en étoile autour d'un domaine

Table donnant le message à recevoir par utilisateur
- `MessageARecevoir(idUtilisateurDestinataire, contenu)`

### Règles

ok Vérifié - Diffusion générique sur le canal `k` (dépendant de l'utilisateur)
```
  // Récurrence sur les utilisateurs de la liste lu. ok
      Diffusion[k](idMsg, idUtil, origine, dest, contenu, u::lu)
  ->  Diffusion[k](idMsg, idUtil, origine, dest, contenu, lu) 
    & k[u](idMsg, idUtil, origine, dest, contenu) 

      Diffusion[k](idMsg, idUtil, origine, dest, contenu, nil) 
  ->  vide
```

ok Vérifié - Envoyer - Accuser réception
```
  // A réception du message initial, le serveur accuse réception et initie la transmission
  // en autorisant le verrouillage pour le domaine destinataire puis
  // en démarrant la diffusion du message aux utilisateurs. 
      envoyer(idMsgC, idEmetteur, origine, dest, contenu)
    & IdentificationMsg(n, idMsgS)      // Nouvelle identification du message par le serveur
  ->  accuserEnvoi[idEmetteur](idMsgS, idEmetteur, origine, dest, contenu) // AR : même message que celui envoyé.
    & IdentificationMsg(n+1, idMsgS')   // Génération de idMsgS'
    & TableMessages(origine, idMsgS, Envoi, idEmetteur, origine, dest, contenu)
    & TableMessages(dest, idMsgS, Transit, idEmetteur, origine, dest, contenu, PERSONNE)
    & Diffusion[recevoir](idMsgS, Transit, idEmetteur, origine, dest, contenu) // diffusion vers 'dest'
```

ok Vérifié - Envoyer - Diffusion en transit
```
  // Le serveur diffuse le message à tous les utilisateurs d'un domaine,
  //   qui le reçoivent. ok
      Diffusion[recevoir](idMsg, Transit, idEmetteur, origine, dest, contenu) & !ReseauEtoile(dest, lu)
  ->  Diffusion[recevoir](idMsg, idEmetteur, origine, dest, contenu, lu)
```

ok Vérifié - Verrouiller - Accuser le succès
```
  // Le serveur verrouille le message à la demande d'un utilisateur et accuse réception.
      verrouiller(idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu) 
    & TableMessages(idDomDest, idMsg, Transit, idEmetteur, idDomOrigine, idDomDest, contenu, PERSONNE)
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
```

ok Vérifié - Verrouiller - Diffusion pour inactiver 
```
  // Le serveur diffuse le message d'inactivation à tous les utilisateurs du domaine,
  // sauf le verrouilleur.
      Diffusion[inactiver](idMsg, Inactif, idVerrouilleur, idDomOrigine, idDomDest, contenu) 
    & !ReseauEtoile(dest, lu)
  ->  Diffusion[inactiver](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu, crible(lu, (u => u != idVerrouilleur)))
```




Vérifié - Déverrouillage
```
  // Le serveur déverrouille le message à la demande de 'utilisateur'
  //   appartenant au domaine 'dest'. ok
      deverrouiller(idMsg, utilisateur, origine, dest, contenu)
    & Verrou(dest, id, utilisateur)
  ->  accuserDeverrouiller[utilisateur](idMsg, utilisateur, origine, dest, contenu)
    & Verrou(dest, id, PERSONNE)
    & MiseAJourAprèsDéverrouillage(id, origine, dest, contenu)
```

Vérifié - Déverrouillage
```
  // Le serveur met à jour les autres utilisateurs du domaine 'dom', en
  //   demandant la libération du message 'idMsg'.
      MiseAJourAprèsDéverrouillage(idMsg, emetteur, origine, dom, contenu) & !Population(dom, lu)
  ->  MiseAJourAprèsDéverrouillage(idMsg, emetteur, origine, dom, contenu, lu)

  // Récurrence sur les utilisateurs de la liste 'lu' 
      MiseAJourAprèsDéverrouillage(idMsg, emetteur, origine, dom, contenu, u::lu) & (u != emetteur)
  ->  MiseAJourAprèsDéverrouillage(idMsg, emetteur, origine, dom, contenu, lu)
    & libérer[u](idMsg, emetteur, origine, dom, contenu)
  
      MiseAJourAprèsDéverrouillage(idMsg, emetteur, origine, dom, contenu, nil)
  ->  vide
```



```
  // Le serveur transmet le message reçu s'il est verrouillé par l'émetteur.
      transmettre(id, emetteur, origine, dest, contenu)
    & Verrou(origine, id, emetteur)
  ->  Verrou(dest, id, PERSONNE) & Diffusion(id, origine, dest, contenu)
  // TODO Sinon, le serveur constate une violation du protocole.
```

```
  // Le serveur vérifie que l'utilisateur interprète correctement le
  //   message si celui-ci est verrouillé par l'utilisateur et indique
  //   qu'il a gagné  le cas échéant.
      verifier(id, idUtil, idDomaine, contenu)
    & MessageARecevoir(idUtil, contenu)
    & Verrou(idDomaine, id, idUtil)
  ->  gagner[idUtil](id, idDomaine, contenu)
```

```
  // Le serveur vérifie que l'utilisateur interprète correctement le
  //   message si celui-ci est verrouillé par l'utilisateur et lui indique
  //   qu'il a perdu le cas échéant.
      verifier(id, idUtil, idDomaine, contenu)
    & MessageARecevoir(idUtil, contenu')
    & Verrou(idDomaine, id, idUtil)
    & (contenu != contenu')
  ->  perdre[idUtil](id, idDomaine, contenu)
  // TODO Sinon, le serveur constate une violation du protocole.
```

## TODO Traduction des canaux

Un canal se traduit pratiquement en
- une liaison via une connexion http
- un type de messages.

- Canaux du serveur
 - `envoyer(idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : INIT
 - `verrouiller(idMessage, idUtil, idDomOrigine, idDomDest, contenu)` : VERROU
  
- Canaux du client
  - `accuserEnvoi[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : INIT
  - `recevoir[idUtilisateur](idMessage, idUtil, idDomOrigine, idDomDestination, contenu)` : TRANSIT
  - `accuserSuccesVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : VERROU
  - `accuserEchecVerrouiller[idCandidatVerrouilleur](idMsg, idVerrouilleur, idDomOrigine, idDomDest, contenu)` : 403 VERROU
  - `inactiver[idUtil](idMessage)` : INACTIF



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

