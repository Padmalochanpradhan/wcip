import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAction } from './add-action';

describe('AddAction', () => {
  let component: AddAction;
  let fixture: ComponentFixture<AddAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAction]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
