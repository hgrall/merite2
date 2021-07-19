import * as React from "react";
import {mot} from "../../../bibliotheque/types/binaire";
import {Couleur, COUPLE_FOND_ENCRE_SUJET, FOND_TEXTE, TEXTE} from "../../../bibliotheque/interface/couleur";
import {MessageInformant} from "../Helpers/typesInterface";
import styled from "styled-components";
import {Avis} from "./Avis";
import {MessageFixe} from "../Messages/MessageFixe";
import {InterlocuteurMessage, Role} from "../../../shared/InterlocuteurMessage";


interface ProprietesAvisGainPerte {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    qualificatif: string;
    fond: Couleur;
}

class ContainerAvisGainPerteBrut
    extends React.Component<ProprietesAvisGainPerte, {}> {
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
                    + mot(this.props.message.trame).representation() + "\n"
                    + "interprétation : "
                    + mot(this.props.message.interpretation).representation()}
                </MessageFixe>
                <Avis fond={this.props.fond}
                      encre={TEXTE}
                      avis={this.props.qualificatif + " par l'utilisateur " + u + "@" + dom + "."}
                />
            </div>
        );
    }
}


export const ContainerAvisGainPerte = styled(ContainerAvisGainPerteBrut)`
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