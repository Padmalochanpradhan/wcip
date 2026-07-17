import { ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { IntegerOnlyDirective } from './integer-only.directive';

describe('IntegerOnlyDirective', () => {
  it('should create an instance', () => {
    const elementRef = new ElementRef(document.createElement('input'));
    const directive = new IntegerOnlyDirective(elementRef, null as unknown as NgControl);
    expect(directive).toBeTruthy();
  });
});
