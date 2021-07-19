import {Deux} from "../../../bibliotheque/types/typesAtomiques";
import {mot} from "../../../bibliotheque/types/binaire";

export function productionEntree(tailleTrame: number, entree: string, prefixe: string): {
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