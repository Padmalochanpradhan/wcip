import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { SystemLogService } from './system-log';

describe('SystemLogService', () => {
  let service: SystemLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(SystemLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
