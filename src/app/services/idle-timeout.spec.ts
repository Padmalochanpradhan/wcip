import { TestBed } from '@angular/core/testing';

import { IdleTimeout } from './idle-timeout';

describe('IdleTimeout', () => {
  let service: IdleTimeout;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdleTimeout);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
