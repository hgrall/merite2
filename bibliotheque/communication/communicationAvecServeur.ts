import axios, {AxiosResponse} from 'axios';

export const enregistrerRequetePOST = <S> (
    data: S,
    traitement: (response: AxiosResponse) => void,
    traitementErreur: (raison: unknown) => void,
    url: string
) => {
    axios
        .post(url, data)
        .then(response => {
            traitement(response)
        })
        .catch(raison => {
            traitementErreur(raison)
        })
};

export const enregistrerRequeteGET = <P> (
    traitement: (response: AxiosResponse) => void,
    traitementErreur: (raison: unknown) => void,
    url: string,
    params: P
) => {
    axios
        .get(url, {
            params:params
        })
        .then(traitement)
        .catch(traitementErreur)
};

export function creerFluxEvenements(url: string): EventSource {
    return new EventSource(url, {withCredentials: false});
}
