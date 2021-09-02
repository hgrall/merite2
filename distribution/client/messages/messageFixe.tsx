import styled from "styled-components";
import {FOND_TEXTE, TEXTE} from "../../../bibliotheque/interface/couleur";

export const MessageFixe = styled.div`
    flex: auto;
    background: ${FOND_TEXTE};
    color: ${TEXTE};
    padding: 1ex;

    min-width: 24ex;
    max-width: 72ex;
    margin: 1ex;
    white-space: pre-wrap;
    overflow-wrap: break-word;
`;