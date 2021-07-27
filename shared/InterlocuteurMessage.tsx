import {Couleur} from "../bibliotheque/interface/couleur";
import * as React from "react";
import styled from "styled-components";

export enum Role { Emetteur, Recepteur };

export interface ProprietesInterlocuteur {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    nom: string,
    role: Role
}

class InterlocuteurBrut extends React.Component<ProprietesInterlocuteur, {}> {
    render() {
        return (
            <p className={this.props.className}>
                {((this.props.role === Role.Emetteur) ? "De : " : "À : ") + this.props.nom}
            </p>
        );
    }
}

export const InterlocuteurMessage = styled(InterlocuteurBrut)`
        background-color: ${(props: ProprietesInterlocuteur) => props.fond};
        color : ${(props: ProprietesInterlocuteur) => props.encre};
        text-align: center;
        padding: 1ex;
        height: 100%;
    `;