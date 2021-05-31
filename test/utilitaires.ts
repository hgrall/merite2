import * as chai from 'chai';
import * as mocha from 'mocha';

let test : mocha.TestFunction = it;
/**
 * Test unitaire entre deux valeurs, l'oracle et le calcul, convertibles en JSON. La
 * comparaison se fait sur des chaînes de caractères, après appel
 * de JSON.stringify.
 * @param description nom du test (fonction, contexte)
 * @param oracle valeur attendue
 * @param calcul valeur calculée par le programme
 */
export function testUnitaireJsonJson<TO, TC>(description : string, oracle : TO, calcul : TC) : void {
    let os = JSON.stringify(oracle);
    let cs = JSON.stringify(calcul);
    console.log(description + " - calcul : " + cs);
    test(description, 
        () => { chai.expect(cs).to.equal(os);});
} 
/**
 * Test unitaire entre un oracle convertible en JSON 
 * et une valeur égale à une chaîne de caractères. La
 * comparaison se fait sur des chaînes de caractères, après appel
 * de JSON.stringify.
 * @param description nom du test (fonction, contexte)
 * @param oracle valeur attendue
 * @param calcul valeur calculée par le programme
 */
export function testUnitaireJsonString<TO>(description : string, oracle : TO, calcul : string) : void {
    let os = JSON.stringify(oracle);
    let cs = calcul;
    console.log(description + " - calcul : " + cs);
    test(description, 
        () => { chai.expect(cs).to.equal(os);});
} 

/**
 * Test unitaire entre un oracle égal à une chaîne de caractères 
 * et une valeur égale à une chaîne de caractères. La
 * comparaison se fait sur les chaînes de caractères.
 * @param description nom du test (fonction, contexte)
 * @param oracle valeur attendue
 * @param calcul valeur calculée par le programme
 */
export function testUnitaireStringString(description : string, oracle : string, calcul : string) : void {
    let os = oracle;
    let cs = calcul;
    console.log(description + " - calcul : " + cs);
    test(description, 
        () => { chai.expect(cs).to.equal(os);});
} 