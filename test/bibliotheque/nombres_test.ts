import { normalisationNombre, entierAleatoire } from "../../bibliotheque/types/nombres";
import { testUnitaireJsonJson } from '../utilitaires';

describe('nombres', () => {
    testUnitaireJsonJson(
        "normalisation",
        "000113",
        normalisationNombre(113, 6));

    let n = entierAleatoire(10);
    testUnitaireJsonJson(
        "aléatoire",
        true,
        (0 <= n) && (n <= 10) 
    );
});

