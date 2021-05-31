import axios from 'axios';

export const envoyerMessage = async (
    message: unknown,
    code: string,
    jeu: string
) => {
    const url = `http://localhost:8080/envoyerAuxVoisins/${jeu}/${code}`;
    console.log(url);
    return axios
        .post(url)
        .then((response) => {
            console.log(response.data);
        })
        .catch((error) => {});
};

export const ecouterServeur = async (
    code: string
) => {
    const url = `http://localhost:8080/listen/${code}`;
    console.log(url);
    return axios
        .get(url)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {});
};