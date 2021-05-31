import { Liste, liste, triCroissant } from "../../bibliotheque/types/liste";
import { testUnitaireJsonJson, testUnitaireJsonString } from '../utilitaires';
import { creerTypeNonSerialisable, TypeNonSerialisable, TypeSerialisable } from './exemplesTypes';

describe('liste avec type sérialisable', () => {
    let l: Liste<TypeSerialisable>
        = liste({ a: "coco1" }, { a: "coco2" });
    testUnitaireJsonJson(
        "taille +2",
        2,
        l.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        l.estVide()
    );
    testUnitaireJsonJson(
        "json +2",
        {
            taille: 2,
            tableau: [{ a: "coco1" }, { a: "coco2" }]
        },
        l.toJSON()
    );
    testUnitaireJsonString(
        "représentation +2",
        [{ a: "coco1" }, { a: "coco2" }],
        l.representation()
    );
    l = l.reste();
    testUnitaireJsonJson(
        "taille +2-1",
        1,
        l.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        l.estVide()
    );
    testUnitaireJsonJson(
        "json +2-1",
        {
            taille: 1,
            tableau: [{ a: "coco2" }]
        },
        l.toJSON()
    );
    testUnitaireJsonString(
        "représentation +2-1",
        [{ a: "coco2" }],
        l.representation()
    );
    l = l.reste();
    testUnitaireJsonJson(
        "taille +2-1-1",
        0,
        l.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        l.estVide()
    );
    testUnitaireJsonJson(
        "json +2-1-1",
        {
            taille: 0,
            tableau: []
        },
        l.toJSON()
    );
    testUnitaireJsonString(
        "représentation +2-1-1",
        [],
        l.representation()
    );
});

describe('liste avec type non sérialisable', () => {
    let l: Liste<TypeNonSerialisable>
        = liste(creerTypeNonSerialisable("coco1"), creerTypeNonSerialisable("coco2"));
    testUnitaireJsonJson(
        "taille +2",
        2,
        l.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        l.estVide()
    );
    testUnitaireJsonJson(
        "json +2",
        {
            taille: 2,
            tableau: [{ a: "coco1" }, { a: "coco2" }]
        },
        l.toJSON()
    );
    testUnitaireJsonString(
        "représentation +2",
        [{ a: "coco1" }, { a: "coco2" }],
        l.representation()
    );
    l = l.reste();
    testUnitaireJsonJson(
        "taille +2-1",
        1,
        l.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        l.estVide()
    );
    testUnitaireJsonJson(
        "json +2-1",
        {
            taille: 1,
            tableau: [{ a: "coco2" }]
        },
        l.toJSON()
    );
    testUnitaireJsonString(
        "représentation +2-1",
        [{ a: "coco2" }],
        l.representation()
    );
    l = l.reste();
    testUnitaireJsonJson(
        "taille +2-1-1",
        0,
        l.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        l.estVide()
    );
    testUnitaireJsonJson(
        "json +2-1-1",
        {
            taille: 0,
            tableau: []
        },
        l.toJSON()
    );
    testUnitaireJsonString(
        "représentation +2-1-1",
        [],
        l.representation()
    );
});

describe('liste triée de nombres', () => {
    let l: Liste<number>
        = liste(4, 3, 7, 9, 0, 8, 1, 5, 2, 6);
    testUnitaireJsonJson(
        "tri 10",
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        triCroissant(l, (x, y) => (x <= y)).toJSON().tableau
    );
});
