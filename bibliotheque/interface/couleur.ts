export type Couleur =
    "rgb(153,180, 153)" | "rgb(209,138, 138)"
    | "rgb(255, 255, 255)" | "rgb(0,0,0)" | "rgb(191, 48, 48)"
    | "rgb(239, 216, 7)" | "rgb(108, 2, 119)" | "rgb(0, 128, 128)"
    | "rgb(0, 255, 127)" | "rgb(127, 127, 127)" | "rgb(48, 48, 48)"
    | "rgb(19, 14, 10)" | "rgb(250, 240, 230)" | "rgb(119, 181, 254)"
    | "rgb(66, 91, 138)" | "rgb(254, 27, 0)" | "rgb(187, 210, 225)"
    | "rgb(175, 175, 175)" | "rgb(255, 0, 0)" | "rgb(0, 255, 0)"
    | "rgb(201, 160, 220)";

const BLEU_TURQUIN: Couleur = "rgb(66, 91, 138)";


const BLANC: Couleur = "rgb(255, 255, 255)";

const NOIR: Couleur = "rgb(0,0,0)";
const NOIR_CARBONE: Couleur = "rgb(19, 14, 10)";

const ANTHRACITE: Couleur = "rgb(48, 48, 48)";

export const FRAISE: Couleur = "rgb(191, 48, 48)";

const JAUNE_OR: Couleur = "rgb(239, 216, 7)";

const ZINZOLIN: Couleur = "rgb(108, 2, 119)";

const BLEU_CANARD: Couleur = "rgb(0, 128, 128)";

const BLEU_CIEL: Couleur = "rgb(119, 181, 254)";

const VERT_PRINTEMPS: Couleur = "rgb(0, 255, 127)";

const GRIS_FER: Couleur = "rgb(127, 127, 127)";

const GRIS_ACIER: Couleur = "rgb(175, 175, 175)";

const LIN: Couleur = "rgb(250, 240, 230)";

const ROUGE_FEU: Couleur = "rgb(254, 27, 0)";

const FUMEE: Couleur = "rgb(187, 210, 225)";

const ROUGE: Couleur = "rgb(255, 0, 0)";

const VERT: Couleur = "rgb(0, 255, 0)"

const GLYCINE: Couleur = "rgb(201, 160, 220)";

export const FOND: Couleur = LIN;
export const FOND_CACHE = GRIS_ACIER;

export const CADRE: Couleur = BLEU_CIEL;
export const SELECTION: Couleur = BLEU_TURQUIN;
export const SEPARATION_CADRE: Couleur = BLANC;

export const TEXTE: Couleur = NOIR;
export const TEXTE_PALE: Couleur = ANTHRACITE;
export const TEXTE_INV: Couleur = BLANC;
export const TEXTE_ERREUR: Couleur = ROUGE_FEU;
export const FOND_TEXTE: Couleur = BLANC;
export const FOND_TEXTE_INV: Couleur = NOIR_CARBONE;

export const FOND_GAIN: Couleur = VERT;
export const FOND_PERTE: Couleur = ROUGE;

export const FOND_SELECTION: Couleur = GLYCINE;

export class SuiteCouplesFondEncre {
    private fonds: Couleur[];
    private encres: Couleur[];
    private pos: number;

    constructor() {
        this.fonds = [JAUNE_OR, BLEU_CANARD, ZINZOLIN, VERT_PRINTEMPS]; /* TODO etendre ! */
        this.encres = [NOIR, BLANC, BLANC, NOIR]; /* TODO etendre ! */
        this.pos = 0;
    }

    courant(): { fond: Couleur, encre: Couleur } {
        let r: { fond: Couleur, encre: Couleur } = { fond: this.fonds[this.pos], encre: this.encres[this.pos] };
        this.pos = (this.pos + 1) % (this.encres.length);
        return r;
    }
}

export const COUPLE_FOND_ENCRE_TOUS: { fond: Couleur, encre: Couleur } = {
    fond: GRIS_FER,
    encre: BLANC
}

export const COUPLE_FOND_ENCRE_SUJET: { fond: Couleur, encre: Couleur } = {
    fond: FRAISE,
    encre: BLANC
}

export const COUPLE_FOND_ENCRE_INCONNU: { fond: Couleur, encre: Couleur } = {
    fond: FUMEE,
    encre: NOIR
}