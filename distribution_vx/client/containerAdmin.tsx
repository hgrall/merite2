import * as React from "react";

import styled from "styled-components";

import { Couleur, FOND, CADRE, SELECTION, TEXTE_INV } from "../../bibliotheque/interface/couleur";
import { DomaineInterface } from "./typesInterface";
import { mot } from "../../bibliotheque/types/binaire";
import { FormatUtilisateur, FormatPopulationLocale, FormatDomaine, FormatConsigne, consigne, populationLocale, utilisateur } from "../commun/echangesJeu1Distribution";

interface ProprietesAdmin {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    utilisateur: FormatUtilisateur;
    population: FormatPopulationLocale;
    consigne: FormatConsigne;
    domaine: DomaineInterface;
    domainesVoisins: ReadonlyArray<DomaineInterface>;
    selection: DomaineInterface;
    modifSelection: (d: DomaineInterface) => void;
    nombreConnexions : string
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
    width: calc(24vw);

    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`;

const SeparateurHorizontal = styled.div`
        margin: 0 0 0 1em;
`;

const SeparateurVertical = styled.div`
        margin: 0 0 1ex 0;
`;


const Retour = styled.div`
    flex: none;
    width: 4ex;
    height: 4ex;
`;


enum Role { Emetteur, Recepteur };

interface ProprietesPastille {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
}

class PastilleBrute extends React.Component<ProprietesPastille, {}> {
    render() {
        return (
            <div className={this.props.className}>
            </div>
        );
    }
}

const Pastille = styled(PastilleBrute)`
        flex: none;
        width: 4ex;
        height: 4ex;
        border-radius: 100%;
        background-color: ${(props: ProprietesPastille) => props.fond};
    `;

const TexteXLarge = styled.div`
    flex: initial;
    background: ${CADRE};
    color: ${TEXTE_INV};
    text-align: center;
    padding: 1ex;
    font-size: x-large;
`;

const TexteNormal = styled.div`
    flex: initial;
    background: ${CADRE};
    color: ${TEXTE_INV};
    text-align: center;
    padding: 1ex;
    font-size: medium;
`;

const TexteInformation = styled.p`
    color: ${CADRE};
    font-size: x-large;
    padding: 20px;
    text-align: center;
`;

interface ProprietesObjetAdmin {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    choix: boolean;
    onClick: () => void;
    fond: Couleur;
    nomDomaine: string;
}

class ObjetAdminBrut extends React.Component<ProprietesObjetAdmin, {}> {

    render() {
        return <button className={this.props.className} onClick={this.props.onClick}>
            <TexteXLarge>{this.props.nomDomaine}</TexteXLarge>
            <Pastille fond={this.props.fond} />
        </button>;
    }
}

const ObjetAdmin = styled(ObjetAdminBrut)`
    flex: initial;
    background: ${CADRE};
    border-radius: 1ex;

    border-style: solid;
    border-width: ${props => props.choix ? "0.5ex" : "0"};
    border-color: ${SELECTION};

    padding: ${props => props.choix ? "0.5ex" : "1ex"};
    margin: 1em 0 1em 0;
    max-width: 20vw;
    width: 12em;
    min-width: 12em;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  p {
    justify-content: left;
    align-items: center;
  }
`;

class ContainerAdminBrut extends React.Component<ProprietesAdmin, {}> {
    render() {
        const dom = mot(this.props.domaine.domaine.nom).representation();
        let utils: FormatUtilisateur[] = [];
        populationLocale(this.props.population).iterer((idU, u) => {
            if (u.ID.val !== this.props.utilisateur.ID.val) {
                utils.push(u);
            }
        });
        return (
            <div className={this.props.className}>
                <SujetAdmin>
                    <SujetAdminContainer>
                        <TexteXLarge>
                            {mot(this.props.utilisateur.pseudo).representation()
                                + " @ "
                                + dom}
                        </TexteXLarge>
                        <Pastille fond={this.props.domaine.fond} />
                    </SujetAdminContainer>
                    <SeparateurVertical />
                    <SujetAdminContainer>
                        <TexteNormal>
                            {"Autres utilisateurs du domaine " + dom + " : "}
                        </TexteNormal>
                    </SujetAdminContainer>
                    <SujetAdminContainer>
                        {utils.map(u =>
                            <TexteNormal key={u.ID.val}>
                                {mot(u.pseudo).representation() + "@" + dom}
                            </TexteNormal>)}
                    </SujetAdminContainer>
                    <SeparateurVertical />
                    <SujetAdminContainer>
                        <TexteXLarge>
                            {"Consigne : " +
                                consigne(this.props.consigne).representation()}
                        </TexteXLarge>
                    </SujetAdminContainer>
                </SujetAdmin>
                <TexteInformation>Sélectionner le domaine voisin destinataire :</TexteInformation>
                {this.props.domainesVoisins.map(i =>
                    <ObjetAdmin choix={this.props.selection.domaine === i.domaine}
                        onClick={() => this.props.modifSelection(i)}
                        fond={i.fond}
                        nomDomaine={mot(i.domaine.nom).representation()}
                        key={i.domaine.ID.val} />
                )}
                <TexteInformation>Nombre de connexions : {this.props.nombreConnexions}/{this.props.tailleReseau}</TexteInformation>
            </div>
        );
    }
}

export const ContainerAdmin = styled(ContainerAdminBrut)`
    background: ${FOND};
    position: absolute;
    top: 0;
    left: 0;
    /* important / overflow : deux sens haut vers bas et gauche vers droite pour le dépassement */
    min-width: calc(24vw);
    min-height: calc(100vh);
    /* occupe au moins la place du container */
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
`;

