import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Usercreation } from './usercreation';

describe('Usercreation', () => {
  let component: Usercreation;
  let fixture: ComponentFixture<Usercreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Usercreation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Usercreation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
