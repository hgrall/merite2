import axios, {AxiosResponse} from 'axios';

export const requetePost = <S> (
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

export function creerFluxDeEvenements(url: string): EventSource {
    return new EventSource(url, {withCredentials: false});
}
