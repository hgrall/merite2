import {FormulaireEssai, MessageInformant} from "../utilitaire/typesInterface";
import React from "react";
import {Deux} from "../../../bibliotheque/types/typesAtomiques";
import {mot} from "../../../bibliotheque/types/binaire";
import {productionEntree} from "../utilitaire/productionEntree";
import {COUPLE_FOND_ENCRE_SUJET, FOND_TEXTE} from "../../../bibliotheque/interface/couleur";
import styled from "styled-components";


interface ProprietesEntreeEssai {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    key: string;
    formulaire: FormulaireEssai;
    envoiEssai: (m: MessageInformant) => void;
    //annulation: (m: FormulaireEssai) => void;
}

interface EtatEntreeEssai {
    texte: string
}

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

                {/*<InterlocuteurMessage fond={this.props.formulaire.domaineEmetteur.fond}*/}
                {/*                      encre={this.props.formulaire.domaineEmetteur.encre}*/}
                {/*                      nom={mot(this.props.formulaire.essayeur.pseudo).representation()*/}
                {/*                      + "@"*/}
                {/*                      + mot(this.props.formulaire.domaineEssayeur.domaine.nom).representation()}*/}
                {/*                      role={Role.Emetteur} />*/}

                {/*<TextareaAutosize*/}
                {/*    value={this.state.texte}*/}
                {/*    placeholder={instructions}*/}
                {/*    rows={2} cols={72}*/}
                {/*    style={StyleTexteEntreeMessage as React.CSSProperties}*/}
                {/*    onChange={this.mettreAJourEntree}>*/}
                {/*</TextareaAutosize>*/}

                {/*<ButtonEnvoi fond={COUPLE_FOND_ENCRE_TOUS.fond}*/}
                {/*       encre={COUPLE_FOND_ENCRE_TOUS.encre}*/}
                {/*       nom={"serveur"}*/}
                {/*       role={Role.Recepteur}*/}
                {/*       onClick={() => {*/}
                {/*           if (this.testerEssai()) {*/}
                {/*               let d = dateMaintenant();*/}
                {/*               this.props.envoiEssai(*/}
                {/*                   messageInformantAvecInterpretation(*/}
                {/*                       this.props.formulaire.ID,*/}
                {/*                       this.props.formulaire.essayeur,*/}
                {/*                       this.props.formulaire.domaineEssayeur,*/}
                {/*                       this.props.formulaire.domaineEssayeur,*/}
                {/*                       this.props.formulaire.domaineEssayeur,*/}
                {/*                       this.props.formulaire.trame,*/}
                {/*                       this.motBinaire,*/}
                {/*                       d.val(), "essai"));*/}
                {/*               this.reinitialiserEntree();*/}
                {/*           }*/}
                {/*       }}*/}
                {/*/>*/}
                {/*<Action fond={COUPLE_FOND_ENCRE_TOUS.fond}*/}
                {/*        encre={COUPLE_FOND_ENCRE_TOUS.encre}*/}
                {/*        nom={"Annuler"}*/}
                {/*        onClick={() => {*/}
                {/*            this.props.annulation(*/}
                {/*                this.props.formulaire);*/}
                {/*        }}*/}
                {/*/>*/}
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