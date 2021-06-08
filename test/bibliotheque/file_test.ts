import { creerFileMutableVideIdentifiantsPrioritaires, FileMutableIdentifiantsPrioritaires } from "../../bibliotheque/types/fileIdentifiantsPrioritaires";
import { identifiant } from "../../bibliotheque/types/identifiant";
import { testUnitaireJsonJson } from '../utilitaires';

describe("FileMutableIdentifiantsPrioritaires", () => {
    let file: FileMutableIdentifiantsPrioritaires<'test'>
        = creerFileMutableVideIdentifiantsPrioritaires('test');
    file.ajouter(identifiant('test', "A1"), 1);
    file.ajouter(identifiant('test', "A2a"), 2);
    file.ajouter(identifiant('test', "A2b"), 2);
    file.ajouter(identifiant('test', "A3"), 3);
    file.ajouter(identifiant('test', "A4"), 4);

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
        "priorité max +5",
        1,
        file.etat().prioriteMaximale
    );

    let id = file.retirer();

    testUnitaireJsonJson(
        "taille +5-1",
        4,
        file.taille()
    );
    testUnitaireJsonJson(
        "vacuité +5-1",
        false,
        file.estVide()
    );
    testUnitaireJsonJson(
        "priorité max +5-1",
        2,
        file.etat().prioriteMaximale
    );
    testUnitaireJsonJson(
        "élément retiré +5-1",
        identifiant('test', "A1"),
        id
    );

    file.ajouter(identifiant('test', "B1"), 1);

    testUnitaireJsonJson(
        "taille +5-1+1",
        5,
        file.taille()
    );
    testUnitaireJsonJson(
        "vacuité +5-1+1",
        false,
        file.estVide()
    );
    testUnitaireJsonJson(
        "priorité max +5-1+1",
        1,
        file.etat().prioriteMaximale
    );

    id = file.retirer();
    id = file.retirer();

    testUnitaireJsonJson(
        "taille +5-1+1-2",
        3,
        file.taille()
    );
    testUnitaireJsonJson(
        "vacuité +5-1+1-2",
        false,
        file.estVide()
    );
    testUnitaireJsonJson(
        "priorité max +5-1+1-2",
        2,
        file.etat().prioriteMaximale
    );
    testUnitaireJsonJson(
        "élément retiré +5-1+1-2",
        identifiant('test', "A2a"),
        id
    );
    id = file.retirer();
    testUnitaireJsonJson(
        "priorité max +5-1+1-2-1",
        3,
        file.etat().prioriteMaximale
    );
    file.modifier(identifiant('test', "A3"), 3, 5);
    testUnitaireJsonJson(
        "priorité max +5-1+1-2",
        4,
        file.etat().prioriteMaximale
    );
    id = file.retirer();
    id = file.retirer();

    testUnitaireJsonJson(
        "taille +5-1+1-2-3",
        0,
        file.taille()
    );
    testUnitaireJsonJson(
        "vacuité +5-1+1-2-3",
        true,
        file.estVide()
    );
    testUnitaireJsonJson(
        "élément retiré +5-1+1-2-3",
        identifiant('test', "A3"),
        id
    );

    file.ajouter(identifiant('test', "C1"), 7);

    testUnitaireJsonJson(
        "taille +5-1+1-2-3+1",
        1,
        file.taille()
    );
    testUnitaireJsonJson(
        "vacuité +5-1+1-2-3+1",
        false,
        file.estVide()
    );
    testUnitaireJsonJson(
        "priorité max +5-1+1-2-3+1",
        7,
        file.etat().prioriteMaximale
    );

});
