import * as React from "react";
import {DateFr} from "../../../bibliotheque/types/date"
import {Individu, Message, ToutIndividu} from "../Helpers/typesInterface";
import {ContainerMessageEmis, ContainerMessageReçu} from "../Message/Message";
import {EntreeMessage} from '../ChampDeTexte/EntreeMessage'
import Alert from "react-bootstrap/Alert";
import {StyledAlert} from "../../../shared/MessageAlert";
import {MessagesContainer, PanneauMessageContainer} from "../../../shared/MessagesContainer";

interface ProprietesPanneauMessages {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    sujet: Individu;
    messages: Message[];
    selection: Individu|ToutIndividu;
    envoiMessage: (m: Message, d: DateFr) => void;
    afficherAlerte: boolean;
    messageAlerte: string
    masquerAlerte: () => void
}


interface EtatPanneauMessages {
    afficherAlerte: boolean;
}


export class PanneauMessages extends React.Component<ProprietesPanneauMessages, EtatPanneauMessages> {

    constructor(props: ProprietesPanneauMessages) {
        super(props);
        this.state = {
            afficherAlerte: props.afficherAlerte
        };
        this.AfficherAlerte = this.AfficherAlerte.bind(this);
    }

    AfficherAlerte() {
        if (this.props.afficherAlerte) {
            return (
                <StyledAlert variant="danger" onClose={this.props.masquerAlerte} dismissible>
                    <Alert.Heading>Attention !</Alert.Heading>
                    <p> {this.props.messageAlerte} </p>
                </StyledAlert>
            );
        }
    }

    render() {
        return (
            <PanneauMessageContainer>
                <MessagesContainer >
                    {this.AfficherAlerte()}
                    {
                        this.props.messages.map((m: Message) =>
                            ((m.emetteur.nom === this.props.sujet.nom) ?
                                    <ContainerMessageEmis message={m}/> :
                                    <ContainerMessageReçu message={m}/>
                            )
                        )
                    }
                </MessagesContainer>
                <EntreeMessage sujet={this.props.sujet} destinataire={this.props.selection}
                               envoiMessage={this.props.envoiMessage}/>
            </PanneauMessageContainer>
        );
    }
}


