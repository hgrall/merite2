import styled from "styled-components";
import {COUPLE_FOND_ENCRE_SUJET, FOND_TEXTE, TEXTE} from "../../../bibliotheque/interface/couleur";
import * as React from "react";
import {mot} from "../../../bibliotheque/types/binaire";
import {MessageInformant} from "../Helpers/typesInterface";
import {MessageFixe} from "./MessageFixe";
import {InterlocuteurMessage, Role} from "../../../shared/InterlocuteurMessage";

interface ProprietesARMessageInitial {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
}

class ContainerARMessageInitialBrut extends React.Component<ProprietesARMessageInitial, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className} key={id}>
                <InterlocuteurMessage fond={this.props.message.domaineEmission.fond}
                                      encre={this.props.message.domaineEmission.encre}
                                      nom={mot(this.props.message.utilisateur.utilisateur).representation()
                                      + "@"
                                      + mot(this.props.message.domaineEmission.domaine.domaine).representation()}
                                      role={Role.Emetteur} />

                <MessageFixe style={{ color: TEXTE }}>
                    {"message numéro " + n + " : "
                    + mot(this.props.message.trame).representation()}
                </MessageFixe>

                <InterlocuteurMessage fond={this.props.message.domaineDestination.fond}
                                      encre={this.props.message.domaineDestination.encre}
                                      nom={mot(this.props.message.domaineDestination.domaine.domaine).representation()}
                                      role={Role.Recepteur} />
            </div>
        );
    }
}

export const ContainerARMessageInitial = styled(ContainerARMessageInitialBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-start;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;