import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlansDialog } from './plans-dialog';

describe('PlansDialog', () => {
  let component: PlansDialog;
  let fixture: ComponentFixture<PlansDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlansDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlansDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
