import * as React from "react";
import {DateFr} from "../../../bibliotheque/types/date"
import { FOND_GAIN, FOND_PERTE} from "../../../bibliotheque/interface/couleur";
import {
    DomaineInterface, Formulaire, ActionAffichable,
    FormulaireMessage, MessageInformant, FormulaireEssai
} from "../utilitaire/typesInterface";
import {EntreeMessage} from "../champDeTexte/entreeMessage";
import {EntreeEssai} from "../champDeTexte/entreeEssai";
import {Option, option } from "../../../bibliotheque/types/option";
import {Identifiant} from "../../../bibliotheque/types/identifiant";
import {ContainerARMessageInitial} from "../messages/accuseReceptionMessageInitial";
import {ContainerMessageTransit} from "../messages/messageTransit";
import {ContainerMessageAOmettre} from "../messages/messageAOmettre";
import {ContainerAvisTransmission} from "../avis/avisTransmission";
import {ContainerAvisGainPerte} from "../avis/avisGainPerte";
import {Alert} from "react-bootstrap";
import {StyledAlert} from "../../../shared/MessageAlert";
import {MessagesContainer, PanneauMessageContainer} from "../../../shared/MessagesContainer";
import {ContainerMessageInactif} from "../messages/messageInactif";
import {ContainerMessageActif} from "../messages/messageActif";
import {TypeMessageDistribution} from "../../commun/echangesDistribution";


interface ProprietesPanneauMessages {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    domaineSelectionne: DomaineInterface;
    informations: MessageInformant[];
    formulaireMessage: Option<Formulaire>;
    formulaireEssai: Option<Formulaire>;
    envoiMessageInitial: (m: FormulaireMessage, d: DateFr) => void;
    envoiEssai: (m: MessageInformant) => void;
    omission: (n: MessageInformant) => void;
    annulationOmission: (n: MessageInformant) => void;
    confirmationOmission: (i: Identifiant<'message'>) => void;
    demandeVerrouillage: (m: MessageInformant) => void;
    demandeDeverrouillage: (m: MessageInformant) => void;
    transmissionMessage: (m: MessageInformant, dom: DomaineInterface, d: DateFr) => void;
    interpretation: (m: MessageInformant) => void;
    afficherAlerte: boolean;
    messageAlerte: string
    masquerAlerte: () => void
}


export class PanneauMessages extends React.Component<ProprietesPanneauMessages, {}> {

    baliseAction(a: ActionAffichable): JSX.Element {
        if (a instanceof MessageInformant) {
            switch (a.typeInformation) {
                case 'AR_initial':
                    return <ContainerARMessageInitial
                        message={a}
                        key={a.ID.val}
                    />;
                case 'transit':
                    return <ContainerMessageTransit
                        message={a}
                        demandeVerrouillage={this.props.demandeVerrouillage}
                        key={a.ID.val}
                        verrouillageActif = {true}
                    />;
                case 'verrou':
                    return <ContainerMessageTransit
                        message={a}
                        demandeVerrouillage={this.props.demandeVerrouillage}
                        key={a.ID.val}
                        verrouillageActif = {false}
                    />;
                case 'omission':
                    return <ContainerMessageAOmettre
                        message={a}
                        annulationOmission={this.props.annulationOmission}
                        confirmationOmission={this.props.confirmationOmission}
                        key={a.ID.val}
                    />;
                case 'inactif':
                    return <ContainerMessageInactif
                        message={a}
                        key={a.ID.val}
                    />;
                case 'transmission':
                    return <ContainerAvisTransmission
                        message={a}
                        omission={this.props.omission}
                        key={a.ID.val}
                    />;
                case 'actif':
                    return <ContainerMessageActif
                        message={a}
                        domaineSelectionne={this.props.domaineSelectionne}
                        demandeDeverrouillage={this.props.demandeDeverrouillage}
                        transmissionMessage={this.props.transmissionMessage}
                        interpretation={this.props.interpretation}
                        key={a.ID.val}
                    />;
                case 'gain':
                    return <ContainerAvisGainPerte
                        message={a}
                        qualificatif={"Gagné"}
                        fond={FOND_GAIN}
                        key={a.ID.val}
                    />;
                case 'perte':
                    return <ContainerAvisGainPerte
                        message={a}
                        qualificatif={"Perdu"}
                        fond={FOND_PERTE}
                        key={a.ID.val}
                    />;
            }
        }
        throw new Error("* Erreur : type d'action affichable inconnu.");
    }

    afficherFormulaire() {
        if(this.props.formulaireMessage.estVide()){
            return;
        }
        if (option(this.props.formulaireMessage).estPresent()) {
            let formulaireMessage = this.props.formulaireMessage.valeur() as FormulaireMessage;
            return <EntreeMessage
                domaineSelectionne={this.props.domaineSelectionne}
                formulaire={formulaireMessage}
                envoiMessage={this.props.envoiMessageInitial}
                key={"entreeMessage"}
            />;
        } else {
            let formulaireEssaie = this.props.formulaireEssai.valeur() as FormulaireEssai;
            if (option(formulaireEssaie).estPresent()) {
                return <EntreeEssai
                    formulaire={formulaireEssaie}
                    envoiEssai={this.props.envoiEssai}
                    key={"entreeEssai"}
                />;
            }
        }
    }

    AfficherAlerte() {
        if (this.props.afficherAlerte) {
            return (
                <StyledAlert variant="danger" onClose={this.props.masquerAlerte} dismissible>
                    <Alert.Heading>Attention !</Alert.Heading>
                    <p> {this.props.messageAlerte} </p>
                </StyledAlert>
            );
        }
    }

    render() {
        let affichable: ActionAffichable[] = [];
        for (let a of this.props.informations) {
            affichable.push(a);
        }
        return (
            <PanneauMessageContainer>
                <MessagesContainer>
                    {this.AfficherAlerte()}
                    {affichable.map((a: ActionAffichable) => this.baliseAction(a))}
                </MessagesContainer>
                {this.afficherFormulaire()}
            </PanneauMessageContainer>
        );
    }
}

