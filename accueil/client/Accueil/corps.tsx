import { AccueilButton, BackButton, Dropdown, DropdownContent, FormTitle, Wrapper } from "../Shared/formStyle";
import * as React from "react";
import { AxiosResponse } from "axios";
import { requeteGET } from "../../../tchat/communication/communicationServeur";
import { AccessPage } from "./connexion";
import { PREFIXE_ACCES, PREFIXE_ACCUEIL } from "../../serveur/routes";
import { ConfigurationJeuDistribution, ConfigurationJeuTchat, ConfigurationJeux } from "../../commun/configurationJeux";

interface JeuChoixPageProps {
    goBack: () => void,
    code: string,
    jeuxTchat: ConfigurationJeuTchat[],
    jeuxDistribution: ConfigurationJeuDistribution[]
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
                            return <a href={urlJeu} > Tchat {jeu.type} avec une taille de {jeu.taille} joueurs</a>
                        })
                    }
                </DropdownContent>
            </Dropdown>
            <Dropdown>
                <AccueilButton> Jeux Distribution</AccueilButton>
                <DropdownContent>
                    {props.jeuxDistribution.map(jeu => {
                        const urlJeu = `${domain}/${jeu.prefixe}/${props.code}/${jeu.suffixe}`
                        return <a href={urlJeu}>{jeu.suffixe}</a>
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
    jeuxDistribution: ConfigurationJeuDistribution[]
}

export class Corps extends React.Component<{}, AccueilState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            hasCode: false, //aCode
            code: "",
            jeuxTchat: [],
            jeuxDistribution: []
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
                jeuxDistribution: [{
                    type: config.distribution.type,
                    prefixe: config.distribution.prefixe,
                    suffixe: config.distribution.suffixe,
                    post: {
                        envoi: config.distribution.post.envoi,
                        verrou: config.distribution.post.verrou,
                    },
                    getPersistant: config.distribution.getPersistant,
                    nombreDomaines: config.distribution.nombreDomaines,

                    effectifParDomaine: config.distribution.effectifParDomaine
                }],
                jeuxTchat: [
                    {
                        prefixe: config.tchat_etoile.prefixe,
                        suffixe: config.tchat_etoile.suffixe,
                        post: {
                            envoi: config.tchat_etoile.post.envoi
                        },
                        getPersistant: config.tchat_etoile.getPersistant,
                        pseudos: config.tchat_etoile.pseudos,
                        taille: config.tchat_etoile.taille,
                        type: config.tchat_etoile.type
                    },
                    {
                        prefixe: config.tchat_anneau.prefixe,
                        suffixe: config.tchat_anneau.suffixe,
                        post: {
                            envoi: config.tchat_anneau.post.envoi
                        },
                        getPersistant: config.tchat_anneau.getPersistant,
                        pseudos: config.tchat_anneau.pseudos,
                        taille: config.tchat_anneau.taille,
                        type: config.tchat_anneau.type
                    }
                ]
            });
        }
        const params = { cle: code };
        const domain = document.location.origin;
        const url = `${domain}/${PREFIXE_ACCUEIL}/${PREFIXE_ACCES}`;

        requeteGET(traitementAUTH, traitementErreur, url, params)
    }

    goBackAccessPage() {
        this.setState({ hasCode: false, code: "" });
    }

    render() {
        if (!this.state.hasCode) // demander code d'accès
            return (
                <AccessPage onClick={this.handleSubmit} />
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
