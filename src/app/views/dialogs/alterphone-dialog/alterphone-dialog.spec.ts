import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlterphoneDialog } from './alterphone-dialog';

describe('AlterphoneDialog', () => {
  let component: AlterphoneDialog;
  let fixture: ComponentFixture<AlterphoneDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlterphoneDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlterphoneDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
