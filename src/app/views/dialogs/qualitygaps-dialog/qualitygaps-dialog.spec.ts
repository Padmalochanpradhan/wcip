import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualitygapsDialog } from './qualitygaps-dialog';

describe('QualitygapsDialog', () => {
  let component: QualitygapsDialog;
  let fixture: ComponentFixture<QualitygapsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualitygapsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualitygapsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
