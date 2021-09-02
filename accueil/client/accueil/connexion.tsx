import {useState} from "react";
import * as React from "react";
import {Bouton, Formulaire, TitreFormulaire, Entree, Enveloppe} from "../commun/elementsFormulaire";

interface AccessPageProps {
    onClick: (code: string | undefined) => void | undefined,
}

export function EntreeCle(props: AccessPageProps) {
    const [code, setCode] = useState<string>();
    return (
        <Enveloppe>
            <TitreFormulaire>Clé d'accès :</TitreFormulaire>
            <Formulaire>
                <Entree type="text" onChange={e => setCode(e.target.value)}/>
                <p>Vous n'avez pas de clé d'accès ? Demandez au professeur.</p>
                <Bouton onClick={() => props.onClick(code)}>Envoyer</Bouton>
            </Formulaire>
        </Enveloppe>
    );
}