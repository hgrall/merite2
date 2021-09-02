import { BoutonAccueil, BoutonRetour, MenuDeroulant, ContenuMenuDeroulant, TitreFormulaire, Enveloppe } from "../commun/elementsFormulaire";
import * as React from "react";
import { AxiosResponse } from "axios";
import { enregistrerRequeteGET } from "../../../bibliotheque/communication/communicationAvecServeur";
import { EntreeCle as EntreeCle } from "./connexion";
import { PREFIXE_ACCES, PREFIXE_ACCUEIL } from "../../serveur/routes";
import { ConfigurationJeuDistribution, ConfigurationJeuTchat, ConfigurationJeux } from "../../commun/configurationJeux";

interface PropsChoixJeux {
    revenir: () => void,
    cle: string,
    jeuxTchat: ConfigurationJeuTchat[],
    jeuxDistribution: ConfigurationJeuDistribution[]
}

function ChoixJeux(props: PropsChoixJeux) {
    const domain = document.location.origin; // en local, vaut http://localhost:8080
    const lienAdmin = domain + "/admin";
    
    return (
        <Enveloppe>
            <TitreFormulaire>A quel jeu voulez-vous jouer ?</TitreFormulaire>
            <MenuDeroulant>
                <BoutonAccueil> Jeux de tchat</BoutonAccueil>
                <ContenuMenuDeroulant>
                    {
                        props.jeuxTchat.map(jeu => {
                            const urlJeu = `${domain}/${jeu.prefixe}/${props.cle}/${jeu.suffixe}`
                            return <a href={urlJeu} > Tchat en {jeu.type} avec {jeu.taille} utilisateurs</a>
                        })
                    }
                </ContenuMenuDeroulant>
            </MenuDeroulant>
            <MenuDeroulant>
                <BoutonAccueil> Jeux de distribution</BoutonAccueil>
                <ContenuMenuDeroulant>
                    {props.jeuxDistribution.map(jeu => {
                        const urlJeu = `${domain}/${jeu.prefixe}/${props.cle}/${jeu.suffixe}`
                        return <a href={urlJeu}>Jeu de distribution de type {jeu.type} avec {jeu.nombreDomaines} domaines</a>
                    })}
                </ContenuMenuDeroulant>
            </MenuDeroulant>
            <BoutonRetour onClick={props.revenir}>Entrez une autre clé d'accès.</BoutonRetour>
        </Enveloppe>
    );
    /*
     * Ajouter un lien vers une page d'administration :
     * <form action={lienAdmin}>
                <BoutonAccueil >Page Admin</BoutonAccueil>
       </form>
    */
}

interface EtatAccueil {
    possedeCle: boolean,
    cle: string,
    jeuxTchat: ConfigurationJeuTchat[],
    jeuxDistribution: ConfigurationJeuDistribution[]
}

export class Corps extends React.Component<{}, EtatAccueil> {
    constructor(props: {}) {
        super(props);
        this.state = {
            possedeCle: false, 
            cle: "",
            jeuxTchat: [],
            jeuxDistribution: []
        };
        this.traiterSoumission = this.traiterSoumission.bind(this);
        this.revenirAccueil = this.revenirAccueil.bind(this);
    }

    traiterSoumission(cle: string) {
        // Empêche la page de se rafraîchir après l'utilisation
        // du bouton du formulaire, qui par default a ce comportement.
        // Voir https://es.reactjs.org/docs/forms.html
        event?.preventDefault();

        const self = this;
        const traitementErreur = () => {
            alert("Cette clé n'est pas valide !");
        }
        const traitementAUTH = (reponse: AxiosResponse) => {
            const config: ConfigurationJeux = reponse.data;
            self.setState({
                possedeCle: true,
                cle: cle,
                jeuxDistribution: [{
                    type: config.distribution.type,
                    prefixe: config.distribution.prefixe,
                    suffixe: config.distribution.suffixe,
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
        const params = { cle: cle };
        const domain = document.location.origin;
        const url = `${domain}/${PREFIXE_ACCUEIL}/${PREFIXE_ACCES}`;

        enregistrerRequeteGET(traitementAUTH, traitementErreur, url, params)
    }

    revenirAccueil() {
        this.setState({ possedeCle: false, cle: "" });
    }

    render() {
        if (!this.state.possedeCle) // demander clé d'accès
            return (
                <EntreeCle onClick={this.traiterSoumission} />
            );
        else // la clé étant valide, afficher les choix des jeux
            return (
                <ChoixJeux
                    revenir={this.revenirAccueil}
                    cle={this.state.cle}
                    jeuxDistribution={this.state.jeuxDistribution}
                    jeuxTchat={this.state.jeuxTchat}
                />
            );
    }
}
