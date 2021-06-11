import * as React from "react";
import {Individu, Message} from "./Helpers/typesInterface";
import {
    creerTableIdentificationMutableVide, FormatTableIdentification,
    tableIdentification,TableIdentificationMutable
} from "../../bibliotheque/types/tableIdentification";
import {
    Couleur,
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
import {dateEnveloppe, DateFr, dateMaintenant} from "../../bibliotheque/types/date";
import {envoyerMessageEnvoi} from "../communication/communicationServeur";
import {Col, Row} from "react-bootstrap";
import {PanneauAdmin} from "./Paneau/PanneauAdmin";
import {PanneauMessages} from "./Paneau/PaneauMessages";
import styled from "styled-components";
import {creerTableauMutableParCopie, creerTableauMutableVide, tableau} from "../../bibliotheque/types/tableau";
import { Noeud, noeud} from "../../bibliotheque/applications/noeud";
import {
    FormatARTchat, FormatMessageARTchat, FormatMessageEnvoiTchat, FormatMessageTransitTchat,
    FormatSommetTchat
} from "../../tchat/commun/echangesTchat";


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
    config: unknown;
    voisins: TableIdentificationMutable<"sommet", Individu>;
    nombreTotalConnexions: number;
}

export class Corps extends React.Component<{}, Etat> {

    private generateurIDMessage: GenerateurIdentifiants<'message'>;

    private messageErreur: string;

    private individuSujet: Individu;
    private toutIndividu: Individu;
    private individuInconnu: Individu;

    private sse: EventSource;

    constructor(props: {}) {
        super(props);
        // this.urlServeur = location.toString()
        //     .replace(/^http/, 'ws'); // Même url, au protocole près

        //TODO: DEPRONTO TOCA BORRARLO
        const code = "A1"
        this.generateurIDMessage = creerGenerateurIdentifiantParCompteur("prototype");


        this.sse = new EventSource(`http://localhost:8080/tchat/code/etoile/reception`,
            {withCredentials: false});

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
            nombreConnexions: 0,
            afficherAlerte: false,
            messageAlerte: "",
            code: "",
            config: {},
            voisins: creerTableIdentificationMutableVide<"sommet", Individu>("sommet"),
            nombreTotalConnexions: 0
        }

        this.envoyerMessage = this.envoyerMessage.bind(this);
        this.modifierSelection = this.modifierSelection.bind(this);
        this.masquerAlerte = this.masquerAlerte.bind(this);
        this.remplirVoisins = this.remplirVoisins.bind(this);
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
            if( messageAMettreAJour.destinataires[0].ID.val == ID_TOUS){
                this.state.voisins.iterer((_, voisin) => {
                    nouveauAccuses.push(voisin.fond)
                })
            } else {
                messageAMettreAJour.destinataires.forEach(destinataire => {
                    nouveauAccuses.push(destinataire.fond);
                })
            }
            this.setState((etatAvant: Etat) => ({
                messages: etatAvant.messages.map((v, i, tab) => {
                    if (v.ID.val === messageAMettreAJour.ID.val) {
                        return {
                            ID: v.ID,
                            emetteur: v.emetteur,
                            destinataires: messageAMettreAJour.destinataires,
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
        if (this.state.nombreConnexions < this.state.nombreTotalConnexions) {
            this.setState({
                afficherAlerte: true,
                messageAlerte: "Le nombre de connexions est insuffisant, il faut que la salle soit complète pour pouvoir envoyer le message."
            })
        } else {

            let destinataires = creerTableauMutableVide<Identifiant<"sommet">>();
            if (m.destinataires.length == 1 && m.destinataires[0].ID.val === ID_TOUS) {
                // Rempli un tableu de destinataires avec tous les voisins du sommet
                this.state.voisins.iterer((ID_sorte) => {
                    destinataires.ajouterEnFin(ID_sorte);
                })
            } else {
                // Rempli un tableau avec les destinataires du map, normalement il n'y a qu'un destinataire
                const idDestinataires = m.destinataires.map((individu) => {
                    return individu.ID
                })
                destinataires = creerTableauMutableParCopie(idDestinataires);
            }
            let msg: FormatMessageEnvoiTchat = {
                ID: m.ID,
                type: 'envoi',
                date: dateMaintenant().toJSON(),
                corps: {ID_emetteur: m.emetteur.ID, contenu: m.contenu, ID_destinataires: destinataires.toJSON()}
            };
            //console.log("- brut : " + msg.brut());
            //console.log("- net : " + msg.representation());
            envoyerMessageEnvoi(msg).then(response => {
                const msg: FormatMessageARTchat = response.data;
                this.mettreAJourAccuses(msg);
            }).catch(reason => {
                // TODO: AFFICHER ALERTE
            });
            this.ajouterMessage(m);
        }
    }

    remplirIndividuSujet(noeudSujet: Noeud<FormatSommetTchat>) {
        this.individuSujet = {
            ID: noeudSujet.etat().centre.ID,
            nom: noeudSujet.etat().centre.pseudo,
            fond: COUPLE_FOND_ENCRE_SUJET.fond,
            encre: COUPLE_FOND_ENCRE_SUJET.encre
        };
    }

    remplirVoisins(voisinsSujet: FormatTableIdentification<"sommet", FormatSommetTchat>) {
        const voisins = tableIdentification<"sommet", FormatSommetTchat>("sommet", voisinsSujet);
        const nouveauxVoisins = creerTableIdentificationMutableVide<"sommet", Individu>("sommet");
        const suite = new SuiteCouplesFondEncre();
        voisins.iterer((ID_sorte, voisin) => {
            if(voisin.actif){
                const c = suite.courant();
                nouveauxVoisins.ajouter(ID_sorte, {ID: ID_sorte, nom: voisin.pseudo, encre: c.encre, fond: c.fond})
            }
        })
        this.setState({voisins: nouveauxVoisins})
    }

    componentDidMount(): void {
        this.setState({
            etatInterface: EtatInterfaceTchat.INITIAL
        });
        // TODO
        // - poster un message de connexion (service rest, requête post)
        // - établir une connexion SSE et recevoir les avertissements de connexion
        // - afficher ces messages
        const self = this;
        this.sse.addEventListener('config', (e: MessageEvent) => {
            const noeudSujet = noeud<FormatSommetTchat>(JSON.parse(e.data));
            this.remplirIndividuSujet(noeudSujet);
            this.remplirVoisins(noeudSujet.etat().voisins.etat());

            self.setState({nombreConnexions: noeudSujet.nombreConnexionsActives()+1});
            self.setState({ etatInterface: EtatInterfaceTchat.NORMAL});
            self.setState({nombreTotalConnexions: noeudSujet.etat().voisins.taille()+1})
        }, false);

        this.sse.addEventListener('erreur', (e: MessageEvent) => {
            //TODO: HANDLE ERRORS IN CORRECT FORMAT
            // this.messageErreur = erreur.representation();
            // // TODO: VERIFIER TYPE ERREUR
            // let codeErreur = erreur.val().erreurRedhibitoire;
            // if (codeErreur == 0) {
            //     let typeReseau = "anneau";
            //     if ((document.URL).includes("etoile")) {
            //         typeReseau = "etoile";
            //     }
            //     const nombreReseauIndex = (document.URL).indexOf(typeReseau) + 6
            //     const nombreNouvelReseau = (Number(document.URL[nombreReseauIndex]) + 1)
            //     if (nombreNouvelReseau < 5) {
            //         const url = document.URL.replace(typeReseau + document.URL[nombreReseauIndex], typeReseau + nombreNouvelReseau)
            //         window.location.href = url
            //     } else {
            //         this.setState({
            //             etatInterface: EtatInterfaceTchat.ERRONE,
            //         });
            //     }
            // } else {
            //     this.setState({
            //         etatInterface: EtatInterfaceTchat.ERRONE,
            //     });
            // }
        }, false);

        this.sse.addEventListener('transit', (e: MessageEvent) => {
            //TODO: implementer message par enveloppe
            let msg: FormatMessageTransitTchat = JSON.parse(e.data);
            console.log(msg);
            console.log("* Réception");
            // console.log("- du message brut : " + msg.brut());
            // console.log("- du message net : " + msg.representation());
            /* Message en transit */

            if (!this.state.voisins.contient(msg.corps.ID_emetteur)) {
                console.log("- message incohérent");
                return;
            }
            if (msg.corps.ID_destinataire.val !== this.individuSujet.ID.val) {
                console.log("- message incohérent");
                return;
            }
            const emetteur: Individu = this.state.voisins.valeur(msg.corps.ID_emetteur);
            const destinataires: Individu[] = [this.individuSujet];
            this.ajouterMessage({
                ID: msg.ID,
                emetteur: emetteur,
                destinataires: destinataires,
                cachet: dateEnveloppe(msg.date).representation(),
                contenu: msg.corps.contenu,
                accuses: []
            });
        });

        console.log("Le composant est monté.");
    }

    componentWillUnmount() {
        this.sse.close()
    }

    render() {
        switch (this.state.etatInterface) {
            case EtatInterfaceTchat.NORMAL:
                return (
                    <CorpsContainer>
                        <Row>
                            <StyledCol sm={12} md={3}>
                                <PanneauAdmin sujet={this.individuSujet}
                                              objets={this.state.voisins.image()}
                                              tous={this.toutIndividu}
                                              selection={this.state.selection}
                                              modifSelection={this.modifierSelection}
                                              nombreConnexions={this.state.nombreConnexions}
                                              nombreTotalConnexions={this.state.nombreTotalConnexions}
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