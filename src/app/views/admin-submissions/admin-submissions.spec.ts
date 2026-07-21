import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { AdminSubmissions } from './admin-submissions';
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

describe('AdminSubmissions', () => {
  let component: AdminSubmissions;
  let fixture: ComponentFixture<AdminSubmissions>;
  let state: AdminStateService;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate');
    history.replaceState(null, ''); // clear any leftover state from other specs

    await TestBed.configureTestingModule({
      imports: [AdminSubmissions],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: HeaderService, useValue: { setTitle: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSubmissions);
    component = fixture.componentInstance;
    state = TestBed.inject(AdminStateService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('quick filter chips', () => {
    beforeEach(() => {
      state.submissions = [
        makeSubmission({ id: 1, survey_title: 'Narrative Field Input' }),
        makeSubmission({ id: 2, survey_title: 'Environmental Scan' }),
        makeSubmission({ id: 3, survey_title: 'Environmental Scan', status: 'flagged' }),
      ];
      fixture.detectChanges();
    });

    it('"all" shows every submission', () => {
      component.selectQuickFilter('all');
      expect(component.filteredSubmissions.length).toBe(3);
    });

    it('"urgent" shows only urgent submissions', () => {
      component.selectQuickFilter('urgent');
      expect(component.filteredSubmissions.length).toBe(1);
      expect(component.filteredSubmissions[0].id).toBe(3);
    });

    it('a survey-title chip shows only matching submissions', () => {
      component.selectQuickFilter('Narrative Field Input');
      expect(component.filteredSubmissions.length).toBe(1);
      expect(component.filteredSubmissions[0].id).toBe(1);
    });
  });

  describe('free-text search box', () => {
    beforeEach(() => {
      state.submissions = [
        makeSubmission({ id: 1, staff_name: 'Chidi Okoro', ward_name: 'Ward 2', location_text: 'Alabama Ave' }),
        makeSubmission({ id: 2, staff_name: 'Briana Hodge', ward_name: 'Ward 6', location_text: 'H St' }),
      ];
      fixture.detectChanges();
    });

    it('matches on staff name (case-insensitive)', () => {
      component.searchQuery = 'chidi';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([1]);
    });

    it('matches on ward name', () => {
      component.searchQuery = 'ward 6';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([2]);
    });

    it('matches on location text', () => {
      component.searchQuery = 'alabama';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([1]);
    });

    it('an empty query returns everything', () => {
      component.searchQuery = '';
      expect(component.filteredSubmissions.length).toBe(2);
    });

    it('onSearch() reads the input value and resets paging', () => {
      component.displayLimit = 999;
      const input = document.createElement('input');
      input.value = 'briana';
      component.onSearch({ target: input } as unknown as Event);
      expect(component.searchQuery).toBe('briana');
      expect(component.displayLimit).toBe(component.PAGE_SIZE);
    });
  });

  describe('advanced search filters', () => {
    beforeEach(() => {
      state.submissions = [
        makeSubmission({ id: 1, ward_name: 'Ward 1', survey_title: 'Environmental Scan', staff_name: 'A', submitted_at: '2026-06-01T00:00:00.000Z' }),
        makeSubmission({ id: 2, ward_name: 'Ward 2', survey_title: 'Narrative Field Input', staff_name: 'B', submitted_at: '2026-06-20T00:00:00.000Z' }),
      ];
      fixture.detectChanges();
    });

    it('filters by ward, delegating to the shared AdminStateService', () => {
      component.filterWard = 'Ward 2';
      expect(state.filterWard).toBe('Ward 2');
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([2]);
    });

    it('filters by survey', () => {
      component.filterSurvey = 'Narrative Field Input';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([2]);
    });

    it('filters by staff/user', () => {
      component.filterUser = 'A';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([1]);
    });

    it('filters by date range', () => {
      component.filterDateFrom = '2026-06-10';
      expect(component.filteredSubmissions.map(s => s.id)).toEqual([2]);
    });

    it('hasActiveFilters is true once any filter is set, false when cleared', () => {
      expect(component.hasActiveFilters).toBeFalse();
      component.filterWard = 'Ward 2';
      expect(component.hasActiveFilters).toBeTrue();
      component.clearFilters();
      expect(component.hasActiveFilters).toBeFalse();
      expect(component.filteredSubmissions.length).toBe(2);
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      state.submissions = Array.from({ length: 60 }, (_, i) => makeSubmission({ id: i + 1 }));
      fixture.detectChanges();
    });

    it('shows only the first PAGE_SIZE submissions initially', () => {
      expect(component.visibleSubmissions.length).toBe(component.PAGE_SIZE);
      expect(component.hasMore).toBeTrue();
      expect(component.remainingCount).toBe(60 - component.PAGE_SIZE);
    });

    it('loadMore() reveals another page', () => {
      component.loadMore();
      expect(component.visibleSubmissions.length).toBe(component.PAGE_SIZE * 2);
    });

    it('showAll() reveals every filtered submission', () => {
      component.showAll();
      expect(component.visibleSubmissions.length).toBe(60);
      expect(component.hasMore).toBeFalse();
    });

    it('changing the quick filter resets pagination back to one page', () => {
      component.loadMore();
      expect(component.displayLimit).toBeGreaterThan(component.PAGE_SIZE);
      component.selectQuickFilter('all');
      expect(component.displayLimit).toBe(component.PAGE_SIZE);
    });

    it('nextBatchSize caps at the remaining count near the end of the list', () => {
      component.displayLimit = 55;
      expect(component.nextBatchSize).toBe(5);
    });
  });

  describe('navigation', () => {
    beforeEach(() => fixture.detectChanges());

    it('openDetail() navigates to the submission detail route', () => {
      component.openDetail(42);
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/submissions', 42]);
    });

    it('goBack() navigates to /admin', () => {
      component.goBack();
      expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('arriving from the Overview "Urgent Flags" tile', () => {
    it('pre-selects the Urgent quick filter when router state carries quickFilter', () => {
      history.pushState({ quickFilter: 'urgent' }, '');
      fixture.detectChanges(); // runs ngOnInit
      expect(component.quickFilter).toBe('urgent');
    });

    it('defaults to "all" when arriving with no router state', () => {
      history.replaceState(null, '');
      fixture.detectChanges();
      expect(component.quickFilter).toBe('all');
    });
  });
});
