import * as express from 'express';
import { isRight } from 'fp-ts/lib/Either'
import { logger } from '../../bibliotheque/administration/log';
import { ConnexionExpress, ConnexionLongueExpress } from '../../bibliotheque/communication/connexion';

import { ConfigurationJeuTchat } from '../../accueil/commun/configurationJeux';

import {
    chemin,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { tableau, Tableau } from '../../bibliotheque/types/tableau';
import {
    FormatMessageARTchat,
    FormatMessageEnvoiTchat,
    FormatMessageTransitTchat} from '../commun/echangesTchat';

import { traductionEnvoiEnAR, traductionEnvoiEnTransit } from './echangesServeurTchat';
import { creerGenerateurReseau, ReseauMutableTchat } from './reseauTchat';
import { FormatMessageTchatValidator } from "../commun/verificationFormat";
import { avertissement, erreur } from '../../bibliotheque/applications/message';

/*
* Service de l'application.
*/

interface ReponseEnvoi {
    accuseReception: FormatMessageARTchat;
    messagesEnTransit: Tableau<FormatMessageTransitTchat>;
    destinationsIncoherentes: number;
    destinationsDeconnectees: number;
}

class ServiceTchat {
    private reseau: ReseauMutableTchat<ConnexionLongueExpress>;
    private generateurIdentifiantsMessages:
    GenerateurIdentifiants<'message'>;
    constructor(
        private config: ConfigurationJeuTchat,
        private cleAcces: string
    ) {
        this.reseau =
            creerGenerateurReseau<ConnexionLongueExpress>(
                config.type, cleAcces, config.taille, config.pseudos).engendrer();
                this.generateurIdentifiantsMessages = creerGenerateurIdentifiantParCompteur(cleAcces + "-tchat-" + config.type + "-");
    }

    /*
    * Service de réception d'un message (POST).
    */

    traitementPOST(msg: FormatMessageEnvoiTchat)
        : ReponseEnvoi {
        const idsDestinataires = tableau(msg.corps.ID_destinataires);
        const idsDestinatairesVoisins =
            idsDestinataires
                .crible((i, id) => this.reseau.sontVoisins(msg.corps.ID_emetteur, id));
        const idsDestinatairesEffectifs =
            idsDestinatairesVoisins
                .crible((i, id) => this.reseau.sommet(id).actif);
        return {
            accuseReception: traductionEnvoiEnAR(msg, idsDestinatairesEffectifs, this.generateurIdentifiantsMessages.produire('message')),
            messagesEnTransit: idsDestinatairesEffectifs
                .application((i, id) => traductionEnvoiEnTransit(msg, this.generateurIdentifiantsMessages.produire('message'), id)),
            destinationsIncoherentes: idsDestinataires.taille() - idsDestinatairesVoisins.taille(),
            destinationsDeconnectees: idsDestinatairesVoisins.taille() - idsDestinatairesEffectifs.taille()
        };
    }
    traductionEntreePost(canal: ConnexionExpress): Option<FormatMessageEnvoiTchat> {
        const msg: FormatMessageEnvoiTchat = canal.lire(); // TODO conversion ???
        if (isRight(FormatMessageTchatValidator.decode(msg))) {
            // Le message reçu est supposé correct,
            // en première approximation.
            return option(msg);
        }
        const desc = "Le format JSON du message reçu n'est pas correct. Le type du message doit être 'envoi'. Erreur HTTP 400 : Bad Request.";
        canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
        logger.error(desc);
        return rienOption<FormatMessageEnvoiTchat>();
    }
    traduireSortiePOST(reponseEnvoi: ReponseEnvoi, canal: ConnexionExpress): void {
        if (reponseEnvoi.destinationsIncoherentes > 0) {
            const desc = `Le message ${reponseEnvoi.accuseReception.corps.ID_envoi} du client est incohérent : des destinataires (${reponseEnvoi.destinationsIncoherentes}) ne sont pas voisins. Erreur HTTP 400 : Bad Request.`;
            logger.error(desc);
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            return;
        }
        if (reponseEnvoi.destinationsDeconnectees > 0) {
            logger.warn(`Le message ${reponseEnvoi.accuseReception.corps.ID_envoi} du client est adressé à des destinataires actuellement déconnectés. Total de déconnectés : ${reponseEnvoi.destinationsDeconnectees}.`);
        }
        canal.envoyerJSON(reponseEnvoi.accuseReception);
        reponseEnvoi.messagesEnTransit.iterer((i, msg) => {
            const canalDest = this.reseau.connexion(msg.corps.ID_destinataire);
            canalDest.envoyerJSON('transit', msg);
        });
    }

    /*
    * Service de connexion persistante pour permettre une communication du serveur vers chaque client connecté.
    */
    traiterGETpersistant(canal: ConnexionLongueExpress): void {
        if (!this.reseau.aUnSommetInactifDeconnecte()) {
            const desc = "La connexion est impossible : tous les utilisateurs sont actifs."
            logger.warn(desc);
            canal.envoyerJSON(
                'avertissement',
                avertissement(this.generateurIdentifiantsMessages.produire('message'), desc));
            return;
        }
        // Envoi de la configuration initiale
        const ID_util = this.reseau.activerSommet(canal);
        const noeud = this.reseau.noeud(ID_util);
        canal.envoyerJSON('config', noeud);
        // Envoi de la nouvelle configuration aux voisins actifs
        this.reseau.diffuserConfigurationAuxVoisins(ID_util);
        // Enregistrement du traitement lors de la déconnexion
        canal.enregistrerTraitementDeconnexion(() => {
            this.reseau.inactiverSommet(ID_util);
            this.reseau.diffuserConfigurationAuxVoisins(ID_util);
        });
    }

    servirTchat(
        serveurApplications: ServeurApplications<express.Request, express.Response>,
        repertoireHtml: string,
        fichierHtml: string,
        sousCheminPost: string,
        sousCheminGetPersistant: string
    ) : void {
        serveurApplications.specifierApplicationAServir(
            this.config.prefixe, this.cleAcces, this.config.suffixe,
            repertoireHtml, fichierHtml);

        serveurApplications.specifierTraitementRequetePOST<
            FormatMessageEnvoiTchat,
            ReponseEnvoi
        >(
            this.config.prefixe,
            this.cleAcces,
            chemin(this.config.suffixe, sousCheminPost),
            (entree) => this.traitementPOST(entree),
            (canal) => this.traductionEntreePost(canal),
            (s, canal) => this.traduireSortiePOST(s, canal)
        );

        serveurApplications
            .specifierTraitementRequeteGETLongue(
                this.config.prefixe,
                this.cleAcces,
                chemin(this.config.suffixe, sousCheminGetPersistant), (canal) => this.traiterGETpersistant(canal)
            );

    }

}

export function creerServiceTchat(
    config: ConfigurationJeuTchat, cleAcces: string) : ServiceTchat {
        return new ServiceTchat(config, cleAcces);
    }

