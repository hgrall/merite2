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
- `accuserEnvoyer[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` 
- `recevoir[idUtilisateur](idMessage, idUtil, idDomOrigine, idDomDestination, contenu)`
- `accuserVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` 
- `accuserEchecVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)`
- `inactiver[idUtil](idMessage)`
- 
- `gagner[idUtil](idMessage, idDom, contenu)`
- `perdre[idUtil](idMessage, idDom, contenu)`

Requis
- `envoyer(idMsg, idUtil, idDomOrigine, idDomDest, contenu)` (message de type `INIT`)
- `verrouiller(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`

- `transmettre(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`
- `verifier(id, idUtil, idDom, contenu)`
- `deverrouiller(id, idUtil, idDomOrigine, idDomDest, contenu)`

### Etat

Compteur pour l'identification des messages
- `IdentificationMsg(n, idMsg)` : `idMsg` identifie le `n`-ième message.


Drapeau pour l'entrée de messages
- `INITIE`

Identité de l'utilisateur et de son domaine
- `!Utilisateur(idUtil, idDom)` 

Ensemble de messages avec des statuts différents 
- `Transit(idMessage, idUtil, idDomOrigine, idDomDest, contenu)*`
- `Attente(idMessage, idUtil, idDomOrigine, idDomDest, contenu)*`
- `Actif(idMessage, idUtil, idDomOrigine, idDomDest, contenu)*`
- `Inactif(idMessage, idUtil, idDomOrigine, idDomDest, contenu)*`
- 
- `Gagné(idMessage, idUtil, idDomOrigine, idDom, contenu)*`
- `Perdu(idMessage, idUtil, idDomOrigine, idDom, contenu)*`
- `ARenvoyer(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`

Messages
- état Actif : trois actions possibles
  - transmettre
  - vérifier (après interprétation)
  - déverrouiller
- état Transit : deux actions possibles
  - verrouiller
  - ignorer

### Entrées

interactions avec l'utilisateur

- `EntreeInit(idDomDestination, contenu)`
- `EntreeVerrou(idMessage)`
- `EntreeEnvoi(idMessage, idDest)`
- `EntreeEssai(idMessage, contenu)`
- `EntreeLibe(idMessage)`
- `EntreeIgnorer(idMessage)`

### Règles

Vérifié 
```
  // L'utilisateur demande au serveur de transmettre le message qu'il doit envoyer
  //   (a priori un unique message), après avoir indiqué le domaine voisin
  //   destinataire et le contenu.
      !Utilisateur(idUtil, idDom) 
    & EntreeInit(idDomDest, contenu) 
    & ¬INITIE 
    & Identifiant(n, idMsg)
  ->  envoyer(idMsg, idUtil, idDom, idDomDest, contenu) 
    & INITIE 
    & Identifiant(n+1, idMsg')
```

Vérifié
```
  // L'utilisateur affiche l'accusé de réception de son message initial.
      accuserEnvoyer[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)
  ->  ARenvoyer(idMsg, idUtil, idDomOrigine, idDomDest, contenu)
```

Vérifié
```
  // L'utilisateur reçoit un message du serveur et le place en transit. Les autres
  // utilisateurs du domaine 'dom' ont reçu le même message.
      recevoir[idUtil](idMsg, idUtil, origine, dom, contenu) 
    & !Utilisateur(idUtil, dom)
  ->  Transit(idMsg, idUtil, origine, dom, contenu)
```

Vérifié
```
  // L'utilisateur demande au serveur de verrouiller un message en transit.
      Transit(idMsg, idUtil, origine, dom, contenu) 
    & EntreeVerrou(idMsg)
    & !Utilisateur(idUtil, dom) // inutile car invariant de Transit
  ->  verrouiller(idMsg, idUtil, origine, dom, contenu)
    & Attente(idMsg, idUtil, origine, dom, contenu) 
```

Vérifié
```
  // L'utilisateur active un message après un verrouillage réussi côté serveur.
      accuserVerrouiller[idUtil](idMsg, idUtil, origine, dom, contenu)
      & !Utilisateur(idUtil, dom)
      & Attente(idMsg, idUtil, origine, dom, contenu) 
  ->  Actif(idMsg, idUtil, origine, dom, contenu)
```

Vérifié
```
  // L'utilisateur reçoit un message d'inactivation, suite au verrouillage par un autre utilisateur.
      inactiver[idUtil](idMsg, idUtil, origine, dom, contenu)
      & !Utilisateur(idUtil, dom)
      & (Transit(idMsg, idUtil, origine, dom, contenu) | Attente(idMsg, idUtil, origine, dom, contenu)) 
  ->  Inactif(idMsg, idUtil, origine, dom, contenu) 
```

Vérifié
```
  // L'utilisateur reçoit un échec de verrouillage côté serveur. Nécessairement, le message est inactif.
      accuserEchecVerrouiller[idUtil](idMsg, idUtil, origine, dom, contenu)
      & !Utilisateur(idUtil, dom)
      & Inactif(idMsg, idUtil, origine, dom, contenu) 
  ->  Inactif(idMsg, idUtil, origine, dom, contenu) 
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
  // L'utilisateur demande au serveur de déverrouiller le message.
      Actif(id, idUtil, origine, dest, contenu) & EntreeLibe(id)
      & !Utilisateur(idUtil, dest) // inutile car invariant de Actif
  ->  deverrouiller(id, idUtil, origine, dest, contenu)
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
- `envoyer(idMsg, idUtil, idDomOrigine, idDomDest, contenu)`
- `verrouiller(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`
  
- `transmettre(idMessage, idUtil, idDomOrigine, idDomDest, contenu)`
- `verifier(id, idUtil, idDom, contenu)`
- `deverrouiller(id, idUtil, idDomOrigine, idDomDest, contenu)`


Requis
- `accuserEnvoyer[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` 
- `recevoir[idUtilisateur](idMessage, idUtil, idDomOrigine, idDomDestination, contenu)`
- `accuserVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` 
- `accuserEchecVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)`
- `inactiver[idUtil](idMessage)`


- `gagner[idUtil](idMessage, idDom, contenu)`
- `perdre[idUtil](idMessage, idDom, contenu)`

### Etat

Compteur pour l'identification des messages
- `IdentificationMsg(n, idMsg)` : `idMsg` identifie le `n`-ième message.

Table des verroux pour les messages : message `idMessage` verrouillé par `(PERSONNE | idUtilisateur)` de `idDomaine`
- `Verrou(idDomaine, idMessage, PERSONNE | idUtilisateur)*`

Diffusion d'un message à tous les utilisateurs d'un domaine
- `Diffusion(idMessage, idDomaineOrigine, idDomaineDestination, contenu)` : diffusion du message `idMessage`
    venant du domaine `idDomaineOrigine` et allant vers `idDomaineDestination` et de contenu `contenu`
- `Diffusion(idMessage, idDomaineOrigine, idDomaineDestination, contenu, listeUtilisateurs)` : ajout de la liste pour réaliser une itération sur ses éléments.

Mise à jour après verrouillage 
- `MiseAJourAprèsVerrouillage(idMessage, idUtilisateur, idDomaineOrigine, idDomaineDestination, contenu)`
- `MiseAJourAprèsVerrouillage(idMessage, idUtilisateur, idDomaineOrigine, idDomaineDestination, contenu, listeUtilisateurs)` : ajout de la liste pour réaliser une itération sur ses éléments.

Réseau TODO
- `Reseau(idDomaine, idDomaine)` : domaines en anneau
- `Reseau(idDom, listeUtil)` : utilisateurs en étoile autour d'un domaine

Table donnant le message à recevoir par utilisateur
- `MessageARecevoir(idUtilisateurDestinataire, contenu)`

*** Règles

Vérifié - Envoi 1
```
  // A réception du message initial, le serveur accuse réception et initie la transmission
  // en autorisant le verrouillage pour le domaine destinataire puis
  // en démarrant la diffusion du message aux utilisateurs. 
      envoyer(idMsgC, idUtil, origine, dest, contenu)
    & IdentificationMsg(n, idMsgS)      // Nouvelle identification du message par le serveur
  ->  accuserEnvoyer[idUtil](idMsgC, idUtil, origine, dest, contenu) // AR : même message que celui envoyé.
    & IdentificationMsg(n+1, idMsgS')   // Génération de idMsgS'
    & Verrou(dest, idMsgS, PERSONNE)    // verrouillage de 'idMsgS' devenant possible pour
                                        //   les utilisateurs du domaine 'dest'
    & Diffusion(idMsgS, idUtil, origine, dest, contenu) // diffusion vers 'dest'
```

Vérifié - Envoi 2
```
  // Le serveur diffuse le message à tous les utilisateurs d'un domaine,
  //   qui le reçoivent. ok
      Diffusion(idMsg, idUtil, origine, dest, contenu) & !Reseau(dest, lu)
  ->  Diffusion(idMsg, idUtil, origine, dest, contenu, lu)

  // Récurrence sur les utilisateurs de la liste lu. ok
      Diffusion(idMsg, idUtil, origine, dest, contenu, u::lu)
  ->  Diffusion(idMsg, idUtil, origine, dest, contenu, lu) 
    & recevoir[u](idMsg, u, origine, dest, contenu) 

      Diffusion(idMsg, idUtil, origine, dest, contenu, nil) 
  ->  vide
```

Vérifié - 
```
  // Le serveur verrouille le message 'id' à la demande de l'utilisateur 'emetteur' du
  //   domaine 'dom' et accuse réception.
      verrouiller(id, emetteur, origine, dom, contenu) & Verrou(dom, id, PERSONNE)
  ->  accuserVerrouiller[emetteur](id, emetteur, origine, dom, contenu)
    & Verrou(dom, id, emetteur)
    & MiseAJourAprèsVerrouillage(id, emetteur, origine, dom, contenu)
```

Vérifié
```
  // Le serveur ne verrouille pas le message 'id' si un utilisateur du
  //   domaine 'dom' verrouille déjà le message. 
      verrouiller(idMsg, emetteur, origine, dom, contenu) & Verrou(dom, idMsg, idUtil) 
    & (idutil != PERSONNE)
  ->  accuserEchecVerrouiller(idMsg, emetteur, origine, dom, contenu)
    & Verrou(dom, idMsg, idUtil)
```

Vérifié
```
  // Le serveur met à jour les autres utilisateurs du domaine 'dom', en
  //   demandant l'inactivation du message 'idMsg'.
      MiseAJourAprèsVerrouillage(idMsg, emetteur, origine, dom, contenu) & !Population(dom, lu)
  ->  MiseAJourAprèsVerrouillage(idMsg, emetteur, origine, dom, contenu, lu)

  // Récurrence sur les utilisateurs de la liste 'lu' 
      MiseAJourAprèsVerrouillage(idMsg, emetteur, origine, dom, contenu, u::lu) & (u != emetteur)
  ->  MiseAJourAprèsVerrouillage(idMsg, emetteur, origine, dom, contenu, lu)
    & inactiver[u](idMsg, emetteur, origine, dom, contenu)
  
      MiseAJourAprèsVerrouillage(idMsg, emetteur, origine, dom, contenu, nil)
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

```
  // Le serveur déverrouille le message à la demande de 'utilisateur'
  //   appartenant au domaine 'dest'. ok
      deverrouiller(id, utilisateur, origine, dest, contenu)
    & Verrou(dest, id, utilisateur)
  ->  Verrou(dest, id, PERSONNE)
    & Diffusion(id, origine, dest, contenu)
```

## Traduction des canaux

Un canal se traduit pratiquement en
- une liaison via une connexion http
- un type de messages.

- Canaux du serveur
 - `envoyer(idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : INIT
 - `verrouiller(idMessage, idUtil, idDomOrigine, idDomDest, contenu)` : VERROU
  
- Canaux du client
  - `accuserEnvoyer[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : INIT
  - `recevoir[idUtilisateur](idMessage, idUtil, idDomOrigine, idDomDestination, contenu)` : TRANSIT
  - `accuserVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : VERROU
  - `accuserEchecVerrouiller[idUtil](idMsg, idUtil, idDomOrigine, idDomDest, contenu)` : ECHEC_VERROU
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

