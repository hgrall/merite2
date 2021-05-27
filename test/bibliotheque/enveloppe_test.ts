import { Enveloppe } from "../../bibliotheque/types/enveloppe";
import { jamais } from "../../bibliotheque/types/typesAtomiques";
import { testUnitaire } from '../utilitaires';

import { creerTypeNonSerialisable, TypeNonSerialisable, TypeSerialisable } from "./exemplesTypes";

type Etiquette = 'rep';


class TestES extends Enveloppe<TypeSerialisable, Etiquette> {

    constructor(etat: TypeSerialisable) {
        super(etat);
    }

    net(e: Etiquette): string {
        let s = this.val();
        switch (e) {
            case 'rep': return s.a;
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('rep');
    }
}

describe("Enveloppe d'un type sérialisable", () => {
    let t = new TestES({ a: "coco" });
    testUnitaire(
        "valeur",
        { a: "coco" },
        t.val()
    );
    testUnitaire(
        "brut",
        JSON.stringify({ a: "coco" }),
        t.brut()
    );
});

class TestENS extends Enveloppe<TypeNonSerialisable, Etiquette> {

    constructor(etat: TypeNonSerialisable) {
        super(etat);
    }

    net(e: Etiquette): string {
        let s = this.val();
        switch (e) {
            case 'rep': return s.a;
        }
        return jamais(e);
    }
    representation(): string {
        return this.net('rep');
    }
}

describe("Enveloppe d'un type non sérialisable", () => {
    let t = new TestENS(creerTypeNonSerialisable("coco"));
    testUnitaire(
        "valeur",
        { a: "coco" },
        t.val()
    );
    testUnitaire(
        "brut",
        JSON.stringify({ a: "coco" }),
        t.brut()
    );
});

