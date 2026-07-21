import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { SurveyDashboard } from './survey-dashboard';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { HeaderService } from '../../services/header.service';
import { Survey } from '../../models/survey.models';

function makeSurvey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: 1,
    title: 'Environmental Scan',
    slug: 'environmental-scan',
    description: '',
    icon: 'scan',
    survey_type: 'scan',
    daily_prompt: 'What did you observe today?',
    status: 'active',
    location_id: null,
    ...overrides,
  };
}

describe('SurveyDashboard', () => {
  let component: SurveyDashboard;
  let fixture: ComponentFixture<SurveyDashboard>;
  let surveyServiceSpy: jasmine.SpyObj<Pick<SurveyService, 'getSurveys' | 'getTodayCount'>>;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate');
    surveyServiceSpy = jasmine.createSpyObj('SurveyService', ['getSurveys', 'getTodayCount']);
    surveyServiceSpy.getSurveys.and.resolveTo([]);
    surveyServiceSpy.getTodayCount.and.resolveTo(0);

    await TestBed.configureTestingModule({
      imports: [SurveyDashboard],
      providers: [
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: Title, useValue: { setTitle: () => {} } },
        { provide: SurveyService, useValue: surveyServiceSpy },
        { provide: UserDataService, useValue: { getUser: () => ({ id: 3 }) } },
        { provide: HeaderService, useValue: { setTitle: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyDashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('only shows active surveys, filtering out draft/archived ones from the API response', async () => {
      surveyServiceSpy.getSurveys.and.resolveTo([
        makeSurvey({ id: 1, status: 'active' }),
        makeSurvey({ id: 2, status: 'draft' }),
        makeSurvey({ id: 3, status: 'archived' }),
        makeSurvey({ id: 4, status: 'active' }),
      ]);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.surveys.map(s => s.id)).toEqual([1, 4]);
    });

    it('sets todayPrompt from the first active survey', async () => {
      surveyServiceSpy.getSurveys.and.resolveTo([
        makeSurvey({ id: 1, status: 'active', daily_prompt: 'Prompt A' }),
      ]);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.todayPrompt).toBe('Prompt A');
    });

    it('leaves todayPrompt empty when there are no active surveys', async () => {
      surveyServiceSpy.getSurveys.and.resolveTo([makeSurvey({ status: 'draft' })]);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.todayPrompt).toBe('');
    });

    it('fetches submittedToday count for the current user', async () => {
      surveyServiceSpy.getTodayCount.and.resolveTo(5);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(surveyServiceSpy.getTodayCount).toHaveBeenCalledWith(3);
      expect(component.submittedToday).toBe(5);
    });

    it('clears isLoading and swallows errors if the load fails', async () => {
      surveyServiceSpy.getSurveys.and.rejectWith(new Error('network down'));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.isLoading).toBeFalse();
      expect(component.surveys).toEqual([]);
    });
  });

  describe('icon helpers', () => {
    it('getIcon() maps known icon keys and falls back to "assignment"', () => {
      expect(component.getIcon('leaf')).toBe('eco');
      expect(component.getIcon('unknown')).toBe('assignment');
    });

    it('getIconBg()/getIconColor() fall back to defaults for unknown icons', () => {
      expect(component.getIconBg('unknown')).toBe(component.iconBg['default']);
      expect(component.getIconColor('unknown')).toBe(component.iconColor['default']);
    });
  });

  describe('navigation', () => {
    beforeEach(() => fixture.detectChanges());

    it('openSurvey(id) navigates to /survey/:id', () => {
      component.openSurvey(9);
      expect(navigateSpy).toHaveBeenCalledWith(['/survey', 9]);
    });

    it('openSubmissions() navigates to /submissions', () => {
      component.openSubmissions();
      expect(navigateSpy).toHaveBeenCalledWith(['/submissions']);
    });

    it('openDataExplorer() navigates to /data-explorer', () => {
      component.openDataExplorer();
      expect(navigateSpy).toHaveBeenCalledWith(['/data-explorer']);
    });
  });
});
