import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AdduserDialog } from './adduser-dialog';

describe('AdduserDialog', () => {
  let component: AdduserDialog;
  let fixture: ComponentFixture<AdduserDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdduserDialog],
      providers: [
        provideHttpClient(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdduserDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
