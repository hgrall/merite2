import { ReseauMutable } from "../../bibliotheque/applications/reseau";
import { FormatSommetTchat } from "../../tchat/commun/echangesTchat";
import { creerGenerateurReseauAnneau, creerGenerateurReseauEtoile } from "../../tchat/serveur/reseauTchat";
import { testUnitaireJsonJson, testUnitaireStringString } from "../utilitaires";

describe('Réseau tchat étoile', () => {
    let genR = creerGenerateurReseauEtoile<number>("code", 2, ["coco", "lulu", "zaza"]);
    let r: ReseauMutable<FormatSommetTchat, number> = genR.engendrer();
    const id1 = r.activerSommet(17);
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
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id2)
    );
    const id3 = r.activerSommet(22);
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id3)
    );    
    const id4 = r.activerSommet(24);
    testUnitaireJsonJson(
        "voisinage",
        false,
        r.sontVoisins(id1, id4)
    );    
    testUnitaireJsonJson(
        "connexion",
        22,
        r.connexion(id3)
    );    
});

describe('Réseau tchat anneau', () => {
    let genR = creerGenerateurReseauAnneau<number>("code", 2, ["coco", "lulu", "momo", "zaza"]);
    let r: ReseauMutable<FormatSommetTchat, number> = genR.engendrer();
    const id1 = r.activerSommet(17);
    
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
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id2)
    );
    const id3 = r.activerSommet(22);
    testUnitaireJsonJson(
        "voisinage",
        false,
        r.sontVoisins(id1, id3)
    );    
    const id4 = r.activerSommet(24);
    testUnitaireJsonJson(
        "voisinage",
        true,
        r.sontVoisins(id1, id4)
    );    
    testUnitaireJsonJson(
        "connexion",
        22,
        r.connexion(id3)
    ); 
    testUnitaireStringString(
        "sommets",
        r.net('sommets'),
        r.net('sommets'),
    );
});