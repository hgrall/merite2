import { MessageTchat} from "../../../bibliotheque/echangesTchat";


export const envoyerADestinataire = async (
    message: unknown,
    code: string
) => {
    const url = `http://localhost:8080/envoyerADestinataire/${code}`;
    console.log(url);
    return axios
        .get(url)
        .then((response) => {
            return response.data.R;
        })
        .catch((error) => {});
};

export const envoyerAVoisins = async (
    message: unknown,
    code: string
) => {
    const url = `http://localhost:8080/envoyerAuxVoisins/${code}`;
    console.log(url);
    return axios
        .get(url)
        .then((response) => {
            return response.data.R;
        })
        .catch((error) => {});
};