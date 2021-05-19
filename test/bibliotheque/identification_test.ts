import * as chai from 'chai';
import * as mocha from 'mocha';

import { GenerateurIdentifiants, FormatIdentifiableMutable, creerGenerateurIdentifiantParCompteur } from "../../bibliotheque/types/identifiant";
import { Unite } from "../../bibliotheque/types/typesAtomiques";
import { testUnitaire } from '../utilitaires';

describe("GenerateurIdentifiants de type 'test'", () => {
    let identification: GenerateurIdentifiants<'test'>
        = creerGenerateurIdentifiantParCompteur("pref-");
    let id: FormatIdentifiableMutable<'test'> = {
        ID: identification.produire('test') };
    testUnitaire(
        "valeur",
        { val: "pref-0", sorte: 'test' },
        id.ID);
    id = {
        ID: identification.produire('test') };
    testUnitaire(
        "valeur",
        { val: "pref-1", sorte: 'test' },
        id.ID
    );
    
});

