import { Exception } from './exception';

export class DecryptException extends Exception {
    customMessage: string;
    constructor(customMessage: string, ex?: Error) {
        super(customMessage, ex);
        this.customMessage = customMessage;
        this.type = DecryptException.name;
    }
}
