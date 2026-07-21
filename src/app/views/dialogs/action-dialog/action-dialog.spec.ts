import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ActionDialog } from './action-dialog';

describe('ActionDialog', () => {
  let component: ActionDialog;
  let fixture: ComponentFixture<ActionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
