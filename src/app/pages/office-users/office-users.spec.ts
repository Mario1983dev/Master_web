import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeUsers } from './office-users';

describe('OfficeUsers', () => {
  let component: OfficeUsers;
  let fixture: ComponentFixture<OfficeUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeUsers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeUsers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
