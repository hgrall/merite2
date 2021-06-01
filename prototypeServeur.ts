import * as express from 'express';
import * as shell from "shelljs";
import {creerGenerateurIdentifiantParCompteur, identifiant, Identifiant} from "./bibliotheque/types/identifiant";
import {creerServeurApplicationsExpress} from "./bibliotheque/communication/serveurApplications";
import {
    creerTableIdentificationMutableParEnveloppe,
    creerTableIdentificationMutableVide,
    FormatTableIdentification, TableIdentificationMutable
} from "./bibliotheque/types/tableIdentification";
import {noeud, Noeud} from "./bibliotheque/applications/noeud";
import {
    FormatNoeudTchat,
    FormatSommetTchat,
    MessageConfigurationTchat,
    sommetTchat
} from "./tchat/commun/echangesTchat";
import {dateEnveloppe, dateMaintenant} from "./bibliotheque/types/date";

const serveurApplications = creerServeurApplicationsExpress(8080);
const generateurIdentifiants = creerGenerateurIdentifiantParCompteur<"sommet">("sommet")

interface DataType {
    message: string,
    id: Identifiant<"sommet">,
    numConnexions: number
}

const noms: ReadonlyArray<string> = ["dede", "fifi", "jojo", "lulu", "zaza"];
let sommets: TableIdentificationMutable<"sommet",FormatSommetTchat> = creerTableIdentificationMutableVide("sommet");
noms.forEach((value, index) => {
    const nouveauIdentifiant = generateurIdentifiants.produire("sommet");
    sommets.ajouter(nouveauIdentifiant, {ID:nouveauIdentifiant, pseudo: value,actif:true, priorite:index})
});
const connexions = creerTableIdentificationMutableVide("sommet");

serveurApplications.demarrer();

const traitementConnexion = (request: express.Request, response: express.Response) => {
    // response.setHeader('Content-Type', 'text/event-stream');
    // response.setHeader('Cache-Control', 'no-cache');
    //
    // // only if you want anyone to access this endpoint
    // response.setHeader('Access-Control-Allow-Origin', '*');
    //
    // response.flushHeaders();
    //const id_sommet = reseauEtoile.traitementOvertureConnectionLongue(response);
    const nouvelleConnexion = sommets.retirer(sommets.selectionCle().valeur());
    console.log(nouvelleConnexion);

    connexions.ajouter(nouvelleConnexion.valeur().ID,response);

    const formatNoeud: FormatNoeudTchat = {centre: sommetTchat(nouvelleConnexion.valeur().ID,nouvelleConnexion.valeur().priorite, nouvelleConnexion.valeur().actif, nouvelleConnexion.valeur().pseudo), voisins: sommets.toJSON()}
    const config: MessageConfigurationTchat = {corps:formatNoeud,date: dateMaintenant().etat(),type:'noeud'}

    response.write('event: config\n');
    response.write(`data: ${JSON.stringify(config)}\n\n`);


    if (nouvelleConnexion != undefined){
        request.on("close", () => {
            //reseauEtoile.traitementFermetureConnectionLongue(id_sommet);
            connexions.retirer(nouvelleConnexion.valeur().ID);
            sommets.ajouter(nouvelleConnexion.valeur().ID, nouvelleConnexion.valeur());
        });
    }
}

serveurApplications.specifierTraitementRequeteGETLongue(
    "listen",
    "A1",
    "",
    traitementConnexion
);



const traducctionSortiePost = ( sortie: DataType, canalSortie: express.Response) =>{
    connexions.iterer((_, val: express.Response) => {
        val.write(`data: msg \n\n`)
        val.write(`data: ${JSON.stringify(sortie)} \n\n`)
    })
    canalSortie.write(`data: msg \n\n`)
    canalSortie.write(`data: ${JSON.stringify(sortie)} \n\n`)
};


const traducctionEntree = (request: express.Request): DataType =>{
    console.log(request.body);
    return {message: request.body.contenu, id: request.body.identifiant, numConnexions: connexions.taille()};
};

const traitementPOST= (message: DataType): DataType =>  {
    return message;
};

serveurApplications.specifierTraitementRequetePOST<DataType,DataType>(
    "envoyer",
    "A1",
    "",
    traitementPOST,
    traducctionEntree,
    traducctionSortiePost
)

const repertoireHtml: string = "build";

serveurApplications.specifierRepertoireScriptsEmbarques(repertoireHtml)

const application = "interfaceTchat.html";
const code =  "A1";
const suffixe = "prototype"
const prefixe = "tchat"

serveurApplications.specifierApplicationAServir(prefixe,code, suffixe,repertoireHtml, application)