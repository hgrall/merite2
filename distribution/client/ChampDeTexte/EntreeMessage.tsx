import {Deux} from "../../../bibliotheque/types/typesAtomiques";
import {mot} from "../../../bibliotheque/types/binaire";
import * as React from "react";
import {DateFr, dateMaintenant} from "../../../bibliotheque/types/date";
import {DomaineInterface, FormulaireMessage, formulaireMessage} from "../Helpers/typesInterface";
import styled from "styled-components";
import {productionEntree} from "../Helpers/ProductionEntree";
import {FormControl, InputGroup} from "react-bootstrap";
import {creerGenerateurIdentifiantParCompteur, GenerateurIdentifiants} from "../../../bibliotheque/types/identifiant";
import { EntreeMessageContainer } from "../../../shared/MessagesContainer";
import {Role} from "../../../shared/InterlocuteurMessage";
import {ButtonEnvoi} from "../../../shared/ButtonEnvoi";



interface ProprietesEntreeMessage {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    domaineSelectionne: DomaineInterface;
    formulaire: FormulaireMessage;
    envoiMessage: (m: FormulaireMessage, d: DateFr) => void;
}

interface EtatEntreeMessage {
    texte: string
}

export class EntreeMessage extends React.Component<ProprietesEntreeMessage, EtatEntreeMessage> {

    private motBinaire: ReadonlyArray<Deux>;
    private generateur: GenerateurIdentifiants<'message'>;
    constructor(props: ProprietesEntreeMessage) {
        super(props);
        this.generateur = creerGenerateurIdentifiantParCompteur("MSG-");
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
            <EntreeMessageContainer>
                <StyledInputGroup>
                <InputGroup.Prepend>
                    <InputGroup.Text>De : {mot(this.props.formulaire.emetteur.utilisateur).representation()
                    + "@"
                    + mot(this.props.formulaire.domaineEmission.domaine.domaine).representation()}</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                    onChange={this.mettreAJourEntree}
                    as="textarea"
                    value={this.state.texte}
                    placeholder="Entrez le texte de votre message puis appuyez sur le bouton à droite indiquant le destinataire pour l'envoyer."
                />
                <InputGroup.Append>
                    <ButtonEnvoi fond={this.props.domaineSelectionne.fond}
                                 encre={this.props.domaineSelectionne.encre}
                                 nom={mot(this.props.domaineSelectionne.domaine.domaine).representation()}
                                 role={Role.Recepteur}
                                 onClick={() => {
                                     if (this.testerTrame()) {
                                         let d = dateMaintenant();
                                         this.props.envoiMessage(
                                             formulaireMessage(
                                                 this.props.formulaire.emetteur,
                                                 this.props.formulaire.domaineEmission,
                                                 this.props.domaineSelectionne,
                                                 this.motBinaire,
                                                 this.props.formulaire.consigne),
                                             d);
                                         this.reinitialiserEntree();
                                     }
                                 }}
                                 inactif = { false }
                    />
                </InputGroup.Append>
            </StyledInputGroup>
            </EntreeMessageContainer>
        );
    }
}

const StyledInputGroup = styled(InputGroup)`
  min-width: 80%;
  height: 200px;
`