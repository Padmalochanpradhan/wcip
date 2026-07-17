import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { OkDialogComponent } from './ok-dialog.component';

describe('OkDialogComponent', () => {
  let component: OkDialogComponent;
  let fixture: ComponentFixture<OkDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OkDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    });
    fixture = TestBed.createComponent(OkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
