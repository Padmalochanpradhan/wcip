export class Exception extends Error {
    innerException?: Error;
    protected type!: string;
    constructor (message: string, ex?: Error) {
        super(message);
        this.innerException = ex;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
