import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlteraddressDialog } from './alteraddress-dialog';

describe('AlteraddressDialog', () => {
  let component: AlteraddressDialog;
  let fixture: ComponentFixture<AlteraddressDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlteraddressDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlteraddressDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
