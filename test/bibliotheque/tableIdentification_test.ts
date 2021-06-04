import { TableIdentificationMutable, creerTableIdentificationMutableVide } from "../../bibliotheque/types/tableIdentification";
import { testUnitaireJsonJson } from '../utilitaires';
import { creerTypeNonSerialisable, TypeNonSerialisable, TypeSerialisable } from './exemplesTypes';


describe('TableIdentificationMutable - type sérialisable', () => {
    let table: TableIdentificationMutable<'test', TypeSerialisable>
        = creerTableIdentificationMutableVide('test');
    table.ajouter({ val: "id1", sorte: 'test' }, { a: "coco1" });
    table.ajouter({ val: "id2", sorte: 'test' }, { a: "coco2" });
    testUnitaireJsonJson("taille +2", 2, table.taille());
    testUnitaireJsonJson(
        "valeur +2",
        { a: "coco1" }, 
        table.valeur({ val: "id1", sorte: 'test' }));
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        table.estVide()
    );
    table.retirer({ val: "id1", sorte: 'test' });
    testUnitaireJsonJson("taille +2-1", 1, table.taille());
    testUnitaireJsonJson(
        "valeur +2-1",
        { a: "coco2" }, 
        table.valeur({ val: "id2", sorte: 'test' }));
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        table.estVide()
    );
    table.retirer({ val: "id2", sorte: 'test' });
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        table.estVide()
    );
});

describe('TableIdentificationMutable - type non sérialisable', () => {
    let table: TableIdentificationMutable<'test', TypeNonSerialisable>
        = creerTableIdentificationMutableVide('test');
    table.ajouter(
        { val: "id1", sorte: 'test' }, 
        creerTypeNonSerialisable("coco1"));
    table.ajouter(
        { val: "id2", sorte: 'test' }, 
        creerTypeNonSerialisable("coco2"));
    testUnitaireJsonJson("taille +2", 2, table.taille());
    testUnitaireJsonJson(
        "valeur +2",
        { a: "coco1" }, 
        table.valeur({ val: "id1", sorte: 'test' }));
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        table.estVide()
    );
    testUnitaireJsonJson(
        "domaine +2",
        { taille : 2, tableau : [{val: "id1", sorte: "test"},{val: "id2", sorte: "test"}]},
        table.domaine()
    );
    table.retirer({ val: "id1", sorte: 'test' });
    testUnitaireJsonJson("taille +2-1", 1, table.taille());
    testUnitaireJsonJson(
        "valeur +2-1",
        { a: "coco2" }, 
        table.valeur({ val: "id2", sorte: 'test' }));
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        table.estVide()
    );
    testUnitaireJsonJson(
        "domaine +2-1",
        { taille : 1, tableau : [{"val":"id2","sorte":"test"}]},
        table.domaine()
    );
    table.retirer({ val: "id2", sorte: 'test' });
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        table.estVide()
    );
});



/*
    console.log("dom : " + table.domaine().map((v, i, t) => v.val).toString());
    console.log("image : " + table.image().map((v, i, t) => JSON.stringify(v)).toString());
    console.log("net : " + table.net('taille'));
    console.log("net : " + table.net('image'));
    console.log("net : " + table.net('domaine'));
    console.log("net : " + table.net('graphe'));
    console.log("sélect : " + JSON.stringify(table.selectionCle()));
    */
    /*
    console.log("image : " + table.image().map((v, i, t) => JSON.stringify(v)).toString());
    console.log("sélect : " + JSON.stringify(table.selectionCle()));
    */
