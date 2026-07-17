import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SubmissionsList } from './submissions-list';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { HeaderService } from '../../services/header.service';
import { SurveySubmission } from '../../models/survey.models';
import { FLAGGING_ENABLED } from '../../config/feature-flags';

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

describe('SubmissionsList (My Submissions)', () => {
  let component: SubmissionsList;
  let fixture: ComponentFixture<SubmissionsList>;
  let surveyServiceSpy: jasmine.SpyObj<Pick<SurveyService, 'getSubmissions' | 'flagSubmission'>>;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate');
    surveyServiceSpy = jasmine.createSpyObj('SurveyService', ['getSubmissions', 'flagSubmission']);
    surveyServiceSpy.getSubmissions.and.resolveTo([]);
    surveyServiceSpy.flagSubmission.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [SubmissionsList],
      providers: [
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: SurveyService, useValue: surveyServiceSpy },
        { provide: UserDataService, useValue: { getUser: () => ({ id: 7 }) } },
        { provide: HeaderService, useValue: { setTitle: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionsList);
    component = fixture.componentInstance;
    // Deliberately not calling fixture.detectChanges() here — most tests set
    // `component.submissions` directly to exercise the filtering getters
    // without depending on the async ngOnInit fetch.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads submissions for the current user and clears isLoading', async () => {
      surveyServiceSpy.getSubmissions.and.resolveTo([makeSubmission({ id: 1 }), makeSubmission({ id: 2 })]);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(surveyServiceSpy.getSubmissions).toHaveBeenCalledWith(7);
      expect(component.submissions.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('sets loadError when the fetch fails', async () => {
      surveyServiceSpy.getSubmissions.and.rejectWith(new Error('network down'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.loadError).toBe('network down');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('flaggingEnabled', () => {
    it('mirrors the FLAGGING_ENABLED feature flag', () => {
      expect(component.flaggingEnabled).toBe(FLAGGING_ENABLED);
    });
  });

  describe('quick filter chips', () => {
    beforeEach(() => {
      component.submissions = [
        makeSubmission({ id: 1, survey_title: 'Narrative Field Input' }),
        makeSubmission({ id: 2, survey_title: 'Environmental Scan' }),
        makeSubmission({ id: 3, survey_title: 'Environmental Scan', status: 'flagged' }),
      ];
    });

    it('"all" shows every submission', () => {
      component.quickFilter = 'all';
      expect(component.filteredSubmissions.length).toBe(3);
    });

    it('"urgent" shows only urgent submissions', () => {
      component.quickFilter = 'urgent';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([3]);
    });

    it('a survey-title chip narrows to that survey', () => {
      component.quickFilter = 'Narrative Field Input';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([1]);
    });

    it('surveyChips reports counts per survey title', () => {
      expect(component.surveyChips).toEqual([
        { title: 'Environmental Scan', count: 2 },
        { title: 'Narrative Field Input', count: 1 },
      ]);
    });

    it('urgentCount reflects the number of urgent submissions', () => {
      expect(component.urgentCount).toBe(1);
    });
  });

  describe('advanced search filters', () => {
    beforeEach(() => {
      component.submissions = [
        makeSubmission({ id: 1, ward_name: 'Ward 1', submitted_at: '2026-06-01T00:00:00.000Z' }),
        makeSubmission({ id: 2, ward_name: 'Ward 2', submitted_at: '2026-06-20T00:00:00.000Z' }),
      ];
    });

    it('filters by ward', () => {
      component.filterWard = 'Ward 2';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([2]);
    });

    it('filters by date range', () => {
      component.filterDateFrom = '2026-06-10';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([2]);
    });

    it('wardOptions lists distinct ward names', () => {
      expect(component.wardOptions).toEqual(['Ward 1', 'Ward 2']);
    });

    it('hasActiveFilters + clearFilters()', () => {
      expect(component.hasActiveFilters).toBeFalse();
      component.filterWard = 'Ward 1';
      expect(component.hasActiveFilters).toBeTrue();
      component.clearFilters();
      expect(component.hasActiveFilters).toBeFalse();
      expect(component.filteredSubmissions.length).toBe(2);
    });
  });

  describe('markFlagged()', () => {
    it('optimistically flags the submission and tracks in-flight state', async () => {
      const sub = makeSubmission({ id: 5, status: 'submitted' });
      const event = new Event('click');
      spyOn(event, 'stopPropagation');

      const promise = component.markFlagged(event, sub);
      expect(component.flagging.has(5)).toBeTrue();
      await promise;

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(surveyServiceSpy.flagSubmission).toHaveBeenCalledWith(5);
      expect(sub.status).toBe('flagged');
      expect(component.flagging.has(5)).toBeFalse();
    });

    it('leaves status unchanged if the API call fails', async () => {
      surveyServiceSpy.flagSubmission.and.rejectWith(new Error('failed'));
      const sub = makeSubmission({ id: 6, status: 'submitted' });

      await component.markFlagged(new Event('click'), sub);

      expect(sub.status).toBe('submitted');
      expect(component.flagging.has(6)).toBeFalse();
    });

    it('is a no-op if already flagging that submission', async () => {
      const sub = makeSubmission({ id: 7 });
      component.flagging.add(7);

      await component.markFlagged(new Event('click'), sub);

      expect(surveyServiceSpy.flagSubmission).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('openDetail() navigates to the submission detail route', () => {
      component.openDetail(9);
      expect(navigateSpy).toHaveBeenCalledWith(['/submissions', 9]);
    });

    it('goBack() navigates to /field-home', () => {
      component.goBack();
      expect(navigateSpy).toHaveBeenCalledWith(['/field-home']);
    });
  });

  describe('display helpers', () => {
    it('aiSnippet() truncates long summaries to 90 chars with an ellipsis', () => {
      const long = 'x'.repeat(120);
      const sub = makeSubmission({ ai_analysis: { summary: long, scores: [], themes: [] } });
      expect(component.aiSnippet(sub).length).toBe(91); // 90 chars + ellipsis
      expect(component.aiSnippet(sub).endsWith('…')).toBeTrue();
    });

    it('aiSnippet() returns short summaries unchanged', () => {
      const sub = makeSubmission({ ai_analysis: { summary: 'short summary', scores: [], themes: [] } });
      expect(component.aiSnippet(sub)).toBe('short summary');
    });

    it('statusClass() maps known statuses and falls back to draft', () => {
      expect(component.statusClass('flagged')).toBe('sl-status-flagged');
      expect(component.statusClass('bogus')).toBe('sl-status-draft');
    });
  });
});
