import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignplanDialog } from './assignplan-dialog';

describe('AssignplanDialog', () => {
  let component: AssignplanDialog;
  let fixture: ComponentFixture<AssignplanDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignplanDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignplanDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
