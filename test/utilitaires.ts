import * as chai from 'chai';
import * as mocha from 'mocha';

let test : mocha.TestFunction = it;

export function testUnitaire<TO, TC>(description : string, oracle : TO, calcul : TC) : void {
    let os = JSON.stringify(oracle);
    let cs = JSON.stringify(calcul);
    console.log(description + " - calcul : " + cs);
    test(description, 
        () => { chai.expect(cs).to.equal(os);});
} 