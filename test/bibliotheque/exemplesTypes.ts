export interface TypeSerialisable {
    a: string;
}

export interface TypeNonSerialisable {
    f: (x : number) => number;
    a: string;
    toJSON : () => TypeSerialisable;
}

export function creerTypeNonSerialisable(x : string) :  TypeNonSerialisable {
    return { f : (x) => x,  a : x , toJSON : () => ({a : x}) };
}



