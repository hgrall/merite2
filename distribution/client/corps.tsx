import * as React from "react";

import styled from "styled-components";

import {
    COUPLE_FOND_ENCRE_INCONNU,
    COUPLE_FOND_ENCRE_SUJET,
    FOND,
    SuiteCouplesFondEncre,
    TEXTE_ERREUR
} from "../../bibliotheque/interface/couleur";


import {
    DomaineInterface,
    FormulaireEssai,
    formulaireEssai,
    FormulaireMessage,
    formulaireMessage,
    MessageInformant,
    messageInformant, TypeMessageInformant,
} from "./Helpers/typesInterface";
import {
    creerTableIdentificationMutableVide,
    TableIdentification,
    TableIdentificationMutable
} from "../../bibliotheque/types/tableIdentification";
import {
    creerGenerateurIdentifiantParCompteur,
    GenerateurIdentifiants,
    identifiant,
    Identifiant
} from "../../bibliotheque/types/identifiant";
import {option, Option, rienOption} from "../../bibliotheque/types/option";
import {DateFr} from "../../bibliotheque/types/date";
import {PanneauMessages} from "./Panneau/PanneauMessages";
import {PanneauAdmin} from "./Panneau/PanneauAdmin";
import {Col, Row} from "react-bootstrap";
import {creerFluxDeEvenements, requetePOST} from "../../bibliotheque/communication/communicationServeur";
import {AxiosError, AxiosResponse} from "axios";
import {Map} from "immutable";
import {
    FormatConfigDistribution,
    FormatConsigne,
    FormatCorpsMessageDistribution,
    FormatDomaineDistribution,
    FormatMessageDistribution,
    FormatNoeudDomaineDistribution,
    FormatUtilisateurDistribution,
    TypeMessageDistribution
} from "../commun/echangesDistribution";
import {TypeMessage} from "../../bibliotheque/applications/message";


interface ProprietesCorps {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
}

enum EtatInterfaceJeu1 {
    INITIAL,
    NORMAL,
    ERRONE
}

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
    domainesVoisins: TableIdentificationMutable<"sommet", DomaineInterface>
}

const ID_INCONNU: string = "?";

class CorpsBrut extends React.Component<ProprietesCorps, EtatCorps> {

    private fluxDeEvenements: EventSource;

    private utilisateur: FormatUtilisateurDistribution;
    private consigne: FormatConsigne;
    private domaineUtilisateur: DomaineInterface;

    private domaineInconnu: DomaineInterface;

    private messageErreur: string;
    private generateur: GenerateurIdentifiants<'message'>;
    private urlEnvoi: string;
    private urlVerrou: string;

    populationDomaine: TableIdentification<"sommet", FormatUtilisateurDistribution>;

    constructor(props: ProprietesCorps) {
        super(props);

        this.populationDomaine = creerTableIdentificationMutableVide("sommet");

        const url = window.location.href;
        this.fluxDeEvenements = creerFluxDeEvenements(`${url}/reception`);
        this.urlEnvoi = `${url}/envoi`
        this.urlVerrou = `${url}/verrou`

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
            domainesVoisins: creerTableIdentificationMutableVide("sommet")
        };
        this.modifierSelection = this.modifierSelection.bind(this);
        this.envoyerMessageInitial = this.envoyerMessageInitial.bind(this);
        this.mettreAJourInformation = this.mettreAJourInformation.bind(this);
        this.retirerInformation = this.retirerInformation.bind(this);
        this.envoyerDemandeVerrouillage = this.envoyerDemandeVerrouillage.bind(this);
        this.envoyerDemandeDeverrouillage
            = this.envoyerDemandeDeverrouillage.bind(this);
        this.transmettreMessage = this.transmettreMessage.bind(this);
        this.interpreter = this.interpreter.bind(this);
        //this.annuler = this.annuler.bind(this);
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
        const message: FormatCorpsMessageDistribution = {
            ID_utilisateur_emetteur: m.emetteur.ID,
            ID_origine: m.domaineEmission.domaine.ID,
            ID_destination: m.domaineDestin.domaine.ID,
            contenu: m.trame
        }
        let msg: FormatMessageDistribution = {
            corps: message,
            type: TypeMessageDistribution.ENVOI,
            date: d.toJSON(),
            ID: this.generateur.produire("message")
        };
        const traitementEnvoiMessage = (reponse: AxiosResponse) => {
            const message: FormatMessageDistribution = reponse.data;
            console.log("- Reception du message");
            if ((this.domaineUtilisateur.domaine.ID.val !== message.corps.ID_destination.val)
                || (!this.state.domainesVoisins.contient(message.corps.ID_origine))
            ) {
                console.log("- message incohérent");
            }
            this.mettreAJourInformation(msg,  'AR_initial');
        };
        const traitementErreur = (raison: AxiosError) => {
            console.log('- erreur POST message intial')
        }
        requetePOST<FormatMessageDistribution>(msg, traitementEnvoiMessage, traitementErreur, this.urlEnvoi);
    }

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
        let msg: FormatMessageDistribution = {
            type: TypeMessageDistribution.VERROUILLABLE,
            date: m.date,
            corps: {
                ID_utilisateur_emetteur: m.utilisateur.ID,
                ID_destination: m.domaineDestination.domaine.ID,
                ID_origine: m.domaineEmission.domaine.ID,
                contenu: m.trame,
            },
            ID: m.ID
        }
        this.mettreAJourInformation(msg, TypeMessageDistribution.TRANSIT);
    }

    annulerOmission(m: MessageInformant): void {
        let msg: FormatMessageDistribution = {
            type: TypeMessageDistribution.VERROUILLABLE,
            date: m.date,
            corps: {
                ID_utilisateur_emetteur: m.utilisateur.ID,
                ID_destination: m.domaineDestination.domaine.ID,
                ID_origine: m.domaineEmission.domaine.ID,
                contenu: m.trame,
            },
            ID: m.ID
        }
        this.mettreAJourInformation(msg, TypeMessageDistribution.TRANSIT);
    }

    confirmerOmission(i: Identifiant<'message'>): void {
        this.retirerInformation(i);
    }

    envoyerDemandeVerrouillage(m: MessageInformant): void {
        console.log("- Envoi demande verrouillage");
        let msg: FormatMessageDistribution = {
            type: TypeMessageDistribution.VERROUILLABLE,
            date: m.date,
            corps: {
                ID_utilisateur_emetteur: m.utilisateur.ID,
                ID_destination: m.domaineDestination.domaine.ID,
                ID_origine: m.domaineEmission.domaine.ID,
                contenu: m.trame,
            },
            ID: m.ID
        }

        this.mettreAJourInformation(msg, TypeMessageDistribution.VERROU);
        const traitementEnvoiMessage = (reponse: AxiosResponse) => {
            const message = reponse.data
            this.mettreAJourInformation( message,  TypeMessageDistribution.ACTIF);

        };
        const traitementErreur = (raison: AxiosError) => {
            console.log("- échec du verrouillage");
        }
        requetePOST<FormatMessageDistribution>(msg, traitementEnvoiMessage, traitementErreur, this.urlVerrou);
    }

    envoyerDemandeDeverrouillage(m: MessageInformant): void {
        let msg: FormatMessageDistribution = {
            type: TypeMessageDistribution.LIBE,
            date: m.date,
            corps: {
                ID_utilisateur_emetteur: m.utilisateur.ID,
                ID_destination: m.domaineDestination.domaine.ID,
                ID_origine: m.domaineEmission.domaine.ID,
                contenu: m.trame,
            },
            ID: m.ID
        };
        const traitementEnvoiMessage = (reponse: AxiosResponse) => {
            const message = reponse.data;
            this.mettreAJourInformation( message, TypeMessageDistribution.TRANSIT);
        };
        const traitementErreur = (raison: AxiosError) => {
            console.log("- échec du deverrouillage");
        }
        requetePOST<FormatMessageDistribution>(msg, traitementEnvoiMessage, traitementErreur, this.urlEnvoi);
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

    /**
     * Met à jour ou étend avec une nouvelle information.
     * @param message
     * @param nouveauType nouveau type du message
     */
    mettreAJourInformation(message: FormatMessageDistribution, nouveauType: TypeMessageInformant): void {
        let domaineEmission =  this.state.domainesVoisins.valeur(message.corps.ID_origine);
        let domainDestination = this.domaineUtilisateur
        if(nouveauType==="AR_initial"){
            domaineEmission = this.domaineUtilisateur;
            domainDestination = this.state.domainesVoisins.valeur(message.corps.ID_destination);
        }
        const nouvelle = messageInformant(
            message.ID,
            this.utilisateur,
            this.domaineUtilisateur,
            domaineEmission,
            domainDestination,
            message.corps.contenu,
            message.date,
            nouveauType
        )
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
                                    domainesVoisins={this.state.domainesVoisins.image()}
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
        this.fluxDeEvenements.addEventListener(TypeMessage.CONFIG, (e: MessageEvent) => {
            console.log("- reception de la configuration");
            const config: FormatConfigDistribution = JSON.parse(e.data);
            const noeudDomaine: FormatNoeudDomaineDistribution = config.noeudDomaine;
            this.utilisateur = config.utilisateur;
            this.generateur = creerGenerateurIdentifiantParCompteur(this.utilisateur.ID.val + "-MSG-");
            const formatVoisins = Map(config.domainesVoisins.identification);
            const suite = new SuiteCouplesFondEncre();
            const nouveauxVoisins = creerTableIdentificationMutableVide<'sommet', DomaineInterface>("sommet");

            formatVoisins.forEach((value: FormatDomaineDistribution, key) => {
                let c = suite.courant();
                nouveauxVoisins.ajouter(identifiant("sommet", key), {
                    domaine: value,
                    encre: c.encre,
                    fond: c.fond,
                })
            })

            this.consigne = this.utilisateur.consigne;
            const dom = noeudDomaine.centre;
            this.domaineUtilisateur = {
                domaine: dom,
                fond: COUPLE_FOND_ENCRE_SUJET.fond,
                encre: COUPLE_FOND_ENCRE_SUJET.encre
            };
            this.setState({
                tailleDomain: config.tailleDomaine,
                utilisateursActifsDomain: config.utilisateursActifsDuDomaine,
                domainesVoisins: nouveauxVoisins
            });
            const voisinSelection = this.state.domainesVoisins.selectionAssociationSuivantCritere((ID_sorte, x) => x.domaine.actif)
            if (voisinSelection.estPresent()){
                const domaineSelection = voisinSelection.valeur()[1];
                this.modifierSelection(domaineSelection);
            }
            this.modifierEtatInterface(EtatInterfaceJeu1.NORMAL);
            this.modifierFormulaireMessage(
                formulaireMessage(this.utilisateur, this.domaineUtilisateur, this.state.selection, [], this.consigne));
        });

        this.fluxDeEvenements.addEventListener(TypeMessageDistribution.TRANSIT, (e: MessageEvent) => {
            console.log("- reception d'un message de transit");

            const message: FormatMessageDistribution = JSON.parse(e.data);
            if ((this.domaineUtilisateur.domaine.ID !== message.corps.ID_destination)
                || (!this.state.domainesVoisins.contient(message.corps.ID_origine))
            ) {
                console.log("- message incohérent");
            }
            this.mettreAJourInformation(message, 'transit');
        })

        this.fluxDeEvenements.addEventListener('INACTIF', (e: MessageEvent) => {
            const message: FormatMessageDistribution = JSON.parse(e.data);
            if ((this.domaineUtilisateur.domaine.ID.val !== message.corps.ID_destination.val)
                || (!this.state.domainesVoisins.contient(message.corps.ID_origine))
            ) {
                console.log("- message incohérent");
                return;
            }
            this.mettreAJourInformation(message, 'inactif');
        })

        this.fluxDeEvenements.addEventListener('distribution', (e: MessageEvent) => {

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
