import {useState} from "react";
import * as React from "react";
import {Button, Form, FormTitle, Input, Wrapper} from "../Shared/formStyle";

interface AccessPageProps {
    onClick: (code: string | undefined) => void | undefined,
}

export function AccessPage(props: AccessPageProps) {
    const [code, setCode] = useState<string>();
    return (
        <Wrapper>
            <FormTitle>Cle d'accès :</FormTitle>
            <Form>
                <Input type="text" onChange={e => setCode(e.target.value)}/>
                <p>Vous n'avez pas un code ? Contactez le professeur.</p>
                <Button onClick={() => props.onClick(code)}>Envoyer</Button>
            </Form>
        </Wrapper>
    );
}