import styled, {keyframes} from "styled-components";
import {CADRE, FOND} from "../../../bibliotheque/interface/couleur";


export const saut = keyframes`
  from{
    transform: translateY(0)
  }
  to{
    transform: translateY(-3px)
  }
`;

export const Bouton = styled.button`
  max-width: 100%;
  padding: 11px 13px;
  color: rgb(253, 249, 243);
  font-weight: 600;
  text-transform: uppercase;
  background: #f03d4e;
  border: none;
  border-radius: 3px;
  outline: 0;
  cursor: pointer;
  margin-top: 0.6rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-out;
  :hover {
    background: rgb(200, 50, 70);
    animation: ${saut} 0.2s ease-out forwards;
  }
`;

export const ContenuMenuDeroulant = styled.div`
  display: none;
  background-color: ${FOND};
  z-index: 1;
  margin-left: 20px;
  width: 60vh;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);

  a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
  }
  a:hover {
    background-color:${CADRE};
    color: ${FOND};
  }
`;

export const BoutonAccueil = styled.button`
  border-radius: 3px;
  width: 60vh;
  background: #f03d4e;
  color: ${FOND};
  padding: 16px;
  font-size: 16px;
  border: none;
  margin: 20px;
`;

export const MenuDeroulant = styled.div`
  position: relative;
  display: inline-block;
  
  &:hover ${ContenuMenuDeroulant} {
    display: block
  }
  &:hover ${BoutonAccueil} {
    margin-bottom: 0;
  }
`;

export const BoutonRetour = styled(Bouton)`
  background: #02063b;
  :hover {
    background: #02063b;
  }
`;

/**
 * Règle horizontale pour marquer une séparation thématique.
 * HR := Horizontal Rule.
 */
export const Hr = styled.hr`
  border-top: 1px solid #bbb;
  max-width: 380px;
  margin-top: 10px;
  width: 100%;
`;

export const Enveloppe = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vh;
  margin:  auto;
`;

export const Formulaire = styled.form`
  width: 100%;
  max-width: 414px;
  padding: 1.3rem;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const Entree = styled.input`
  max-width: 100%;
  padding: 11px 13px;
  background: #f9f9fa;
  color: #f03d4e;
  margin-bottom: 0.9rem;
  border-radius: 4px;
  outline: 0;
  border: 1px solid rgba(245, 245, 245, 0.7);
  font-size: 14px;
  transition: all 0.3s ease-out;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(0, 0, 0, 0.1);
  :focus,
  :hover {
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.15), 0 1px 5px rgba(0, 0, 0, 0.1);
  }
`;

export const TitreFormulaire = styled.h2`
  font-weight: normal;
  color: #2a2a29;
  text-align: center;
`;

export const DivAlerte = styled.div`
  height: 40%;
  border-width: 5px;
  border-color: #02063b;
  border-radius: 16px;
  border-style: solid;
  text-align: center;
  padding: 10%;
  p {
    color: #02063b;
    font-size: 40px;
  }
`;