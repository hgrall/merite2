import * as React from "react";

import styled from "styled-components";

import TextareaAutosize from 'react-textarea-autosize';

import { DateFr } from "../../bibliotheque/types/date"

import { FOND, COUPLE_FOND_ENCRE_SUJET, FOND_GAIN, FOND_PERTE } from "../../bibliotheque/interface/couleur";
import {
    DomaineInterface, Formulaire, ActionAffichable,
    FormulaireMessage, MessageInformant, FormulaireEssai
} from "./typesInterface";
import { EntreeMessage, ContainerARMessageInitial, ContainerMessageTransit, ContainerMessageAOmettre, ContainerAvisVerrouillage, ContainerMessageVerrouille, ContainerAvisTransmission, EntreeEssai, ContainerAvisGainPerte } from "./containersMessages";
import { FormatOption, option } from "../../bibliotheque/types/option";
import { Identifiant } from "../../bibliotheque/types/identifiant";

interface ProprietesAction {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    domaineSelectionne: DomaineInterface;
    informations: MessageInformant[];
    formulaireMessage: FormatOption<Formulaire>;
    formulaireEssai: FormatOption<Formulaire>;
    envoiMessageInitial: (m: FormulaireMessage, dom: DomaineInterface, d: DateFr) => void;
    envoiEssai: (m: MessageInformant) => void;
    omission: (n: MessageInformant) => void;
    annulationOmission: (n: MessageInformant) => void;
    confirmationOmission: (i: Identifiant<'message'>) => void;
    demandeVerrouillage: (m: MessageInformant) => void;
    demandeDeverrouillage: (m: MessageInformant) => void;
    transmissionMessage: (m: MessageInformant, dom: DomaineInterface, d: DateFr) => void;
    interpretation: (m: MessageInformant) => void;
    annulation: (m: FormulaireEssai) => void;
}


class ContenuContainerAction extends React.Component<ProprietesAction, {}> {


    baliseAction(a: ActionAffichable): JSX.Element {
        if (a instanceof FormulaireMessage) {
            return <EntreeMessage
                domaineSelectionne={this.props.domaineSelectionne}
                formulaire={a}
                envoiMessage={this.props.envoiMessageInitial}
                key={"entreeMessage"}
            />;
        }
        if (a instanceof FormulaireEssai) {
            return <EntreeEssai
                formulaire={a}
                envoiEssai={this.props.envoiEssai}
                annulation={this.props.annulation}
                key={"entreeEssai"}
            />;
        }
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
                    />;
                case 'omission':
                    return <ContainerMessageAOmettre
                        message={a}
                        annulationOmission={this.props.annulationOmission}
                        confirmationOmission={this.props.confirmationOmission}
                        key={a.ID.val}
                    />;
                case 'verrouillage_autrui':
                    return <ContainerAvisVerrouillage
                        message={a}
                        key={a.ID.val}
                    />;
                case 'transmission':
                    return <ContainerAvisTransmission
                        message={a}
                        omission={this.props.omission}
                        key={a.ID.val}
                    />;
                case 'verrouillage':
                    return <ContainerMessageVerrouille
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

    render() {
        let affichable: ActionAffichable[] = [];
        for (let a of this.props.informations) {
            affichable.push(a);
        }
        let fe = this.props.formulaireEssai;
        if (option(fe).estPresent()) {
            affichable.push(fe);
        }
        let fm = this.props.formulaireMessage;
        if (option(fm).estPresent()) {
            affichable.push(fm);
        }
        return (
            <div className={this.props.className}>
                {
                    affichable.map((a: ActionAffichable) =>
                        this.baliseAction(a)
                    )
                }
            </div>
        );
        /*
return (
            <div className={this.props.className}>
                {
                    affichable.map((a: ActionAffichable) =>
                        (a instanceof MessageAEnvoyer) ?
                            <EntreeMessage
                                domaineSelectionne={this.props.domaineSelectionne}
                                formulaire={a}
                                envoiMessage={this.props.envoiMessage}
                            />
                            : (
                                (a instanceof ARMessageInitial) ?
                                    <ContainerARMessageInitial
                                        message={a}
                                    />
                                    :
                                    (a instanceof MessageTransit ?
                                        <ContainerMessageTransit
                                            message={a}
                                            miseAJourInformation={this.props.miseAJourInformation}
                                        />
                                        :
                                        (a instanceof MessageAOmettre ?
                                            <ContainerMessageAOmettre
                                                message={a}
                                                miseAJourInformation={this.props.miseAJourInformation}
                                                retraitInformation={this.props.retraitInformation}
                                            />
                                            : "RAS"
                                        )

                                    )
                            )
                    )
                }
            </div>
        );



        return (
<div className={this.props.className}>
            {
                this.props.messages.map((m: Message) =>
                    ((m.emetteur.nom === this.props.sujet.nom) ?
                        <ContainerMessageEmis message={m} /> :
                        <ContainerMessageRecu message={m} />
                    )
                )
            }
            <EntreeMessage sujet={this.props.sujet} destinataire={this.props.selection}
                envoiMessage={this.props.envoiMessage} />
        </div>
        );
        */
    }
}

export const ContainerAction = styled(ContenuContainerAction)`
    background: ${FOND};
                    position: absolute;
                    top: 0;
                    left: 0;
                    /* important / overflow : deux sens haut vers bas et gauche vers droite pour le dépassement */
                    min-width: calc(74vw);
                    min-height: calc(100vh);
                    /* occupe au moins la place du container */
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                `;

