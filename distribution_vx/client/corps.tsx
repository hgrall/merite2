import * as React from "react";

import styled from "styled-components";

import {
  COUPLE_FOND_ENCRE_SUJET, COUPLE_FOND_ENCRE_TOUS, COUPLE_FOND_ENCRE_INCONNU,
  SuiteCouplesFondEncre, FOND, CADRE, SEPARATION_CADRE, TEXTE_ERREUR
} from "../../bibliotheque/interface/couleur";

import { CanalClientServeur, creerCanalClient } from "../../bibliotheque/communication/client";

import {
  FormatErreurDistribution,
  FormatConfigurationDistribution,
  FormatMessageDistribution,
  EtiquetteMessageDistribution,
  ConfigurationDistribution,
  configurationJeu1Distribution,
  erreurDistribution,
  FormatPopulationLocale,
  FormatUtilisateur,
  FormatConsigne,
  FormatDomaine,
  consigne,
  domaine,
  MessageDistribution,
  messageDistribution,
  messageInitial,
  TypeMessageDistribution,
  messageDemandeVerrouillage,
  populationLocale,
  messageDemandeDeverrouillage,
  transmission,
  essai,
  TypeErreurDistribution, FormatInformationDistribution, TypeInformationDistribution
} from "../commun/echangesJeu1Distribution";

import { Admin } from "./admin";
import { Action } from "./action";
import {
  DomaineInterface, Formulaire, formulaireMessage, FormulaireMessage,
  messageInformant, MessageInformant, messageInformantAvecNouveauType, TypeMessageInformant, FormulaireEssai, formulaireEssai,
  messageInformantAvecInterpretation, messageInformantAvecNouveauxInterpretationType,

} from "./typesInterface";
import { TableIdentification, tableIdentification } from "../../bibliotheque/types/tableIdentification";
import { table } from "../../bibliotheque/types/table";
import { identifiant, Identifiant } from "../../bibliotheque/types/identifiant";
import { FormatOption, rienOption, option, Option } from "../../bibliotheque/types/option";
import { DateFr, dateEnveloppe, dateMaintenant } from "../../bibliotheque/types/date";
import { mot } from "../../bibliotheque/types/binaire";

interface CanalDistribution extends CanalClientServeur<
  FormatErreurDistribution,
  FormatConfigurationDistribution,
  FormatMessageDistribution,
  FormatInformationDistribution,
  EtiquetteMessageDistribution > { }

const ApresAdmin = styled.div`
    background: ${CADRE};
    position: fixed;
    top: 0;
    left: 24vw;
    width: calc(1vw);
    height: calc(100vh);
    border-style: solid;
    border-width: 0 0.33vw;
    border-color: ${SEPARATION_CADRE};
`;

const ApresAction = styled.div`
    background: ${CADRE};
    position: fixed;
    top: 0;
    right: 0;
    width: 1vw;
    height: 100vh;
    border-style: solid;
    border-width: 0 0.33vw;
    border-color: ${SEPARATION_CADRE};
`;

interface ProprietesCorps {
  // see https://github.com/Microsoft/TypeScript/issues/8588
  className?: string;
}

enum EtatInterfaceJeu1 {
  INITIAL,
  NORMAL,
  ERRONE
};

/*
  Etat contenant
  - les attributs susceptibles d'être modifiés par des sous-composants,
  - un indicateur de l'état de l'interface, chaque valeur étant associée
    à des attributs du composant, modifiés uniquement en interne
*/
interface EtatCorps {
  selection: DomaineInterface;
  etatInterface: EtatInterfaceJeu1;
  informations: MessageInformant[]; // Identification par l'identifiant du message.
  formulaireMessage: FormatOption<FormulaireMessage>;
  formulaireEssai: FormatOption<FormulaireEssai>;
  nombreConnexions: string;
  tailleReseau: string;
}

const ID_INCONNU: string = "?";

/*
 * Degré du graphe limité à 4 - Cf. la liste des couples de couleurs.
 */
class CorpsBrut extends React.Component<ProprietesCorps, EtatCorps> {

  private urlServeur: string; // avec protocole ws
  private canal: CanalDistribution;

  private utilisateur: FormatUtilisateur;
  private population: FormatPopulationLocale;
  private consigne: FormatConsigne; // TODO : inutile ?
  private domaineUtilisateur: DomaineInterface;
  private domainesVoisins: TableIdentification<'sommet', DomaineInterface>; // TODO : intile ?
  // TODO : voir les usages de ces attributs. possiblement, les transformer
  //   en variables locales si usage linéaire.
  private domaineInconnu: DomaineInterface;

  private messageErreur: string;

  constructor(props: ProprietesCorps) {
    super(props);

    this.urlServeur = location.toString()
      .replace(/^http/, 'ws'); // Même url, au protocole près

    this.domaineInconnu = {
      domaine: {
        ID: identifiant('sommet', ID_INCONNU),
        nom: [0, 0, 0, 0]
      },
      fond: COUPLE_FOND_ENCRE_INCONNU.fond,
      encre: COUPLE_FOND_ENCRE_INCONNU.encre
    };

    this.state = {
      etatInterface: EtatInterfaceJeu1.INITIAL,
      selection: this.domaineInconnu,
      informations: [],
      formulaireMessage: rienOption<FormulaireMessage>().val(),
      formulaireEssai: rienOption<FormulaireMessage>().val(),
      nombreConnexions: "0",
      tailleReseau:"0",
    };
    this.modifierSelection = this.modifierSelection.bind(this);
    this.envoyerMessageInitial = this.envoyerMessageInitial.bind(this);
    this.mettreAJourInformation = this.mettreAJourInformation.bind(this);
    this.retirerInformation = this.retirerInformation.bind(this);
    this.envoyerDemandeVerrouillage = this.envoyerDemandeVerrouillage.bind(this);
    this.envoyerDemandeDeverrouillage
      = this.envoyerDemandeDeverrouillage.bind(this);
    this.transmettreMessage = this.transmettreMessage.bind(this);
    this.interpreter = this.interpreter.bind(this);
    this.annuler = this.annuler.bind(this);
    this.envoyerEssai = this.envoyerEssai.bind(this);
    this.omettre = this.omettre.bind(this);
    this.annulerOmission = this.annulerOmission.bind(this);
    this.confirmerOmission = this.confirmerOmission.bind(this);
  }

  mettreAJourApresEnvoiMessage(m: FormulaireMessage): void {
    this.retirerFormulaireMessage();
  }

  envoyerMessageInitial(m: FormulaireMessage, domaineDestination: DomaineInterface, d: DateFr): void {
    this.mettreAJourApresEnvoiMessage(m);

    let msg: MessageDistribution = messageInitial(
      this.utilisateur.ID,
      m.domaineEmission.domaine.ID, domaineDestination.domaine.ID,
      mot(m.trame), d);
    console.log("* Envoi du message");
    console.log("- brut : " + msg.brut());
    console.log("- net : " + msg.representation());
    this.canal.envoyerMessage(msg);

  }
  // ok
  envoyerEssai(m: MessageInformant): void {
    let msg: MessageDistribution = essai(
      m.ID,
      m.utilisateur.ID,
      m.domaineEmission.domaine.ID,
      m.domaineDestination.domaine.ID,
      mot(m.interpretation),
      dateEnveloppe(m.date));
    console.log("* Envoi du message");
    console.log("- brut : " + msg.brut());
    console.log("- net : " + msg.representation());
    this.canal.envoyerMessage(msg);

  }

  omettre(m: MessageInformant): void {
    this.mettreAJourInformation(m);
  }
  annulerOmission(m: MessageInformant): void {
    this.mettreAJourInformation(m);
  }
  confirmerOmission(i: Identifiant<'message'>): void {
    this.retirerInformation(i);
  }

  mettreAJourApresDemandeVerrouillage(m: MessageInformant): void {
    this.retirerInformation(m.ID);
  }

  envoyerDemandeVerrouillage(m: MessageInformant): void {
    this.mettreAJourApresDemandeVerrouillage(m);

    let msg: MessageDistribution = messageDemandeVerrouillage(
      m.ID,
      m.utilisateur.ID,
      m.domaineEmission.domaine.ID,
      m.domaineDestination.domaine.ID,
      mot(m.trame),
      dateEnveloppe(m.date)
    );
    console.log("* Envoi du message");
    console.log("- brut : " + msg.brut());
    console.log("- net : " + msg.representation());
    this.canal.envoyerMessage(msg);

  }

  mettreAJourApresDemandeDeverrouillage(m: MessageInformant): void {
    this.retirerInformation(m.ID);
  }

  envoyerDemandeDeverrouillage(m: MessageInformant): void {
    this.mettreAJourApresDemandeDeverrouillage(m);

    let msg: MessageDistribution = messageDemandeDeverrouillage(
      m.ID,
      m.utilisateur.ID,
      m.domaineEmission.domaine.ID,
      m.domaineDestination.domaine.ID,
      mot(m.trame),
      dateEnveloppe(m.date)
    );
    console.log("* Envoi du message");
    console.log("- brut : " + msg.brut());
    console.log("- net : " + msg.representation());
    this.canal.envoyerMessage(msg);

  }

  mettreAJourApresTransmission(m: MessageInformant): void {
    this.mettreAJourInformation(m);
  }

  transmettreMessage(m: MessageInformant, domaineDestination: DomaineInterface, d: DateFr): void {
    m = messageInformant(
      m.ID,
      m.utilisateur,
      m.domaineUtilisateur,
      m.domaineEmission,
      domaineDestination,
      m.trame,
      m.date, "transmission"
    );
    this.mettreAJourApresTransmission(m);

    let msg: MessageDistribution = transmission(
      m.ID,
      this.utilisateur.ID,
      this.domaineUtilisateur.domaine.ID, domaineDestination.domaine.ID,
      mot(m.trame), d);
    console.log("* Envoi du message");
    console.log("- brut : " + msg.brut());
    console.log("- net : " + msg.representation());
    this.canal.envoyerMessage(msg);

  }

  interpreter(m: MessageInformant): void {
    this.retirerInformation(m.ID);
    this.modifierFormulaireEssai(
      formulaireEssai(m.ID, this.utilisateur, this.domaineUtilisateur,
        m.utilisateur, m.domaineEmission, m.trame, this.consigne));
  }

  annuler(f: FormulaireEssai): void {
    this.retirerFormulaireEssai();
    let d = dateMaintenant();
    this.ajouterInformation(
      messageInformant(
        f.ID,
        this.utilisateur,
        this.domaineUtilisateur,
        f.domaineEmetteur,
        this.domaineUtilisateur,
        f.trame,
        d.val(),
        "verrouillage"
      )
    )
  }


  modifierSelection(dom: DomaineInterface): void {
    this.setState({ selection: dom });
  }

  modifierEtatInterface(etat: EtatInterfaceJeu1): void {
    this.setState({
      etatInterface: etat
    });
  }

  retirerFormulaireMessage(): void {
    this.setState({
      formulaireMessage: rienOption<FormulaireMessage>().val()
    });
  }

  retirerFormulaireEssai(): void {
    this.setState({
      formulaireEssai: rienOption<FormulaireMessage>().val()
    });
  }

  modifierFormulaireMessage(f: Formulaire) {
    this.setState({
      formulaireMessage: f
    });
  }

  modifierFormulaireEssai(f: Formulaire) {
    this.setState({
      formulaireEssai: f
    });
  }

  ajouterInformation(i: MessageInformant): void {
    this.setState((etatAvant: EtatCorps) => ({
      informations: [...etatAvant.informations, i]
    }));
  }
  /**
   * Met à jour ou étend avec une nouvelle information.
   * @param nouvelle
   */
  mettreAJourInformation(nouvelle: MessageInformant): void {
    this.setState((etatAvant: EtatCorps) => {
      for (let j in etatAvant.informations) {
        if (etatAvant.informations[j].ID.val === nouvelle.ID.val) {
          etatAvant.informations[j] = nouvelle;
          return {
            informations: etatAvant.informations
          };
        }
      }
      return {
        informations: [...etatAvant.informations, nouvelle]
      };

    });
  }

  informationParIdentifiant(idInfo: Identifiant<'message'>):
    Option<MessageInformant> {
    for (let j in this.state.informations) {
      if (this.state.informations[j].ID.val === idInfo.val) {
        return option(this.state.informations[j]);
      }
    }
    return rienOption();
  }

  retirerInformation(idInfo: Identifiant<'message'>): void {
    this.setState((etatAvant: EtatCorps) => {
      etatAvant.informations.forEach((v, i) => {
        if (v.ID.val === idInfo.val) {
          etatAvant.informations.splice(i, 1);
        }
      });
      return {
        informations: etatAvant.informations
      };
    });
  }

  render(): JSX.Element {
    switch (this.state.etatInterface) {
      case EtatInterfaceJeu1.INITIAL:
        return (
          <h1>Connexion au serveur pour l'initialisation</h1>
        );
      case EtatInterfaceJeu1.NORMAL:
        return (
          <div className={this.props.className}>
            <Admin
              utilisateur={this.utilisateur}
              population={this.population}
              domaine={this.domaineUtilisateur}
              consigne={this.consigne}
              domainesVoisins={this.domainesVoisins.image()}
              selection={this.state.selection} modifSelection={this.modifierSelection}
              nombreConnexions={this.state.nombreConnexions}
              tailleReseau = {this.state.tailleReseau}
            />
            <ApresAdmin />
            <Action
              informations={this.state.informations}
              formulaireMessage={this.state.formulaireMessage}
              formulaireEssai={this.state.formulaireEssai}
              domaineSelectionne={this.state.selection}
              envoiMessageInitial={this.envoyerMessageInitial}
              envoiEssai={this.envoyerEssai}
              annulationOmission={this.annulerOmission}
              confirmationOmission={this.confirmerOmission}
              omission={this.omettre}
              demandeVerrouillage={this.envoyerDemandeVerrouillage}
              demandeDeverrouillage={this.envoyerDemandeDeverrouillage}
              transmissionMessage={this.transmettreMessage}
              interpretation={this.interpreter}
              annulation={this.annuler}
            />
            <ApresAction />
          </div>
        );
      case EtatInterfaceJeu1.ERRONE:
        return (
          <div>
            <h1>Fin de l'application après l'erreur suivante : </h1>
            <div style={{ color: TEXTE_ERREUR }}>
              {this.messageErreur}
            </div>
          </div>
        );
    }
  }

  componentDidMount(): void {
    console.log("* Initialisation après montage du corps");

    console.log("- du canal de communication avec le serveur d'adresse " + this.urlServeur);
    this.canal = creerCanalClient(this.urlServeur);

    console.log("- du traitement des messages");
    this.canal.enregistrerTraitementMessageRecu((m: FormatMessageDistribution) => {
      let msg = messageDistribution(m);
      console.log("* Traitement d'un message");
      console.log("- brut : " + msg.brut());
      console.log("- net : " + msg.representation());
      switch (m.type) {
        case TypeMessageDistribution.AR_INIT:
          if (
            (this.utilisateur.ID.val !== m.ID_utilisateur.val)
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
            || (!this.domainesVoisins.contient(m.ID_destination))
          ) {
            console.log("- message incohérent");
            break;
          }
          this.ajouterInformation(
            messageInformant(
              m.ID,
              this.utilisateur,
              this.domaineUtilisateur,
              this.domaineUtilisateur,
              this.domainesVoisins.valeur(m.ID_destination),
              m.contenu, m.date,
              'AR_initial'
            )
          );
          break;
        case TypeMessageDistribution.TRANSIT:
          if (
            (this.utilisateur.ID.val !== m.ID_utilisateur.val)
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            || (!this.domainesVoisins.contient(m.ID_origine))
          ) {
            console.log("- message incohérent");
            break;
          }
          this.mettreAJourInformation(
            messageInformant(
              m.ID,
              this.utilisateur,
              this.domaineUtilisateur,
              this.domainesVoisins.valeur(m.ID_origine),
              this.domaineUtilisateur,
              m.contenu, m.date,
              'transit'
            )
          );
          break;
        case TypeMessageDistribution.ECHEC_VERROU:
          if (
            (this.utilisateur.ID.val === m.ID_utilisateur.val)
            || (!populationLocale(this.population)
              .possedeUtilisateur(m.ID_utilisateur))
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            || (!this.domainesVoisins.contient(m.ID_origine))
          ) {
            console.log("- message incohérent");
            break;
          }
          console.log("- échec du verrouillage");
          break;
        case TypeMessageDistribution.VERROU:
          if (
            (!populationLocale(this.population)
              .possedeUtilisateur(m.ID_utilisateur))
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            || (!this.domainesVoisins.contient(m.ID_origine))
          ) {
            console.log("- message incohérent");
            return;
          }
          if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            // cet utilisateur a verrouillé le message.
            this.ajouterInformation(
              messageInformant(
                m.ID,
                this.utilisateur,
                this.domaineUtilisateur,
                this.domainesVoisins.valeur(m.ID_origine),
                this.domaineUtilisateur,
                m.contenu, m.date,
                'verrouillage'
              )
            );
          } else {
            // cet utilisateur n'a pas verrouillé le message.
            const u
              = populationLocale(this.population).utilisateur(m.ID_utilisateur);
            this.retirerInformation(m.ID);
            this.mettreAJourInformation(
              messageInformant(
                m.ID,
                u,
                this.domaineUtilisateur,
                this.domainesVoisins.valeur(m.ID_origine),
                this.domaineUtilisateur,
                m.contenu, m.date,
                'verrouillage_autrui'
              )
            );
          }
          break;
        case TypeMessageDistribution.AR_SUIVANT:
          if (
            (!populationLocale(this.population)
              .possedeUtilisateur(m.ID_utilisateur))
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
            || (!this.domainesVoisins.contient(m.ID_destination))
          ) {
            console.log("- message incohérent");
            return;
          }
          if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            // Cet utilisateur a transmis le message.
            // Rien à faire : mise à jour faite lors de l'émission.
          } else {
            // cet utilisateur n'a pas verrouillé le message.
            const u
              = populationLocale(this.population).utilisateur(m.ID_utilisateur);
            let optionInfo = this.informationParIdentifiant(m.ID);
            if (optionInfo.estPresent()) {
              let msgI = optionInfo.valeur();
              let neoMsgI = messageInformant(
                msgI.ID,
                msgI.utilisateur,
                this.domaineUtilisateur,
                msgI.domaineEmission,
                this.domainesVoisins.valeur(m.ID_destination),
                msgI.trame, msgI.date,
                "transmission"
              );
              this.mettreAJourInformation(neoMsgI);
            }
          }
          break;
        case TypeMessageDistribution.GAIN:
          if (
            (!populationLocale(this.population)
              .possedeUtilisateur(m.ID_utilisateur))
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
          ) {
            console.log("- message incohérent util gain");
            return;
          }
          if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            let optionFormulaire = option(this.state.formulaireEssai);
            if (optionFormulaire.estVide()) {
              console.log("- message incohérent option formulaire gain");
              return;
            }
            // Cet utilisateur a interprété le message.
            let formulaire = optionFormulaire.valeur();
            this.retirerFormulaireEssai();
            this.ajouterInformation(
              messageInformantAvecInterpretation(
                m.ID,
                this.utilisateur,
                this.domaineUtilisateur,
                formulaire.domaineEmetteur,
                this.domaineUtilisateur,
                formulaire.trame,
                m.contenu, m.date,
                'gain'
              )
            );
          } else {
            let optionInfo = this.informationParIdentifiant(m.ID);
            if (optionInfo.estVide()) {
              console.log("- message incohérent autre option info gain");
              return;
            }
            // Cet utilisateur n'a pas interprété le message,
            // verrouillé et interprété par un autre utilisateur.
            let info = optionInfo.valeur();
            this.mettreAJourInformation(
              messageInformantAvecNouveauxInterpretationType(info, m.contenu, "gain")
            );
          }
          break;
        case TypeMessageDistribution.PERTE:
          if (
            (!populationLocale(this.population)
              .possedeUtilisateur(m.ID_utilisateur))
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_destination.val)
            || (this.domaineUtilisateur.domaine.ID.val !== m.ID_origine.val)
          ) {
            console.log("- message incohérent util perte");
            return;
          }
          if (this.utilisateur.ID.val === m.ID_utilisateur.val) {
            let optionFormulaire = option(this.state.formulaireEssai);
            if (optionFormulaire.estVide()) {
              console.log("- message incohérent option formulaire perte");
              return;
            }
            // Cet utilisateur a interprété le message.
            let formulaire = optionFormulaire.valeur();
            this.retirerFormulaireEssai();
            this.ajouterInformation(
              messageInformantAvecInterpretation(
                m.ID,
                this.utilisateur,
                this.domaineUtilisateur,
                formulaire.domaineEmetteur,
                this.domaineUtilisateur,
                formulaire.trame,
                m.contenu, m.date,
                'perte'
              )
            );
          } else {
            let optionInfo = this.informationParIdentifiant(m.ID);
            if (optionInfo.estVide()) {
              console.log("- message incohérent autre option info perte");
              return;
            }
            // Cet utilisateur n'a pas interprété le message,
            // verrouillé et interprété par un autre utilisateur.
            let info = optionInfo.valeur();
            this.mettreAJourInformation(
              messageInformantAvecNouveauxInterpretationType(info, m.contenu, "perte")
            );
          }
          break;
        default:
          console.log("TODO");
      }
    });

    console.log("- du traitement de la configuration");
    this.canal.enregistrerTraitementConfigurationRecue((c: FormatConfigurationDistribution) => {
      let config = configurationJeu1Distribution(c);
      console.log("* Réception");
      console.log("- de la configuration brute : " + config.brut());
      console.log("- de la configuration nette : " + config.representation());
      console.log("* Initialisation de l'utilisateur et du domaine");
      this.utilisateur = config.val().utilisateur;
      this.population = config.val().population;
      this.consigne = config.val().consigne;
      let dom = config.val().centre;
      this.domaineUtilisateur = {
        domaine: dom,
        fond: COUPLE_FOND_ENCRE_SUJET.fond,
        encre: COUPLE_FOND_ENCRE_SUJET.encre
      };
      this.setState({tailleReseau: config.val().tailleReseau+""});
      let suite = new SuiteCouplesFondEncre();
      this.domainesVoisins =
        tableIdentification('sommet',
          table(config.noeud().val().voisins.identification).application(d => {
            let c = suite.courant();
            return {
              domaine: d,
              fond: c.fond,
              encre: c.encre
            };
          }).val());
      let domaineSelectionne
        = this.domainesVoisins.valeur(this.domainesVoisins.selectionCle());
      this.modifierSelection(domaineSelectionne);
      this.modifierEtatInterface(EtatInterfaceJeu1.NORMAL);
      this.modifierFormulaireMessage(
        formulaireMessage(this.utilisateur, this.domaineUtilisateur, [], this.consigne));
    });

    console.log("- du traitement d'une erreur rédhibitoire");
    this.canal.enregistrerTraitementErreurRecue((err: FormatErreurDistribution) => {
      switch (err.type) {
        case TypeErreurDistribution.NOM_CONNEXIONS:
          alert(err.messageErreur);
          this.modifierFormulaireMessage(
              formulaireMessage(this.utilisateur, this.domaineUtilisateur, [], this.consigne));
          return;
        case TypeErreurDistribution.REDHIBITOIRE:
          let erreur = erreurDistribution(err);
          console.log("* Réception");
          console.log("- de l'erreur rédhibitoire brute : " + erreur.brut());
          console.log("- de l'erreur rédhibitoire nette : " + erreur.representation());
          console.log("* Affichage de l'erreur");
          this.messageErreur = erreur.representation();
          this.modifierEtatInterface(EtatInterfaceJeu1.ERRONE);
          return;
      }
    });
    console.log("- du traitement d'une information");
    this.canal.enregistrerTraitementInformationRecue((i : FormatInformationDistribution) => {
      this.setState({nombreConnexions: i.contenu});
    });

  }

}

export const Corps = styled(CorpsBrut)`
      width: 100vw;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
  background: ${FOND}
            `;
