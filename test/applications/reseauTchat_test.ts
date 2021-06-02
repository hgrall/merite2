import { ReseauMutable } from "../../bibliotheque/applications/reseau";
import { FormatSommetTchat } from "../../tchat/commun/echangesTchat";
import { creerGenerateurReseauAnneau, creerGenerateurReseauEtoile } from "../../tchat/serveur/reseauTchat";
import { testUnitaireJsonJson, testUnitaireStringString } from "../utilitaires";

describe('Réseau tchat étoile', () => {
    let genR = creerGenerateurReseauEtoile<number>("code", 2, ["coco", "lulu", "zaza"]);
    let r: ReseauMutable<FormatSommetTchat, number> = genR.engendrer();
    const id1 = r.activerSommet(17);
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
    const id2 = r.activerSommet(19);
    n = r.noeud(id2);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id2)
    );
    const id3 = r.activerSommet(22);
    n = r.noeud(id3);
    testUnitaireJsonJson(
        "centre actif - 2 voisins actifs",
        [true, 2],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );

    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id3)
    );    
    const id4 = r.activerSommet(24);
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre actif - 0 voisin actif",
        [true, 0],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        false,
        r.sontVoisins(id1, id4)
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
    let genR = creerGenerateurReseauAnneau<number>("code", 2, ["coco", "lulu", "momo", "zaza"]);
    let r: ReseauMutable<FormatSommetTchat, number> = genR.engendrer();
    
    const id1 = r.activerSommet(17);
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
    const id2 = r.activerSommet(19);
    n = r.noeud(id2);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id2)
    );
    const id3 = r.activerSommet(22);
    n = r.noeud(id3);
    testUnitaireJsonJson(
        "centre actif - 1 voisin actif",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        false,
        r.sontVoisins(id1, id3)
    );    
    const id4 = r.activerSommet(24);
    n = r.noeud(id4);
    testUnitaireJsonJson(
        "centre actif - 2 voisins actifs",
        [true, 2],
        [n.toJSON().centre.actif, n.nombreConnexionsActives()]
    );
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id4)
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