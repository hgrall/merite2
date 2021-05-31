import { DateFr, dateEnveloppe, dateMaintenant, conversionDate, FormatDateFr } from "../../bibliotheque/types/date";
import { testUnitaireJsonJson } from '../utilitaires';

describe('DateFr', () => {
    let r : DateFr = dateMaintenant();
    let oracle = dateEnveloppe(r.etat());
    testUnitaireJsonJson(
        "fabrique",
        oracle.etat(),
        r.etat());
    let dateStd = new Date(2018, 7, 21, 12, 2, 21, 5);
    let dateFr : FormatDateFr = conversionDate(dateStd);
    testUnitaireJsonJson(
        "conversion Date standard",
        {
            seconde: 21,
            minute: 2,
            heure: 12,
            jourSemaine: 1,
            jourMois: 21,
            mois: 7,
            annee: 2018
        },
        dateFr
    );
    testUnitaireJsonJson(
        "représentation",
        "12:02:21, le 21/08/2018",
        dateEnveloppe(dateFr).representation()
    );
    testUnitaireJsonJson(
        "représentation longue",
        "12:02:21, le mardi 21 aout 2018",
        dateEnveloppe(dateFr).representationLongue()
    );

    testUnitaireJsonJson(
        "représentation log",
        "12:02:21 21/08/2018",
        dateEnveloppe(dateFr).representationLog()
    );
});

