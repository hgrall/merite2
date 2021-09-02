import { CanalPersistantEcritureJSON } from "../../bibliotheque/communication/connexion";
import { identifiant } from "../../bibliotheque/types/identifiant";
import { creerGenerateurReseau, ReseauMutableTchat } from "../../tchat/serveur/reseauTchat";
import { testUnitaireJsonJson } from "../utilitaires";

class ConnexionFictive implements CanalPersistantEcritureJSON {
    constructor(public val : number){}
    envoyerJSON<T>(etiquette: string, x: T): void {
        console.log(etiquette + " : " + JSON.stringify(x));
    }
    toJSON() : number {
        return this.val;
    }
}

function cf(n : number) : ConnexionFictive {
    return new ConnexionFictive(n);
}

describe('Réseau tchat étoile', () => {
    let genR = creerGenerateurReseau<ConnexionFictive>("etoile", "code", 2, ["coco", "lulu", "zaza"]);
    let r: ReseauMutableTchat<ConnexionFictive> = genR.engendrer();
    const id1 = r.connecterSommet(cf(17));
    let n = r.noeud(id1);
    testUnitaireJsonJson(
        "centre actif - 0 voisin actif",
        [true, 0],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );

    testUnitaireJsonJson(
        "nombre d'actifs",
        1,
        r.nombreActifs(),
    );
    testUnitaireJsonJson(
        "nombre d'inactifs",
        5,
        r.nombreInactifsDeconnectes(),
    ); 
    testUnitaireJsonJson(
        "priorité maximale (ordre inversé)",
        1,
        r.etat().fileInactifsDeconnectes.etat().prioriteMaximale
    );
    const id2 = r.connecterSommet(cf(19));
    n = r.noeud(id2);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );
    
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, identifiant('sommet', id2.val))
    );
    const id3 = r.connecterSommet(cf(22));
    n = r.noeud(id3);
    testUnitaireJsonJson(
        "centre actif - 2 voisins actifs",
        [true, 2],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );

    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, identifiant('sommet', id3.val))
    );    
    const id4 = r.connecterSommet(cf(24));
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre actif - 0 voisin actif",
        [true, 0],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );
    testUnitaireJsonJson(
        "voisinage",
        false,
        r.sontVoisins(id1, identifiant('sommet', id4.val))
    );    
    testUnitaireJsonJson(
        "connexion",
        24,
        r.connexion(id4)
    );
    r.deconnecterSommet(id4);
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre inactif - 0 voisin actif",
        [false, 0],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );   
});

describe('Réseau tchat anneau', () => {
    let genR = creerGenerateurReseau<ConnexionFictive>("anneau", "code", 2, ["coco", "lulu", "momo", "zaza"]);
    let r: ReseauMutableTchat<ConnexionFictive> = genR.engendrer();
    
    const id1 = r.connecterSommet(cf(17));
    let n = r.noeud(id1);
    testUnitaireJsonJson(
        "centre actif - 0 voisin actif",
        [true, 0],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );
    
    testUnitaireJsonJson(
        "nombre d'actifs",
        1,
        r.nombreActifs(),
    );
    testUnitaireJsonJson(
        "nombre d'inactifs",
        7,
        r.nombreInactifsDeconnectes(),
    ); 
    testUnitaireJsonJson(
        "priorité maximale (ordre inversé)",
        1,
        r.etat().fileInactifsDeconnectes.etat().prioriteMaximale
    );
    const id2 = r.connecterSommet(cf(19));
    n = r.noeud(id2);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );
    testUnitaireJsonJson(
        "voisinage id1 avec id2",
        true,
        r.sontVoisins(id1, identifiant('sommet', id2.val))
    );
    const id3 = r.connecterSommet(cf(22));
    n = r.noeud(id3);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );
    testUnitaireJsonJson(
        "voisinage id3 avec id1 ou id2 ?!",
        true,
        r.sontVoisins(id1, identifiant('sommet', id3.val)) 
        || r.sontVoisins(id2, identifiant('sommet', id3.val)) 
    );    
    const id4 = r.connecterSommet(cf(24));
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre actif - 2 voisins actifs",
        [true, 2],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );
    testUnitaireJsonJson(
        "voisins inactifs / id4",
        0, 
        r.voisinsInactifs(id4).taille()

    );    
    testUnitaireJsonJson(
        "connexion",
        24,
        r.connexion(id4)
    ); 
    
    r.deconnecterSommet(id4);
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre inactif - 2 voisins actifs",
        [false, 2],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );   

});