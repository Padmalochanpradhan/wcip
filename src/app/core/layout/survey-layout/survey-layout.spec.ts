import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { SurveyLayout } from './survey-layout';
import { SurveyService } from '../../../services/survey.service';
import { UserDataService } from '../../../services/user-data-service';
import { Survey } from '../../../models/survey.models';

function makeSurvey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: 1,
    title: 'Environmental Scan',
    slug: 'environmental-scan',
    description: '',
    icon: 'scan',
    survey_type: 'scan',
    daily_prompt: '',
    status: 'active',
    location_id: null,
    ...overrides,
  };
}

describe('SurveyLayout', () => {
  let component: SurveyLayout;
  let fixture: ComponentFixture<SurveyLayout>;
  let surveyServiceSpy: jasmine.SpyObj<Pick<SurveyService, 'getSurveys' | 'getTodayCount'>>;
  let userDataSpy: jasmine.SpyObj<Pick<UserDataService, 'getUser' | 'clearUser'>>;
  let todayCount$: BehaviorSubject<number>;
  let navigateSpy: jasmine.Spy;
  let currentUser: any;

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate');
    todayCount$ = new BehaviorSubject<number>(0);
    currentUser = { id: 3, name: 'Jane Doe' };

    surveyServiceSpy = jasmine.createSpyObj('SurveyService', ['getSurveys', 'getTodayCount']);
    surveyServiceSpy.getSurveys.and.resolveTo([]);
    surveyServiceSpy.getTodayCount.and.resolveTo(0);
    (surveyServiceSpy as any).todayCount$ = todayCount$.asObservable();

    userDataSpy = jasmine.createSpyObj('UserDataService', ['getUser', 'clearUser']);
    userDataSpy.getUser.and.callFake(() => currentUser);

    await TestBed.configureTestingModule({
      imports: [SurveyLayout],
      providers: [
        provideRouter([]),
        { provide: SurveyService, useValue: surveyServiceSpy },
        { provide: UserDataService, useValue: userDataSpy },
      ],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    fixture = TestBed.createComponent(SurveyLayout);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('sets a time-of-day greeting', () => {
      fixture.detectChanges();
      expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(component.greeting);
    });

    it('reads the user name, falling back to username', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.userName).toBe('Jane Doe');
    });

    it('falls back to username when name is absent', async () => {
      currentUser = { id: 3, username: 'jdoe' };
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.userName).toBe('jdoe');
    });

    it('only lists active surveys in the bottom nav', async () => {
      surveyServiceSpy.getSurveys.and.resolveTo([
        makeSurvey({ id: 1, status: 'active' }),
        makeSurvey({ id: 2, status: 'draft' }),
      ]);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.surveys.map(s => s.id)).toEqual([1]);
    });

    it('subscribes to todayCount$ and reflects new emissions', () => {
      fixture.detectChanges();
      todayCount$.next(7);
      expect(component.submittedCount).toBe(7);
    });

    it('does not throw and leaves surveys empty when the survey load fails', async () => {
      surveyServiceSpy.getSurveys.and.rejectWith(new Error('network down'));
      expect(() => fixture.detectChanges()).not.toThrow();
      await fixture.whenStable();
      expect(component.surveys).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes from todayCount$ so later emissions are ignored', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      todayCount$.next(42);
      expect(component.submittedCount).toBe(0);
    });
  });

  describe('icon helper', () => {
    it('getIcon() maps known icon keys and falls back to "assignment"', () => {
      expect(component.getIcon('target')).toBe('track_changes');
      expect(component.getIcon('unknown')).toBe('assignment');
    });
  });

  describe('changePassword()', () => {
    it('navigates to /change-password with a returnTo of /field-home', () => {
      fixture.detectChanges();
      component.changePassword();
      expect(navigateSpy).toHaveBeenCalledWith(['/change-password'], { state: { returnTo: '/field-home' } });
    });
  });

  describe('signOut()', () => {
    it('clears the session and navigates to /login', () => {
      fixture.detectChanges();
      component.signOut();
      expect(userDataSpy.clearUser).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
