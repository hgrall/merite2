import {Couleur} from "../../../bibliotheque/interface/couleur";
import * as React from "react";
import styled from "styled-components";

interface ProprietesAvis {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    fond: Couleur;
    encre: Couleur;
    avis: string,
}

class AvisBrut extends React.Component<ProprietesAvis, {}> {
    render() {
        return (
            <div className={this.props.className}>
                {this.props.avis}
            </div>
        );
    }
}

export const Avis = styled(AvisBrut)`
        flex: none;
        background-color: ${(props: ProprietesAvis) => props.fond};
        color : ${(props: ProprietesAvis) => props.encre};
        text-align: center;
        padding: 1ex;

        width: 54ex;
        margin: 1ex;
        border-radius: 1ex;
    `;