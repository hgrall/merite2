import * as websocket from 'websocket';

import {table} from "../../bibliotheque/types/table";

import {
    creerTableIdentificationMutableVide,
    TableIdentification,
    TableIdentificationMutable
} from "../../bibliotheque/types/tableIdentification";

import {
    AiguilleurWebSocket,
    CanalServeurClientWebSocket,
    ServeurAbstraitCanaux,
    ServeurCanaux
} from "../../bibliotheque/communication/serveurConnexions";
import {ServeurApplications} from "../../bibliotheque/communication/serveurApplications";

import {dateMaintenant} from "../../bibliotheque/types/date"
import {
    compositionConfigurationJeu1,
    compositionErreurDistribution,
    compositionInformationDistribution,
    ConfigurationDistribution,
    consigne,
    Domaine,
    domaine,
    EtiquetteConfigurationDistribution,
    EtiquetteErreurDistribution,
    EtiquetteInformationDistribution,
    EtiquetteMessageDistribution,
    FormatConfigurationDistribution,
    FormatDomaine,
    FormatErreurDistribution,
    FormatMessageDistribution,
    FormatPopulationLocale,
    FormatUtilisateur, InformationDistribution,
    messageDistribution,
    MessageDistribution,
    populationLocale,
    TypeErreurDistribution,
    TypeInformationDistribution,
    TypeMessageDistribution,
    Utilisateur,
    utilisateur
} from "../commun/echangesJeu1Distribution";
import {
    ConfigurationServeurJeu1Distribution,
    creerConfigurationServeur,
    ReseauJeu1Distribution
} from "./generationReseauJeu1Distribution";
import {divEuclidienne} from "../../bibliotheque/types/entier";
import {creerIdentificationParCompteur, Identifiant, Identification} from '../../bibliotheque/types/identifiant';
import {egaliteMots, mot} from '../../bibliotheque/types/binaire';
import {FormatInformation} from "../../bibliotheque/reseau/formats";


/**
 * TODO Canal de communication entre un client et le serveur,
 * pour le jeu 1 de distribution, utilisant des Web Sockets.
 * Il implémente les trois méthodes de traitement correspondant aux trois étapes
 * de connexion :
 * - initialisation de la connexion ("traiterConnexion"),
 * - réception d'un message ("traiterMessage"),
 * - fermeture de la connexion ("traiterFermeture").
 * <br>
 * Il partage via l'aiguilleur transmis les trois attributs suivants :
 * - "reseaux" : portions de réseaux à connecter,
 * - "reseauxConnectes" : portions de réseaux déjà connectées,
 * - "connexions" : connexions entre les clients et le serveur.
 */
class CanalJeu1Distribution extends CanalServeurClientWebSocket<FormatErreurDistribution, EtiquetteErreurDistribution, FormatConfigurationDistribution, EtiquetteConfigurationDistribution, FormatMessageDistribution, EtiquetteMessageDistribution, ConfigurationDistribution, FormatInformation, EtiquetteInformationDistribution> {

    private nombreConnexions:number;

    /**
     * Constructeur initialisant les attributs à partir de l'aiguilleur.
     * @param configurationsUtilisateursAConnecter tableau des configurations
     *          des utilisateurs à connecter.
     * @param configurationsUtilisateursConnectes tableau des configurations
     *        des utilisateurs connectés.
     * @param connexions table associant à un identifiant de sommet
     *        le canal de communication entre le sommet client et le serveur.
     * @param reseau
     * @param chemin chemin utilisé par le canal.
     * @param connexion connexion par Web Socket
     * @param adresseIPClient adresse IP du client
     */
    constructor(
        private configurationsUtilisateursAConnecter
            : TableIdentificationMutable<'utilisateur', ConfigurationDistribution,
                FormatConfigurationDistribution>,
        private configurationsUtilisateursConnectes
            : TableIdentificationMutable<'utilisateur', ConfigurationDistribution,
                FormatConfigurationDistribution>,
        private connexions: TableIdentificationMutable<
            'utilisateur',
            CanalJeu1Distribution, CanalJeu1Distribution>,
        private reseau: ReseauJeu1Distribution,
        private generateur: Identification<'message'>,
        private autorisationsVerrouillage:
            TableIdentificationMutable<"message", Domaine, FormatDomaine>,
        private verrous:
            TableIdentificationMutable<"message", Utilisateur, FormatUtilisateur>,
        private populations:
            TableIdentification<'sommet', FormatPopulationLocale>,
        chemin: string, connexion: websocket.connection, adresseIPClient: string, nombreConnexions: number) {
        super(chemin, connexion, adresseIPClient);
        this.nombreConnexions = nombreConnexions;
    }
    /**
     * Traite la connexion par les actions suivantes :
     * - sélection d'un utilisateur à connecter par retrait du tableau des
     *   utilisateurs à connecter,
     *   - si le tableau des utilisateurs à connecter est vide, le réseau est complet ;
     * - vérification de la cohérence des connexions
     * - mise-à-jour des connexions courantes en associant ce canal à
     *   l'utilisateur,
     * - définition et envoi de la configuration associée à l'utilisateur
     *   sélectionné,
     * - retrait de l'utilisateur de la portion de réseau à connecter,
     * - ajout du noeud à la portion de réseau connectée associée au chemin.
     */
    traiterConnexion(): boolean {
        let ID_utilisateur: Identifiant<'utilisateur'>;
        try {
            ID_utilisateur = this.configurationsUtilisateursAConnecter
                .selectionCle();
        } catch (e) {
            // Traiter le cas où le réseau est complet.
            let d = dateMaintenant();
            console.log("* " + d.representationLog() + " - " + (<Error>e).message);
            console.log("* " + d.representationLog() + " - Connexion impossible d'un client : le réseau est complet.");
            this.envoyerMessageErreur(compositionErreurDistribution(
                "Jeu de distribution - Réseau complet ! Il est impossible de se connecter : le réseau est complet.",
                d.val(), TypeErreurDistribution.REDHIBITOIRE));
            return false;
        }
        let cfg = this.configurationsUtilisateursAConnecter.retirer(ID_utilisateur).valeur();

        // Test de cohérence : l'utilisateur n'est pas déjà connecté.
        /* // Exemple du tchat
        if (this.connexions.contient(ID_sommet) || this.reseauxConnectes.valeur(chemin).possedeNoeud(ID_sommet)) {
            let d = dateMaintenant()
            console.log("* " + d.representationLog() + " - Connexion impossible d'un client : le réseau est corrompu.");
            this.envoyerMessageErreur(erreurTchatDeMessage(
                "Tchat - Réseau corrompu ! Il est impossible de se connecter : le réseau est corrompu. Contacter l'administrateur.",
                d.val()));
            return false;
        }
        */
        // Cas où la sélection d'un utilisateur a réussi
        const d = dateMaintenant();
        cfg = cfg.aJour(d);
        console.log("* " + d.representationLog()
            + " - Connexion de " + cfg.utilisateur().representation()
            + " par Web socket.");

        this.connexions.ajouter(cfg.utilisateur().val().ID, this);
        console.log("- envoi au client d'adresse " + this.adresseClient());
        console.log("  - de la configuration brute " + cfg.brut());
        console.log("  - de la configuration nette " + cfg.representation());
        this.envoyerConfiguration(cfg);
        this.configurationsUtilisateursConnectes.ajouter(ID_utilisateur, cfg);
        // Diffuser le nombre d'utilisateurs connectés dans le reseau a tous les connexions
        this.diffuserInformation(compositionInformationDistribution(this.connexions.taille()+"", d.val(), TypeInformationDistribution.NOM_CONNEXIONS));
        return true;
    }
    // ok
    accuserReceptionMessage(msg: MessageDistribution,
        typeAR: TypeMessageDistribution): void {
        msg = msg.avecType(typeAR);
        let lienEmetteur: CanalJeu1Distribution
            = this.connexions.valeur(msg.val().ID_utilisateur);
        console.log("- Envoi en accusé de réception au client utilisant l'adresse "
            + lienEmetteur.adresseClient());
        console.log("  - du message brut : " + msg.brut());
        console.log("  - du message net : " + msg.representation());
        lienEmetteur.envoyerAuClient(msg);
    }
    // ok
    autoriserVerrouillage(msg: MessageDistribution): void {
        const dom = domaine(this.reseau.noeud(msg.val().ID_destination).centre);
        this.autorisationsVerrouillage.ajouter(msg.val().ID, dom);
        console.log("- Autorisation du verrouillage du message "
            + msg.val().ID.val + " par les utilisateurs du domaine " + dom.representation());
    }
    // ok
    modifierAutorisationVerrouillage(msg: MessageDistribution): void {
        this.autorisationsVerrouillage.retirer(msg.val().ID);
        this.autoriserVerrouillage(msg);
    }
    // ok
    retirerAutorisationVerrouillage(idMsg: Identifiant<"message">): void {
        this.autorisationsVerrouillage.retirer(idMsg);
    }
    // ok
    envoyerMessageAClient(
        msg: MessageDistribution, idUtilisateur: Identifiant<"utilisateur">): boolean {
        if (!this.connexions.contient(idUtilisateur)) {
            console.log("  - Pas d'envoi à l'utilisateur non connecté d'identifiant "
                + idUtilisateur.val);
            return false;
        }
        this.connexions.valeur(idUtilisateur).envoyerAuClient(msg);
        return true;
    }

    envoyerInformationAClient(
        info: InformationDistribution, idUtilisateur: Identifiant<"utilisateur">): boolean {
        if (!this.connexions.contient(idUtilisateur)) {
            console.log("  - Pas d'envoi à l'utilisateur non connecté d'identifiant "
                + idUtilisateur.val);
            return false;
        }
        this.connexions.valeur(idUtilisateur).envoyerMessageInformation(info);
        return true;
    }
    // ok
    diffuserMessage(msg: MessageDistribution): void {
        console.log("- Diffusion aux utilisateurs du domaine d'identifiant "
            + msg.val().ID_destination.val);
        table(this.populations.valeur(msg.val().ID_destination).identification)
            .iterer((c, u) => {
                msg = msg.diffusion(u.ID);
                if (this.envoyerMessageAClient(msg, u.ID)) {
                    console.log("  - du message brut : " + msg.brut());
                    console.log("  - du message net : " + msg.representation());
                }
            });
    }
    initialisationInterdite(idUtil: Identifiant<'utilisateur'>): boolean {
        let msgErreur = "Initialisation interdite : ";
        if (!this.connexions.contient(idUtil)) {
            msgErreur = msgErreur
                + "tentative d'envoi du message initial par l'utilisateur non connecté "
                + "d'identifiant "
                + idUtil.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        return false;
    }
    // ok
    verrouillageInterdit(idMsg: Identifiant<'message'>,
        idUtil: Identifiant<'utilisateur'>): boolean {
        let msgErreur = "Verrouillage interdit : ";
        if (!this.autorisationsVerrouillage.contient(idMsg)) {
            msgErreur = msgErreur
                + "tentative de verrouillage du message non verrouillable "
                + "d'identifiant "
                + idMsg.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        if (!populationLocale(
            this.populations.valeur(
                this.autorisationsVerrouillage
                    .valeur(idMsg).ID))
            .possedeUtilisateur(idUtil)) {
            msgErreur = msgErreur
                + "tentative de verrouillage par l'utilisateur d'identifiant "
                + idUtil.val
                + " n'appartenant pas à la population du domaine.";
            console.log("- " + msgErreur);
            return true;
        }
        console.log("- Verrouillage licite.");
        return false;
    }
    // ok
    verrouillagePossible(idMsg: Identifiant<'message'>): boolean {
        if (this.verrous.contient(idMsg)) {
            console.log("- Echec du verrouillage.");
            return false;
        }
        console.log("- Verrouillage réussi.");
        return true;
    }
    // ok
    verrouiller(idMsg: Identifiant<'message'>,
        idUtil: Identifiant<'utilisateur'>): void {
        const u = populationLocale(
            this.populations.valeur(
                this.autorisationsVerrouillage
                    .valeur(idMsg).ID))
            .utilisateur(idUtil);
        this.verrous.ajouter(idMsg, utilisateur(u));
    }
    // ok
    diffuserAvisVerrouillage(msg: MessageDistribution): void {
        console.log("- Diffusion aux utilisateurs du domaine d'identifiant "
            + msg.val().ID_destination.val);
        console.log("  - du message brut : " + msg.brut());
        console.log("  - du message net : " + msg.representation());
        table(this.populations.valeur(msg.val().ID_destination).identification)
            .iterer((c, u) => {
                this.envoyerMessageAClient(msg, u.ID);
            });
    }
    // ok
    deverrouillageInterdit(idMsg: Identifiant<'message'>,
        idUtil: Identifiant<'utilisateur'>): boolean {
        let msgErreur = "Déverrouillage interdit : ";
        if (!this.verrous.contient(idMsg)) {
            msgErreur = msgErreur
                + "tentative de déverrouillage "
                + "du message non verrouillé d'identifiant "
                + idMsg.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        let verrouilleur = this.verrous.valeur(idMsg);
        if (verrouilleur.ID.val !== idUtil.val) {
            msgErreur = msgErreur
                + "tentative de déverrouillage "
                + "par l'utilisateur d'identifiant "
                + idUtil.val
                + ", différent de l'utilisateur ayant verrouillé d'identifiant "
                + verrouilleur.ID.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        console.log("- Déverrouillage licite.");
        return false;
    }
    // ok
    deverrouiller(idMsg: Identifiant<'message'>): void {
        this.verrous.retirer(idMsg);
    }
    // ok
    diffuserAvisDeverrouillage(msg: MessageDistribution): void {
        console.log("- Diffusion aux utilisateurs du domaine d'identifiant "
            + msg.val().ID_destination.val);
        table(this.populations.valeur(msg.val().ID_destination).identification)
            .iterer((c, u) => {
                msg = msg.diffusion(u.ID);
                if (this.envoyerMessageAClient(msg, u.ID)) {
                    console.log("  - du message brut : " + msg.brut());
                    console.log("  - du message net : " + msg.representation());
                }
            });
    }
    // ok
    transmissionInterdite(idMsg: Identifiant<'message'>,
        idUtil: Identifiant<'utilisateur'>): boolean {
        let msgErreur = "Transmission interdite : ";
        if (!this.verrous.contient(idMsg)) {
            msgErreur = msgErreur
                + "tentative de transmission "
                + "du message non verrouillé d'identifiant "
                + idMsg.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        let verrouilleur = this.verrous.valeur(idMsg);
        if (verrouilleur.ID.val !== idUtil.val) {
            msgErreur = msgErreur
                + "tentative de transmission "
                + "par l'utilisateur d'identifiant "
                + idUtil.val
                + ", différent de l'utilisateur ayant verrouillé d'identifiant "
                + verrouilleur.ID.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        console.log("- Transmission licite.");
        return false;
    }
    // ok
    diffuserAvisTransmission(msg: MessageDistribution): void {
        msg = msg.avecType(TypeMessageDistribution.AR_SUIVANT);
        console.log("- Diffusion aux utilisateurs du domaine d'identifiant "
            + msg.val().ID_origine.val);
        console.log("  - du message brut : " + msg.brut());
        console.log("  - du message net : " + msg.representation());
        table(this.populations.valeur(msg.val().ID_origine).identification)
            .iterer((c, u) => {
                this.envoyerMessageAClient(msg, u.ID);
            });
    }
    // ok
    essaiInterdit(idMsg: Identifiant<'message'>,
        idUtil: Identifiant<'utilisateur'>): boolean {
        let msgErreur = "Essai interdit : ";
        if (!this.verrous.contient(idMsg)) {
            msgErreur = msgErreur
                + "tentative d'interprétation "
                + "du message non verrouillé d'identifiant "
                + idMsg.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        let verrouilleur = this.verrous.valeur(idMsg);
        if (verrouilleur.ID.val !== idUtil.val) {
            msgErreur = msgErreur
                + "tentative d'interprétation "
                + "par l'utilisateur d'identifiant "
                + idUtil.val
                + ", différent de l'utilisateur ayant verrouillé d'identifiant "
                + verrouilleur.ID.val + ".";
            console.log("- " + msgErreur);
            return true;
        }
        if (!this.configurationsUtilisateursConnectes.contient(idUtil)) {
            msgErreur = msgErreur
                + "tentative d'interprétation "
                + "par l'utilisateur d'identifiant "
                + idUtil.val
                + ", qui n'est pas configuré.";
            console.log("- " + msgErreur);
            return true;
        }
        console.log("- Essai licite.");
        return false;
    }
    // ok
    essaiReussi(msg: MessageDistribution): boolean {
        let c = consigne(
            this.configurationsUtilisateursConnectes
                .valeur(msg.val().ID_utilisateur).messageARecevoir);
        let motAttendu = mot(c.val().mot);
        console.log("mot attendu : " + motAttendu.representation());
        let motPropose = mot(msg.val().contenu);
        console.log("mot proposé : " + motPropose.representation());
        console.log("égalité ? " + egaliteMots(motAttendu, motPropose));
        return egaliteMots(motAttendu, motPropose);
    }
    // ok
    diffuserAvisReussite(msg: MessageDistribution): void {
        msg = msg.avecType(TypeMessageDistribution.GAIN);
        console.log("- Diffusion aux utilisateurs du domaine d'identifiant "
            + msg.val().ID_origine.val);
        console.log("  - du message brut : " + msg.brut());
        console.log("  - du message net : " + msg.representation());
        table(this.populations.valeur(msg.val().ID_origine).identification)
            .iterer((c, u) => {
                this.envoyerMessageAClient(msg, u.ID);
            });
    }
    // ok
    diffuserAvisEchec(msg: MessageDistribution): void {
        msg = msg.avecType(TypeMessageDistribution.PERTE);
        console.log("- Diffusion aux utilisateurs du domaine d'identifiant "
            + msg.val().ID_origine.val);
        console.log("  - du message brut : " + msg.brut());
        console.log("  - du message net : " + msg.representation());
        table(this.populations.valeur(msg.val().ID_origine).identification)
            .iterer((c, u) => {
                this.envoyerMessageAClient(msg, u.ID);
            });
    }

    diffuserInformation(info : InformationDistribution): void {
        console.log("- Diffusion d'information à tous les utilisateurs du reseau");
        console.log("  - du message brut : " + info.brut());
        console.log("  - du message net : " + info.representation());
        this.populations.domaine().forEach(identifiantSommet => {
            table(this.populations.valeur(identifiantSommet).identification)
                .iterer((c, u) => {
                    this.envoyerInformationAClient(info, u.ID);
                });
        });
    }

    /**
     * Traite le message par les actions suivantes :
     * - cas d'un message de type TODO:
     * - autres cas : envoi d'un message d'erreur au client émetteur.
     * @param m message reçu du client au format JSON.
     */
    traiterMessage(m: FormatMessageDistribution): void {
        // TODO : Replace by config value
        if (this.connexions.taille() < this.nombreConnexions) {
            let d = dateMaintenant();
            this.envoyerMessageErreur(compositionErreurDistribution(
                "Jeu de distribution - Réseau incomplet ! Il est impossible d'envoyer des messages",
                d.val(), TypeErreurDistribution.NOM_CONNEXIONS));
            return;
        }
        let chemin = this.cheminServeur();
        let msg = messageDistribution(m);
        console.log("* Traitement d'un message");
        console.log("- brut : " + msg.brut());
        console.log("- net : " + msg.representation());
        switch (m.type) {
            case TypeMessageDistribution.INIT:
                const idUtilI = msg.val().ID_utilisateur;
                if (this.initialisationInterdite(idUtilI)) {

                    break;
                }
                const idMsgG = this.generateur.identifier("message");
                msg = msg.avecIdentifiant(idMsgG);
                this.accuserReceptionMessage(msg, TypeMessageDistribution.AR_INIT);
                this.autoriserVerrouillage(msg);
                this.diffuserMessage(msg);
                break;
            case TypeMessageDistribution.VERROU:
                const idMsgV = msg.val().ID;
                const idUtilV = msg.val().ID_utilisateur;
                if (this.verrouillageInterdit(idMsgV, idUtilV)) {
                    break;
                }
                if (this.verrouillagePossible(idMsgV)) {
                    this.verrouiller(idMsgV, idUtilV);
                    this.diffuserAvisVerrouillage(msg);
                } else {
                    this.accuserReceptionMessage(msg,
                        TypeMessageDistribution.ECHEC_VERROU);
                }
                break;
            case TypeMessageDistribution.LIBE:
                const idMsgL = msg.val().ID;
                const idUtilL = msg.val().ID_utilisateur;
                if (this.deverrouillageInterdit(idMsgL, idUtilL)) {
                    break;
                }
                this.deverrouiller(idMsgL);
                this.diffuserAvisDeverrouillage(msg);
                break;
            case TypeMessageDistribution.SUIVANT:
                const idMsgS = msg.val().ID;
                const idUtilS = msg.val().ID_utilisateur;
                if (this.transmissionInterdite(idMsgS, idUtilS)) {
                    break;
                }
                this.deverrouiller(idMsgS);
                this.modifierAutorisationVerrouillage(msg);
                this.diffuserAvisTransmission(msg);
                this.diffuserMessage(msg);
                break;
            case TypeMessageDistribution.ESSAI:
                const idMsgE = msg.val().ID;
                const idUtilE = msg.val().ID_utilisateur;
                if (this.essaiInterdit(idMsgE, idUtilE)) {
                    break;
                }
                this.deverrouiller(idMsgE);
                this.retirerAutorisationVerrouillage(idMsgE);
                if (this.essaiReussi(msg)) {
                    this.diffuserAvisReussite(msg);
                } else {
                    this.diffuserAvisEchec(msg);
                }
                break;
            default:
                console.log("- Erreur : message non reconnu.");
        }
        console.log("- Fin du traitement.");
        /*
        switch (m.type) {
            case TypeMessageDistribution.INIT:
                let ID_emetteurUrl = this.configuration().val().centre.ID;
                let ID_emetteurMsg = m.ID_emetteur;
                let ID_destinataireMsg = m.ID_destinataire;
                // Contrôle de l'émetteur et du destinataire
                if (!(ID_emetteurUrl.val === ID_emetteurMsg.val)) {
                    let msgErreur = "Problème d'identité pour l'émetteur : le client utilisant l'adresse "
                        + this.adresseClient()
                        + " devrait signer ses messages " + ID_emetteurUrl + " et non " + ID_emetteurMsg + ".";
                    console.log("- " + msgErreur);
                    this.envoyerAuClient(messageRetourErreur(msg, TypeMessageTchat.ERREUR_EMET, msgErreur));
                    break;
                }
                if (this.connexions.valeur(ID_emetteurMsg) === undefined) {
                    let msgErreur = "Problème de Web socket : la connexion n'est plus active. Fermer l'onglet et se reconnecter.";
                    console.log("- " + msgErreur);
                    this.envoyerAuClient(messageRetourErreur(msg, TypeMessageTchat.ERREUR_EMET, msgErreur));
                    break;
                }
                if (this.connexions.valeur(ID_destinataireMsg) === undefined) {
                    let msgErreur = "Destinataire inconnu ou non connecté. Attendre sa connexion ou essayer un autre destinataire.";
                    console.log("- " + msgErreur);
                    msgErreur = msgErreur + "\n- Message original : \n" + m.contenu;
                    this.envoyerAuClient(messageRetourErreur(msg, TypeMessageTchat.ERREUR_DEST, msgErreur));
                    break;
                }
                // Contrôle des communications
                if (!this.reseauxConnectes.valeur(chemin).sontVoisins(ID_emetteurMsg, ID_destinataireMsg)) {
                    let msgErreur = "communication interdite : le noeud émetteur "
                        + ID_emetteurMsg.val
                        + " n'est pas vosin du noeud destinataire " + ID_destinataireMsg.val + ".";
                    console.log("- " + msgErreur);
                    this.envoyerAuClient(messageRetourErreur(msg, TypeMessageTchat.INTERDICTION, msgErreur));
                }
                // Fonctionnement normal
                let lienDestinaire: CanalJeu1Distribution = this.connexions.valeur(ID_destinataireMsg);
                let lienEmetteur: CanalJeu1Distribution = this.connexions.valeur(ID_emetteurMsg);
                let msgTransit = msg.transit();
                console.log("- Envoi en transit au client utilisant l'adresse "
                    + lienDestinaire.adresseClient());
                console.log("  - du message brut : " + msgTransit.brut());
                console.log("  - du message net : " + msgTransit.representation());
                lienDestinaire.envoyerAuClient(msgTransit);
                let msgAR = msg.avecAccuseReception();
                console.log("- Envoi en accusé de réception au client utilisant l'adresse "
                    + lienEmetteur.adresseClient());
                console.log("  - du message brut : " + msgAR.brut());
                console.log("  - du message net : " + msgAR.representation());
                lienEmetteur.envoyerAuClient(msgAR);
                break;
            default:
                let msgErreur = "Type de message non reconnu : le type doit être "
                    + TypeMessageTchat.COM.toString() + " et non " + m.type + ".";
                console.log("- " + msgErreur);
                this.envoyerAuClient(messageRetourErreur(msg, TypeMessageTchat.ERREUR_TYPE, msgErreur));
                break;
        }*/
    }
    /**
     * Traite la fermeture par les actions suivantes :
     * - contrôle de la connexion, qui doit être active au moment de la
     * fermeture,
     * - retrait du noeud de la portion de réseau connectée assoicée au chemin,
     * - retrait du canal de la table des connexions actives,
     * - ajout du noeud à la portion de réseau à connecter.
     * @param r code de fermeture (normalement : 1001).
     * @param desc description textuelle expliquant la fermeture (normalement :
     * Remote peer is going away).
     */
    traiterFermeture(r: number, desc: string): void {
        let chemin = this.cheminServeur();
        let ID_util = this.configuration().val().utilisateur.ID;
        if ((this.connexions.valeur(ID_util) === undefined)
            || (!this.configurationsUtilisateursConnectes.contient(ID_util))
            || this.configurationsUtilisateursAConnecter.contient(ID_util)) {
            console.log("* Impossibilité de fermer correctement la connexion par Web socket : "
                + ID_util.val + " est partiellement déconnecté. Une déconnexion complète est assurée.");
            this.connexions.retirer(ID_util);
            this.configurationsUtilisateursConnectes.retirer(ID_util);
            this.configurationsUtilisateursAConnecter.ajouter(ID_util, this.configuration());
            return;
        }
        console.log(" * " + dateMaintenant().representationLog()
            + " - Déconnexion de l'utilisateur " + ID_util.val
            + " utilisant l'adresse " + this.adresseClient() + ".");
        console.log("- domaine : " + this.configuration().val().centre.ID.val);
        console.log("- raison : " + r + " ; description : " + desc);
        this.connexions.retirer(ID_util);
        this.configurationsUtilisateursConnectes.retirer(ID_util);
        this.configurationsUtilisateursAConnecter.ajouter(ID_util, this.configuration());

        // Diffuser le nombre d'utilisateurs connectés dans la reseau a tous les connexions
        const d = dateMaintenant();
        this.diffuserInformation(compositionInformationDistribution(this.connexions.taille()+"", d.val(), TypeInformationDistribution.NOM_CONNEXIONS));
    }
}

const nombreDomaines: number = 5;
//const nombreDomaines: number = 6;

/**
 * Serveur de canaux pour le jeu 1 de distribution. TODO
 */
export class ServeurCanauxJeu1Distribution<S extends ServeurApplications>
    extends ServeurAbstraitCanaux<S, websocket.connection>
    implements ServeurCanaux<websocket.connection>
{
    /**
     *
     */
    private configuration: ConfigurationServeurJeu1Distribution;
    /**
     * Tableau d'utilisateurs. Le tableau
     * d'utilisateurs contient les utilisateurs encore à connecter pour le jeu
     * associé au chemin.
     */
    private _configsUtilisateursAConnecter:
        TableIdentificationMutable<'utilisateur', ConfigurationDistribution,
            FormatConfigurationDistribution>;
    /**
     * Table associant à un chemin la portion de réseau connectée.
     */
    private _configsUtilisateursConnectes:
        TableIdentificationMutable<'utilisateur', ConfigurationDistribution,
            FormatConfigurationDistribution>;
    /**
     * Table associant à un identificateur de sommet le canal.
     */
    private _connexions: TableIdentificationMutable<
        'utilisateur', CanalJeu1Distribution, CanalJeu1Distribution>;

    private generateur: Identification<'message'>;
    private autorisationsVerrouillage:
        TableIdentificationMutable<"message", Domaine, FormatDomaine>;
    private verrous:
        TableIdentificationMutable<"message", Utilisateur, FormatUtilisateur>;
    private nombreConnexions: number

    /**
     * Constructeur du serveur de canaux à partir d'un aiguilleur.
     * @param aiguilleur aiguilleur de tchat
     */
    constructor(
        chemin: string,
        aiguilleur: AiguilleurWebSocket<S>
    ) {
        super(chemin, aiguilleur);
    }

    /**
     * Configuration du serveur de canaux avant l'initialisation.
     * @param chemin
     * @param nombreUtilisateurs
     * @param prefixeIdDom
     */
    preInit(
        chemin: string,
        nombreUtilisateurs: number,
        prefixeIdDom: string
    ) {
        let effectifs = new Array<number>(nombreDomaines);
        let d = divEuclidienne(nombreUtilisateurs, nombreDomaines);
        for (let j = 0; j < nombreDomaines; j++) {
            effectifs[j] = d.quotient + ((j < d.reste) ? 1 : 0);
        }
        const configServeur = creerConfigurationServeur(nombreDomaines, prefixeIdDom);
        configServeur.engendrerPopulations(effectifs);
        configServeur.engendrerConsignes();
        this.configuration = configServeur;
        this.nombreConnexions = nombreUtilisateurs;
        this._configsUtilisateursConnectes
            = creerTableIdentificationMutableVide('utilisateur', (c) => c.val());

        this._configsUtilisateursAConnecter
            = creerTableIdentificationMutableVide('utilisateur', (c) => c.val());

        this._connexions =
            creerTableIdentificationMutableVide<
                'utilisateur', CanalJeu1Distribution, CanalJeu1Distribution>(
                'utilisateur', (x) => x);
        this.generateur = creerIdentificationParCompteur(
            chemin + "/MSG-");
        this.autorisationsVerrouillage
            = creerTableIdentificationMutableVide("message", (x) => x.val());
        this.verrous
            = creerTableIdentificationMutableVide("message", (x) => x.val());
    }

    /**
     * Fabrique un canal à partir des arguments passés et en transmettant
     * l'aiguilleur.
     * @param chemin chemin sur l'hôte.
     * @param connexion connexion par Web Socket.
     * @param adresseIPClient adresse IP du client.
     */
    creerCanal(chemin: string, connexion: websocket.connection, adresseIPClient: string) {
        return new CanalJeu1Distribution(
            this._configsUtilisateursAConnecter,
            this._configsUtilisateursConnectes,
            this._connexions,
            this.configuration.reseau(),
            this.generateur,
            this.autorisationsVerrouillage,
            this.verrous,
            this.configuration.populations(),
            chemin, connexion, adresseIPClient, this.nombreConnexions );
    }

    /**
     * Initialise le serveur de canaux.
     * TODO relation avec admin .
     * @param chemin
     * @param nombreUtilisateurs
     */
    initialiser() {

        // Double itération : domaines du réseau puis utilisateurs du domaine
        this.configuration.reseau().iterer((idDom, n) => {
            populationLocale(
                this.configuration.populations().valeur(idDom))
                .iterer((idU, u) => {
                    const config = compositionConfigurationJeu1(
                        this.configuration.reseau().noeud(idDom),
                        this.configuration.populations().valeur(idDom),
                        u,
                        dateMaintenant().val(),
                        this.configuration.consignesEmission().valeur(u.ID),
                        this.configuration.attendusReception().valeur(u.ID),
                        this.nombreConnexions
                    );
                    this._configsUtilisateursAConnecter
                        .ajouter(idU, config);
                })
        });
    }
}





