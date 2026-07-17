import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IStorageService, StorageService } from '../../../../services/storage.service';

import { AddpageAccess } from './addpage-access';

describe('AddpageAccess', () => {
  let component: AddpageAccess;
  let fixture: ComponentFixture<AddpageAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddpageAccess],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: IStorageService, useClass: StorageService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddpageAccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
