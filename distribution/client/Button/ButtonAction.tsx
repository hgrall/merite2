import {Couleur} from "../../../bibliotheque/interface/couleur";
import * as React from "react";
import styled from "styled-components";

interface ProprietesAction {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    nom: string;
    onClick: () => void;
    disabled:boolean
}

class ActionBrut extends React.Component<ProprietesAction, {}> {
    render() {
        return (
            <button className={this.props.className}
                    onClick={this.props.onClick}
                    disabled={this.props.disabled}
            >
                {this.props.nom}
            </button>
        );
    }
}

export const Action = styled(ActionBrut)`
        flex: none;
        background-color: ${(props: ProprietesAction) => props.fond};
        color : ${(props: ProprietesAction) => props.encre};
        text-align: center;
        padding: 1ex;

        width: 18ex;
        margin: 1ex;
        border-radius: 1ex;
    `;