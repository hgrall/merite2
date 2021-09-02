import {MessageInformant, messageInformantAvecNouveauType} from "../utilitaire/typesInterface";
import * as React from "react";
import {mot} from "../../../bibliotheque/types/binaire";
import {COUPLE_FOND_ENCRE_SUJET, FOND_TEXTE, TEXTE} from "../../../bibliotheque/interface/couleur";
import styled from "styled-components";
import {Action} from "../bouton/boutonAction";
import {Avis} from "./avis";
import {MessageFixe} from "../messages/messageFixe";
import {InterlocuteurMessage, Role} from "../../../shared/InterlocuteurMessage";


interface ProprietesAvisTransmission {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    omission: (n: MessageInformant) => void;
}


class ContainerAvisTransmissionBrut
    extends React.Component<ProprietesAvisTransmission, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        let u = mot(this.props.message.utilisateur.utilisateur).representation();
        let dom
            = mot(this.props.message.domaineUtilisateur.domaine.domaine).representation();
        return (
            <div className={this.props.className}>
                <InterlocuteurMessage fond={this.props.message.domaineEmission.fond}
                               encre={this.props.message.domaineEmission.encre}
                               nom={mot(this.props.message.domaineEmission.domaine.domaine).representation()}
                               role={Role.Emetteur} />
                <MessageFixe style={{ color: TEXTE }}>
                    {"message numéro " + n + " : "
                    + mot(this.props.message.trame).representation()}
                </MessageFixe>
                <Avis fond={this.props.message.domaineDestination.fond}
                      encre={this.props.message.domaineDestination.encre}
                      avis={"Transmis par l'utilisateur " + u + "@" + dom
                      + " à " + mot(this.props.message.domaineDestination.domaine.domaine).representation()
                      + "."}
                />

                <Action fond={this.props.message.domaineDestination.fond}
                        encre={this.props.message.domaineDestination.encre}
                        nom={"Omettre"}
                        onClick={() => {
                            this.props.omission(
                                messageInformantAvecNouveauType(this.props.message, 'omission'));
                        }}
                        disabled={false}
                />
            </div>
        );
    }
}


export const ContainerAvisTransmission = styled(ContainerAvisTransmissionBrut)`
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