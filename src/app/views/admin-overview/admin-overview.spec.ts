import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { AdminOverview } from './admin-overview';
import { AdminStateService } from '../../services/admin-state.service';
import { HeaderService } from '../../services/header.service';
import { SurveySubmission } from '../../models/survey.models';

function makeSubmission(overrides: Partial<SurveySubmission> = {}): SurveySubmission {
  return {
    id: 1,
    survey_id: 1,
    survey_title: 'Environmental Scan',
    user_id: 1,
    ward_id: 1,
    ward_name: 'Ward 1',
    location_text: 'Main St',
    status: 'submitted',
    ai_analysis: null,
    submitted_at: '2026-06-15T12:00:00.000Z',
    created_at: '2026-06-15T12:00:00.000Z',
    staff_name: 'Jane Doe',
    ...overrides,
  };
}

describe('AdminOverview', () => {
  let component: AdminOverview;
  let fixture: ComponentFixture<AdminOverview>;
  let state: AdminStateService;
  let navigateSpy: jasmine.Spy;
  let headerTitleSpy: jasmine.Spy;

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate');
    headerTitleSpy = jasmine.createSpy('setTitle');

    await TestBed.configureTestingModule({
      imports: [AdminOverview],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: HeaderService, useValue: { setTitle: headerTitleSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOverview);
    component = fixture.componentInstance;
    state = TestBed.inject(AdminStateService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sets the header title on init', () => {
    fixture.detectChanges();
    expect(headerTitleSpy).toHaveBeenCalledWith('ADMIN OVERVIEW');
  });

  it('exposes the shared AdminStateService as `state` for the template to read stats/charts from', () => {
    fixture.detectChanges();
    expect(component.state).toBe(state);
  });

  describe('openSub(id)', () => {
    it('navigates to the submission detail route', () => {
      fixture.detectChanges();
      component.openSub(17);
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/submissions', 17]);
    });
  });

  describe('openUrgentFlags()', () => {
    it('navigates to Admin Submissions pre-filtered to Urgent', () => {
      fixture.detectChanges();
      component.openUrgentFlags();
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/submissions'], { state: { quickFilter: 'urgent' } });
    });
  });

  describe('urgent flags list (delegated to AdminStateService)', () => {
    it('reflects state.urgentSubs once submissions are computed', () => {
      state.submissions = [
        makeSubmission({ id: 1, status: 'flagged' }),
        makeSubmission({ id: 2, status: 'submitted' }),
      ];
      state.compute();
      fixture.detectChanges();

      expect(component.state.urgentSubs.map(s => s.id)).toEqual([1]);
    });
  });
});
