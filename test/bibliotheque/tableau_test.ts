import { TableauMutable, creerTableauMutableVide, tableau, Tableau } from "../../bibliotheque/types/tableau";
import { testUnitaireJsonJson } from '../utilitaires';
import { creerTypeNonSerialisable, TypeNonSerialisable, TypeSerialisable } from './exemplesTypes';

describe('TableauMutable avec type sérialisable', () => {
    let tab: TableauMutable<TypeSerialisable> 
        = creerTableauMutableVide<TypeSerialisable>();
    tab.ajouterEnFin({ a: "coco1" });
    tab.ajouterEnFin({ a: "coco2" });
    testUnitaireJsonJson(
        "taille +2",
        2,
        tab.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        tab.estVide()
    );
    testUnitaireJsonJson(
        "état +2",
        {
            taille : 2,
            tableau : [{a : "coco1"}, {a : "coco2"}]
        },
        tab.etat()
    );
    testUnitaireJsonJson(
        "json +2",
        {
            taille : 2,
            tableau : [{a : "coco1"}, {a : "coco2"}]
        },
        tab.toJSON()
    );
    tab.retirerEnFin();
    testUnitaireJsonJson(
        "taille +2-1",
        1,
        tab.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        tab.estVide()
    );
    testUnitaireJsonJson(
        "état +2-1",
        {
            taille : 1,
            tableau : [{a : "coco1"}]
        },
        tab.etat()
    );
    testUnitaireJsonJson(
        "json +2-1",
        {
            taille : 1,
            tableau : [{a : "coco1"}]
        },
        tab.toJSON()
    );
    tab.retirerEnFin();
    testUnitaireJsonJson(
        "taille +2-1-1",
        0,
        tab.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        tab.estVide()
    );
    testUnitaireJsonJson(
        "état +2-1-1",
        {
            taille : 0,
            tableau : []
        },
        tab.etat()
    );
    testUnitaireJsonJson(
        "json +2-1-1",
        {
            taille : 0,
            tableau : []
        },
        tab.toJSON()
    );

});

describe('TableauMutable avec type non sérialisable', () => {
    let tab: TableauMutable<TypeNonSerialisable> 
    = creerTableauMutableVide();
    tab.ajouterEnFin(creerTypeNonSerialisable("coco1"));
    tab.ajouterEnFin(creerTypeNonSerialisable("coco2"));
    testUnitaireJsonJson(
        "taille +2",
        2,
        tab.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        tab.estVide()
    );
    testUnitaireJsonJson(
        "état +2",
        {
            taille : 2,
            tableau : [{a : "coco1"}, {a : "coco2"}]
        },
        tab.etat()
    );
    testUnitaireJsonJson(
        "json +2",
        {
            taille : 2,
            tableau : [{a : "coco1"}, {a : "coco2"}]
        },
        tab.toJSON()
    );
    tab.retirerEnFin();
    testUnitaireJsonJson(
        "taille +2-1",
        1,
        tab.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        tab.estVide()
    );
    testUnitaireJsonJson(
        "état +2-1",
        {
            taille : 1,            
            tableau : [{a : "coco1"}]
        },
        tab.etat()
    );
    testUnitaireJsonJson(
        "json +2-1",
        {
            taille : 1,
            tableau : [{a : "coco1"}]
        },
        tab.toJSON()
    );
    tab.retirerEnFin();
    testUnitaireJsonJson(
        "taille +2-1-1",
        0,
        tab.taille()
    );
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        tab.estVide()
    );
    testUnitaireJsonJson(
        "état +2-1-1",
        {
            taille : 0,
            tableau : []
        },
        tab.etat()
    );
    testUnitaireJsonJson(
        "json +2-1-1",
        {
            taille : 0,
            tableau : []
        },
        tab.toJSON()
    );

});

describe('Tableau de Tableau', () => {
    let tab1: Tableau<number> 
    = tableau([1, 2, 3]);
    let tab2: Tableau<number> 
    = tableau([4, 5, 6, 7]);
    let tab3: Tableau<number> 
    = tableau([8, 9]);
    let tab: Tableau<Tableau<number>> =
    tableau([tab1, tab2, tab3]);
    testUnitaireJsonJson(
        "taille 3",
        3,
        tab.taille()
    );
    testUnitaireJsonJson(
        "vacuité 3",
        false,
        tab.estVide()
    );
    testUnitaireJsonJson(
        "état +2",
        {
            taille : 3,
            tableau : [
                        {taille : 3, tableau:[1, 2, 3]}, 
                        {taille : 4, tableau:[4, 5, 6, 7]},
                        {taille : 2, tableau:[8, 9]} ]
        },
        tab.toJSON()
    );
});
