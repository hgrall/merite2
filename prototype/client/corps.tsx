import * as React from "react";
import {Individu, Message} from "./Helpers/typesInterface";
import {
    creerTableIdentificationMutableParCopie, creerTableIdentificationMutableParEnveloppe,
    creerTableIdentificationMutableVide,
    tableIdentification,
    TableIdentification, TableIdentificationMutable
} from "../../bibliotheque/types/tableIdentification";
import {
    COUPLE_FOND_ENCRE_INCONNU, COUPLE_FOND_ENCRE_SUJET,
    COUPLE_FOND_ENCRE_TOUS,
    FOND, SuiteCouplesFondEncre,
    TEXTE_ERREUR
} from "../../bibliotheque/interface/couleur";
import {
    creerGenerateurIdentifiantParCompteur,
    GenerateurIdentifiants,
    identifiant,
    Identifiant
} from "../../bibliotheque/types/identifiant";
import {DateFr} from "../../bibliotheque/types/date";
import {creerMessageAVoisin} from "../communication/Mapper/MessageMapper";
import {configurationDeSommetTchat, configurationTchat, MessageTchat} from "../../bibliotheque/echangesTchat";
import {ecouterServeur, envoyerAVoisins} from "./Reseau/connexionServeur";
import {Col, Row} from "react-bootstrap";
import {PanneauAdmin} from "./Paneau/PanneauAdmin";
import {PanneauMessages} from "./Paneau/PaneauMessages";
import styled from "styled-components";
import {tableau} from "../../bibliotheque/types/tableau";
import {table} from "../../bibliotheque/types/table";
import {FormatSommetTchat} from "../../bibliotheque/types/sommet";


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
    nombreConnexions: number;
    afficherAlerte: boolean;
    messageAlerte: string;
    code: string;
    config: unknown
}

export class Corps extends React.Component<{}, Etat> {

    private generateur: GenerateurIdentifiants<'message'>;
    private urlServeur: string; // avec protocole ws

    private messageErreur: string;

    private individusObjets: TableIdentificationMutable<'sommet', Individu>;
    private individuSujet: Individu;
    private toutIndividu: Individu;
    private individuInconnu: Individu;

    private  sse : EventSource;

    constructor(props: {}) {
        super(props);
        // this.urlServeur = location.toString()
        //     .replace(/^http/, 'ws'); // Même url, au protocole près

        const code = "A1"
        this.sse = new EventSource(`http://localhost:8080/listen/${code}`,
            { withCredentials: false });

        this.messageErreur = "Aucune erreur";

        this.individusObjets = creerTableIdentificationMutableVide('sommet');

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
            nombreConnexions: 0,
            afficherAlerte: false,
            messageAlerte: "",
            code: "",
            config: {}
        }

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
            });
        }
    }


    componentDidMount(): void {
        // TODO
        // - poster un message de connexion (service rest, requête post)
        // - établir une connexion SSE et recevoir les avertissements de connexion
        // - afficher ces messages
        const self = this;
        this.sse .addEventListener('config',  (e:MessageEvent) => {
            const configJSON = JSON.parse(e.data);
            console.log(configJSON);
            const config = configurationTchat<FormatSommetTchat,Express.Request>(configJSON.etat);
            self.individuSujet = {
                ID: configJSON.etat.id,
                nom: configJSON.etat.centre.pseudo,
                fond: COUPLE_FOND_ENCRE_SUJET.fond,
                encre: COUPLE_FOND_ENCRE_SUJET.encre
            };
            self.generateur = creerGenerateurIdentifiantParCompteur(configJSON.id + "-ERR-");
            const suite = new SuiteCouplesFondEncre();
            console.log(configJSON.etat.voisinsActifs);
            console.log(configJSON.etat.voisinsActifs.etat.identification);
            creerTableIdentificationMutableParEnveloppe("sommet", {identification:configJSON.etat.voisinsActifs.etat.identification,sorte:"sommet"}).iterer((ID_sorte, sommet: FormatSommetTchat) => {
                    let c = suite.courant();
                    self.individusObjets.ajouter(ID_sorte, {ID: sommet.ID,nom:sommet.pseudo, encre:c.encre, fond:c.fond })
                });
            self.setState({nombreConnexions: config.val().nombreConnexions});
            self.setState({
                etatInterface: EtatInterfaceTchat.NORMAL
            });
        });





        // this.sse.onmessage = e => this.getRealtimeData(JSON.parse(e.data));
        // this.sse.onerror = e => {
        //     // error log here
        //     console.log(e);
        //     this.sse.close();
        // }

        //let config = configurationTchat(c);
        // console.log("* Réception");
        // console.log("- de la configuration brute : " + config.brut());
        // console.log("- de la configuration nette : " + config.representation());
        // console.log("* Initialisation du noeud du réseau");
        // this.setState({nombreConnexions: config.net('nombreConnexions')})
        // this.noeud = config.noeud();
        // this.individuSujet = {
        //     ID: this.noeud.val().centre.ID,
        //     nom: this.noeud.val().centre.pseudo,
        //     fond: COUPLE_FOND_ENCRE_SUJET.fond,
        //     encre: COUPLE_FOND_ENCRE_SUJET.encre
        // };
        // this.generateur = creerGenerateurIdentifiantParCompteur(this.individuSujet.ID.val + "-ERR-");
        // let suite = new SuiteCouplesFondEncre();
        // this.individusObjets =
        //     tableIdentification('sommet',
        //         table(this.noeud.val().voisins.identification).application(s => {
        //             let c = suite.courant();
        //             return {
        //                 ID: s.ID,
        //                 nom: s.pseudo,
        //                 fond: c.fond,
        //                 encre: c.encre
        //             };
        //         }).val());
        // this.setState({
        //     etatInterface: EtatInterfaceTchat.NORMAL
        // });

        console.log("Le composant est monté.");
    }

    componentWillUnmount() {
        this.sse.close()
    }

    render() {
        switch (this.state.etatInterface) {
            case EtatInterfaceTchat.NORMAL:
                console.log(this.individuSujet);
                console.log(this.individusObjets);
                console.log(this.toutIndividu);
                console.log(this.state.selection);
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