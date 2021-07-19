import * as React from "react";

import styled from "styled-components";

import {
    COUPLE_FOND_ENCRE_INCONNU, COUPLE_FOND_ENCRE_SUJET, FOND, SuiteCouplesFondEncre, TEXTE_ERREUR
} from "../../bibliotheque/interface/couleur";


import {
    DomaineInterface, FormulaireMessage,
    messageInformant, MessageInformant, FormulaireEssai, formulaireEssai, formulaireMessage,

} from "./Helpers/typesInterface";
import {
    creerTableIdentificationMutableVide,
    TableIdentificationMutable
} from "../../bibliotheque/types/tableIdentification";
import {
    creerGenerateurIdentifiantParCompteur,
    GenerateurIdentifiants,
    identifiant,
    Identifiant
} from "../../bibliotheque/types/identifiant";
import {rienOption, option, Option} from "../../bibliotheque/types/option";
import {DateFr, dateMaintenant} from "../../bibliotheque/types/date";
import {PanneauMessages} from "./Panneau/PanneauMessages";
import {PanneauAdmin} from "./Panneau/PanneauAdmin";
import {Col, Row} from "react-bootstrap";
import {creerFluxDeEvenements, requetePOST} from "../../tchat/communication/communicationServeur";
import {AxiosError, AxiosResponse} from "axios";
import {Map} from "immutable";
import {
    FormatConfigDistribution,
    FormatConsigne, FormatDomaineDistribution,
    FormatMessageDistribution,
    FormatMessageInitialDistribution, FormatNoeudDomaineDistribution, FormatUtilisateurDistribution,
    TypeMessageDistribution
} from "../commun/echangesDistribution";


interface ProprietesCorps {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
}

enum EtatInterfaceJeu1 {
    INITIAL,
    NORMAL,
    ERRONE
};

/*
  Etat contenant
  - les attributs susceptibles d'être modifiés par des sous-composants,
  - un indicateur de l'état de l'interface, chaque valeur étant associée
    à des attributs du composant, modifiés uniquement en interne
*/
interface EtatCorps {
    selection: DomaineInterface;
    etatInterface: EtatInterfaceJeu1;
    informations: MessageInformant[]; // Identification par l'identifiant du message.
    formulaireMessage: Option<FormulaireMessage>;
    formulaireEssai: Option<FormulaireEssai>;
    tailleDomain: number;
    utilisateursActifsDomain: number;
    afficherAlerte: boolean;
    messageAlerte: string;
}

const ID_INCONNU: string = "?";

class CorpsBrut extends React.Component<ProprietesCorps, EtatCorps> {

    private fluxDeEvenements: EventSource;

    private utilisateur: FormatUtilisateurDistribution;
    private populationDomaine: TableIdentificationMutable<"sommet", FormatUtilisateurDistribution>;
    private consigne: FormatConsigne;
    private domaineUtilisateur: DomaineInterface;
    private domainesVoisins: TableIdentificationMutable<'sommet', DomaineInterface>; // TODO : intile ?

    private domaineInconnu: DomaineInterface;

    private messageErreur: string;
    private generateur: GenerateurIdentifiants<'message'>;
    private urlEnvoi: string;

    constructor(props: ProprietesCorps) {
        super(props);

        this.domainesVoisins = creerTableIdentificationMutableVide("sommet");
        this.populationDomaine = creerTableIdentificationMutableVide("sommet");

        const url = window.location.href;
        this.fluxDeEvenements = creerFluxDeEvenements(`${url}/reception`);
        this.urlEnvoi = `${url}/envoi`

        this.domaineInconnu = {
            domaine: {
                ID: identifiant('sommet', ID_INCONNU),
                domaine: [0, 0],
                actif: false
            },
            fond: COUPLE_FOND_ENCRE_INCONNU.fond,
            encre: COUPLE_FOND_ENCRE_INCONNU.encre
        };

        this.state = {
            etatInterface: EtatInterfaceJeu1.INITIAL,
            selection: this.domaineInconnu,
            informations: [],
            formulaireMessage: rienOption<FormulaireMessage>(),
            formulaireEssai: rienOption<FormulaireEssai>(),
            tailleDomain: 0,
            utilisateursActifsDomain: 0,
            afficherAlerte: false,
            messageAlerte: "",
        };
        this.envoyerMessageInitial = this.envoyerMessageInitial.bind(this);
        this.mettreAJourInformation = this.mettreAJourInformation.bind(this);
        this.retirerInformation = this.retirerInformation.bind(this);
        this.envoyerDemandeVerrouillage = this.envoyerDemandeVerrouillage.bind(this);
        this.envoyerDemandeDeverrouillage
            = this.envoyerDemandeDeverrouillage.bind(this);
        this.transmettreMessage = this.transmettreMessage.bind(this);
        this.interpreter = this.interpreter.bind(this);
        this.annuler = this.annuler.bind(this);
        this.envoyerEssai = this.envoyerEssai.bind(this);
        this.omettre = this.omettre.bind(this);
        this.annulerOmission = this.annulerOmission.bind(this);
        this.confirmerOmission = this.confirmerOmission.bind(this);
        this.masquerAlerte = this.masquerAlerte.bind(this);
    }

    masquerAlerte() {
        this.setState({afficherAlerte: false})
    }

    mettreAJourApresEnvoiMessage(m: FormulaireMessage): void {
        this.retirerFormulaireMessage();
    }

    envoyerMessageInitial(m: FormulaireMessage, d: DateFr): void {
        this.mettreAJourApresEnvoiMessage(m);
        const message: FormatMessageDistribution = {
            ID_utilisateur_emetteur: m.emetteur.ID,
            ID_origine:  m.domaineEmission.domaine.ID,
            ID_destination: m.domaineDestin.domaine.ID,
            contenu: m.trame
        }
        let msg: FormatMessageInitialDistribution = {
            corps: message,
            type: TypeMessageDistribution.INIT,
            date: d.toJSON(),
            ID: this.generateur.produire("message")
        };
        const traitementEnvoiMessage = (reponse: AxiosResponse) => {
            // TODO: TRAITER REPONSE COMME MESSAGE AR POUR L'AFFICHAGE
        };
        const traitementErreur = (raison: AxiosError) => {
            // TODO: TRAITER ERREUR
        }
        requetePOST<FormatMessageInitialDistribution>(msg, traitementEnvoiMessage, traitementErreur, this.urlEnvoi);
    }

    // ok
    envoyerEssai(m: MessageInformant): void {
    //     let msg: FormatMessageEssaiDistribution = {
    //         type: 'essai',
    //         date: m.date,
    //         domaine_origine: m.domaineEmission.domaine.ID,
    //         ID_emetteur: m.utilisateur.ID,
    //         contenu: mot(m.trame),
    //         ID: m.ID
    //     }
    //     const traitementEnvoiMessage = (reponse: AxiosResponse) => {
    //         // TODO: TRAITER REPONSE
    //     };
    //     const traitementErreur = (raison: AxiosError) => {
    //         // TODO: TRAITER ERREUR
    //     }
    //     requetePOST<FormatMessageEssaiDistribution>(msg, traitementEnvoiMessage, traitementErreur, `http://localhost:8080/tchat/code/etoile/envoi`);
    }

    omettre(m: MessageInformant): void {
        this.mettreAJourInformation(m);
    }

    annulerOmission(m: MessageInformant): void {
        this.mettreAJourInformation(m);
    }

    confirmerOmission(i: Identifiant<'message'>): void {
        this.retirerInformation(i);
    }

    mettreAJourApresDemandeVerrouillage(m: MessageInformant): void {
        this.retirerInformation(m.ID);
    }

    envoyerDemandeVerrouillage(m: MessageInformant): void {
        // this.mettreAJourApresDemandeVerrouillage(m);
        //
        // let msg: FormatMessageDemandeVerrouillageDistribution = {
        //     type: 'verrou',
        //     date: m.date,
        //     domaine_origine: m.domaineEmission.domaine.ID,
        //     ID_emetteur: m.utilisateur.ID,
        //     contenu: mot(m.trame),
        //     ID: m.ID
        // }
        // const traitementEnvoiMessage = (reponse: AxiosResponse) => {
        //     // TODO: TRAITER REPONSE
        // };
        // const traitementErreur = (raison: AxiosError) => {
        //     // TODO: TRAITER ERREUR
        // }
        // requetePOST<FormatMessageDemandeVerrouillageDistribution>(msg, traitementEnvoiMessage, traitementErreur, `http://localhost:8080/tchat/code/etoile/envoi`);
    }

    mettreAJourApresDemandeDeverrouillage(m: MessageInformant): void {
        this.retirerInformation(m.ID);
    }

    envoyerDemandeDeverrouillage(m: MessageInformant): void {
        // this.mettreAJourApresDemandeDeverrouillage(m);
        //
        // let msg: FormatMessageDemandeDeverrouillageDistribution = {
        //     type: 'libe',
        //     date: m.date,
        //     domaine_origine: m.domaineEmission.domaine.ID,
        //     ID_emetteur: m.utilisateur.ID,
        //     contenu: mot(m.trame),
        //     ID: m.ID
        // };
        // const traitementEnvoiMessage = (reponse: AxiosResponse) => {
        //     // TODO: TRAITER REPONSE
        // };
        // const traitementErreur = (raison: AxiosError) => {
        //     // TODO: TRAITER ERREUR
        // }
        // requetePOST<FormatMessageDemandeDeverrouillageDistribution>(msg, traitementEnvoiMessage, traitementErreur, `http://localhost:8080/tchat/code/etoile/envoi`);
    }

    mettreAJourApresTransmission(m: MessageInformant): void {
        this.mettreAJourInformation(m);
    }

    transmettreMessage(m: MessageInformant, domaineDestination: DomaineInterface, d: DateFr): void {
        // m = messageInformant(
        //     m.ID,
        //     m.utilisateur,
        //     m.domaineUtilisateur,
        //     m.domaineEmission,
        //     domaineDestination,
        //     m.trame,
        //     m.date, "transmission"
        // );
        // this.mettreAJourApresTransmission(m);
        //
        // let msg: FormatMessageTransmissionDistribution = {
        //     type: 'transmettre',
        //     date: m.date,
        //     domaine_origine: m.domaineEmission.domaine.ID,
        //     ID_emetteur: m.utilisateur.ID,
        //     contenu: mot(m.trame),
        //     ID: m.ID
        // };
        // console.log("* Envoi du message");
        // const traitementEnvoiMessage = (reponse: AxiosResponse) => {
        //     // TODO: TRAITER REPONSE
        // };
        // const traitementErreur = (raison: AxiosError) => {
        //     // TODO: TRAITER ERREUR
        // }
        // requetePOST<FormatMessageTransmissionDistribution>(msg, traitementEnvoiMessage, traitementErreur, `http://localhost:8080/tchat/code/etoile/envoi`);
    }

    interpreter(m: MessageInformant): void {
        this.retirerInformation(m.ID);
        this.modifierFormulaireEssai(
            formulaireEssai(m.ID, this.utilisateur, this.domaineUtilisateur,
                m.utilisateur, m.domaineEmission, m.trame, this.consigne));
    }

    annuler(f: FormulaireEssai): void {
        this.retirerFormulaireEssai();
        let d = dateMaintenant();
        this.ajouterInformation(
            messageInformant(
                f.ID,
                this.utilisateur,
                this.domaineUtilisateur,
                f.domaineEmetteur,
                this.domaineUtilisateur,
                f.trame,
                d.toJSON(),
                "verrouillage"
            )
        )
    }


    modifierSelection(dom: DomaineInterface): void {
        this.setState({selection: dom});
    }

    modifierEtatInterface(etat: EtatInterfaceJeu1): void {
        this.setState({
            etatInterface: etat
        });
    }

    retirerFormulaireMessage(): void {
        this.setState({
            formulaireMessage: rienOption<FormulaireMessage>()
        });
    }

    retirerFormulaireEssai(): void {
        this.setState({
            formulaireEssai: rienOption<FormulaireEssai>()
        });
    }

    modifierFormulaireMessage(f: FormulaireMessage) {
        this.setState({
            formulaireMessage: option(f)
        });
    }

    modifierFormulaireEssai(f: FormulaireEssai) {
        this.setState({
            formulaireEssai: option(f)
        });
    }

    ajouterInformation(i: MessageInformant): void {
        this.setState((etatAvant: EtatCorps) => ({
            informations: [...etatAvant.informations, i]
        }));
    }

    /**
     * Met à jour ou étend avec une nouvelle information.
     * @param nouvelle
     */
    mettreAJourInformation(nouvelle: MessageInformant): void {
        this.setState((etatAvant: EtatCorps) => {
            for (let j in etatAvant.informations) {
                if (etatAvant.informations[j].ID.val === nouvelle.ID.val) {
                    etatAvant.informations[j] = nouvelle;
                    return {
                        informations: etatAvant.informations
                    };
                }
            }
            return {
                informations: [...etatAvant.informations, nouvelle]
            };

        });
    }

    informationParIdentifiant(idInfo: Identifiant<'message'>):
        Option<MessageInformant> {
        for (let j in this.state.informations) {
            if (this.state.informations[j].ID.val === idInfo.val) {
                return option(this.state.informations[j]);
            }
        }
        return rienOption();
    }

    retirerInformation(idInfo: Identifiant<'message'>): void {
        this.setState((etatAvant: EtatCorps) => {
            etatAvant.informations.forEach((v, i) => {
                if (v.ID.val === idInfo.val) {
                    etatAvant.informations.splice(i, 1);
                }
            });
            return {
                informations: etatAvant.informations
            };
        });
    }

    render(): JSX.Element {
        switch (this.state.etatInterface) {
            case EtatInterfaceJeu1.INITIAL:
                return (
                    <h1>Connexion au serveur pour l'initialisation</h1>
                );
            case EtatInterfaceJeu1.NORMAL:
                return (
                    <div className={this.props.className}>
                        <Row>
                            <StyledCol sm={12} md={3}>
                                <PanneauAdmin
                                    utilisateur={this.utilisateur}
                                    populationDomaine={this.populationDomaine}
                                    domaine={this.domaineUtilisateur}
                                    consigne={this.consigne}
                                    domainesVoisins={this.domainesVoisins.image()}
                                    selection={this.state.selection}
                                    modifSelection={this.modifierSelection}
                                    tailleDomain={this.state.tailleDomain}
                                    utilisateursActifsDomain={this.state.utilisateursActifsDomain}
                                />
                            </StyledCol>
                            <StyledCol sm={12} md={9}>
                                <PanneauMessages
                                    informations={this.state.informations}
                                    formulaireMessage={this.state.formulaireMessage}
                                    formulaireEssai={this.state.formulaireEssai}
                                    domaineSelectionne={this.state.selection}
                                    envoiMessageInitial={this.envoyerMessageInitial}
                                    envoiEssai={this.envoyerEssai}
                                    annulationOmission={this.annulerOmission}
                                    confirmationOmission={this.confirmerOmission}
                                    omission={this.omettre}
                                    demandeVerrouillage={this.envoyerDemandeVerrouillage}
                                    demandeDeverrouillage={this.envoyerDemandeDeverrouillage}
                                    transmissionMessage={this.transmettreMessage}
                                    interpretation={this.interpreter}
                                    annulation={this.annuler}
                                    afficherAlerte={this.state.afficherAlerte}
                                    messageAlerte={this.state.messageAlerte}
                                    masquerAlerte={this.masquerAlerte}
                                />
                            </StyledCol>
                        </Row>
                    </div>
                );
            case EtatInterfaceJeu1.ERRONE:
                return (
                    <div>
                        <h1>Fin de l'application après l'erreur suivante : </h1>
                        <div style={{color: TEXTE_ERREUR}}>
                            {this.messageErreur}
                        </div>
                    </div>
                );
        }
    }

    componentDidMount(): void {
        console.log("* Initialisation après montage du corps");
        this.fluxDeEvenements.addEventListener('config', (e: MessageEvent) => {
            const config: FormatConfigDistribution = JSON.parse(e.data)
            const noeudDomaine: FormatNoeudDomaineDistribution = config.noeudDomaine;
            this.utilisateur = config.utilisateur;
            this.generateur = creerGenerateurIdentifiantParCompteur(this.utilisateur.ID.val + "-MSG-");
            const formatVoisins = Map(config.domainesVoisins.identification);
            let suite = new SuiteCouplesFondEncre();
            formatVoisins.forEach((value:FormatDomaineDistribution, key) => {
                let c = suite.courant();
                this.domainesVoisins.ajouter(identifiant("sommet", key), {
                    domaine: value,
                    encre: c.encre,
                    fond: c.fond
                })
            })

            this.consigne = this.utilisateur.consigne;
            let dom = noeudDomaine.centre;
            this.domaineUtilisateur = {
                domaine: dom,
                fond: COUPLE_FOND_ENCRE_SUJET.fond,
                encre: COUPLE_FOND_ENCRE_SUJET.encre
            };
            //TODO: A completer
            this.setState({tailleDomain: config.tailleDomaine, utilisateursActifsDomain: config.utilisateursActifsDuDomaine});

            let domaineSelectionne = this.domainesVoisins.selectionAssociation().valeur()[1];
            this.modifierSelection(domaineSelectionne);
            this.modifierEtatInterface(EtatInterfaceJeu1.NORMAL);
            this.modifierFormulaireMessage(
                formulaireMessage(this.utilisateur, this.domaineUtilisateur, domaineSelectionne, [], this.consigne));
        });

        this.fluxDeEvenements.addEventListener('distribution', (e: MessageEvent) => {
            //TODO: REGARDER FORMAT TYPE DE MESSAGES
            //let msg = messageDistribution(m);
            // console.log("* Traitement d'un message");
            // console.log("- brut : " + msg.brut());
            // console.log("- net : " + msg.representation());
            // switch (m.type) {
            //     case TypeMessageDistribution.AR_INIT:
            //         if (
            //             (this.utilisateur.ID.val !== m.ID_utilisateur.val)
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
            //             || (!this.domainesVoisins.contient(m.ID_destination))
            //         ) {
            //             console.log("- message incohérent");
            //             break;
            //         }
            //         this.ajouterInformation(
            //             messageInformant(
            //                 m.ID,
            //                 this.utilisateur,
            //                 this.domaineUtilisateur,
            //                 this.domaineUtilisateur,
            //                 this.domainesVoisins.valeur(m.ID_destination),
            //                 m.contenu, m.date,
            //                 'AR_initial'
            //             )
            //         );
            //         break;
            //     case TypeMessageDistribution.TRANSIT:
            //         if (
            //             (this.utilisateur.ID.val !== m.ID_utilisateur.val)
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            //             || (!this.domainesVoisins.contient(m.ID_origine))
            //         ) {
            //             console.log("- message incohérent");
            //             break;
            //         }
            //         this.mettreAJourInformation(
            //             messageInformant(
            //                 m.ID,
            //                 this.utilisateur,
            //                 this.domaineUtilisateur,
            //                 this.domainesVoisins.valeur(m.ID_origine),
            //                 this.domaineUtilisateur,
            //                 m.contenu, m.date,
            //                 'transit'
            //             )
            //         );
            //         break;
            //     case TypeMessageDistribution.ECHEC_VERROU:
            //         if (
            //             (this.utilisateur.ID.val === m.ID_utilisateur.val)
            //             || (!populationLocale(this.population)
            //                 .possedeUtilisateur(m.ID_utilisateur))
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            //             || (!this.domainesVoisins.contient(m.ID_origine))
            //         ) {
            //             console.log("- message incohérent");
            //             break;
            //         }
            //         console.log("- échec du verrouillage");
            //         break;
            //     case TypeMessageDistribution.VERROU:
            //         if (
            //             (!populationLocale(this.population)
            //                 .possedeUtilisateur(m.ID_utilisateur))
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            //             || (!this.domainesVoisins.contient(m.ID_origine))
            //         ) {
            //             console.log("- message incohérent");
            //             return;
            //         }
            //         if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            //             // cet utilisateur a verrouillé le message.
            //             this.ajouterInformation(
            //                 messageInformant(
            //                     m.ID,
            //                     this.utilisateur,
            //                     this.domaineUtilisateur,
            //                     this.domainesVoisins.valeur(m.ID_origine),
            //                     this.domaineUtilisateur,
            //                     m.contenu, m.date,
            //                     'verrouillage'
            //                 )
            //             );
            //         } else {
            //             // cet utilisateur n'a pas verrouillé le message.
            //             const u
            //                 = populationLocale(this.population).utilisateur(m.ID_utilisateur);
            //             this.retirerInformation(m.ID);
            //             this.mettreAJourInformation(
            //                 messageInformant(
            //                     m.ID,
            //                     u,
            //                     this.domaineUtilisateur,
            //                     this.domainesVoisins.valeur(m.ID_origine),
            //                     this.domaineUtilisateur,
            //                     m.contenu, m.date,
            //                     'verrouillage_autrui'
            //                 )
            //             );
            //         }
            //         break;
            //     case TypeMessageDistribution.AR_SUIVANT:
            //         if (
            //             (!populationLocale(this.population)
            //                 .possedeUtilisateur(m.ID_utilisateur))
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
            //             || (!this.domainesVoisins.contient(m.ID_destination))
            //         ) {
            //             console.log("- message incohérent");
            //             return;
            //         }
            //         if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            //             // Cet utilisateur a transmis le message.
            //             // Rien à faire : mise à jour faite lors de l'émission.
            //         } else {
            //             // cet utilisateur n'a pas verrouillé le message.
            //             const u
            //                 = populationLocale(this.population).utilisateur(m.ID_utilisateur);
            //             let optionInfo = this.informationParIdentifiant(m.ID);
            //             if (optionInfo.estPresent()) {
            //                 let msgI = optionInfo.valeur();
            //                 let neoMsgI = messageInformant(
            //                     msgI.ID,
            //                     msgI.utilisateur,
            //                     this.domaineUtilisateur,
            //                     msgI.domaineEmission,
            //                     this.domainesVoisins.valeur(m.ID_destination),
            //                     msgI.trame, msgI.date,
            //                     "transmission"
            //                 );
            //                 this.mettreAJourInformation(neoMsgI);
            //             }
            //         }
            //         break;
            //     case TypeMessageDistribution.GAIN:
            //         if (
            //             (!populationLocale(this.population)
            //                 .possedeUtilisateur(m.ID_utilisateur))
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
            //         ) {
            //             console.log("- message incohérent util gain");
            //             return;
            //         }
            //         if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            //             let optionFormulaire = option(this.state.formulaireEssai);
            //             if (optionFormulaire.estVide()) {
            //                 console.log("- message incohérent option formulaire gain");
            //                 return;
            //             }
            //             // Cet utilisateur a interprété le message.
            //             let formulaire = optionFormulaire.valeur();
            //             this.retirerFormulaireEssai();
            //             this.ajouterInformation(
            //                 messageInformantAvecInterpretation(
            //                     m.ID,
            //                     this.utilisateur,
            //                     this.domaineUtilisateur,
            //                     formulaire.domaineEmetteur,
            //                     this.domaineUtilisateur,
            //                     formulaire.trame,
            //                     m.contenu, m.date,
            //                     'gain'
            //                 )
            //             );
            //         } else {
            //             let optionInfo = this.informationParIdentifiant(m.ID);
            //             if (optionInfo.estVide()) {
            //                 console.log("- message incohérent autre option info gain");
            //                 return;
            //             }
            //             // Cet utilisateur n'a pas interprété le message,
            //             // verrouillé et interprété par un autre utilisateur.
            //             let info = optionInfo.valeur();
            //             this.mettreAJourInformation(
            //                 messageInformantAvecNouveauxInterpretationType(info, m.contenu, "gain")
            //             );
            //         }
            //         break;
            //     case TypeMessageDistribution.PERTE:
            //         if (
            //             (!populationLocale(this.population)
            //                 .possedeUtilisateur(m.ID_utilisateur))
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            //             || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
            //         ) {
            //             console.log("- message incohérent util perte");
            //             return;
            //         }
            //         if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            //             let optionFormulaire = option(this.state.formulaireEssai);
            //             if (optionFormulaire.estVide()) {
            //                 console.log("- message incohérent option formulaire perte");
            //                 return;
            //             }
            //             // Cet utilisateur a interprété le message.
            //             let formulaire = optionFormulaire.valeur();
            //             this.retirerFormulaireEssai();
            //             this.ajouterInformation(
            //                 messageInformantAvecInterpretation(
            //                     m.ID,
            //                     this.utilisateur,
            //                     this.domaineUtilisateur,
            //                     formulaire.domaineEmetteur,
            //                     this.domaineUtilisateur,
            //                     formulaire.trame,
            //                     m.contenu, m.date,
            //                     'perte'
            //                 )
            //             );
            //         } else {
            //             let optionInfo = this.informationParIdentifiant(m.ID);
            //             if (optionInfo.estVide()) {
            //                 console.log("- message incohérent autre option info perte");
            //                 return;
            //             }
            //             // Cet utilisateur n'a pas interprété le message,
            //             // verrouillé et interprété par un autre utilisateur.
            //             let info = optionInfo.valeur();
            //             this.mettreAJourInformation(
            //                 messageInformantAvecNouveauxInterpretationType(info, m.contenu, "perte")
            //             );
            //         }
            //         break;
            //     default:
            //         console.log("TODO");
        });


        this.fluxDeEvenements.addEventListener('erreur', (e: MessageEvent) => {
            // switch (err.type) {
            //     case TypeErreurDistribution.NOM_CONNEXIONS:
            //         this.setState({messageAlerte: err.messageErreur, afficherAlerte: true})
            //         this.modifierFormulaireMessage(
            //             formulaireMessage(this.utilisateur, this.domaineUtilisateur, [], this.consigne));
            //         return;
            //     case TypeErreurDistribution.REDHIBITOIRE:
            //         let erreur = erreurDistribution(err);
            //         console.log("* Réception");
            //         console.log("- de l'erreur rédhibitoire brute : " + erreur.brut());
            //         console.log("- de l'erreur rédhibitoire nette : " + erreur.representation());
            //         console.log("* Affichage de l'erreur");
            //         this.messageErreur = erreur.representation();
            //         this.modifierEtatInterface(EtatInterfaceJeu1.ERRONE);
            //         return;
            // }
        });
    }

}

export const Corps = styled(CorpsBrut)`
  background: ${FOND};
  height: 100vh;
`;

const StyledCol = styled(Col)`
  padding: 0;
`;
