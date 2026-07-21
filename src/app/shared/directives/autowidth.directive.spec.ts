import { ElementRef } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AutowidthDirective } from './autowidth.directive';

describe('AutowidthDirective', () => {
  it('should create an instance', () => {
    const elementRef = new ElementRef(document.createElement('input'));
    const ngModel = {} as NgModel;
    const directive = new AutowidthDirective(elementRef, ngModel);
    expect(directive).toBeTruthy();
  });
});
