import * as React from "react";
import {requeteGET} from "../../../tchat/communication/communicationServeur";
import {AxiosResponse} from "axios";
import {BackButton, Wrapper} from "../Shared/formStyle";
import {PREFIXE_ACCES, PREFIXE_CONNEXION} from "../../serveur/routes";
import styled from "styled-components";
import {ConnexionAdmin} from "./connexionAdmin";

interface JeuChoixPageProps {
    code: string,
    goBack: () => void
}

function AlerteCode(props: JeuChoixPageProps) {
    return (
        <Wrapper>
            <DivAlerte>
                <p> Votre code d'accès est {props.code} </p>
                <br/>
                <BackButton onClick={props.goBack}> Changer le code d'accès</BackButton>
            </DivAlerte>
        </Wrapper>
    );
}

interface AccueilState {
    hasCode: boolean,
    code: string,
}

export class Corps extends React.Component<{}, AccueilState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            hasCode: false, //aCode
            code: ""
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.goBackAccessPage = this.goBackAccessPage.bind(this);
    }

    handleSubmit(code: string) {
        // Empêche la page de se rafraîchir après d'utiliser le button du forme qui par default a ce comportement
        //https://es.reactjs.org/docs/forms.html
        event?.preventDefault()
        if (code == undefined){
            return;
        }
        const self = this;
        const traitementErreur = (erreur: AxiosResponse) => {
            console.log(erreur)
            alert("Ce code n'est pas valide !");
        }
        const traitementAUTH = (reponse: AxiosResponse) => {
            self.setState({
                hasCode: true,
                code: reponse.data,
            });
        }
        const params = {code: code};
        const domain = document.location.origin;
        const url = `${domain}/${PREFIXE_CONNEXION}/${PREFIXE_ACCES}`;

        requeteGET(traitementAUTH, traitementErreur, url, params)
    }

    goBackAccessPage() {
        this.setState({hasCode: false, code: ""});
    }

    render() {
        if (this.state.hasCode) // demander code d'accès
            return (
                <Wrapper>
                    <AlerteCode code={this.state.code} goBack= {this.goBackAccessPage} />
                </Wrapper>
            );
        else // code valide fourni, afficher la clé d'accès
            return (
                <Wrapper>
                    <ConnexionAdmin onClick={this.handleSubmit}/>
                </Wrapper>
            );
    }
}

const DivAlerte = styled.div`
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