import { TableMutable, creerTableMutableVide } from "../../bibliotheque/types/table";
import { testUnitaireJsonJson } from '../utilitaires';
import { creerTypeNonSerialisable, TypeNonSerialisable, TypeSerialisable } from './exemplesTypes';

describe('TableMutable avec type sérialisable', () => {
    let table: TableMutable<TypeSerialisable> 
        = creerTableMutableVide();
    table.ajouter("a1", { a: "coco1" });
    table.ajouter("a2", { a: "coco2" });
    testUnitaireJsonJson(
        "taille +2",
        2,
        table.taille()
    );
    testUnitaireJsonJson(
        "domaine +2",
        ["a1", "a2"],
        table.domaine()
    );
    testUnitaireJsonJson(
        "état +2",
        {
            table : {a1 : {a : "coco1"}, a2 : {a : "coco2"}},
            taille : 2
        },
        table.etat()
    );
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        table.estVide()
    );
    testUnitaireJsonJson(
        "image +2",
        [{a : "coco1"}, {a : "coco2"}],
        table.image()
    );
    table.retirer("a1");
    testUnitaireJsonJson(
        "taille +2-1",
        1,
        table.taille()
    );
    testUnitaireJsonJson(
        "domaine +2-1",
        ["a2"],
        table.domaine()
    );
    testUnitaireJsonJson(
        "état +2-1",
        {
            table : {a2 : {a : "coco2"}},
            taille : 1
        },
        table.etat()
    );
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        table.estVide()
    );
    testUnitaireJsonJson(
        "image +2-1",
        [{a : "coco2"}],
        table.image()
    );
    table.retirer("a2");
    testUnitaireJsonJson(
        "taille +2-1-1",
        0,
        table.taille()
    );
    testUnitaireJsonJson(
        "domaine +2-1-1",
        [],
        table.domaine()
    );
    testUnitaireJsonJson(
        "état +2-1-1",
        {
            table : {},
            taille : 0
        },
        table.etat()
    );
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        table.estVide()
    );
    testUnitaireJsonJson(
        "image +2-1-1",
        [],
        table.image()
    );

});

describe('TableMutable avec type non sérialisable', () => {
    let table: TableMutable<TypeNonSerialisable> 
    = creerTableMutableVide();
    table.ajouter("a1", creerTypeNonSerialisable("coco1"));
    table.ajouter("a2", creerTypeNonSerialisable("coco2"));

    testUnitaireJsonJson(
        "taille +2",
        2,
        table.taille()
    );
    testUnitaireJsonJson(
        "domaine +2",
        ["a1", "a2"],
        table.domaine()
    );
    testUnitaireJsonJson(
        "état +2",
        {
            table : {a1 : {a : "coco1"}, a2 : {a : "coco2"}},
            taille : 2
        },
        table.etat()
    );
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        table.estVide()
    );
    testUnitaireJsonJson(
        "image +2",
        [{a : "coco1"}, {a : "coco2"}],
        table.image()
    );
    table.retirer("a1");
    testUnitaireJsonJson(
        "taille +2-1",
        1,
        table.taille()
    );
    testUnitaireJsonJson(
        "domaine +2-1",
        ["a2"],
        table.domaine()
    );
    testUnitaireJsonJson(
        "état +2-1",
        {
            table : {a2 : {a : "coco2"}},
            taille : 1
        },
        table.etat()
    );
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        table.estVide()
    );
    testUnitaireJsonJson(
        "image +2-1",
        [{a : "coco2"}],
        table.image()
    );
    table.retirer("a2");
    testUnitaireJsonJson(
        "taille +2-1-1",
        0,
        table.taille()
    );
    testUnitaireJsonJson(
        "domaine +2-1-1",
        [],
        table.domaine()
    );
    testUnitaireJsonJson(
        "état +2-1-1",
        {
            table : {},
            taille : 0
        },
        table.etat()
    );
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        table.estVide()
    );
    testUnitaireJsonJson(
        "image +2-1-1",
        [],
        table.image()
    );

});

