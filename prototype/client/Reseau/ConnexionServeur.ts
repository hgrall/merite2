import { MessageTchat} from "../../../bibliotheque/echangesTchat";
import axios from 'axios';


export const envoyerAVoisins = async (
    message: unknown,
    code: string
) => {
    const url = `http://localhost:8080/envoyerAuxVoisins/${code}`;
    console.log(url);
    return axios
        .post(url)
        .then((response) => {
            console.log(response.data);
        })
        .catch((error) => {});
};