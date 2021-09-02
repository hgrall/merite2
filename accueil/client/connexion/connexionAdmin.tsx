import {useState} from "react";
import * as React from "react";
import {Bouton, Formulaire, TitreFormulaire, Entree, Enveloppe} from "../commun/elementsFormulaire";

interface PropsAdminConnexionAdmin {
    entrerCode: (code: string | undefined) => void | undefined,
}

export function AdminConnexion(props: PropsAdminConnexionAdmin) {
    const [code, intialiserCode] = useState<string>();
    return (
        <div>
            <TitreFormulaire>Code d'accès :</TitreFormulaire>
            <Formulaire>
                <Entree type="text" onChange={e => intialiserCode(e.target.value)}/>
                <p>Vous n'avez pas de code d'accès ? Contactez l'administrateur.</p>
                <Bouton onClick={() => props.entrerCode(code)}>Envoyer</Bouton>
            </Formulaire>
        </div>
    );
}