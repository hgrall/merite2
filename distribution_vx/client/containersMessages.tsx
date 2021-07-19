import * as React from "react";

import styled from "styled-components";

import { DateFr, dateMaintenant } from "../../bibliotheque/types/date"

import { Identification, creerIdentificationParCompteur, Identifiant } from "../../bibliotheque/types/identifiant"

import {
    DomaineInterface, FormulaireMessage, formulaireMessage,
    MessageInformant, messageInformantAvecNouveauType, FormulaireEssai, formulaireEssai, messageInformant, messageInformantAvecInterpretation
} from "./typesInterface";

import {
    Couleur, COUPLE_FOND_ENCRE_SUJET, FOND_TEXTE, TEXTE,
    FOND_TEXTE_INV, TEXTE_INV, TEXTE_PALE, TEXTE_ERREUR, FOND_SELECTION,
    COUPLE_FOND_ENCRE_TOUS
} from "../../bibliotheque/interface/couleur";

import TextareaAutosize from 'react-textarea-autosize';
import { mot } from "../../bibliotheque/types/binaire";
import { Deux } from "../../bibliotheque/types/typesAtomiques";
import { FormatOption } from "../../bibliotheque/types/option";

interface ProprietesARMessageInitial {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
}

enum Role { Emetteur, Recepteur };

interface ProprietesInterlocuteur {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    nom: string,
    role: Role
}

class InterlocuteurBrut extends React.Component<ProprietesInterlocuteur, {}> {
    render() {
        return (
            <div className={this.props.className}>
                {((this.props.role === Role.Emetteur) ? "De : " : "A : ") + this.props.nom}
            </div>
        );
    }
}

const Interlocuteur = styled(InterlocuteurBrut)`
        flex: none;
        background-color: ${(props: ProprietesInterlocuteur) => props.fond};
        color : ${(props: ProprietesInterlocuteur) => props.encre};
        text-align: center;
        padding: 1ex;

        width: 18ex;
        margin: 1ex;
        border-radius: 1ex;
    `;

interface ProprietesAvis {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    avis: string,
}

class AvisBrut extends React.Component<ProprietesAvis, {}> {
    render() {
        return (
            <div className={this.props.className}>
                {this.props.avis}
            </div>
        );
    }
}

const Avis = styled(AvisBrut)`
        flex: none;
        background-color: ${(props: ProprietesAvis) => props.fond};
        color : ${(props: ProprietesAvis) => props.encre};
        text-align: center;
        padding: 1ex;

        width: 54ex;
        margin: 1ex;
        border-radius: 1ex;
    `;

interface ProprietesAction {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    nom: string;
    onClick: () => void;
}

class ActionBrut extends React.Component<ProprietesAction, {}> {
    render() {
        return (
            <button className={this.props.className}
                onClick={this.props.onClick} >
                {this.props.nom}
            </button>
        );
    }
}

const Action = styled(ActionBrut)`
        flex: none;
        background-color: ${(props: ProprietesAction) => props.fond};
        color : ${(props: ProprietesAction) => props.encre};
        text-align: center;
        padding: 1ex;

        width: 18ex;
        margin: 1ex;
        border-radius: 1ex;
    `;

const MessageFixe = styled.div`
    flex: auto;
    background: ${FOND_TEXTE};
    color: ${TEXTE};
    text-align: justify;
    padding: 1ex;

    min-width: 24ex;
    max-width: 72ex;
    margin: 1ex;
    white-space: pre-wrap;
    overflow-wrap: break-word;
`;

const Cachet = styled.div`
    font-size: x-small;
    color: ${TEXTE_PALE};
    text-align: right;
`;

interface ProprietesPastille {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
}

class PastilleBrute extends React.Component<ProprietesPastille, {}> {
    render() {
        return (
            <div className={this.props.className}>
            </div>
        );
    }
}

const Pastille = styled(PastilleBrute)`
        display: inline-block;
        width: 2ex;
        height: 2ex;
        border-radius: 100%;
        background-color: ${(props: ProprietesPastille) => props.fond};
        margin: 0 1ex 0 1ex;
    `;


class ContainerARMessageInitialBrut extends React.Component<ProprietesARMessageInitial, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className} key={id}>
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.utilisateur.pseudo).representation()
                        + "@"
                        + mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />

                <MessageFixe style={{ color: TEXTE }}>
                    {"message numéro " + n + " : "
                        + mot(this.props.message.trame).representation()}
                </MessageFixe>

                <Interlocuteur fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={mot(this.props.message.domaineDestination.domaine.nom).representation()}
                    role={Role.Recepteur} />
            </div>
        );
    }
}

interface ProprietesMessageTransit {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    demandeVerrouillage: (m: MessageInformant) => void;
}

interface ProprietesMessageAOmettre {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    annulationOmission: (n: MessageInformant) => void;
    confirmationOmission: (i: Identifiant<'message'>) => void;
}

/*
interface ProprietesMessageAVerrouiller {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    message: MessageInformant;
}
*/
interface ProprietesMessageVerrouille {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    domaineSelectionne: DomaineInterface;
    demandeDeverrouillage: (m: MessageInformant) => void;
    transmissionMessage: (m: MessageInformant, dom: DomaineInterface, d: DateFr) => void;
    interpretation: (m: MessageInformant) => void;
}

interface ProprietesAvisEchecVerrouillage {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
}

interface ProprietesAvisVerrouillage {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
}

interface ProprietesAvisGainPerte {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    qualificatif: string;
    fond: Couleur;
}

interface ProprietesAvisTransmission {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    message: MessageInformant;
    omission: (n: MessageInformant) => void;
}

class ContainerMessageTransitBrut extends React.Component<ProprietesMessageTransit, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className}>
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />

                <MessageFixe style={{ color: (this.props.message.ID.val.includes('ERR')) ? TEXTE_ERREUR : TEXTE }}>
                    {"message numéro " + n + " : "
                        + mot(this.props.message.trame).representation()}
                </MessageFixe>

                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Verrouiller"}
                    onClick={() => {
                        this.props.demandeVerrouillage(
                            this.props.message
                        );
                    }}
                />

            </div>
        );
    }
}

class ContainerMessageAOmettreBrut extends React.Component<ProprietesMessageAOmettre, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className}>
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />

                <MessageFixe style={{ color: (this.props.message.ID.val.includes('ERR')) ? TEXTE_ERREUR : TEXTE }}>
                    {"Omettre le message numéro " + n + " : "
                        + mot(this.props.message.trame).representation()
                        + " ?"}
                </MessageFixe>

                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Annuler"}
                    onClick={() => {
                        this.props.annulationOmission(
                            messageInformantAvecNouveauType(this.props.message, 'transmission'));
                    }}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Confirmer"}
                    onClick={() => {
                        this.props.confirmationOmission(
                            this.props.message.ID
                        );
                    }}
                />
            </div>
        );
    }
}
/*
class ContainerMessageAVerrouillerBrut extends React.Component<ProprietesMessageAVerrouiller, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className}>
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />

                <MessageFixe style={{ color: (this.props.message.ID.val.includes('ERR')) ? TEXTE_ERREUR : TEXTE }}>
                    {"message numéro " + n + " : "
                        + mot(this.props.message.trame).representation()
                        + " ?"}
                </MessageFixe>

                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Interpréter"}
                    onClick={() => {

                    }}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Transmettre"}
                    onClick={() => {

                    }}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Déverrouiller"}
                    onClick={() => {

                    }}
                />

            </div>
        );
    }
}
*/
class ContainerMessageVerrouilleBrut extends React.Component<ProprietesMessageVerrouille, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        return (
            <div className={this.props.className} style={{ background: FOND_SELECTION }} >
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />
                <MessageFixe style={{ color: (this.props.message.ID.val.includes('ERR')) ? TEXTE_ERREUR : TEXTE }}>
                    {"message numéro " + n + " : "
                        + mot(this.props.message.trame).representation()}
                </MessageFixe>
                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Interpréter"}
                    onClick={() => {
                        this.props.interpretation(this.props.message);
                    }}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Transmettre"}
                    onClick={() => {
                        let d = dateMaintenant();
                        this.props.transmissionMessage(this.props.message,
                            this.props.domaineSelectionne,
                            d
                        );
                    }}
                />
                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Déverrouiller"}
                    onClick={() => {
                        this.props.demandeDeverrouillage(
                            this.props.message
                        );
                    }}
                />


            </div>
        );
    }
}

class ContainerAvisVerrouillageBrut
    extends React.Component<ProprietesAvisVerrouillage, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        let u = mot(this.props.message.utilisateur.pseudo).representation();
        let dom
            = mot(this.props.message.domaineUtilisateur.domaine.nom).representation();
        return (
            <div className={this.props.className}>
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />
                <MessageFixe style={{ color: TEXTE }}>
                    {"message numéro " + n + " : "
                        + mot(this.props.message.trame).representation()}
                </MessageFixe>
                <Avis fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    avis={"Verrouillé par l'utilisateur " + u + "@" + dom + "."}
                />
            </div>
        );
    }
}

class ContainerAvisGainPerteBrut
    extends React.Component<ProprietesAvisGainPerte, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        let u = mot(this.props.message.utilisateur.pseudo).representation();
        let dom
            = mot(this.props.message.domaineUtilisateur.domaine.nom).representation();
        return (
            <div className={this.props.className}>
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />
                <MessageFixe style={{ color: TEXTE }}>
                    {"message numéro " + n + " : "
                        + mot(this.props.message.trame).representation() + "\n"
                        + "interprétation : "
                        + mot(this.props.message.interpretation).representation()}
                </MessageFixe>
                <Avis fond={this.props.fond}
                    encre={TEXTE}
                    avis={this.props.qualificatif + " par l'utilisateur " + u + "@" + dom + "."}
                />
            </div>
        );
    }
}

class ContainerAvisTransmissionBrut
    extends React.Component<ProprietesAvisTransmission, {}> {
    render() {
        let id = this.props.message.ID.val;
        let n = id.split("MSG-")[1];
        let u = mot(this.props.message.utilisateur.pseudo).representation();
        let dom
            = mot(this.props.message.domaineUtilisateur.domaine.nom).representation();
        return (
            <div className={this.props.className}>
                <Interlocuteur fond={this.props.message.domaineEmission.fond}
                    encre={this.props.message.domaineEmission.encre}
                    nom={mot(this.props.message.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />
                <MessageFixe style={{ color: TEXTE }}>
                    {"message numéro " + n + " : "
                        + mot(this.props.message.trame).representation()}
                </MessageFixe>
                <Avis fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    avis={"Transmis par l'utilisateur " + u + "@" + dom
                        + " à " + mot(this.props.message.domaineDestination.domaine.nom).representation()
                        + "."}
                />

                <Action fond={this.props.message.domaineDestination.fond}
                    encre={this.props.message.domaineDestination.encre}
                    nom={"Omettre"}
                    onClick={() => {
                        this.props.omission(
                            messageInformantAvecNouveauType(this.props.message, 'omission'));
                    }}
                />
            </div>
        );
    }
}


/*export const ContainerMessageRecu = styled(ContainerMessageBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: -1ex 1ex 3ex -1ex ${(props) => props.message.domaineEmission.fond};
    border-radius: 1ex;
    margin: 1ex 1em 1ex 1ex;
    align-self: flex-end;
    // Contrainte : marge plus grande que la largeur des ascenseurs.
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;*/

export const ContainerARMessageInitial = styled(ContainerARMessageInitialBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-start;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;

export const ContainerMessageTransit = styled(ContainerMessageTransitBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;

export const ContainerMessageAOmettre = styled(ContainerMessageAOmettreBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;

/*export const ContainerMessageAVerrouiller = styled(ContainerMessageAVerrouillerBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    // Contrainte : marge plus grande que la largeur des ascenseurs.
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;
*/
export const ContainerMessageVerrouille = styled(ContainerMessageVerrouilleBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;

export const ContainerAvisVerrouillage = styled(ContainerAvisVerrouillageBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;

export const ContainerAvisGainPerte = styled(ContainerAvisGainPerteBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;


export const ContainerAvisTransmission = styled(ContainerAvisTransmissionBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-end;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
`;

interface ProprietesEntreeMessage {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    domaineSelectionne: DomaineInterface;
    formulaire: FormulaireMessage;
    envoiMessage: (m: FormulaireMessage, dom: DomaineInterface, d: DateFr) => void;
}

interface EtatEntreeMessage {
    texte: string
}

interface ProprietesEntreeEssai {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    formulaire: FormulaireEssai;
    envoiEssai: (m: MessageInformant) => void;
    annulation: (m: FormulaireEssai) => void;
}

interface EtatEntreeEssai {
    texte: string
}

const styleTexteBrut = {
    alignSelf: "flex-end",
    flex: "auto",
    resize: "vertical",
    overflow: "auto",
    margin: "1ex",
    background: FOND_TEXTE_INV,
    color: TEXTE_INV,
    fontSize: "medium"
};

interface ProprietesEnvoi {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    nom: string;
    onClick: () => void;
}

class EnvoiBrut extends React.Component<ProprietesEnvoi> {
    render() {
        return (
            <button className={this.props.className}
                onClick={this.props.onClick} >
                {"A : " + this.props.nom}
            </button>
        );
    }
}

const Envoi = styled(EnvoiBrut)`
        flex: none;
        background-color: ${(props: ProprietesInterlocuteur) => props.fond};
        color : ${(props: ProprietesInterlocuteur) => props.encre};
        text-align: center;
        padding: 1ex;
        height: 4ex;
        width: 18ex;
        margin: 1ex;
        border-radius: 1ex;
    `;

function productionEntree(tailleTrame: number, entree: string, prefixe: string): {
    motBin: ReadonlyArray<Deux>;
    texte: string;
} {
    let lignes = entree.split("\n");
    let res1 = "";
    let res2 = "";
    if (lignes.length === 1) {
        res2 = lignes[0];
    } else {
        res2 = lignes[2];
    }
    let motBin = [];
    for (let x of res2) {
        if (x === "0") {
            motBin.push(0);
        }
        if (x === "1") {
            motBin.push(1);
        }
    }
    let r = tailleTrame - motBin.length;
    let commentaire = "";
    if (r < -1) {
        commentaire = " - Trame trop remplie ; "
            + (-r) + " chiffres en trop.";
        // motBin = motBin.slice(0, t);
    }
    if (r === -1) {
        commentaire = " - Trame trop remplie ; "
            + " 1 chiffre en trop.";
        // motBin = motBin.slice(0, t);
    }
    if (r === 0) {
        commentaire = " - Trame complète.";
    }
    if (r === 1) {
        commentaire = " - Trame à compléter par " +
            " 1 chiffre.";
    }
    if (r > 1) {
        commentaire = " - Trame à compléter par " +
            + r + " chiffres.";
    }
    res1 = mot(motBin).representation() + commentaire;
    let res = prefixe + res1 + "\n" + res2;
    return {
        motBin: motBin,
        texte: res
    };
}

class EntreeMessageBrut extends React.Component<ProprietesEntreeMessage, EtatEntreeMessage> {

    private motBinaire: ReadonlyArray<Deux>;
    constructor(props: ProprietesEntreeMessage) {
        super(props);
        this.state = { texte: '' };
        this.mettreAJourEntree = this.mettreAJourEntree.bind(this);
        this.motBinaire = [0];
    }

    mettreAJourEntree(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        let t = this.props.formulaire.consigne.tailleTrame;
        let msg = event.target.value;
        let prod = productionEntree(t, msg, "Envoi du message suivant la consigne : " + "\n");
        this.motBinaire = prod.motBin;
        this.setState({ texte: prod.texte });
    }

    reinitialiserEntree(): void {
        this.setState({ texte: "" });
        this.motBinaire = [0];
    }
    testerTrame(): boolean {
        return (this.motBinaire.length === this.props.formulaire.consigne.tailleTrame);
    }
    render() {
        let instructions = "Envoi du message suivant la consigne." + "\n"
            + "Entrez un message de "
            + this.props.formulaire.consigne.tailleTrame + " chiffres binaires (0 ou 1), "
            + "La trame apparaît progressivement sur la première ligne, "
            + "sous la forme '[?,?,...]', au dessus du texte entré, "
            + "après effacement de tout caractère autre que '0' ou '1'."
            + "Choisissez ensuite le domaine destinaire, "
            + "puis cliquez sur le bouton à droite indiquant "
            + "ce domaine destinataire pour envoyer le message.";
        return (
            <div className={this.props.className}>

                <Interlocuteur fond={this.props.formulaire.domaineEmission.fond}
                    encre={this.props.formulaire.domaineEmission.encre}
                    nom={mot(this.props.formulaire.emetteur.pseudo).representation()
                        + "@"
                        + mot(this.props.formulaire.domaineEmission.domaine.nom).representation()}
                    role={Role.Emetteur} />

                <TextareaAutosize
                    value={this.state.texte}
                    placeholder={instructions}
                    rows={2} cols={72}
                    style={styleTexteBrut as React.CSSProperties}
                    onChange={this.mettreAJourEntree}>
                </TextareaAutosize>

                <Envoi fond={this.props.domaineSelectionne.fond}
                    encre={this.props.domaineSelectionne.encre}
                    nom={mot(this.props.domaineSelectionne.domaine.nom).representation()}
                    role={Role.Recepteur}
                    onClick={() => {
                        if (this.testerTrame()) {
                            let d = dateMaintenant();
                            this.props.envoiMessage(
                                formulaireMessage(
                                    this.props.formulaire.emetteur,
                                    this.props.formulaire.domaineEmission,
                                    this.motBinaire,
                                    this.props.formulaire.consigne),
                                this.props.domaineSelectionne, d);
                            this.reinitialiserEntree();
                        }
                    }}
                />
            </div>
        );
    }
}

export const EntreeMessage = styled(EntreeMessageBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-start;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
    max-width: calc(50vw);
`;

class EntreeEssaiBrut extends React.Component<ProprietesEntreeEssai, EtatEntreeEssai> {

    private motBinaire: ReadonlyArray<Deux>;
    private messageOriginal: string;
    constructor(props: ProprietesEntreeEssai) {
        super(props);
        this.state = { texte: '' };
        this.mettreAJourEntree = this.mettreAJourEntree.bind(this);
        this.motBinaire = [0];
        this.messageOriginal = "Mot original d'identifiant "
            + this.props.formulaire.ID.val.split("MSG-")[1] + " : "
            + mot(this.props.formulaire.trame).representation()
            + "."
            + "\n";
    }

    mettreAJourEntree(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        let t = this.props.formulaire.consigne.mot.length;
        let msg = event.target.value;
        let prod = productionEntree(t, msg, this.messageOriginal);
        this.motBinaire = prod.motBin;
        this.setState({ texte: prod.texte });
    }

    reinitialiserEntree(): void {
        this.setState({ texte: "" });
        this.motBinaire = [0];
    }
    testerEssai(): boolean {
        return (this.motBinaire.length === this.props.formulaire.consigne.mot.length);
    }
    render() {
        let instructions = this.messageOriginal
            + "Entrez votre interprétation du message original. "
            + "L'interprétation de "
            + this.props.formulaire.consigne.mot.length + " chiffres binaires (0 ou 1) "
            + "apparaît progressivement sur la seconde ligne, "
            + "sous la forme '[?,?,...]', au dessus du texte entré, "
            + "après effacement de tout caractère autre que '0' ou '1'. "
            + "Cliquez sur le bouton à droite indiquant "
            + "le serveur comme destinataire pour envoyer le message.";
        return (
            <div className={this.props.className}>

                <Interlocuteur fond={this.props.formulaire.domaineEmetteur.fond}
                    encre={this.props.formulaire.domaineEmetteur.encre}
                    nom={mot(this.props.formulaire.essayeur.pseudo).representation()
                        + "@"
                        + mot(this.props.formulaire.domaineEssayeur.domaine.nom).representation()}
                    role={Role.Emetteur} />

                <TextareaAutosize
                    value={this.state.texte}
                    placeholder={instructions}
                    rows={2} cols={72}
                    style={styleTexteBrut as React.CSSProperties}
                    onChange={this.mettreAJourEntree}>
                </TextareaAutosize>

                <Envoi fond={COUPLE_FOND_ENCRE_TOUS.fond}
                    encre={COUPLE_FOND_ENCRE_TOUS.encre}
                    nom={"serveur"}
                    role={Role.Recepteur}
                    onClick={() => {
                        if (this.testerEssai()) {
                            let d = dateMaintenant();
                            this.props.envoiEssai(
                                messageInformantAvecInterpretation(
                                    this.props.formulaire.ID,
                                    this.props.formulaire.essayeur,
                                    this.props.formulaire.domaineEssayeur,
                                    this.props.formulaire.domaineEssayeur,
                                    this.props.formulaire.domaineEssayeur,
                                    this.props.formulaire.trame,
                                    this.motBinaire,
                                    d.val(), "essai"));
                            this.reinitialiserEntree();
                        }
                    }}
                />



                <Action fond={COUPLE_FOND_ENCRE_TOUS.fond}
                    encre={COUPLE_FOND_ENCRE_TOUS.encre}
                    nom={"Annuler"}
                    onClick={() => {
                        this.props.annulation(
                            this.props.formulaire);
                    }}
                />
            </div>
        );
    }
}

export const EntreeEssai = styled(EntreeEssaiBrut)`
    flex: initial;
    background: ${FOND_TEXTE};
    box-shadow: 1ex 1ex 3ex -1ex ${COUPLE_FOND_ENCRE_SUJET.fond};
    border-radius: 1ex;
    margin: 1ex 1ex 1ex 1em;
    align-self: flex-start;
    /* Contrainte : marge plus grande que la largeur des ascenseurs. */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 80ex;
    max-width: calc(50vw);
`;