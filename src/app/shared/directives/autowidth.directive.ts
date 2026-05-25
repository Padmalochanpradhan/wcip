import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appAutowidth]'
})
export class AutowidthDirective implements OnInit, OnDestroy  {
  @Input() minWidth: number=45; // Input property to set the min width
  @Input() font: string | null = null; // Input property to set the font
  private valueChangesSub: Subscription | null = null;
  
  constructor(private readonly el: ElementRef,private readonly ngModel: NgModel) { 
    this.el.nativeElement.style.width = `${this.minWidth}px`;
  }
  
  ngOnInit() {
    this.valueChangesSub = this.ngModel.valueChanges?.subscribe(() => {
      this.resize();
    }) ?? null;
    

    // Resize based on initial value
    this.resize(); 
  }
  ngOnDestroy() {
    this.valueChangesSub?.unsubscribe();
  }

  @HostListener('ngModelChange', ['$event'])
  inputChanged(value: any) {
    this.resize();
  }

  private resize() {
    const text = this.el.nativeElement.value || '';
    const calculatedWidth = this.getTextWidth(text, this.font);

    // Adjust width for spinner if type is "number"
    const spinnerWidth = this.el.nativeElement.type === 'number' ? 20 : 0;

    const width = Math.max(this.minWidth, calculatedWidth + 10 + spinnerWidth); // Add padding and spinner width
    this.el.nativeElement.style.width=`${width}px`;
  }
  getTextWidth(text:string, font:string | null) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if(!context) return this.minWidth;
    //context.font ='14px / 20px Roboto'; //font || getComputedStyle(document.body).font;
    // Use custom font if provided, otherwise fallback to computed style
    context.font =window.getComputedStyle(this.el.nativeElement).font;
    return context.measureText(text).width;
  }
}
