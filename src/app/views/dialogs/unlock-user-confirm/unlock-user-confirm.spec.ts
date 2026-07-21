import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IStorageService, StorageService } from '../../../services/storage.service';

import { UnlockUserConfirm } from './unlock-user-confirm';

describe('UnlockUserConfirm', () => {
  let component: UnlockUserConfirm;
  let fixture: ComponentFixture<UnlockUserConfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnlockUserConfirm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: IStorageService, useClass: StorageService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnlockUserConfirm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
