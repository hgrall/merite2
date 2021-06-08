import { creerEnsembleMutableIdentifiantsVide, EnsembleIdentifiants, EnsembleMutableIdentifiants } from "../../bibliotheque/types/ensembleIdentifiants";
import { identifiant } from "../../bibliotheque/types/identifiant";
import { testUnitaireJsonJson } from '../utilitaires';


describe('EnsembleMutableIdentifiants', () => {
    let ens: EnsembleMutableIdentifiants<'test'>
        = creerEnsembleMutableIdentifiantsVide('test');
    ens.ajouter(identifiant("test", "a1"));
    ens.ajouter(identifiant("test", "a2"));

    testUnitaireJsonJson(
        "taille +2",
        2,
        ens.taille()
    );
    console.log("*** Ensemble : " + ens.representation());
    let opt = ens.selectionIdentifiantSuivantCritere((id) => id.val === "a2");
    console.log("option : " + opt.representation());
    testUnitaireJsonJson(
        "sélection +2",
        { val: "a2", sorte: 'test' },
        ens.selectionIdentifiantSuivantCritere((id) => id.val === "a2").valeur()
    );
    testUnitaireJsonJson(
        "vacuité +2",
        false,
        ens.estVide()
    );
    ens.retirer({ val: "a1", sorte: 'test' });
    testUnitaireJsonJson(
        "taille +2-1",
        1,
        ens.taille()
    );
    testUnitaireJsonJson(
        "valeur +2-1",
        {"sorte":"test","ensemble":["a2"]},
        ens.toJSON()
    );
    testUnitaireJsonJson(
        "vacuité +2-1",
        false,
        ens.estVide()
    );
    ens.retirer({ val: "a2", sorte: 'test' });
    testUnitaireJsonJson(
        "vacuité +2-1-1",
        true,
        ens.estVide()
    );
    for (let i = 0; i < 10; i++) {
        ens.ajouter(identifiant("test", i.toString()));
    }
    testUnitaireJsonJson(
        "taille crible mod 2 +10",
        5,
        ens.crible((id) => parseInt(id.val) % 2 === 0).taille()
    );
    ens.cribler((id) => parseInt(id.val) % 2 === 0);
    testUnitaireJsonJson(
        "taille cribler mod 2 +10",
        5,
        ens.taille()
    );
});

