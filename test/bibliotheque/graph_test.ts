import * as chai from 'chai';
import { GrapheMutableParTablesIdentification } from "../../bibliotheque/types/graphe";
import {
    creerGenerateurIdentifiantParCompteur,
    FormatIdentifiable,
    GenerateurIdentifiants, Identifiant
} from "../../bibliotheque/types/identifiant";
import {creerTableIdentificationMutableVide} from "../../bibliotheque/types/tableIdentification";
import {FormatTableau} from "../../bibliotheque/types/tableau";


interface FSIType extends FormatIdentifiable<"sommet">{
    readonly a: string;
}

interface Ctype {
    readonly c: string;
}
describe('Classe Graphe', () => {
    const generateurIdentifiants: GenerateurIdentifiants<"sommet"> = creerGenerateurIdentifiantParCompteur("test");
    const inactifs = creerTableIdentificationMutableVide<"sommet",FSIType>("sommet");
    const tableAdjacence = creerTableIdentificationMutableVide<'sommet', FormatTableau<Identifiant<'sommet'>>>("sommet");


    for (let i = 0; i < 4; i++) {
        const id = generateurIdentifiants.produire("sommet")
        inactifs.ajouter(id, {a:"test", ID: id})
    }
    let table: GrapheMutableParTablesIdentification<FSIType,Ctype >
        = new GrapheMutableParTablesIdentification(inactifs, tableAdjacence);

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

