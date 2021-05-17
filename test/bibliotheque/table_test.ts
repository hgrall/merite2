import * as chai from 'chai';
import { TableMutable, creerTableMutableVide } from "../../bibliotheque/types/table";


interface FType {
    readonly a: number;
    readonly b: string;
}

describe('classe Table', () => {
    let table: TableMutable<FType> 
        = creerTableMutableVide();
    table.ajouter("a1", { a: 1, b: "coco1" });
    table.ajouter("a2", { a: 2, b: "coco2" });
    let oracle = 2;
    let r = table.taille();
    it('renvoie ' + r.toString(), () => {
        chai.expect(r).to.equal(oracle);
    });
    console.log("dom : " + table.domaine().toString());
    console.log("image : " + table.image().map((v, i, t) => JSON.stringify(v) ).toString());
    it('renvoie ' + table.estVide(), () => {
        chai.expect(table.estVide()).to.equal(false);
    });
    table.retirer("a1");
    console.log("image : " + table.image().map((v, i, t) => JSON.stringify(v) ).toString());
});

