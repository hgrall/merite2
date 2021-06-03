import { ReseauMutable } from "../../bibliotheque/applications/reseau";
import { CanalPersistantEcritureJSON } from "../../bibliotheque/communication/connexion";
import { identifiant } from "../../bibliotheque/types/identifiant";
import { FormatSommetTchat } from "../../tchat/commun/echangesTchat";
import { creerGenerateurReseauAnneau, creerGenerateurReseauEtoile } from "../../tchat/serveur/reseauTchat";
import { testUnitaireJsonJson, testUnitaireStringString } from "../utilitaires";

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
    let genR = creerGenerateurReseauEtoile<ConnexionFictive>("code", 2, ["coco", "lulu", "zaza"]);
    let r: ReseauMutable<FormatSommetTchat, ConnexionFictive> = genR.engendrer();
    const id1 = r.activerSommet(cf(17));
    let n = r.noeud(id1);
    testUnitaireJsonJson(
        "centre actif - 0 voisin actif",
        [true, 0],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );

    testUnitaireJsonJson(
        "nombre d'actifs",
        1,
        r.nombreActifs(),
    );
    testUnitaireJsonJson(
        "nombre d'inactifs",
        5,
        r.nombreInactifs(),
    ); 
    testUnitaireJsonJson(
        "priorité",
        0,
        r.sommet(id1).priorite
    );
    const id2 = r.activerSommet(cf(19));
    n = r.noeud(id2);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, identifiant("sommet", id2.val))
    );
    const id3 = r.activerSommet(cf(22));
    n = r.noeud(id3);
    testUnitaireJsonJson(
        "centre actif - 2 voisins actifs",
        [true, 2],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );

    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, identifiant("sommet", id3.val))
    );    
    const id4 = r.activerSommet(cf(24));
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre actif - 0 voisin actif",
        [true, 0],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        false,
        r.sontVoisins(id1, identifiant("sommet", id4.val))
    );    
    testUnitaireJsonJson(
        "connexion",
        24,
        r.connexion(id4)
    );
    r.inactiverSommet(id4);
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre inactif - 0 voisin actif",
        [false, 0],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );   
});

describe('Réseau tchat anneau', () => {
    let genR = creerGenerateurReseauAnneau<ConnexionFictive>("code", 2, ["coco", "lulu", "momo", "zaza"]);
    let r: ReseauMutable<FormatSommetTchat, ConnexionFictive> = genR.engendrer();
    
    const id1 = r.activerSommet(cf(17));
    let n = r.noeud(id1);
    testUnitaireJsonJson(
        "centre actif - 0 voisin actif",
        [true, 0],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    
    testUnitaireJsonJson(
        "nombre d'actifs",
        1,
        r.nombreActifs(),
    );
    testUnitaireJsonJson(
        "nombre d'inactifs",
        7,
        r.nombreInactifs(),
    ); 
    testUnitaireJsonJson(
        "priorité",
        0,
        r.sommet(id1).priorite
    );
    const id2 = r.activerSommet(cf(19));
    n = r.noeud(id2);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, identifiant("sommet", id2.val))
    );
    const id3 = r.activerSommet(cf(22));
    n = r.noeud(id3);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        false,
        r.sontVoisins(id1, identifiant("sommet", id3.val))
    );    
    const id4 = r.activerSommet(cf(24));
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre actif - 2 voisins actifs",
        [true, 2],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, identifiant("sommet", id4.val))
    );    
    testUnitaireJsonJson(
        "connexion",
        24,
        r.connexion(id4)
    ); 
    testUnitaireStringString(
        "sommets",
        r.net('sommets'),
        r.net('sommets'),
    );
    r.inactiverSommet(id4);
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre inactif - 2 voisins actifs",
        [false, 2],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );   

});