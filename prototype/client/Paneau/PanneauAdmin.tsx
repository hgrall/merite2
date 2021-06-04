import * as React from "react";
import styled from "styled-components"
import {FOND, CADRE, TEXTE_PALE} from "../../../bibliotheque/interface/couleur";
import {Individu, ToutIndividu} from "../Helpers/typesInterface";
import {PastilleAdmin} from "../../../shared/Pastilles";
import {Pseudo} from "../Label/Pseudo";
import {ButtonDestinataire} from "../Button/ButtonDestinataire";
import {TexteInformation, TexteXLarge} from "../../../shared/texte"
import {TableIdentificationMutable} from "../../../bibliotheque/types/tableIdentification";


interface ProprietesAdmin {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    sujet: Individu;
    objets: ReadonlyArray<Individu>;
    tous: ToutIndividu;
    selection: Individu | ToutIndividu;
    modifSelection: (i: Individu | ToutIndividu) => void;
    nombreConnexions: number;
    nombreTotalConnexions: number;
}

export class PanneauAdmin extends React.Component<ProprietesAdmin, {}> {
    render() {
        console.log(this.props.objets)
        return (
            <PanneauAdminDiv>
                <SujetAdminContainer>
                    <PastilleAdmin fond={this.props.sujet.fond}/>
                    <Pseudo>
                        {this.props.sujet.nom}
                    </Pseudo>
                </SujetAdminContainer>
                <TexteInformation> Choisissez un destinataire : </TexteInformation>
                {this.props.objets.map( i =>
                    <ButtonDestinataire choix={this.props.selection!.nom === i.nom}
                                        onClick={() => this.props.modifSelection(i)}
                                        fond={i.fond}
                                        nom={i.nom}
                                        active={i.inactif}
                    />
                )}
                <TexteInformation> Ou tous les destinataires :</TexteInformation>
                <ButtonDestinataire choix={this.props.selection.nom === this.props.tous.nom}
                                    onClick={() => this.props.modifSelection(this.props.tous)}
                                    fond={this.props.tous.fond}
                                    nom={this.props.tous.nom}
                                    active={this.props.tous.inactif}
                />
                <TexteInformation> Nombre de
                    connexions: {this.props.nombreConnexions}/{this.props.nombreTotalConnexions} </TexteInformation>
            </PanneauAdminDiv>
        );

    }
}

const PanneauAdminDiv = styled.div`
  border-right: 5px solid ${CADRE};
  min-height:100vh;
  background: ${FOND};
  @media (max-width: 768px) {
    border-bottom: 5px solid ${CADRE};
    border-right: 0;
  }
`;


const SujetAdminContainer = styled.div`
  flex: auto;
  margin: 0;
  background: ${CADRE};

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;


