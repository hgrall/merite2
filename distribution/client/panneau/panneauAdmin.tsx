import * as React from "react";

import styled from "styled-components";

import {FOND, CADRE} from "../../../bibliotheque/interface/couleur";
import {DomaineInterface} from "../utilitaire/typesInterface";
import {mot} from "../../../bibliotheque/types/binaire";
import {ButtonAdmin} from "../bouton/boutonAdmin";
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
    utilisateursActifsDomain: number;
    tailleDomain: number;
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
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;


const SeparateurVertical = styled.div`
  margin: 0 0 1ex 0;
`;

const CorpsPanneauAdmin = styled.div`
  padding: 10px;
`

/**
 * Représentation de la consigne sous la forme suivante :
 * - "envoyer le mot binaire [0 | 1, ...] à l'utilisateur [0 | 1, ...] (id)
 *    du domaine [0 | 1, ...] (id) dans une trame de x chiffres binaires.".
 */
const representationConsigne = (consigne: FormatConsigne)=> {
    return "Envoyer le mot binaire [" + consigne.mot
        + "] à l'utilisateur ["
        + consigne.destinataire + '] du domaine ['
        + consigne.adresse + '] dans une trame de '
        + consigne.tailleTrame + ' chiffres binaires.';
}
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
                            {"Consigne : " +
                            representationConsigne(this.props.consigne)}
                        </TexteNormal>
                    </SujetAdminContainer>
                </SujetAdmin>
                <CorpsPanneauAdmin>
                    <TexteInformation>Sélectionner le domaine voisin destinataire :</TexteInformation>
                    {this.props.domainesVoisins.map(i =>
                        <ButtonAdmin choix={this.props.selection.domaine === i.domaine}
                                     onClick={() => this.props.modifSelection(i)}
                                     fond={i.fond}
                                     nomDomaine={mot(i.domaine.domaine).representation()}
                                     key={i.domaine.ID.val} actif={i.domaine.actif}/>
                    )}
                    <TexteInformation>Nombre de connexions actifs dans le domain
                        : {this.props.utilisateursActifsDomain}/{this.props.tailleDomain}</TexteInformation>
                </CorpsPanneauAdmin>
            </ContainerAdmin>
        );
    }
}

const ContainerAdmin = styled.div`
  background: ${FOND};
  min-height: 100vh;
`;

