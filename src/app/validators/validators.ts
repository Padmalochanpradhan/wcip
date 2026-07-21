import { FormControl, FormGroup, ValidatorFn, AbstractControl } from '@angular/forms';
import { ValidatorUtility } from '../services/validator.service';

/**
 * Allows alpha numeric characters and -, _ characters
 */
export function AlphaNumDashesValidator(control: FormControl): { nonAlphaNumDashes: boolean, error: boolean } | null {
    if (ValidatorUtility.isEmpty(control.value)) {
        return null;
    }
    return /^[\w\-]+$/.test(control.value)
        ? null : { nonAlphaNumDashes: true, error: true };
}

export function PasswordMatchValidator(formGroup: FormGroup): { passwordNotMatch: boolean } | null {
    const password  = formGroup.get('password')?.value;
    const confirmPassword  = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordNotMatch: true };
}

export function FileExtensionValidator(extensions: string[]): ValidatorFn {
    return (formControl: AbstractControl): { pattern: boolean } | null => {
        if (formControl?.value) {
            const fileNameArray = formControl.value.split('.');
            const extension = fileNameArray[fileNameArray.length - 1];
            if (extensions.includes(extension.toLowerCase())) {
                return null;
            } else {
                return { pattern: true };
            }
        } else {
            return null;
        }
    };
}

export function CannotContainSpace(control: FormControl): { cannotContainSpace: boolean } | null {
    if (ValidatorUtility.hasSpaces(control.value)) {
        return { cannotContainSpace: true };
    }
    return null;
}
