import { FormatDateFr } from "../types/date";
import { Identifiant } from "../types/identifiant";

export interface FormatMessage<TypeMsg, CorpsMsg> {
    readonly ID: Identifiant<'message'>;
    readonly type: TypeMsg;
    readonly corps: CorpsMsg;
    readonly date: FormatDateFr
}