import * as React from "react";
import {Message} from "../Helpers/typesInterface";
import styled from "styled-components";
import {
    Couleur,
    COUPLE_FOND_ENCRE_SUJET,
    FOND_TEXTE,
    TEXTE,
    TEXTE_ERREUR,
    TEXTE_PALE
} from "../../../bibliotheque/interface/couleur";
import {InterlocuteurMessage, Role} from "../../../shared/InterlocuteurMessage";
import {PastilleMessage} from "../../../shared/Pastilles";
import {Col, Row} from "react-bootstrap";

interface ProprietesMessage {
    // see https://github.com/Microsoft/TypeScript/issues/8588
    className?: string;
    message: Message;
}


const MessageFixe = styled.div`
  flex: auto;
  background: ${FOND_TEXTE};
  color: ${TEXTE};
  text-align: justify;
  padding: 1ex;

  min-width: 24ex;
  max-width: 72ex;
  margin: 1ex;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const Cachet = styled.div`
  font-size: x-small;
  color: ${TEXTE_PALE};
  text-align: right;
`;

export class ContainerMessageReçu extends React.Component<ProprietesMessage, {}> {
    render() {
        return (
            <ContainerMessage className={this.props.className}>
                <Row>
                    <Col md={3} sm={12}>
                        <InterlocuteurMessage fond={this.props.message.emetteur.fond}
                                              encre={this.props.message.emetteur.encre}
                                              nom={this.props.message.emetteur.nom}
                                              role={Role.Emetteur}/>
                    </Col>
                    <Col md={6} sm={12}>
                        <MessageFixe
                            style={{color: (this.props.message.ID.val.includes('ERR')) ? TEXTE_ERREUR : TEXTE}}>
                            {this.props.message.contenu}
                            <Cachet>
                                {
                                    this.props.message.accuses.map((c: Couleur) =>
                                        <PastilleMessage fond={c}/>
                                    )
                                }
                                {this.props.message.cachet}
                            </Cachet>
                        </MessageFixe>
                    </Col>
                    <Col md={3} sm={12}>
                        <InterlocuteurMessage fond={this.props.message.destinataire.fond}
                                              encre={this.props.message.destinataire.encre}
                                              nom={this.props.message.destinataire.nom}
                                              role={Role.Recepteur}/>
                    </Col>
                </Row>
            </ContainerMessage>
        );
    }
}

export class ContainerMessageEmis extends React.Component<ProprietesMessage, {}> {
    render() {
        return (
            <ContainerMessage className={this.props.className}>
                <Row>
                    <Col md={3} sm={12}>

                        <InterlocuteurMessage fond={this.props.message.destinataire.fond}
                                              encre={this.props.message.destinataire.encre}
                                              nom={this.props.message.destinataire.nom}
                                              role={Role.Recepteur}/>
                    </Col>
                    <Col md={6} sm={12}>
                        <MessageFixe
                            style={{color: (this.props.message.ID.val.includes('ERR')) ? TEXTE_ERREUR : TEXTE}}>
                            {this.props.message.contenu}
                            <Cachet>
                                {
                                    this.props.message.accuses.map((c: Couleur) =>
                                        <PastilleMessage fond={c}/>
                                    )
                                }
                                {this.props.message.cachet}
                            </Cachet>
                        </MessageFixe>
                    </Col>
                    <Col md={3} sm={12}>

                        <InterlocuteurMessage fond={this.props.message.emetteur.fond}
                                              encre={this.props.message.emetteur.encre}
                                              nom={this.props.message.emetteur.nom}
                                              role={Role.Emetteur}/>
                    </Col>
                </Row>
            </ContainerMessage>
        );
    }
}

export const ContainerMessage = styled.div`
  background: ${FOND_TEXTE};
  border-radius: 1ex;
  margin: 1ex auto;
  width: 80%;
`;
