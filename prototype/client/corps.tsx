import * as React from "react";
import {Individu, Message} from "./Helpers/typesInterface";
import {TableIdentification} from "../../bibliotheque/types/tableIdentification";
import {
    COUPLE_FOND_ENCRE_INCONNU,
    COUPLE_FOND_ENCRE_TOUS,
    FOND,
    TEXTE_ERREUR
} from "../../bibliotheque/interface/couleur";
import {GenerateurIdentifiants, identifiant, Identifiant} from "../../bibliotheque/types/identifiant";
import {DateFr} from "../../bibliotheque/types/date";
import {creerMessageAVoisin} from "../communication/Mapper/MessageMapper";
import {MessageTchat} from "../../bibliotheque/echangesTchat";
import {envoyerAVoisins} from "./Reseau/ConnexionServeur";
import {Col, Row} from "react-bootstrap";
import {PanneauAdmin} from "./Paneau/PanneauAdmin";
import {PanneauMessages} from "./Paneau/PaneauMessages";
import styled from "styled-components";
import {tableau} from "../../bibliotheque/types/tableau";


interface ProprietesCorps {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
}

enum EtatInterfaceTchat {
    INITIAL,
    NORMAL,
    ERRONE
}

const ID_TOUS: string = "TOUS";
const ID_INCONNU: string = "?";

interface Etat {
    selection: Individu;
    messages: Message[];
    etatInterface: EtatInterfaceTchat;
    nombreConnexions: string;
    afficherAlerte: boolean;
    messageAlerte: string;
    code: string;
}

export class Corps extends React.Component<{}, Etat> {

    private generateur: GenerateurIdentifiants<'message'>;
    private urlServeur: string; // avec protocole ws

    private messageErreur: string;

    private individusObjets: TableIdentification<'sommet', Individu>;
    private individuSujet: Individu;
    private toutIndividu: Individu;
    private individuInconnu: Individu;

    constructor(props: {}) {
        super(props);
        this.urlServeur = location.toString()
            .replace(/^http/, 'ws'); // Même url, au protocole près

        this.messageErreur = "Aucune erreur";

        this.toutIndividu = {
            ID: identifiant('sommet', ID_TOUS),
            nom: "tous",
            fond: COUPLE_FOND_ENCRE_TOUS.fond,
            encre: COUPLE_FOND_ENCRE_TOUS.encre
        };

        this.individuInconnu = {
            ID: identifiant('sommet', ID_INCONNU),
            nom: "inconnu",
            fond: COUPLE_FOND_ENCRE_INCONNU.fond,
            encre: COUPLE_FOND_ENCRE_INCONNU.encre
        };

        this.state = {
            selection: this.toutIndividu,
            messages: [],
            etatInterface: EtatInterfaceTchat.INITIAL,
            nombreConnexions: "0",
            afficherAlerte: false,
            messageAlerte: "",
            code: ""
        };
        this.envoyerMessage = this.envoyerMessage.bind(this);
        this.modifierSelection = this.modifierSelection.bind(this);
        this.masquerAlerte = this.masquerAlerte.bind(this);
    }

    masquerAlerte() {
        this.setState({afficherAlerte: false})
    }

    modifierSelection(i: Individu) {
        this.setState({selection: i});
    }

    ajouterMessage(m: Message): void {
        this.setState((etatAvant: Etat) => ({
            messages: [...etatAvant.messages, m]
        }));
    }

    individu(id: Identifiant<'sommet'>): Individu {
        if (id.val === this.individuSujet.ID.val) {
            return this.individuSujet;
        }
        if (this.individusObjets.contient(id)) {
            return this.individusObjets.valeur(id);
        }
        return this.individuInconnu;
    }

    mettreAJourMessageEnvoye(id: Identifiant<'message'>, destinataire: Individu) {
        this.setState((etatAvant: Etat) => ({
            messages: etatAvant.messages.map((v, i, tab) => {
                if (v.ID.val === id.val) {
                    return {
                        ID: v.ID,
                        emetteur: v.emetteur,
                        destinataire: v.destinataire,
                        contenu: v.contenu,
                        cachet: v.cachet,
                        accuses: [...v.accuses, destinataire.fond]
                    };
                } else {
                    return v;
                }
            })
        }));
    }

    envoyerMessage(m: Message, d: DateFr) {
        //TODO : Parametrer config
        if (Number(this.state.nombreConnexions) < 5) {
            this.setState({
                afficherAlerte: true,
                messageAlerte: "Le nombre de connexions est insuffisant, il faut que la salle soit complète pour pouvoir envoyer le message."
            })
        } else {
            this.ajouterMessage(m);
            if (m.destinataire.ID.val === ID_TOUS) {
                console.log("* Diffusion du message")
                let msg: MessageTchat = creerMessageAVoisin(m.ID, m.emetteur.ID, m.contenu, tableau([]));
                console.log("- brut : " + msg.brut());
                console.log("- net : " + msg.representation());
                envoyerAVoisins(msg, this.state.code).catch(reason => {
                    // TODO: AFFICHER ALERTE
                });
                return;
            }
            let msg: MessageTchat = creerMessageAVoisin(m.ID, m.emetteur.ID, m.contenu, tableau([]));
            console.log("* Envoi du message");
            console.log("- brut : " + msg.brut());
            console.log("- net : " + msg.representation());
            envoyerAVoisins(msg, this.state.code).catch(reason => {
                // TODO: AFFICHER ALERTE
            });;
        }
    }

    componentDidMount(): void {
        // TODO
        // - poster un message de connexion (service rest, requête post)
        // - établir une connexion SSE et recevoir les avertissements de connexion
        // - afficher ces messages
        console.log("Le composant est monté.");

    }

    render() {
        switch (this.state.etatInterface) {
            case EtatInterfaceTchat.NORMAL:
                return (
                    <CorpsContainer>
                        <Row>
                            <StyledCol sm={12} md={3}>
                                <PanneauAdmin sujet={this.individuSujet}
                                              objets={this.individusObjets.image()}
                                              tous={this.toutIndividu}
                                              selection={this.state.selection}
                                              modifSelection={this.modifierSelection}
                                              nombreConnexions={this.state.nombreConnexions}
                                />
                            </StyledCol>
                            <StyledCol sm={12} md={9}>
                                <PanneauMessages sujet={this.individuSujet} messages={this.state.messages}
                                                 selection={this.state.selection} envoiMessage={this.envoyerMessage}
                                                 afficherAlerte={this.state.afficherAlerte}
                                                 messageAlerte={this.state.messageAlerte}
                                                 masquerAlerte={this.masquerAlerte}/>
                            </StyledCol>
                        </Row>
                    </CorpsContainer>
                );
            case EtatInterfaceTchat.INITIAL:
                return (
                    <h1>Connexion au serveur pour l'initialisation</h1>
                );
            case EtatInterfaceTchat.ERRONE:
                return (
                    <div>
                        <h1>Fin de l'application après l'erreur suivante : </h1>
                        <div style={{color: TEXTE_ERREUR}}>
                            {this.messageErreur}
                        </div>
                    </div>
                );
        }
    }
}

const CorpsContainer = styled.div`
  background: ${FOND}
`;

const StyledCol = styled(Col)`
  padding: 0
`;