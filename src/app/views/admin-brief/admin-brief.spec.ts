import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';

import { AdminBrief } from './admin-brief';
import { AdminStateService } from '../../services/admin-state.service';
import { SurveyService } from '../../services/survey.service';
import { SurveySubmission, CommunityBenchmarks } from '../../models/survey.models';

function makeBenchmarks(overrides: Partial<CommunityBenchmarks> = {}): CommunityBenchmarks {
  const live = (source: string, citation: string, metrics: { label: string; value: string }[]) =>
    ({ source, citation, live: true, metrics });
  const stat = (source: string, citation: string, metrics: { label: string; value: string }[]) =>
    ({ source, citation, live: false, placeholder: true, metrics });
  return {
    census: live('U.S. Census Bureau ACS 2022 5-Year Estimates', 'Verify at data.census.gov', [{ label: 'Uninsured rate', value: '5.0%' }]),
    brfss:  live('CDC BRFSS', 'Figures are DC estimates; verify at cdc.gov/brfss for current data', [{ label: 'Fair or poor health', value: '11.5%' }]),
    eji:    live('CDC/ATSDR Environmental Justice Index 2022', 'Verify at atsdr.cdc.gov/placeandhealth/eji', [{ label: 'EJI percentile', value: '42nd' }]),
    ncqa:   stat('NCQA State of Health Care Quality MY 2023', 'ncqa.org/hedis', [{ label: 'Well-child visits', value: 'TBD — verify at ncqa.org' }]),
    samhsa: stat('SAMHSA 2023 NSDUH', 'samhsa.gov/data', [{ label: 'Any mental illness', value: 'TBD — verify at samhsa.gov' }]),
    ...overrides,
  };
}

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

describe('AdminBrief', () => {
  let component: AdminBrief;
  let fixture: ComponentFixture<AdminBrief>;
  let state: AdminStateService;
  let titleSpy: jasmine.Spy;
  let surveyServiceSpy: jasmine.SpyObj<Pick<SurveyService, 'getAllSubmissions' | 'getCommunityBenchmarks'>>;

  beforeEach(async () => {
    titleSpy = jasmine.createSpy('setTitle');
    surveyServiceSpy = jasmine.createSpyObj('SurveyService', ['getAllSubmissions', 'getCommunityBenchmarks']);
    surveyServiceSpy.getAllSubmissions.and.resolveTo([]);
    surveyServiceSpy.getCommunityBenchmarks.and.resolveTo(makeBenchmarks());

    await TestBed.configureTestingModule({
      imports: [AdminBrief],
      providers: [
        { provide: Title, useValue: { setTitle: titleSpy } },
        { provide: SurveyService, useValue: surveyServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBrief);
    component = fixture.componentInstance;
    state = TestBed.inject(AdminStateService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sets the browser tab title on init', () => {
    fixture.detectChanges();
    expect(titleSpy).toHaveBeenCalledWith('WellCentricPulse : COMMUNITY INTELLIGENCE BRIEF');
  });

  it('loads submissions via AdminStateService on init', () => {
    fixture.detectChanges();
    expect(surveyServiceSpy.getAllSubmissions).toHaveBeenCalled();
  });

  it('exposes the shared AdminStateService as `state` for the template to read stats from', () => {
    fixture.detectChanges();
    expect(component.state).toBe(state);
  });

  describe('refresh()', () => {
    it('reloads data through AdminStateService', async () => {
      fixture.detectChanges();
      surveyServiceSpy.getAllSubmissions.calls.reset();
      await component.refresh();
      expect(surveyServiceSpy.getAllSubmissions).toHaveBeenCalledTimes(1);
    });

    it('also reloads community benchmarks', async () => {
      fixture.detectChanges();
      surveyServiceSpy.getCommunityBenchmarks.calls.reset();
      await component.refresh();
      expect(surveyServiceSpy.getCommunityBenchmarks).toHaveBeenCalledTimes(1);
    });
  });

  describe('print()', () => {
    it('invokes window.print', () => {
      const printSpy = spyOn(window, 'print');
      component.print();
      expect(printSpy).toHaveBeenCalled();
    });
  });

  describe('rendered stats (delegated to AdminStateService)', () => {
    beforeEach(() => {
      // ngOnInit's own state.load() is async and would otherwise race with
      // (and clobber) the state this describe block sets up synchronously.
      spyOn(state, 'load').and.resolveTo(undefined);
    });

    it('reflects state.total once submissions are computed', () => {
      state.submissions = [
        makeSubmission({ id: 1 }),
        makeSubmission({ id: 2 }),
      ];
      state.compute();
      fixture.detectChanges();

      expect(component.state.total).toBe(2);
    });

    it('shows the urgent flags stat card only when there are urgent flags', () => {
      state.submissions = [makeSubmission({ id: 1, status: 'submitted' })];
      state.compute();
      fixture.detectChanges();

      let card = fixture.nativeElement.querySelector('.acb-stat-urgent');
      expect(card).toBeNull();

      state.submissions = [makeSubmission({ id: 1, status: 'flagged' })];
      state.compute();
      fixture.detectChanges();

      card = fixture.nativeElement.querySelector('.acb-stat-urgent');
      expect(card).not.toBeNull();
    });

    it('renders one theme row per topThemes entry', () => {
      state.submissions = [
        makeSubmission({ id: 1, ai_analysis: { summary: '', scores: [], themes: [], category: 'Housing' } }),
        makeSubmission({ id: 2, ai_analysis: { summary: '', scores: [], themes: [], category: 'Housing' } }),
        makeSubmission({ id: 3, ai_analysis: { summary: '', scores: [], themes: [], category: 'Safety' } }),
      ];
      state.compute();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.acb-theme-row');
      expect(rows.length).toBe(state.topThemes.length);
      expect(rows.length).toBe(2);
    });

    it('renders one signal card per urgent submission', () => {
      state.submissions = [
        makeSubmission({ id: 1, status: 'flagged' }),
        makeSubmission({ id: 2, status: 'submitted' }),
      ];
      state.compute();
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.acb-signal-card');
      expect(cards.length).toBe(state.urgentSubs.length);
      expect(cards.length).toBe(1);
    });
  });

  describe('Community context — public data benchmarks', () => {
    it('shows a spinner while benchmarks are loading', () => {
      // Keep state.isLoading resolved false so the outer @if that gates the
      // whole page body doesn't itself hide the benchmarks card during this
      // synchronous (never-awaited) assertion.
      spyOn(state, 'load').and.resolveTo(undefined);
      surveyServiceSpy.getCommunityBenchmarks.and.returnValue(new Promise(() => {})); // never resolves
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.acb-bench-loader')).not.toBeNull();
    });

    it('renders one card per benchmark source once loaded', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.acb-bench-card');
      expect(cards.length).toBe(5);
    });

    it('marks live sources with a Live badge and static sources with a Reference badge', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.acb-bench-live').length).toBe(3);
      expect(fixture.nativeElement.querySelectorAll('.acb-bench-static').length).toBe(2);
    });

    it('shows an "Unavailable" note for a source whose live fetch failed', async () => {
      surveyServiceSpy.getCommunityBenchmarks.and.resolveTo(makeBenchmarks({
        eji: {
          source: 'CDC/ATSDR Environmental Justice Index 2022',
          citation: 'Verify at atsdr.cdc.gov/placeandhealth/eji',
          live: false,
          error: 'onemap.cdc.gov timed out',
          metrics: [],
        },
      }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Unavailable');
    });

    it('shows the benchmarks error message when the whole call fails', async () => {
      surveyServiceSpy.getCommunityBenchmarks.and.rejectWith(new Error('Network error'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const err = fixture.nativeElement.querySelector('.acb-bench-error');
      expect(err).not.toBeNull();
      expect(err.textContent).toContain('Network error');
    });
  });

  describe('loading / error states', () => {
    beforeEach(() => {
      // Same rationale as the "rendered stats" block above — prevent ngOnInit's
      // own load() from racing with (and overwriting) these directly-set states.
      spyOn(state, 'load').and.resolveTo(undefined);
    });

    it('shows a spinner while isLoading is true', () => {
      state.isLoading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.acb-loader')).not.toBeNull();
    });

    it('shows the error banner when loadError is set', () => {
      state.isLoading = false;
      state.loadError = 'Network error';
      fixture.detectChanges();
      const err = fixture.nativeElement.querySelector('.acb-error');
      expect(err).not.toBeNull();
      expect(err.textContent).toContain('Network error');
    });
  });
});
