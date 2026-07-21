import { Injectable } from '@angular/core';

export class Validator {
    isAbsoluteURI(url: string): boolean {
        return url.startsWith('http://') || url.startsWith('https://');
    }

    isNullOrUndefined(value: any): boolean {
        return (value === undefined || value === null || typeof value === 'undefined') ? true : false;
    }

    isString(value: any): boolean {
        return typeof value === 'string';
    }

    isEmpty(value: any): boolean {
        return (this.isNullOrUndefined(value) || value === '') ? true : false;
    }

    isNotANumber(value: any): boolean {
        return Number.isNaN(value);
    }

    isEmail(email: string): boolean {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
    }

    isMultipleEmail(str: string, separator: string): boolean {
        const emails = str.split(separator);
        for (const email of emails) {
            if ((email.length !== 0) && this.isEmail(email) === false) {
                return false;
            }
        }

        return true;
    }

    hasSpaces(str: string): boolean {
        return str.indexOf(' ') >= 0;
    }
}

// Also export the instance to reuse the logic in non-angular code
export const ValidatorUtility = new Validator();

@Injectable()
export class ValidatorService extends Validator {

}
