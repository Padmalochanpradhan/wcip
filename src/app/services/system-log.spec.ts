import { TestBed } from '@angular/core/testing';

import { SystemLog } from './system-log';

describe('SystemLog', () => {
  let service: SystemLog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemLog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
