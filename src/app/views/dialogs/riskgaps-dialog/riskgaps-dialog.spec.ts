import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskgapsDialog } from './riskgaps-dialog';

describe('RiskgapsDialog', () => {
  let component: RiskgapsDialog;
  let fixture: ComponentFixture<RiskgapsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskgapsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskgapsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
