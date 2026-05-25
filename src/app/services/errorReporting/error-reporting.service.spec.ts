import { TestBed } from '@angular/core/testing';

import { ErrorReportingService } from './error-reporting.service';

describe('ErrorReportingService', () => {
  let service: ErrorReportingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorReportingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
