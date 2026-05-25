import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnlockUserConfirm } from './unlock-user-confirm';

describe('UnlockUserConfirm', () => {
  let component: UnlockUserConfirm;
  let fixture: ComponentFixture<UnlockUserConfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnlockUserConfirm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnlockUserConfirm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
