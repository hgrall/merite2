import {MessageInformant} from "../Helpers/typesInterface";
import * as React from "react";
import {mot} from "../../../bibliotheque/types/binaire";
import {COUPLE_FOND_ENCRE_SUJET, FOND_TEXTE, TEXTE, TEXTE_ERREUR} from "../../../bibliotheque/interface/couleur";
import {MessageFixe} from "./MessageFixe";
import styled from "styled-components";
import {Action} from "../Button/ButtonAction";
import {InterlocuteurMessage, Role} from "../../../../../../Desktop/shared/InterlocuteurMessage";

interface ProprietesMessageTransit {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    demandeVerrouillage: (m: MessageInformant) => void;
}

class ContainerMessageTransitBrut extends React.Component<ProprietesMessageTransit, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className}>
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
                        nom={"Verrouiller"}
                        onClick={() => {
                            this.props.demandeVerrouillage(
                                this.props.message
                            );
                        }}
                />

            </div>
        );
    }
}

export const ContainerMessageTransit = styled(ContainerMessageTransitBrut)`
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