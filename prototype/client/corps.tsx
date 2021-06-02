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
    FormatARTchat, FormatMessageEnvoiTchat, FormatMessageTransitTchat,
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
    config: unknown
}

export class Corps extends React.Component<{}, Etat> {

    private generateurIDMessage: GenerateurIdentifiants<'message'>;

    private messageErreur: string;

    private voisins: TableIdentificationMutable<'sommet', Individu>;
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

        this.voisins = creerTableIdentificationMutableVide("sommet");

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


    mettreAJourAccuses(m: FormatARTchat) {
        console.log(m);
        const messageAMettreAJour = this.state.messages.find((message: Message) => {
            return message.ID.val == m.ID_envoi.val
        });
        if (messageAMettreAJour != undefined) {
            const nouveauAccuses: Couleur[] = [];
            messageAMettreAJour.destinataires.forEach(destinataire => {
                nouveauAccuses.push(destinataire.encre);
            })
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


    envoyerMessage(m: Message, d: DateFr) {
        //TODO: Paramétrer config
        //TODO: Factoriser le code
        if (this.state.nombreConnexions < 3) {
            this.setState({
                afficherAlerte: true,
                messageAlerte: "Le nombre de connexions est insuffisant, il faut que la salle soit complète pour pouvoir envoyer le message."
            })
        } else {
            this.ajouterMessage(m);
            if (m.destinataires.length == 1 && m.destinataires[0].ID.val === ID_TOUS) {
                console.log("* Diffusion du message")
                const destinataires = creerTableauMutableVide<Identifiant<"sommet">>();
                this.voisins.iterer((ID_sorte) => {
                    destinataires.ajouterEnFin(ID_sorte);
                })
                //TODO: utiliser le bon format
                let msg: FormatMessageEnvoiTchat = {
                    ID: m.ID,
                    type: 'envoi',
                    date: dateMaintenant().toJSON(),
                    corps: {ID_emetteur: m.emetteur.ID, contenu: m.contenu, ID_destinataires: destinataires.toJSON()}
                };
                //console.log("- brut : " + msg.brut());
                //console.log("- net : " + msg.representation());
                envoyerMessageEnvoi(msg).then(response => {
                    const msg: FormatARTchat = response.data.corps;
                    this.mettreAJourAccuses(msg);
                }).catch(reason => {
                    // TODO: AFFICHER ALERTE
                });
                return;
            } else {
                const idDestinataires = m.destinataires.map((individu) => {
                    return individu.ID
                })
                const destinataires = creerTableauMutableParCopie(idDestinataires);
                let msg: FormatMessageEnvoiTchat = {
                    ID: m.ID,
                    type: 'envoi',
                    date: dateMaintenant().toJSON(),
                    corps: {
                        ID_emetteur: m.emetteur.ID,
                        contenu: m.contenu,
                        ID_destinataires: destinataires.toJSON()
                    }
                };
                //console.log("- brut : " + msg.brut());
                //console.log("- net : " + msg.representation());
                envoyerMessageEnvoi(msg).then(response => {
                    console.log(response);
                    const msg: FormatARTchat = response.data;
                    msg.ID_destinataires.tableau.forEach(idDestinataire => {
                        if (!this.voisins.contient(idDestinataire)) {
                            console.log("- message incohérent");
                            return;
                        }
                    })
                    this.mettreAJourAccuses(msg);
                }).catch(reason => {
                    // TODO: AFFICHER ALERTE
                });
                const indivudusDestinataires: Individu[] = [];
                tableau(msg.corps.ID_destinataires.tableau).iterer((index, val) => {
                    const destinataire = this.voisins.valeur(val);
                    indivudusDestinataires.push({
                        ID: destinataire.ID,
                        nom: destinataire.nom,
                        fond: destinataire.fond,
                        encre: destinataire.encre
                    })
                })
            }
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

        const suite = new SuiteCouplesFondEncre();
        voisins.iterer((ID_sorte, voisin) => {
            if(voisin.actif){
                const c = suite.courant();
                this.voisins.ajouter(ID_sorte, {ID: ID_sorte, nom: voisin.pseudo, encre: c.encre, fond: c.fond})
            } else {
                this.voisins.retirer(ID_sorte);
            }
        })
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
            console.log(JSON.parse(e.data));
            const noeudSujet = noeud<FormatSommetTchat>(JSON.parse(e.data));
            this.remplirIndividuSujet(noeudSujet);
            this.remplirVoisins(noeudSujet.etat().voisins.etat());

            self.setState({nombreConnexions: noeudSujet.nombreConnexionsActives()+1});
            self.setState({
                etatInterface: EtatInterfaceTchat.NORMAL
            });
            return;
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
            console.log(this.voisins.representation());
            // console.log("- du message brut : " + msg.brut());
            // console.log("- du message net : " + msg.representation());
            /* Message en transit */

            if (!this.voisins.contient(msg.corps.ID_emetteur)) {
                console.log("- message incohérent");
                return;
            }
            if (msg.corps.ID_destinataire.val !== this.individuSujet.ID.val) {
                console.log("- message incohérent");
                return;
            }
            //const tableauDestinataires = tableau(msg.corps.ID_destinataires.tableau);
            // tableauDestinataires.iterer((_, val) => {
            //     let destinataire = this.voisins.valeur(val);
            //     this.mettreAJourMessageEnvoye(msg.ID, destinataire);
            //     return;
            // });
            const emetteur: Individu = this.voisins.valeur(msg.corps.ID_emetteur);
            const destinataires: Individu[] = [this.individuSujet];
            this.ajouterMessage({
                ID: msg.ID,
                emetteur: emetteur,
                destinataires: destinataires,
                cachet: dateEnveloppe(msg.date).representation(),
                contenu: msg.corps.contenu,
                accuses: []
            });
            return;
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
                                              objets={this.voisins.image()}
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