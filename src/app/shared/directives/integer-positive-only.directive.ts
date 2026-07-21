import { Directive, ElementRef, HostListener, Input, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appIntegerPositiveOnly]'
})
export class IntegerPositiveOnlyDirective {
  @Input() min: number = 0;  // Default min value is 0
  @Input() max: number = Infinity;  // Default max value is Infinity

  private readonly regex: RegExp = new RegExp(/^-?\d*$/);

  constructor(private readonly el: ElementRef, @Optional() private readonly control: NgControl) { }

 @HostListener('input', ['$event'])
onInputChange(event: Event): void {
  const inputEl = this.el.nativeElement as HTMLInputElement;
  const inputValue = inputEl.value;

  const sanitizedValue = inputValue.replace(/[^0-9]/g, '');
  if (sanitizedValue && !this.regex.test(sanitizedValue)) {
    inputEl.value = sanitizedValue.slice(0, -1);
  } else {
    inputEl.value = sanitizedValue.replace(/^(-?)0+(\d)/, '$1$2');
  }

  if (inputEl.value !== inputValue) {
    event.stopPropagation();
  }
}


  @HostListener('blur')
  onInputBlur(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    let numericValue = input.value ? Number.parseInt(input.value, 10) : Number.NaN;

    // If empty, set to min
    if (Number.isNaN(numericValue)) {
      numericValue = this.min;
    }

    // Apply min/max constraints
    if (numericValue < this.min) {
      numericValue = this.min;
    } else if (numericValue > this.max) {
      numericValue = this.max;
    }

    // Update input value
    input.value = numericValue.toString();

    // Update Angular model
    if (this.control?.control) {
      this.control.control.setValue(numericValue, { emitEvent: false });
    }
  }
}
