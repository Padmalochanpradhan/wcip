import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { IStorageService, StorageService } from './storage.service';
import { IdleTimeoutService } from './idle-timeout';

describe('IdleTimeoutService', () => {
  let service: IdleTimeoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: IStorageService, useClass: StorageService },
      ],
    });
    service = TestBed.inject(IdleTimeoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
