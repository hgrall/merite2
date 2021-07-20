import styled from "styled-components";
import {
    COUPLE_FOND_ENCRE_SUJET,
    FOND_SELECTION,
    FOND_TEXTE, TEXTE,
    TEXTE_ERREUR
} from "../../../bibliotheque/interface/couleur";
import * as React from "react";
import {mot} from "../../../bibliotheque/types/binaire";
import {DateFr, dateMaintenant} from "../../../bibliotheque/types/date";
import {DomaineInterface, MessageInformant} from "../Helpers/typesInterface";
import {MessageFixe} from "./MessageFixe";
import {Action} from "../Button/ButtonAction";
import {InterlocuteurMessage, Role} from "../../../shared/InterlocuteurMessage";

interface ProprietesMessageVerrouille {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    domaineSelectionne: DomaineInterface;
    demandeDeverrouillage: (m: MessageInformant) => void;
    transmissionMessage: (m: MessageInformant, dom: DomaineInterface, d: DateFr) => void;
    interpretation: (m: MessageInformant) => void;
}

class ContainerMessageVerrouilleBrut extends React.Component<ProprietesMessageVerrouille, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className} style={{ background: FOND_SELECTION }} >
                <InterlocuteurMessage fond={this.props.message.domaineEmission.fond}
                               encre={this.props.message.domaineEmission.encre}
                               nom={mot(this.props.message.domaineEmission.domaine.domaine).representation()}
                               role={Role.Emetteur} />
                <MessageFixe style={{ color: (this.props.message.ID.val.includes('ERR')) ? TEXTE_ERREUR : TEXTE }}>
                    {"message numéro " + n + " : "
                    + mot(this.props.message.trame).representation()}
                </MessageFixe>
                <Action fond={this.props.message.domaineDestination.fond}
                        encre={this.props.message.domaineDestination.encre}
                        nom={"Interpréter"}
                        onClick={() => {
                            this.props.interpretation(this.props.message);
                        }}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                        encre={this.props.message.domaineDestination.encre}
                        nom={"Transmettre"}
                        onClick={() => {
                            let d = dateMaintenant();
                            this.props.transmissionMessage(this.props.message,
                                this.props.domaineSelectionne,
                                d
                            );
                        }}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                        encre={this.props.message.domaineDestination.encre}
                        nom={"Déverrouiller"}
                        onClick={() => {
                            this.props.demandeDeverrouillage(
                                this.props.message
                            );
                        }}
                />


            </div>
        );
    }
}

export const ContainerMessageVerrouille = styled(ContainerMessageVerrouilleBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;