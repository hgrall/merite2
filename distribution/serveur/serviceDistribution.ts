import * as express from 'express';
import { isRight } from 'fp-ts/lib/Either'
import { logger } from '../../bibliotheque/administration/log';
import { ConnexionExpress, ConnexionLongueExpress } from '../../bibliotheque/communication/connexion';

import { ConfigurationJeuDistribution } from '../../accueil/commun/configurationJeux';

import {
    chemin,
    ServeurApplications
} from "../../bibliotheque/communication/serveurApplications";

import { creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants } from "../../bibliotheque/types/identifiant";
import { option, Option, rienOption } from '../../bibliotheque/types/option';
import { creerGenerateurReseauDistribution, ReseauMutableDistribution } from './reseauDistribution';
import {
    estUtilisateur, FormatConfigDistribution,
    FormatMessageInitialDistribution,
} from '../commun/echangesDistribution';
import { avertissement, erreur } from '../../bibliotheque/applications/message';
import { EnsembleIdentifiants } from '../../bibliotheque/types/ensembleIdentifiants';
import { traductionInitEnTransit } from './echangesServeurDistribution';
import {FormatMessageInitialDistributionValidator} from "../../bibliotheque/validation/distribution/echanges";


/*
* Service de l'application.
*/

interface ReponsePOSTInitial {
    accuseReception: FormatMessageInitialDistribution;
    utilisateursDestinataires: EnsembleIdentifiants<"sommet">
}

class ServiceDistribution {
    private reseau: ReseauMutableDistribution<ConnexionLongueExpress>;
    private generateurIdentifiantsMessages:
        GenerateurIdentifiants<'message'>;
    constructor(
        private config: ConfigurationJeuDistribution,
        private cleAcces: string
    ) {
        this.reseau = creerGenerateurReseauDistribution<ConnexionLongueExpress>(
            cleAcces, config.nombreDomaines, config.effectifParDomaine
        ).engendrer();
        this.generateurIdentifiantsMessages = creerGenerateurIdentifiantParCompteur(cleAcces + "-distribution-" + config.type + "-");
    }

    /*
    * Service de réception d'un message (POST).
    */

    traitementPOSTInitial(msg: FormatMessageInitialDistribution)
        : ReponsePOSTInitial {
        return {
            accuseReception: msg,
            utilisateursDestinataires: this.reseau.cribleVoisins(msg.corps.ID_destination, (ID, s) => estUtilisateur(s) && s.actif)
        };
    }
    traductionEntreePostInitial(canal: ConnexionExpress): Option<FormatMessageInitialDistribution> {
        const msg: FormatMessageInitialDistribution = canal.lire();
        if (!isRight(FormatMessageInitialDistributionValidator.decode(msg))) {
            const desc = "TODO Le format JSON du message reçu n'est pas correct. Le type du message doit être 'INIT'. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageInitialDistribution>();
        }
        // Le message reçu est supposé correct,
        // en première approximation.
        const voisinageDomaines = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_destination);
        const appartenanceUtilisateurDomaine = this.reseau.sontVoisins(msg.corps.ID_origine, msg.corps.ID_utilisateur_emetteur);
        if (!voisinageDomaines
            || !appartenanceUtilisateurDomaine) {
            const desc = `Le message reçu n'est pas cohérent. Les domaines d'origine et de destination doivent être voisins (ici ${voisinageDomaines}) et l'utilisateur émetteur doit appartenir au domaine d'origine (ici ${appartenanceUtilisateurDomaine}). Erreur HTTP 400 : Bad Request.`;
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageInitialDistribution>();
        }
        if (!this.reseau.sommet(msg.corps.ID_destination).actif) {
            const desc = "Le domaine de destination n'est pas actif. La requête doit être renvoyée lorsque le domaine devient actif. Erreur HTTP 400 : Bad Request.";
            canal.envoyerJSONCodeErreur(400, erreur(this.generateurIdentifiantsMessages.produire('message'), desc));
            logger.error(desc);
            return rienOption<FormatMessageInitialDistribution>();
        }
        return option(msg);
    }

    traduireSortiePOSTInitial(reponse: ReponsePOSTInitial, canal: ConnexionExpress): void {
        
        canal.envoyerJSON(reponse.accuseReception);
        reponse.utilisateursDestinataires.iterer((ID) => {
            const canalDest = this.reseau.connexion(ID);
            canalDest.envoyerJSON(
                'TRANSIT', 
                traductionInitEnTransit(reponse.accuseReception, 
                    ID, this.generateurIdentifiantsMessages.produire('message') ));
        });
    }

    /*
    * Service de connexion persistante pour permettre 
    * une communication du serveur vers chaque client connecté.
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
        const ID_util = this.reseau.activerSommet(canal);
        const config : FormatConfigDistribution = this.reseau.configurationUtilisateur(ID_util);

        // Envoi de la configuration initiale
        canal.envoyerJSON('config', config);
        // Envoi de la nouvelle configuration aux voisins actifs
        this.reseau.diffuserConfigurationAuxVoisins(ID_util);

        // Enregistrement du traitement lors de la déconnexion
        canal.enregistrerTraitementDeconnexion(() => {
            this.reseau.inactiverSommet(ID_util);
            this.reseau.diffuserConfigurationAuxVoisins(ID_util);
        });
    }

    servirDistribution(
        serveurApplications: ServeurApplications<express.Request, express.Response>,
        repertoireHtml: string,
        fichierHtml: string,
        sousCheminPost: string,
        sousCheminGetPersistant: string
    ): void {
        serveurApplications.specifierApplicationAServir(
            this.config.prefixe, this.cleAcces, this.config.suffixe,
            repertoireHtml, fichierHtml);

        serveurApplications.specifierTraitementRequetePOST<
            FormatMessageInitialDistribution,
            ReponsePOSTInitial
        >(
            this.config.prefixe,
            this.cleAcces,
            chemin(this.config.suffixe, sousCheminPost),
            (entree) => this.traitementPOSTInitial(entree),
            (canal) => this.traductionEntreePostInitial(canal),
            (s, canal) => this.traduireSortiePOSTInitial(s, canal)
        );

        serveurApplications
            .specifierTraitementRequeteGETLongue(
                this.config.prefixe,
                this.cleAcces,
                chemin(this.config.suffixe, sousCheminGetPersistant), (canal) => this.traiterGETpersistant(canal)
            );

    }

}

export function creerServiceDistribution(
    config: ConfigurationJeuDistribution, cleAcces: string): ServiceDistribution {
    return new ServiceDistribution(config, cleAcces);
}

