import { TestBed } from '@angular/core/testing';

import { LibrosCv } from './libros-cv';

describe('LibrosCv', () => {
  let service: LibrosCv;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LibrosCv);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
