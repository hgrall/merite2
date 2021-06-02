import axios from 'axios';
import {FormatMessageEnvoiTchat} from "../../tchat/commun/echangesTchat";
import stringify = Mocha.utils.stringify;

export const envoyerMessageEnvoi = async (
    data: FormatMessageEnvoiTchat
) => {
    //TODO: Set url by using constants
    const url = `http://localhost:8080/tchat/code/etoile/envoi`;
    console.log(url);
    console.log(data);
    return axios
        .post(url, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
};
