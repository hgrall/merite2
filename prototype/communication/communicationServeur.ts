import axios from 'axios';
import {FormatMessageEnvoiTchat} from "../../tchat/commun/echangesTchat";

export const envoyerMessageEnvoi = async (
    message: FormatMessageEnvoiTchat,
    code: string,
    // jeu: string
) => {
    const url = `http://localhost:8080/envoyer/A1`;
    console.log(url);
    console.log(message);
    return axios
        .post(url, {
            message
        })
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {});
};
