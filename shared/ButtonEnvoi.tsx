import {CADRE, Couleur} from "../bibliotheque/interface/couleur";
import * as React from "react";
import styled from "styled-components";
import {ProprietesInterlocuteur} from "./InterlocuteurMessage";
import {Button} from "react-bootstrap";

interface ProprietesEnvoi {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    nom: string;
    onClick: () => void;
    inactif: boolean;
}

class ButtonEnvoiBrut extends React.Component<ProprietesEnvoi> {
    render() {
        return (
            <Button className={this.props.className}
                    onClick={this.props.onClick}
                    disabled={this.props.inactif}

            >
                {"A : " + this.props.nom}
            </Button>
        );
    }
}

export const ButtonEnvoi = styled(ButtonEnvoiBrut)`
  flex: none;
  background-color: ${(props: ProprietesInterlocuteur) => props.fond};
  border-color: ${(props: ProprietesInterlocuteur) => props.fond};
  color: ${(props: ProprietesInterlocuteur) => props.encre};
  text-align: center;
  width: 150px;

  :hover {
    background-color: ${CADRE};
    border-color: ${CADRE};
  }

  ::selection {
    background-color: ${(props: ProprietesInterlocuteur) => props.fond};
  }

  :focus {
    background-color: ${(props: ProprietesInterlocuteur) => props.fond};
    border-color:${(props: ProprietesInterlocuteur) => props.fond};
  }
  
  :disabled {
    border: 1px solid #999999;
    background-color: #cccccc;
  }
`;