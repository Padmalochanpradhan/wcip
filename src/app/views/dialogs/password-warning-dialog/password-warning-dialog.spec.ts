import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordWarningDialog } from './password-warning-dialog';

describe('PasswordWarningDialog', () => {
  let component: PasswordWarningDialog;
  let fixture: ComponentFixture<PasswordWarningDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordWarningDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordWarningDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
