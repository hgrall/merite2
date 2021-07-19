import {CADRE, Couleur, SELECTION} from "../../../bibliotheque/interface/couleur";
import * as React from "react";
import styled from "styled-components";
import {TexteXLarge} from "../../../../../../Desktop/shared/Texte";
import {PastilleAdmin} from "../../../../../../Desktop/shared/Pastilles";

interface ProprietesObjetAdmin {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    choix: boolean;
    onClick: () => void;
    fond: Couleur;
    nomDomaine: string;
}

class ButtonAdminBrut extends React.Component<ProprietesObjetAdmin, {}> {

    render() {
        return <button className={this.props.className} onClick={this.props.onClick}>
            <TexteXLarge>{this.props.nomDomaine}</TexteXLarge>
            <PastilleAdmin fond={this.props.fond} />
        </button>;
    }
}

export const ButtonAdmin = styled(ButtonAdminBrut)`
  flex: initial;
  background: ${CADRE};
  border-radius: 1ex;

  border-style: solid;
  border-width: ${props => props.choix ? "0.5ex" : "0"};
  border-color: ${SELECTION};

  padding: ${props => props.choix ? "0.5ex" : "1ex"};
  max-width: 20vw;
  width: 12em;
  min-width: 12em;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0.5em auto;
  p {
    justify-content: left;
    align-items: center;
  }
`;