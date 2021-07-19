import * as React from "react";
import {Individu, Message, ToutIndividu} from "./Helpers/typesInterface";
import {
    creerTableIdentificationMutableVide, TableIdentification,TableIdentificationMutable
} from "../../bibliotheque/types/tableIdentification";
import {
    Couleur,
    COUPLE_FOND_ENCRE_INCONNU, COUPLE_FOND_ENCRE_SUJET,
    COUPLE_FOND_ENCRE_TOUS,
    FOND, SuiteCouplesFondEncre,
    TEXTE_ERREUR
} from "../../bibliotheque/interface/couleur";
import {
    identifiant,
    Identifiant
} from "../../bibliotheque/types/identifiant";
import {dateEnveloppe, dateMaintenant} from "../../bibliotheque/types/date";
import {creerFluxDeEvenements, requetePOST} from "../communication/communicationServeur";
import {Col, Row} from "react-bootstrap";
import {PanneauAdmin} from "./Paneau/PanneauAdmin";
import {PanneauMessages} from "./Paneau/PaneauMessages";
import styled from "styled-components";
import {tableauDeNatif} from "../../bibliotheque/types/tableau";
import {Noeud, noeud} from "../../bibliotheque/applications/noeud";
import {
    FormatMessageARTchat,
    FormatMessageAvertissementTchat,
    FormatMessageEnvoiTchat,
    FormatMessageErreurTchat,
    FormatMessageTransitTchat,
    FormatUtilisateurTchat,
} from "../commun/echangesTchat";
import {AxiosError, AxiosResponse} from "axios";


enum EtatInterfaceTchat {
    INITIAL,
    NORMAL,
    ERRONE
}

const ID_INCONNU: string = "?";

interface Etat {
    selection: Individu | ToutIndividu
    messages: Message[];
    etatInterface: EtatInterfaceTchat;
    nombreConnexions: number;
    afficherAlerte: boolean;
    messageAlerte: string;
    voisins: TableIdentificationMutable<"sommet", Individu>;
    nombreTotalConnexions: number;
    toutIndividu: ToutIndividu;
}

export class Corps extends React.Component<{}, Etat> {

    private messageErreur: string;

    private individuSujet: Individu;
    private individuInconnu: Individu;

    private fluxDeEvenements: EventSource;
    private urlEnvoi: string;

    constructor(props: {}) {
        super(props);
        const url = window.location.href;
        this.fluxDeEvenements = creerFluxDeEvenements(`${url}/reception`);
        this.urlEnvoi = `${url}/envoi`
        this.individuInconnu = {
            ID: identifiant('sommet', ID_INCONNU),
            nom: "inconnu",
            fond: COUPLE_FOND_ENCRE_INCONNU.fond,
            encre: COUPLE_FOND_ENCRE_INCONNU.encre,
            inactif: false
        };

        this.state = {
            toutIndividu: {
                IDVoisins: tableauDeNatif([]),
                nom: "tous",
                fond: COUPLE_FOND_ENCRE_TOUS.fond,
                encre: COUPLE_FOND_ENCRE_TOUS.encre,
                inactif: true
            },
            selection: this.individuInconnu,
            messages: [],
            etatInterface: EtatInterfaceTchat.INITIAL,
            nombreConnexions: 0,
            afficherAlerte: false,
            messageAlerte: "Connexion au serveur pour l'initialisation",
            voisins: creerTableIdentificationMutableVide<"sommet", Individu>("sommet"),
            nombreTotalConnexions: 0,
        }
        this.envoyerMessage = this.envoyerMessage.bind(this);
        this.modifierSelection = this.modifierSelection.bind(this);
        this.masquerAlerte = this.masquerAlerte.bind(this);
        this.remplirVoisins = this.remplirVoisins.bind(this);
        this.mettreAJourAccuses = this.mettreAJourAccuses.bind(this);
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


    mettreAJourAccuses(m: FormatMessageARTchat) {
        const messageAMettreAJour = this.state.messages.find((message: Message) => {
            return message.ID.val == m.corps.ID_envoi.val
        });
        if (messageAMettreAJour != undefined) {
            const nouveauAccuses: Couleur[] = [];
            if ("IDVoisins" in messageAMettreAJour.destinataire) {
                messageAMettreAJour.destinataire.IDVoisins.iterer((_, idSommet) => {
                    nouveauAccuses.push(this.state.voisins.valeur(idSommet).fond);
                });
            } else {
                nouveauAccuses.push(messageAMettreAJour.destinataire.fond);
            }
            this.setState((etatAvant: Etat) => ({
                messages: etatAvant.messages.map((v) => {
                    if (v.ID.val === messageAMettreAJour.ID.val) {
                        return {
                            ID: v.ID,
                            emetteur: v.emetteur,
                            destinataire: messageAMettreAJour.destinataire,
                            contenu: v.contenu,
                            cachet: v.cachet,
                            accuses: nouveauAccuses
                        };
                    } else {
                        return v;
                    }
                })
            }));
        }
    }


    envoyerMessage(m: Message) {
        let destinataires = tableauDeNatif<Identifiant<"sommet">>([]);
        if ("ID" in m.destinataire) {
            destinataires = tableauDeNatif([m.destinataire.ID]);
        } else if ("IDVoisins" in m.destinataire) {
            destinataires = m.destinataire.IDVoisins;
        }
        let msg: FormatMessageEnvoiTchat = {
            ID: m.ID,
            type: 'envoi',
            date: dateMaintenant().toJSON(),
            corps: {ID_emetteur: m.emetteur.ID, contenu: m.contenu, ID_destinataires: destinataires.toJSON()}
        };
        this.ajouterMessage(m);
        const traitementEnvoiMessage = (reponse: AxiosResponse) => {
            const msgAR: FormatMessageARTchat = reponse.data;
            this.mettreAJourAccuses(msgAR);
        };
        const traitementErreur = (raison: AxiosError) => {
            if (raison.response?.status == 400) {
                const erreur: FormatMessageErreurTchat = raison.response.data;
                console.log(`Erreur: ${erreur.corps.erreur}`);
            } else if (raison.response?.status == 500) {
                this.messageErreur = raison.response?.data
                this.setState({etatInterface: EtatInterfaceTchat.ERRONE});
            }
        }
        requetePOST<FormatMessageEnvoiTchat>(msg, traitementEnvoiMessage, traitementErreur, this.urlEnvoi);
    }

    remplirIndividuSujet(noeudSujet: Noeud<FormatUtilisateurTchat>) {
        this.individuSujet = {
            ID: noeudSujet.etat().centre.ID,
            nom: noeudSujet.etat().centre.pseudo,
            fond: COUPLE_FOND_ENCRE_SUJET.fond,
            encre: COUPLE_FOND_ENCRE_SUJET.encre,
            inactif: true
        };
    }

    remplirVoisins(voisins: TableIdentification<"sommet", FormatUtilisateurTchat>) {
        const nouveauxVoisins = creerTableIdentificationMutableVide<"sommet", Individu>("sommet");
        const suite = new SuiteCouplesFondEncre();
        const identifiantsVoisins: Identifiant<"sommet">[] = [];
        voisins.iterer((ID_sorte, voisin) => {
            const c = suite.courant();
            nouveauxVoisins.ajouter(ID_sorte, {
                ID: ID_sorte,
                nom: voisin.pseudo,
                encre: c.encre,
                fond: c.fond,
                inactif: !voisin.actif
            })
            if(voisin.actif){
                identifiantsVoisins.push(ID_sorte);
            }
        });
        const nouveauToutIndividu = {
            IDVoisins: tableauDeNatif<Identifiant<"sommet">>( identifiantsVoisins),
            nom: "tous",
            fond: COUPLE_FOND_ENCRE_TOUS.fond,
            encre: COUPLE_FOND_ENCRE_TOUS.encre,
            inactif: identifiantsVoisins.length < 1
        }
        this.setState({
            voisins: nouveauxVoisins,
            toutIndividu: nouveauToutIndividu,
            selection: nouveauToutIndividu
        });
    }

    componentDidMount(): void {
        this.setState({
            etatInterface: EtatInterfaceTchat.INITIAL
        });
        const self = this;
        this.fluxDeEvenements.addEventListener('config', (e: MessageEvent) => {
            const noeudSujet = noeud<FormatUtilisateurTchat>(JSON.parse(e.data));
            this.remplirIndividuSujet(noeudSujet);
            this.remplirVoisins(noeudSujet.etat().voisins);

            self.setState({
                nombreConnexions: noeudSujet.nombreVoisinsActifs() + 1,
                etatInterface: EtatInterfaceTchat.NORMAL,
                nombreTotalConnexions: noeudSujet.etat().voisins.taille() + 1
            });
        });

        this.fluxDeEvenements.addEventListener('avertissement', (e: MessageEvent) => {
            const avertissement: FormatMessageAvertissementTchat = JSON.parse(e.data);
            console.log(`Avertissement: ${avertissement.corps.avertissement}`)
            this.setState({
                messageAlerte: avertissement.corps.avertissement,
                afficherAlerte: true
            })
        });

        this.fluxDeEvenements.addEventListener('transit', (e: MessageEvent) => {
            let msg: FormatMessageTransitTchat = JSON.parse(e.data);
            if (!this.state.voisins.contient(msg.corps.ID_emetteur)) {
                console.log("- message incohérent");
                return;
            }
            if (msg.corps.ID_destinataire.val !== this.individuSujet.ID.val) {
                console.log("- message incohérent");
                return;
            }
            const emetteur: Individu = this.state.voisins.valeur(msg.corps.ID_emetteur);
            this.ajouterMessage({
                ID: msg.ID,
                emetteur: emetteur,
                destinataire: this.individuSujet,
                cachet: dateEnveloppe(msg.date).representation(),
                contenu: msg.corps.contenu,
                accuses: []
            });
        });

        console.log("Le composant est monté.");
    }

    componentWillUnmount() {
        this.fluxDeEvenements.close()
    }

    render() {
        switch (this.state.etatInterface) {
            case EtatInterfaceTchat.NORMAL:
                return (
                    <CorpsContainer>
                        <StyledRow>
                            <StyledAdminCol sm={12} md={3}>
                                <PanneauAdmin sujet={this.individuSujet}
                                              objets={this.state.voisins.image()}
                                              tous={this.state.toutIndividu}
                                              selection={this.state.selection}
                                              modifSelection={this.modifierSelection}
                                              nombreConnexions={this.state.nombreConnexions}
                                              nombreTotalConnexions={this.state.nombreTotalConnexions}
                                />
                            </StyledAdminCol>
                            <StyledMessagesCol sm={12} md={9}>
                                <PanneauMessages sujet={this.individuSujet} messages={this.state.messages}
                                                 selection={this.state.selection} envoiMessage={this.envoyerMessage}
                                                 afficherAlerte={this.state.afficherAlerte}
                                                 messageAlerte={this.state.messageAlerte}
                                                 masquerAlerte={this.masquerAlerte}/>
                            </StyledMessagesCol>
                        </StyledRow>
                    </CorpsContainer>
                );
            case EtatInterfaceTchat.INITIAL:
                return (
                    <h1>{this.state.messageAlerte}</h1>
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
  background: ${FOND};
  overflow: hidden;
  height: 100vh;
`;

const StyledMessagesCol = styled(Col)`
  padding: 0;
  height: 100vh;
`;

const StyledAdminCol = styled(Col)`
  padding: 0;
  overflow: scroll;
  height: 100vh;
`;

const StyledRow = styled(Row)`
  height: 100%;
`