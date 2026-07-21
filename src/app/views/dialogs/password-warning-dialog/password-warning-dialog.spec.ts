import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PasswordWarningDialog } from './password-warning-dialog';

describe('PasswordWarningDialog', () => {
  let component: PasswordWarningDialog;
  let fixture: ComponentFixture<PasswordWarningDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordWarningDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { message: '', is_password_expired: false } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordWarningDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
