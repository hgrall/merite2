import {AccueilButton, BackButton, Dropdown, DropdownContent, FormTitle, Wrapper} from "../Shared/formStyle";
import * as React from "react";
import {AxiosResponse} from "axios";
import {requeteGET} from "../../../tchat/communication/communicationServeur";
import {AccessPage} from "./connexion";
import {PREFIXE_ACCES, PREFIXE_ACCUEIL} from "../../serveur/routes";
import {ConfigurationJeuTchat, ConfigurationJeux} from "../../commun/configurationJeux";

interface JeuChoixPageProps {
    goBack: () => void,
    code: string,
    jeuxTchat: ConfigurationJeuTchat[],
    jeuxDistribution: string[]
}

function JeuChoixPage(props: JeuChoixPageProps) {
    const domain = document.location.origin; // local retourne : http://localhost:8081
    const lienAdmin = domain + "/admin";

    return (
        <Wrapper>
            <FormTitle>Quel jeu vous voulez jouer ?</FormTitle>
            <Dropdown>
                <AccueilButton> Jeux Tchat</AccueilButton>
                <DropdownContent>
                    {
                        props.jeuxTchat.map(jeu => {
                        const urlJeu = `${domain}/${jeu.prefixe}/${props.code}/${jeu.suffixe}`
                        return <a href= {urlJeu} > Tchat {jeu.type} avec une taille de {jeu.taille} joueurs</a>
                        })
                    }
                </DropdownContent>
            </Dropdown>
            <Dropdown>
                <AccueilButton> Jeux Distribution</AccueilButton>
                <DropdownContent>
                    {props.jeuxDistribution.map(jeu => {
                        return <a href={""}>{jeu}</a>
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
    jeuxTchat: ConfigurationJeuTchat[],
    jeuxDistribution: string[]
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
            const config: ConfigurationJeux = reponse.data;
            self.setState({
                hasCode: true,
                code: code,
                jeuxDistribution: [config.distribution],
                jeuxTchat: [
                    {
                        prefixe: config.tchat_etoile.prefixe,
                        pseudos: config.tchat_etoile.pseudos,
                        suffixe: config.tchat_etoile.suffixe,
                        taille: config.tchat_etoile.taille,
                        type: config.tchat_etoile.type
                    },
                    {  prefixe: config.tchat_anneau.prefixe,
                        pseudos: config.tchat_anneau.pseudos,
                        suffixe: config.tchat_anneau.suffixe,
                        taille: config.tchat_anneau.taille,
                        type: config.tchat_anneau.type
                    }
                ]
            });
        }
        const params = {cle: code};
        const domain = document.location.origin;
        const url = `${domain}/${PREFIXE_ACCUEIL}/${PREFIXE_ACCES}`;

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
