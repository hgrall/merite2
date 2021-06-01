import * as React from "react";
import {Individu, Message} from "./Helpers/typesInterface";
import {
    creerTableIdentificationMutableParCopie, creerTableIdentificationMutableParEnveloppe,
    creerTableIdentificationMutableVide, FormatTableIdentification, FormatTableIdentificationMutable,
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
import {dateEnveloppe, DateFr} from "../../bibliotheque/types/date";
import {ecouterServeur, envoyerMessage} from "../communication/communicationServeur";
import {Col, Row} from "react-bootstrap";
import {PanneauAdmin} from "./Paneau/PanneauAdmin";
import {PanneauMessages} from "./Paneau/PaneauMessages";
import styled from "styled-components";
import {tableau} from "../../bibliotheque/types/tableau";
import {table} from "../../bibliotheque/types/table";
import {FormatNoeud, Noeud, noeud} from "../../bibliotheque/applications/noeud";
import {FormatNoeudTchat, FormatSommetTchat} from "../../tchat/commun/echangesTchat";


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

    private generateurIDMessage: GenerateurIdentifiants<'message'>;

    private messageErreur: string;

    private voisins: TableIdentificationMutable<'sommet', Individu>;
    private individuSujet: Individu;
    private toutIndividu: Individu;
    private individuInconnu: Individu;

    private  sse : EventSource;

    constructor(props: {}) {
        super(props);
        // this.urlServeur = location.toString()
        //     .replace(/^http/, 'ws'); // Même url, au protocole près

        //TODO: DEPRONTO TOCA BORRARLO
        const code = "A1"
        this.generateurIDMessage = creerGenerateurIdentifiantParCompteur("prototype");

        this.voisins =  creerTableIdentificationMutableVide("sommet");

        this.sse = new EventSource(`http://localhost:8080/listen/${code}`,
            { withCredentials: false });

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
        if (this.state.nombreConnexions < 5) {
            this.setState({
                afficherAlerte: true,
                messageAlerte: "Le nombre de connexions est insuffisant, il faut que la salle soit complète pour pouvoir envoyer le message."
            })
        } else {
            this.ajouterMessage(m);
            if (m.destinataire.ID.val === ID_TOUS) {
                console.log("* Diffusion du message")
                //TODO: utiliser le bon format
                let msg: unknown = {identifiant: m.ID, identifiantEmmeteur: m.emetteur.ID, contenu: m.contenu, destinataires:tableau([])};
                //console.log("- brut : " + msg.brut());
                //console.log("- net : " + msg.representation());
                envoyerMessage(msg, this.state.code).catch(reason => {
                    // TODO: AFFICHER ALERTE
                });
                return;
            }
            // TODO: utiliser le bon format
            let msg: unknown = {identifiant: m.ID, identifiantEmmeteur: m.emetteur.ID, contenu: m.contenu, destinataires:tableau([])};
            console.log("* Envoi du message");
            //console.log("- brut : " + msg.brut());
            //console.log("- net : " + msg.representation());
            envoyerMessage(msg, this.state.code).catch(reason => {
                // TODO: AFFICHER ALERTE
            });
        }
    }

    remplirIndividuSujet(noeudSujet: Noeud<FormatSommetTchat>){
        this.individuSujet = {
            ID: noeudSujet.etat().centre.ID,
            nom: noeudSujet.etat().centre.pseudo,
            fond: COUPLE_FOND_ENCRE_SUJET.fond,
            encre: COUPLE_FOND_ENCRE_SUJET.encre
        };
    }

    remplirVoisins(voisinsSujet: FormatTableIdentification<"sommet", FormatSommetTchat>){
        const voisins = tableIdentification<"sommet", FormatSommetTchat>("sommet", voisinsSujet);

        const suite = new SuiteCouplesFondEncre();
        voisins.iterer((ID_sorte, val) => {
            const c = suite.courant();
            this.voisins.ajouter(ID_sorte, {ID: ID_sorte,nom:val.pseudo, encre:c.encre, fond:c.fond })
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
         this.sse .addEventListener('config',  (e:MessageEvent) => {
             const noeudSujet = noeud<FormatSommetTchat>(JSON.parse(e.data).corps);
             this.remplirIndividuSujet(noeudSujet);

             const voisins = creerTableIdentificationMutableParEnveloppe<"sommet", FormatSommetTchat>("sommet", JSON.parse(e.data).corps.voisins);

             const suite = new SuiteCouplesFondEncre();
             voisins.iterer((ID_sorte, val) => {
                 const c = suite.courant();
                 self.voisins.ajouter(ID_sorte, {ID: ID_sorte,nom:val.pseudo, encre:c.encre, fond:c.fond })
             })

             //this.remplirVoisins(JSON.parse(e.data).corps.voisins);

             //self.setState({nombreConnexions: noeudSujet.nombreConnexionsActives()});
             self.setState({
                 etatInterface: EtatInterfaceTchat.NORMAL
             });
        });

        this.sse .addEventListener('erreur',  (e:MessageEvent) => {
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
        });

        this.sse .addEventListener('msg',  (e:MessageEvent) => {
            console.log(e.data);
            //TODO: Handle messages using correct format
            // let msg = messageTchat(e.data);
            // console.log("* Réception");
            // console.log("- du message brut : " + msg.brut());
            // console.log("- du message net : " + msg.representation());
            //
            // let contenu: string = msg.val().contenu;
            //
            // /* Message en transit */
            // if (msg.val().type === TypeMessageTchat.TRANSIT) {
            //     if (!this.individusObjets.contient(msg.val().ID_emetteur)) {
            //         console.log("- message incohérent");
            //         return;
            //     }
            //     if (msg.val().ID_emetteur.val !== this.individuSujet.ID.val) {
            //         console.log("- message incohérent");
            //         return;
            //     }
            //     msg.val().ID_destinataires.iterer((_, val) => {
            //         let destinataire = this.individusObjets.valeur(val);
            //         this.mettreAJourMessageEnvoye(msg.val().ID, destinataire);
            //         return;
            //     });
            //     let emetteur: Individu = this.individusObjets.valeur(msg.val().ID_emetteur);
            //     let destinataire: Individu = this.individuSujet;
            //     this.ajouterMessage({
            //         ID: msg.val().ID,
            //         emetteur: emetteur,
            //         destinataire: destinataire,
            //         cachet: dateEnveloppe(msg.val().date).representation(),
            //         contenu: contenu,
            //         accuses: []
            //     });
            //     return;
            // }
            //
            // /* Message accusant réception */
            // if (msg.val().type === TypeMessageTchat.AR) {
            //     if (!this.individusObjets.contient(msg.val().ID_emetteur)) {
            //         console.log("- message incohéent");
            //         return;
            //     }
            //     if (msg.val().ID_emetteur.val !== this.individuSujet.ID.val) {
            //         console.log("- message incohéent");
            //         return;
            //     }
            //     msg.val().ID_destinataires.iterer((_, val) => {
            //         let destinataire = this.individusObjets.valeur(val);
            //         this.mettreAJourMessageEnvoye(msg.val().ID, destinataire);
            //         return;
            //     });
            // }
            //
            //
            // // TODO: REEMPLACER PAR MESSAGE D'INFORMATION
            // if (msg.val().type === TypeMessageTchat.INFO) {
            //     this.setState({nombreConnexions: msg.val().contenu})
            //     return;
            // }
            //
            // this.ajouterMessage({
            //     ID: this.generateur.produire("message"),
            //     emetteur: this.individu(msg.val().ID_emetteur),
            //     destinataire: this.individu(msg.val().ID_destinataire),
            //     cachet: dateEnveloppe(msg.val().date).representation(),
            //     contenu: contenu,
            //     accuses: []
            // });
        });
        // this.sse.onerror = e => {
        //     // error log here
        //     console.log(e);
        //     this.sse.close();
        // }

        // });

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