import * as React from "react";

import styled from "styled-components";

import {FOND, CADRE} from "../../../bibliotheque/interface/couleur";
import {DomaineInterface} from "../Helpers/typesInterface";
import {mot} from "../../../bibliotheque/types/binaire";
import {ButtonAdmin} from "../Button/ButtonAdmin";
import {TableIdentification} from "../../../bibliotheque/types/tableIdentification";
import {FormatConsigne, FormatUtilisateurDistribution} from "../../commun/echangesDistribution";
import {PastilleAdmin} from "../../../shared/Pastilles";
import {TexteInformation, TexteNormal, TexteXLarge} from "../../../shared/Texte";

interface ProprietesAdmin {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    utilisateur: FormatUtilisateurDistribution;
    populationDomaine: TableIdentification<"sommet", FormatUtilisateurDistribution>;
    consigne: FormatConsigne;
    domaine: DomaineInterface;
    domainesVoisins: ReadonlyArray<DomaineInterface>;
    selection: DomaineInterface;
    modifSelection: (d: DomaineInterface) => void;
    nombreConnexions: string
    tailleReseau: string
}

const SujetAdmin = styled.div`
  background: ${FOND};
  flex: auto;
  align-self: center;
  min-width: calc(24vw);

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`;

const SujetAdminContainer = styled.div`
  flex: initial;
  margin: 0;
  background: ${CADRE};
  width: 100%;

  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;


const SeparateurVertical = styled.div`
  margin: 0 0 1ex 0;
`;


export class PanneauAdmin extends React.Component<ProprietesAdmin, {}> {
    render() {
        const dom = mot(this.props.domaine.domaine.domaine).representation();
        let utils: FormatUtilisateurDistribution[] = [];
        this.props.populationDomaine.iterer((idU, u) => {
            if (u.ID.val !== this.props.utilisateur.ID.val) {
                utils.push(u);
            }
        });
        return (
            <ContainerAdmin className={this.props.className}>
                        <SujetAdmin>
                            <SujetAdminContainer>
                                <TexteXLarge>
                                    {mot(this.props.utilisateur.utilisateur).representation()
                                    + " @ "
                                    + dom}
                                </TexteXLarge>
                                <PastilleAdmin fond={this.props.domaine.fond}/>
                            </SujetAdminContainer>
                            <SeparateurVertical/>
                            <SujetAdminContainer>
                                <TexteNormal>
                                    {"Autres utilisateurs du domaine " + dom + " : "}
                                </TexteNormal>
                            </SujetAdminContainer>
                            <SujetAdminContainer>
                                {utils.map(u =>
                                    <TexteNormal key={u.ID.val}>
                                        {mot(u.utilisateur).representation() + "@" + dom}
                                    </TexteNormal>)}
                            </SujetAdminContainer>
                            <SeparateurVertical/>
                            <SujetAdminContainer>
                                <TexteXLarge>
                                    {"Consigne : " +
                                    this.props.consigne}
                                </TexteXLarge>
                            </SujetAdminContainer>
                        </SujetAdmin>
                        <TexteInformation>Sélectionner le domaine voisin destinataire :</TexteInformation>
                        {this.props.domainesVoisins.map(i =>
                            <ButtonAdmin choix={this.props.selection.domaine === i.domaine}
                                         onClick={() => this.props.modifSelection(i)}
                                         fond={i.fond}
                                         nomDomaine={mot(i.domaine.domaine).representation()}
                                         key={i.domaine.ID.val}/>
                        )}
                        <TexteInformation>Nombre de connexions
                            : {this.props.nombreConnexions}/{this.props.tailleReseau}</TexteInformation>
            </ContainerAdmin>
        );
    }
}

const ContainerAdmin = styled.div`
  border-right: 5px solid ${CADRE};
  background: ${FOND};
  height: 100%;
`;

