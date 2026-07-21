import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ErrorReportingService } from './error-reporting.service';

describe('ErrorReportingService', () => {
  let service: ErrorReportingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(ErrorReportingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
