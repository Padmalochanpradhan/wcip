import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OkDialogComponent } from './ok-dialog.component';

describe('OkDialogComponent', () => {
  let component: OkDialogComponent;
  let fixture: ComponentFixture<OkDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OkDialogComponent]
    });
    fixture = TestBed.createComponent(OkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
