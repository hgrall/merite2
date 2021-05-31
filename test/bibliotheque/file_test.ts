import { fileAPriorite, FileMutableAPriorite } from "../../bibliotheque/types/fileAPriorite";
import { liste } from "../../bibliotheque/types/liste";
import { testUnitaireJsonJson } from '../utilitaires';

describe('file à priorité', () => {
    let file: FileMutableAPriorite<number>
        = fileAPriorite(
            liste([5, 1], [3, 3], [4, 2], [1, 5], [2, 4]));
    testUnitaireJsonJson(
        "taille +5",
        5,
        file.taille()
    );
    testUnitaireJsonJson(
        "vacuité +5",
        false,
        file.estVide()
    );
    testUnitaireJsonJson(
        "json +5",
        {
            taille: 5,
            tableau: [[5, 1], [4,2], [3, 3], [2, 4], [1, 5]]
        },
        file.toJSON()
    );
    let e = file.retirer();
    testUnitaireJsonJson(
        "taille +5-1",
        4,
        file.taille()
    );
    testUnitaireJsonJson(
        "élément retiré +5-1",
        5,
        e
    );
    testUnitaireJsonJson(
        "json +5-1",
        {
            taille: 4,
            tableau: [[4,2], [3, 3], [2, 4], [1, 5]]
        },
        file.toJSON()
    );
    file.ajouter(0, 6);
    testUnitaireJsonJson(
        "taille +5-1",
        5,
        file.taille()
    );
    testUnitaireJsonJson(
        "json +5-1+1",
        {
            taille: 5,
            tableau: [[4,2], [3, 3], [2, 4], [1, 5], [0, 6]]
        },
        file.toJSON()
    );
});
