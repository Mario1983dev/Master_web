import { TestBed } from '@angular/core/testing';

import { AuthMaster } from './auth-master';

describe('AuthMaster', () => {
  let service: AuthMaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthMaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
