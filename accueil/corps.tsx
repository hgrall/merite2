import * as React from "react";
import styled, {keyframes} from "styled-components";
import {useState} from "react";
import {requeteGET} from "../tchat/communication/communicationServeur";
import {AxiosResponse} from "axios";
import {CADRE, FOND} from "../bibliotheque/interface/couleur";
import {Jeu} from "../tchat/serveur/serveurTchatEtoile";

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const Form = styled.form`
  margin: 0 auto;
  width: 100%;
  max-width: 414px;
  padding: 1.3rem;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Input = styled.input`
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

const jump = keyframes`
  from{
    transform: translateY(0)
  }
  to{
    transform: translateY(-3px)
  }
`;

const Button = styled.button`
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
    animation: ${jump} 0.2s ease-out forwards;
  }
`;

const DropdownContent = styled.div`
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

const AccueilButton = styled.button`
  border-radius: 3px;
  width: 60vh;
  background: #f03d4e;
  color: ${FOND};
  padding: 16px;
  font-size: 16px;
  border: none;
  margin: 20px;
`;

const Dropdown = styled.div`
  position: relative;
  display: inline-block;
  
  &:hover ${DropdownContent} {
    display: block
  }
  &:hover ${AccueilButton} {
    margin-bottom: 0;
  }
`;

const BackButton = styled(Button)`
  background: #050a4d;
  :hover {
    background: #02063b;
  }
`;


const Title = styled.h2`
  font-weight: normal;
  color: #2a2a29;
  // text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Hr = styled.hr`
  border-top: 1px solid #bbb;
  max-width: 380px;
  margin-top: 10px;
  width: 100%;
`;


interface AccessPageProps {
    onClick: (code: string | undefined) => void | undefined,
}

function AccessPage(props: AccessPageProps) {
    const [code, setCode] = useState<string>();
    return (
        <Wrapper>
            <Title>Code d'accès :</Title>
            <Form>
                <Input type="text" onChange={e => setCode(e.target.value)}/>
                <p>Vous n'avez pas un code ? Contactez l'administrateur.</p>
                <Button onClick={() => props.onClick(code)}>Envoyer</Button>
            </Form>
        </Wrapper>
    );
}

interface JeuChoixPageProps {
    goBack: () => void,
    code: string,
    jeuxTchat: Jeu[],
    jeuxDistribution: Jeu[]
}

function JeuChoixPage(props: JeuChoixPageProps) {
    const domain = document.location.origin; // local retourne : http://localhost:8081
    const lienAdmin = domain + "/admin";

    return (
        <Wrapper>
            <Title>Quel jeu vous voulez jouer ?</Title>
            <Dropdown>
                <AccueilButton> Jeux Tchat</AccueilButton>
                <DropdownContent>
                    {props.jeuxTchat.map(jeu => {
                        return <a href={jeu.url}>{jeu.nom}</a>
                    })}
                </DropdownContent>
            </Dropdown>
            <Dropdown>
                <AccueilButton> Jeux Distribution</AccueilButton>
                <DropdownContent>
                    {props.jeuxDistribution.map(jeu => {
                        return <a href={jeu.url}>{jeu.nom}</a>
                    })}
                </DropdownContent>
            </Dropdown>
            <form action={lienAdmin}>
                <AccueilButton >Page Admin</AccueilButton>
            </form>
            <BackButton onClick={props.goBack}>Changer le code d'accès</BackButton>
        </Wrapper>
    );
}

interface AccueilState {
    hasCode: boolean,
    code: string,
    jeuxTchat: Jeu[],
    jeuxDistribution: Jeu[]
}

export class Corps extends React.Component<{}, AccueilState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            hasCode: false, //aCode
            code: "",
            jeuxTchat: [],
            jeuxDistribution:[]
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.goBackAccessPage = this.goBackAccessPage.bind(this);
    }

    handleSubmit(code: string) {
        // Empêche la page de se rafraîchir après d'utiliser le button du forme qui par default a ce comportement
        //https://es.reactjs.org/docs/forms.html
        event?.preventDefault()

        const self = this;
        const traitementErreur = () => {
            alert("Ce code n'est pas valide !");
        }
        const traitementAUTH = (reponse: AxiosResponse) => {
            self.setState({
                hasCode: true,
                code: reponse.data.code,
                jeuxDistribution: reponse.data.jeuxDistribution,
                jeuxTchat:reponse.data.jeuxTchat
            });
        }
        const params = {code: code};
        const domain = document.location.origin;
        const url = `${domain}/auth`;

        requeteGET(traitementAUTH, traitementErreur, url, params)
    }

    goBackAccessPage() {
        this.setState({hasCode: false, code: ""});
    }

    render() {
        if (!this.state.hasCode) // demander code d'accès
            return (
                <AccessPage onClick={this.handleSubmit}/>
            );
        else // code valide fourni, afficher les choix des jeux
            return (
                <JeuChoixPage
                    goBack={this.goBackAccessPage}
                    code={this.state.code}
                    jeuxDistribution={this.state.jeuxDistribution}
                    jeuxTchat={this.state.jeuxTchat}
                />
            );
    }
}
