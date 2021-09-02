import * as React from "react";
import {mot} from "../../../bibliotheque/types/binaire";
import {COUPLE_FOND_ENCRE_SUJET, FOND_TEXTE, TEXTE, TEXTE_ERREUR} from "../../../bibliotheque/interface/couleur";
import {MessageInformant, messageInformantAvecNouveauType} from "../utilitaire/typesInterface";
import {Identifiant} from "../../../bibliotheque/types/identifiant";
import styled from "styled-components";
import {Action} from "../bouton/boutonAction";
import { MessageFixe } from "./messageFixe";
import {InterlocuteurMessage, Role} from "../../../shared/InterlocuteurMessage";


interface ProprietesMessageAOmettre {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    annulationOmission: (n: MessageInformant) => void;
    confirmationOmission: (i: Identifiant<'message'>) => void;
}

class ContainerMessageAOmettreBrut extends React.Component<ProprietesMessageAOmettre, {}> {
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
                    {"Omettre le message numéro " + n + " : "
                    + mot(this.props.message.trame).representation()
                    + " ?"}
                </MessageFixe>

                <Action fond={this.props.message.domaineDestination.fond}
                        encre={this.props.message.domaineDestination.encre}
                        nom={"Annuler"}
                        onClick={() => {
                            this.props.annulationOmission(
                                messageInformantAvecNouveauType(this.props.message, 'transmission'));
                        }}
                        disabled={false}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                        encre={this.props.message.domaineDestination.encre}
                        nom={"Confirmer"}
                        onClick={() => {
                            this.props.confirmationOmission(
                                this.props.message.ID
                            );
                        }}
                        disabled={false}
                />
            </div>
        );
    }
}

export const ContainerMessageAOmettre = styled(ContainerMessageAOmettreBrut)`
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