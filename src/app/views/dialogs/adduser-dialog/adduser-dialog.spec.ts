import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdduserDialog } from './adduser-dialog';

describe('AdduserDialog', () => {
  let component: AdduserDialog;
  let fixture: ComponentFixture<AdduserDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdduserDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdduserDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
