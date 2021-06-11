import { CanalPersistantEcritureJSON } from "../../bibliotheque/communication/connexion";
import { egaliteMots, mot } from "../../bibliotheque/types/binaire";
import { identifiant, sontIdentifiantsEgaux } from "../../bibliotheque/types/identifiant";
import { estUtilisateur, FormatUtilisateurDistribution } from "../../distribution/commun/echangesDistribution";
import { creerGenerateurReseauDistribution, ReseauMutableDistribution } from "../../distribution/serveur/reseauDistribution";
import { testUnitaireJsonJson } from "../utilitaires";

class ConnexionFictive implements CanalPersistantEcritureJSON {
    constructor(public val: number) { }
    envoyerJSON<T>(etiquette: string, x: T): void {
        console.log(etiquette + " : " + JSON.stringify(x));
    }
    toJSON(): number {
        return this.val;
    }
}

function cf(n: number): ConnexionFictive {
    return new ConnexionFictive(n);
}

describe('Réseau distribution', () => {
    let genR = creerGenerateurReseauDistribution<ConnexionFictive>("code", 5, [3, 3, 3, 3, 3]);
    let r: ReseauMutableDistribution<ConnexionFictive>
        = genR.engendrer();
    const id1 = r.activerSommet(cf(17));
    let n = r.noeud(id1);
    testUnitaireJsonJson(
        "utilisateur actif - 1 voisin actif (le domaine)",
        [true, 1],
        [n.toJSON().centre.actif, n.nombreVoisinsActifs()]
    );
    testUnitaireJsonJson(
        "nombre d'actifs",
        2,
        r.nombreActifs()
    );
    testUnitaireJsonJson(
        "nombre d'inactifs déconnectés",
        14,
        r.nombreInactifsDeconnectes()
    );
    testUnitaireJsonJson(
        "priorité maximale (ordre inversé)",
        0,
        r.etat().fileInactifsDeconnectes.etat().prioriteMaximale
    );

    for (let i = 0; i < 4; i++) {
        const idi = r.activerSommet(cf(18 + i));
        const ni = r.noeud(idi);
        testUnitaireJsonJson(
            "utilisateur actif - 1 voisin actif (le domaine)",
            [true, 1],
            [ni.toJSON().centre.actif, ni.nombreVoisinsActifs()]
        );
        testUnitaireJsonJson(
            "nombre d'actifs",
            2 * (i + 2),
            r.nombreActifs()
        );
        testUnitaireJsonJson(
            "nombre d'inactifs déconnectés",
            13 - i,
            r.nombreInactifsDeconnectes()
        );
    }

    testUnitaireJsonJson(
        "priorité maximale (ordre inversé)",
        1,
        r.etat().fileInactifsDeconnectes.etat().prioriteMaximale
    );

    for (let i = 0; i < 5; i++) {
        const idi = r.activerSommet(cf(22 + i));
        const ni = r.noeud(idi);
        testUnitaireJsonJson(
            "utilisateur actif - 1 voisin actif (le domaine)",
            [true, 1],
            [ni.toJSON().centre.actif, ni.nombreVoisinsActifs()]
        );
        testUnitaireJsonJson(
            "nombre d'utilisateurs actifs",
            2,
            r.nombreUtilisateursActifsDeSonDomaine(idi)
        );
    }

    for (let i = 0; i < 5; i++) {
        const idi = r.activerSommet(cf(22 + i));
    }
    testUnitaireJsonJson(
        "nombre d'actifs",
        20,
        r.nombreActifs()
    );
    testUnitaireJsonJson(
        "nombre d'inactifs déconnectés",
        0,
        r.nombreInactifsDeconnectes()
    );
    // Consignes
    const consigne1 = (r.sommet(id1) as FormatUtilisateurDistribution).consigne;
    const [ID_dest, dest] = r.etat().sommets
        .selectionAssociationSuivantCritere((id, s) => {
            if(estUtilisateur(s)){
                return sontIdentifiantsEgaux(
                    r.consigneParDestination(id).ID,
                    consigne1.ID);
            }else{
                return false;
             }
    }).valeur();
    testUnitaireJsonJson(
        "égalité des destinataires de la consigne",
        true,
        egaliteMots(
            mot(consigne1.destinataire), 
            mot((dest as FormatUtilisateurDistribution).utilisateur))
    );
    console.log("*** consigne 1 : " + JSON.stringify(consigne1));
    console.log("*** réseau : " + r.net('sommets'));
});

