import { Directive, ElementRef, HostListener, Input, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appIntegerOnly]'
})
export class IntegerOnlyDirective {
  @Input() min: number = 0; // Default to 0 if no min is provided
  private timeout: any; // Store the timeout reference
  private readonly regex: RegExp = new RegExp(/^-?\d*$/);

  constructor(private readonly el: ElementRef, @Optional() private readonly control: NgControl) { }

  @HostListener('input', ['$event'])
  onInputChange(event: Event): void {
    const inputValue = this.el.nativeElement.value;
    // Remove any non-integer characters
    const sanitizedValue = inputValue.replace(/[^0-9-]/g, '');
    let normalizedValue=sanitizedValue;
    // Validate if the sanitized value matches the number format
    if (sanitizedValue && !this.regex.test(sanitizedValue)) {
      normalizedValue = sanitizedValue.slice(0, -1); // Remove last invalid character
    } else {
      // If valid, normalize the number format (e.g., -09 to -9)
      normalizedValue = sanitizedValue.replace(/^(-?)0+(\d)/, '$1$2');
    }

    // Clear previous timeout to avoid multiple updates
    clearTimeout(this.timeout);
    // Set a timer to update the input value
    this.timeout = setTimeout(() => {
      if (this.el.nativeElement.value !== normalizedValue) {
        this.el.nativeElement.value = normalizedValue;
        event.stopPropagation();
        // Trigger Angular's change detection manually
        //this.el.nativeElement.value.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 300); // Adjust the delay as needed (300 milliseconds in this case)
    
  }

  @HostListener('blur')
  onInputBlur(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    // Set to "0" if input is empty or just a lone '-'
    if (input.value === '' || input.value === '-' || input.value === '-0') {
      input.value =this.min.toString();
      if (this.control?.control) {
        this.control.control.setValue(this.min);  // Update the model
      }
    }
    // else{
    //   const sanitizedValue = input.value.replace(/[^0-9-]/g, '');
    //   input.value = sanitizedValue;
    // }
  }
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const key = event.key;

    // Allow digits (0-9) and a single leading minus sign
    if (!/^\d$/.test(key) && key !== '-' || (key === '-' && (event.target as HTMLInputElement).value.length > 0)) {
      event.preventDefault();
    }
  }
}
