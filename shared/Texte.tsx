
import {CADRE, FOND_TEXTE_INV, TEXTE_INV} from "../bibliotheque/interface/couleur";
import styled from "styled-components";

export const TexteInformation = styled.p`
    color: ${CADRE};
    font-size: 26px;
    padding: 20px;
    text-align: center;
    margin: 0px;
`;

export const TexteXLarge = styled.div`
    flex: initial;
    color: ${CADRE};
    text-align: center;
    padding-top:20vh;
    padding-right: 1ex;
    padding-left: 1ex;
    font-size: xx-large;
    height: 100vh;
    horiz-align: center;
`;

export const TexteNormal = styled.div`
    flex: initial;
    background: ${CADRE};
    color: ${TEXTE_INV};
    text-align: center;
    padding: 1ex;
    font-size: medium;
`;

export const StyleTexteEntreeMessage = {
    alignSelf: "flex-end",
    flex: "auto",
    resize: "vertical",
    overflow: "auto",
    margin: "1ex",
    background: FOND_TEXTE_INV,
    color: TEXTE_INV,
    fontSize: "medium"
};