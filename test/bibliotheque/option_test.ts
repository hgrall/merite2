import { rienOption, option, Option  } from "../../bibliotheque/types/option";
import { testUnitaireJsonJson } from '../utilitaires';

describe('Option vide', () => {
    let r: Option<number> = rienOption();
    testUnitaireJsonJson(
        "vide",
        true,
        r.estVide()
    );
    testUnitaireJsonJson(
        "présent",
        false,
        r.estPresent()
    );
    testUnitaireJsonJson(
        "représentation",
        `option vide`,
        r.representation()
    );
});

describe('Option json vide', () => {
    let r: Option<number> = rienOption<number>();
    testUnitaireJsonJson(
        "vide",
        true,
        r.estVide()
    );
    testUnitaireJsonJson(
        "présent",
        false,
        r.estPresent()
    );
    testUnitaireJsonJson(
        "représentation",
        `option vide`,
        r.representation()
    );
});

describe('Option json pleine', () => {
    let r: Option<number> = option<number>(5);
    testUnitaireJsonJson(
        "vide",
        false,
        r.estVide()
    );
    testUnitaireJsonJson(
        "présent",
        true,
        r.estPresent()
    );
    testUnitaireJsonJson(
        "valeur",
        5,
        r.valeur()
    );
});