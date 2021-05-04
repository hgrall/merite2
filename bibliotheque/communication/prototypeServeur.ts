import {ServeurApplicationsExpress} from "./serveurApplications";
import * as express from "express";
import * as bodyParser from "body-parser";


class DataType {
    constructor(public message: string, public id: string ) {};
}

class DataTypeSortie {
    constructor(public entree: DataType, public id: number, public messageSortie: string){};
}


function entreeAUTH  (requete : express.Request) : DataType {
    const id = JSON.stringify(requete.body.id);
    const message = JSON.stringify(requete.body.message);
    return new DataType(message, id);
}


function entreeGET  (requete : express.Request) : DataType {
    const id = requete.body.id;
    const message = requete.body.message;
    return new DataType(message, id);
}

function entreePOST (requete : express.Request) : DataType {
    const id = requete.body.id;
    const message = requete.body.message;
    return new DataType(message, id);
}

function entreePUT (requete : express.Request) : DataType {
    const id = JSON.stringify(requete.body.id);
    const message = JSON.stringify(requete.body.message);
    return new DataType(message, id);
}

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(port, function () {
    console.log("SSE Tchat listening on port 5000!");
});

const serveurApplications = new ServeurApplicationsExpress(entreeAUTH, entreeGET, entreePOST, entreePUT,8080);

serveurApplications.demarrer();

const connexions = new Array<express.Response>();

function envoyerATous(data:DataTypeSortie) {
    connexions.forEach((c) =>
        c.write(`data: ${JSON.stringify(data)} \n\n`)
    );
}


const cheminGETSSE ="/listen";
const code = "A1";
let num = 0;
const  traitementGETRequeteSSE = (entree: DataType) : DataTypeSortie => {
    const  sortie = new DataTypeSortie(entree, num,"Connection établi avec le serveur de connexion");

    app.get(cheminGETSSE, function (req: express.Request, res) {

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


