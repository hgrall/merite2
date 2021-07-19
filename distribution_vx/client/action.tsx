import * as React from "react";

import styled from "styled-components";

import Scrollbars from "react-custom-scrollbars";

import { ContainerAction } from "./containerAction";

import { FOND } from "../../bibliotheque/interface/couleur";
import { DomaineInterface, Formulaire, FormulaireMessage, MessageInformant, FormulaireEssai } from "./typesInterface";
import { FormatOption } from "../../bibliotheque/types/option";
import { DateFr } from "../../bibliotheque/types/date";
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

class ContenuAction extends React.Component<ProprietesAction, {}> {
    render() {
        return (
            <div className={this.props.className}>
                <Scrollbars style={{ width: "74vw", height: "100vh" }}>
                    <ContainerAction
                        domaineSelectionne={this.props.domaineSelectionne}
                        informations={this.props.informations}
                        formulaireMessage={this.props.formulaireMessage}
                        formulaireEssai={this.props.formulaireEssai}
                        envoiMessageInitial={this.props.envoiMessageInitial}
                        envoiEssai={this.props.envoiEssai}
                        annulationOmission={this.props.annulationOmission}
                        confirmationOmission={this.props.confirmationOmission}
                        omission={this.props.omission}
                        demandeVerrouillage={this.props.demandeVerrouillage}
                        demandeDeverrouillage={this.props.demandeDeverrouillage}
                        transmissionMessage={this.props.transmissionMessage}
                        interpretation={this.props.interpretation}
                        annulation={this.props.annulation}
                    />
                </Scrollbars>
            </div>
        );
    }
}

export const Action = styled(ContenuAction)`
    background: ${FOND};
    position: fixed;
    top: 0;
    right: 1vw;
`;

