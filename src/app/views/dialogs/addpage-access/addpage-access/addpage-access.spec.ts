import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddpageAccess } from './addpage-access';

describe('AddpageAccess', () => {
  let component: AddpageAccess;
  let fixture: ComponentFixture<AddpageAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddpageAccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddpageAccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
