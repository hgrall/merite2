import * as React from "react";
import {CADRE, Couleur, SELECTION} from "../../../bibliotheque/interface/couleur";
import {PastilleAdmin} from "../../../shared/Pastilles";
import {Pseudo} from "../Label/Pseudo";
import styled from "styled-components";

interface ProprietesObjetAdmin {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    choix: boolean;
    onClick: () => void;
    fond: Couleur;
    nom: string;
    inactif: boolean;
}

class ButtonDestinataireBrut extends React.Component<ProprietesObjetAdmin, {}> {
    render() {
        return <button className={this.props.className} onClick={this.props.onClick} disabled={this.props.inactif}>
            <PastilleAdmin fond={this.props.fond}/>
            <Pseudo>{this.props.nom}</Pseudo>
        </button>;
    }
}

export const ButtonDestinataire = styled(ButtonDestinataireBrut)`
  flex: initial;
  background: ${CADRE};
  border-radius: 1ex;

  border-style: solid;
  border-width: ${props => props.choix ? "0.5ex" : "0"};
  border-color: ${SELECTION};

  padding: ${props => props.choix ? "0.5ex" : "1ex"};
  max-width: 20vw;
  width: 12em;
  min-width: 10em;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0.5em auto;

  :disabled {
    border: 3px solid #999999;
    background-color: #cccccc;
    color: #666666;
  }
`;
