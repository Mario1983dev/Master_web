import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibrosCv } from './libros-cv';

describe('LibrosCv', () => {
  let component: LibrosCv;
  let fixture: ComponentFixture<LibrosCv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibrosCv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibrosCv);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
