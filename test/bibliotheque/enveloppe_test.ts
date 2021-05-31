import { Enveloppe } from "../../bibliotheque/types/enveloppe";
import { jamais } from "../../bibliotheque/types/typesAtomiques";
import { testUnitaireJsonJson } from '../utilitaires';

import { creerTypeNonSerialisable, TypeNonSerialisable, TypeSerialisable } from "./exemplesTypes";

type Etiquette = 'rep';


class TestES extends Enveloppe<TypeSerialisable, TypeSerialisable, Etiquette> {
    toJSON(): TypeSerialisable {
        return this.etat();
    }

    constructor(etat: TypeSerialisable) {
        super(etat);
    }

    net(e: Etiquette): string {
        let s = this.etat();
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
    testUnitaireJsonJson(
        "valeur",
        { a: "coco" },
        t.etat()
    );
    testUnitaireJsonJson(
        "brut",
        JSON.stringify({ a: "coco" }),
        t.brut()
    );
});

class TestENS extends Enveloppe<TypeNonSerialisable, TypeSerialisable, Etiquette> {
    
    constructor(etat: TypeNonSerialisable) {
        super(etat);
    }

    toJSON(): TypeSerialisable {
        return this.etat();
    }
    
    net(e: Etiquette): string {
        let s = this.etat();
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
    testUnitaireJsonJson(
        "valeur",
        { a: "coco" },
        t.etat()
    );
    testUnitaireJsonJson(
        "brut",
        JSON.stringify({ a: "coco" }),
        t.brut()
    );
});

