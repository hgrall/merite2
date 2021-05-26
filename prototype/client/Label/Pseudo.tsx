import styled from "styled-components";
import {CADRE, TEXTE_INV} from "../../../bibliotheque/interface/couleur";

export const Pseudo = styled.div`
    flex: initial;
    background: ${CADRE};
    color: ${TEXTE_INV};
    text-align: center;
    padding: 1ex;
    height: 4ex;
    font-size: x-large;
`;