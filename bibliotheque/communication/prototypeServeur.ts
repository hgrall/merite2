import {Reseau, ServeurApplications, ServeurApplicationsExpress, ServeurConnexion} from "./serveurApplications";
import * as express from "express";
import * as bodyParser from "body-parser";


class DataType {
    constructor(public message: string, public id: string ) {};
}

class DataTypeSortie {
    constructor(public entree: DataType, public id: number, public messageSortie: string){};
}

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(port, function () {
    console.log("SSE Tchat listening on port 5000!");
});


const connexions = new Array<express.Response>();

function envoyerATous(data:DataTypeSortie) {
    connexions.forEach((c) =>
        c.write(`data: ${JSON.stringify(data)} \n\n`)
    );
}


const cheminGETSSE ="/listen";
let num = 0;
const  traitementGETRequeteSSE = (entree: DataType) : DataTypeSortie => {
    const  sortie = new DataTypeSortie(entree, num,"Connection établi avec le serveur de connexion");

    app.get(cheminGETSSE, function (req: express.Request, res:express.Response) {

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
        });
        console.log(`${sortie.id} Connection opened`);
        connexions.push(res);
        res.write(JSON.stringify(sortie));

        req.on("close", () => {

            console.log(`${sortie.id} Connection closed`);
        });
    });
    num++;
    return sortie;
}
serveurApplications.specifierTraitementRequeteGET(code,cheminGETSSE, traitementGETRequeteSSE);

const cheminPOSTSSE ="/send";
const traitementPOSTRequeteSSE = (entree: DataType) : DataTypeSortie => {
    const  sortie = new DataTypeSortie(entree,0, "Le message a ete envoyé");
    envoyerATous(sortie);
    return sortie;
}
serveurApplications.specifierTraitementRequetePOST(code,cheminPOSTSSE, traitementPOSTRequeteSSE);


export class PrototypeServeur<E, S> implements ServeurConnexion<E, S>{

    private appli: express.Application;
    private reseau: Reseau<S> ;
    private serveur: ServeurApplications<E, S>
    private traitementFermetureConnexionLongue: () => void;
    private noeud: NoeudReseauPrototype;

    constructor(
        appli: express.Application, serveur: ServeurApplications<E, S>) {
        this.reseau = new ReseauPrototype<S>();
        this.appli = appli;
        this.serveur = serveur;
    }


    chemin(): string {
        return "/prototype";
    }

    code(): string {
        //TODO: Changer le code en fonction de l'authentication
        return "/A1";
    }

    reseauConnecte() : Reseau<S> {
        return this.reseau;
    }

    serveurApplications(): ServeurApplications<E,S> {
        return this.serveur;
    }

    xX(chemin: string): void {
        const objet= this;
        this.appli.get(chemin, function (req: express.Request, res:express.Response) {

            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                Connection: "keep-alive",
                "Cache-Control": "no-cache",
            });
            console.log(`${sortie.id} Connection opened`);
            connexions.push(res);
            //TODO : Ajouter au reseau res
            //TODO : ENvoyer configuration
            res.write(JSON.stringify(sortie));

            req.on("close", () => {
               objet.traitementFermetureConnexionLongue()
                console.log(`${sortie.id} Connection closed`);
            });
        });
    }

    //TODO: definir traitement -> Retirer un element du reseau et diffuser information aux utlisateurs. Reflechir a le lieu ou ce traitement devrait etre defini
    specifierTraitementFermetureConnexionLongue(sousChemin : string, traitement : (() => void)) : void {

        const entreeGET  = (reponse : express.Response) : NoeudReseauPrototype=> {
            // TODO: Creer id avec le builder
            return new NoeudReseauPrototype(reponse,"id");
        }

        const traitementOvertureConnexionLongue  = (noeud : NoeudReseauPrototype) : void => {
            this.noeud = noeud;
            noeud.response.writeHead(200, {
                "Content-Type": "text/event-stream",
                Connection: "keep-alive",
                "Cache-Control": "no-cache",
            });
            // TODO : Ajouter NOEUD AU RESEAU
        }

        this.traitementFermetureConnexionLongue = traitement;
        //TODO: Enlever du reseau
        this.serveurApplications().specifierTraitementRequeteGET("/listen",this.code(),"prototype", entreeGET,traitementOvertureConnexionLongue);
    };


    specifierTraitementOuvertureConnexionLongue(sousChemin : string, traitement : ((entree : E) => void)) : void{
        //TODO: Ajouter au reseau
        //

    }


    specifierTraitementRequeteEntrante(sousChemin : string, traitement : ((entree : E) => void)) : void{
        // TODO: Envoyer message
    }

}

export class NoeudReseauPrototype{
    constructor(public response: express.Response, public idClient: string ) {};
}


class ReseauPrototype<S> extends Map<string,S> implements Reseau<S>{
    envoyer(clientDestinataire: string, message : S) : void{
       const noeud = this.get(clientDestinataire) as unknown as NoeudReseauPrototype;

    }

    estComplet(): boolean {
        return false;
    }

    estVide(): boolean {
        return this.size== 0;
    }

    ajouterNoeud(noeud: S): void {
        const noeudCast = noeud as unknown as NoeudReseauPrototype;
        this.set(noeudCast.idClient, noeud);
    }
}

