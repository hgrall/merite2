import * as React from "react";
import {enregistrerRequeteGET} from "../../../bibliotheque/communication/communicationAvecServeur";
import {AxiosResponse} from "axios";
import {BoutonRetour, Enveloppe, DivAlerte } from "../commun/elementsFormulaire";
import {PREFIXE_ACCES, PREFIXE_CONNEXION} from "../../serveur/routes";
import {AdminConnexion as EntreeCode} from "./connexionAdmin";

interface JeuChoixPageProps {
    code: string,
    revenir: () => void
}

function AffichageCle(props: JeuChoixPageProps) {
    return (
        <Enveloppe>
            <DivAlerte>
                <p> Votre clé d'accès, valable pour cette session, est {props.code}. </p>
                <br/>
                <BoutonRetour onClick={props.revenir}>Entrez un autre code d'accès.</BoutonRetour>
            </DivAlerte>
        </Enveloppe>
    );
}

interface EtatAccueil {
    possedeCode: boolean,
    code: string,
}

export class Corps extends React.Component<{}, EtatAccueil> {
    constructor(props: {}) {
        super(props);
        this.state = {
            possedeCode: false, // pas de code initialement
            code: ""
        };
        this.traiterSoumission = this.traiterSoumission.bind(this);
        this.retournerPageAcces = this.retournerPageAcces.bind(this);
    }

    traiterSoumission(code: string) {
        // Empêche la page de se rafraîchir après l'utilisation
        // du bouton du formulaire, qui par default a ce comportement.
        // Voir https://es.reactjs.org/docs/forms.html
        event?.preventDefault();
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
                possedeCode: true,
                code: reponse.data,
            });
        }
        const params = {code: code};
        const domaine = document.location.origin;
        const url = `${domaine}/${PREFIXE_CONNEXION}/${PREFIXE_ACCES}`;

        enregistrerRequeteGET(traitementAUTH, traitementErreur, url, params)
    }

    retournerPageAcces() {
        this.setState({possedeCode: false, code: ""});
    }

    render() {
        if (this.state.possedeCode){ // récapitulatif + retour
            return (
                <Enveloppe>
                    <AffichageCle code={this.state.code} revenir= {this.retournerPageAcces} />
                </Enveloppe>
            );
        }else { // aucun code d'accès - formulaire pour en entrer un
            return (
                <Enveloppe>
                    <EntreeCode entrerCode={this.traiterSoumission}/>
                </Enveloppe>
            );
        }
    }
}

