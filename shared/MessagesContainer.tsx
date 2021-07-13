import styled from "styled-components";
import {CADRE, COUPLE_FOND_ENCRE_SUJET, FOND, FOND_TEXTE} from "../bibliotheque/interface/couleur";

export const PanneauMessageContainer = styled.div`
  background: ${FOND}
  margin-bottom: 20px;
  border-left: 5px solid ${CADRE};
  height:100%;
  @media (max-width: 768px) {
    border-left: 0;
  }
`;

export const MessagesContainer = styled.div`
    height: 65%;
    overflow: scroll;
    display: flex;
    flex-direction: column;
    text-align: center;
`;

export const EntreeMessageContainer = styled.div`
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 20px;
  @media (min-width: 768px) {
    width: 70%;
    position: fixed;
    bottom: 0;
  }
`;
