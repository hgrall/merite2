import { mot, binaire, premiersBinaires, Mot, egaliteMots } from "../../bibliotheque/types/binaire";
import { Deux } from "../../bibliotheque/types/typesAtomiques";
import { testUnitaireJsonJson, testUnitaireStringString } from '../utilitaires';

describe('nombres binaires', () => {

    testUnitaireJsonJson(
        "binaire 0",
        mot([Deux.ZERO]),
        binaire(0)
    );
    testUnitaireJsonJson(
        "binaire 1",
        mot([Deux.UN]),
        binaire(1)
    );
    testUnitaireJsonJson(
        "binaire 2",
        mot([Deux.UN, Deux.ZERO]),
        binaire(2)
    );
    testUnitaireJsonJson(
        "binaire 3",
        mot([Deux.UN, Deux.UN]),
        binaire(3)
    );

    testUnitaireJsonJson(
        "bit 1 de 3",
        Deux.UN,
        binaire(3).bit(1)
    );

    testUnitaireJsonJson(
        "premiers binaires",
        [[Deux.ZERO], [Deux.UN], [Deux.UN, Deux.ZERO]],
        premiersBinaires(3).map((m) => m.tableauBinaire())
    )
    testUnitaireStringString(
        'fonction base2',
        "UN.UN.UN",
        binaire(7).base2Litteral()
    );

    testUnitaireJsonJson(
        'fonction base10',
        7,
        binaire(7).base10()
    );
    testUnitaireJsonJson(
        'égalité ',
        true,
        egaliteMots(mot([0, 0, 0]), mot([0, 0, 0]))
    );
    testUnitaireJsonJson(
        'inégalité ',
        false,
        egaliteMots(mot([0, 0, 1]), mot([0, 0, 0]))
    );
    testUnitaireJsonJson(
        'inégalité ',
        false,
        egaliteMots(mot([0, 0, 0, 0]), mot([0, 0, 0]))
    );

});