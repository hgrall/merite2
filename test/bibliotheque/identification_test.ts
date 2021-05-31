import { GenerateurIdentifiants, FormatIdentifiableMutable, creerGenerateurIdentifiantParCompteur } from "../../bibliotheque/types/identifiant";
import { testUnitaireJsonJson } from '../utilitaires';

describe("GenerateurIdentifiants de type 'test'", () => {
    let identification: GenerateurIdentifiants<'test'>
        = creerGenerateurIdentifiantParCompteur("pref-");
    let id: FormatIdentifiableMutable<'test'> = {
        ID: identification.produire('test') };
    testUnitaireJsonJson(
        "valeur",
        { val: "pref-0", sorte: 'test' },
        id.ID);
    id = {
        ID: identification.produire('test') };
    testUnitaireJsonJson(
        "valeur",
        { val: "pref-1", sorte: 'test' },
        id.ID
    );
    
});

