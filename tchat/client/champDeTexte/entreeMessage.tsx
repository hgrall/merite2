import * as React from "react";
import {
    creerGenerateurIdentifiantParCompteur,
    GenerateurIdentifiants,
    Identifiant
} from "../../../bibliotheque/types/identifiant";
import {Role} from "../../../shared/InterlocuteurMessage";
import {DateFr, dateMaintenant} from "../../../bibliotheque/types/date";
import styled from "styled-components";
import {Individu, Message, ToutIndividu} from "../typesUtiles/typesInterface";
import { ButtonEnvoi } from "../../../shared/ButtonEnvoi"
import FormControl from "react-bootstrap/FormControl"
import  InputGroup from "react-bootstrap/InputGroup";
import {EntreeMessageContainer} from "../../../shared/MessagesContainer";




interface ProprietesEntreeMessage {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    sujet: Individu;
    destinataire: Individu|ToutIndividu;
    envoiMessage: (m: Message, d: DateFr) => void;
}

interface EtatEntreeMessage {
    texte: string
}

export class EntreeMessage extends React.Component<ProprietesEntreeMessage, EtatEntreeMessage> {

    private generateur: GenerateurIdentifiants<'message'>;
    constructor(props: ProprietesEntreeMessage) {
        super(props);
        this.state = { texte: '' };
        this.generateur = creerGenerateurIdentifiantParCompteur(this.props.sujet.ID.val + "-MSG-");
        this.mettreAJourEntree = this.mettreAJourEntree.bind(this);
    }

    mettreAJourEntree(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        this.setState({ texte: event.target.value });
    }

    reinitialiserEntree(): void {
        this.setState({ texte: "" });
    }
    render() {
        return (
            <EntreeMessageContainer>
                <StyledInputGroup>
                        <InputGroup.Prepend>
                            <InputGroup.Text>De : {this.props.sujet.nom}</InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                            onChange={this.mettreAJourEntree}
                            as="textarea"
                            value={this.state.texte}
                            placeholder="Entrez le texte de votre message puis appuyez sur le bouton à droite indiquant le destinataire pour l'envoyer."
                        />
                        <InputGroup.Append>
                           <ButtonEnvoi
                               fond={this.props.destinataire.fond}
                               encre={this.props.destinataire.encre}
                               nom={this.props.destinataire.nom}
                               role={Role.Recepteur}
                               onClick={() => {
                                   let d = dateMaintenant();
                                   this.props.envoiMessage({
                                       ID: this.generateur.produire("message"),
                                       emetteur: this.props.sujet,
                                       destinataire: this.props.destinataire,
                                       cachet: d.representation(),
                                       contenu: this.state.texte,
                                       accuses: []
                                   }, d);
                                   this.reinitialiserEntree();
                               }}
                               inactif={this.props.destinataire.inactif}
                           />
                        </InputGroup.Append>
                </StyledInputGroup>
            </EntreeMessageContainer>
        );
    }
}

const StyledInputGroup = styled(InputGroup)`
  height: 200px;
`
