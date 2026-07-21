import { ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { IntegerPositiveOnlyDirective } from './integer-positive-only.directive';

describe('IntegerPositiveOnlyDirective', () => {
  it('should create an instance', () => {
    const elementRef = new ElementRef(document.createElement('input'));
    const directive = new IntegerPositiveOnlyDirective(elementRef, null as unknown as NgControl);
    expect(directive).toBeTruthy();
  });
});
