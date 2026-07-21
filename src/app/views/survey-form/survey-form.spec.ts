import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';

import { SurveyForm } from './survey-form';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { ConfigService } from '../../services/api.service';
import { SurveyDetail, SurveyQuestion, SurveySection, Ward } from '../../models/survey.models';

function makeQuestion(overrides: Partial<SurveyQuestion> = {}): SurveyQuestion {
  return {
    id: 1,
    map_id: 1,
    code: 'q1',
    label: 'Notes',
    helper_text: null,
    placeholder: null,
    question_type: 'textarea',
    is_required: false,
    display_order: 1,
    options: [],
    ...overrides,
  };
}

function makeSection(overrides: Partial<SurveySection> = {}): SurveySection {
  return {
    id: 1,
    title: 'General',
    subtitle: null,
    icon: null,
    badge_label: null,
    is_collapsible: false,
    is_required: false,
    display_order: 1,
    questions: [],
    ...overrides,
  };
}

function makeSurvey(overrides: Partial<SurveyDetail> = {}): SurveyDetail {
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
    sections: [makeSection({ id: 1, questions: [makeQuestion()] })],
    ...overrides,
  };
}

const WARDS: Ward[] = [{ id: 1, name: 'Ward 1', code: 'W1' }];

describe('SurveyForm', () => {
  let component: SurveyForm;
  let fixture: ComponentFixture<SurveyForm>;
  let surveyServiceSpy: jasmine.SpyObj<Pick<SurveyService,
    'getSurveyDetail' | 'getWards' | 'analyzeNarrative' | 'analyzeEnvScan' | 'incrementTodayCount'>>;
  let userDataSpy: jasmine.SpyObj<Pick<UserDataService, 'getUser'>>;
  let apiServiceSpy: jasmine.SpyObj<Pick<ConfigService, 'insert'>>;
  let navigateSpy: jasmine.Spy;
  let paramMap$: Observable<ParamMap>;
  let currentUser: any;

  function setup(survey: SurveyDetail | null = makeSurvey()) {
    surveyServiceSpy.getSurveyDetail.and.resolveTo(survey as SurveyDetail);
    fixture = TestBed.createComponent(SurveyForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return fixture.whenStable();
  }

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate');
    currentUser = { ID: 42, FistName: 'Jane', LastName: 'Doe' };
    paramMap$ = of(convertToParamMap({ id: '1' }));

    surveyServiceSpy = jasmine.createSpyObj('SurveyService',
      ['getSurveyDetail', 'getWards', 'analyzeNarrative', 'analyzeEnvScan', 'incrementTodayCount']);
    surveyServiceSpy.getSurveyDetail.and.resolveTo(makeSurvey());
    surveyServiceSpy.getWards.and.resolveTo(WARDS);
    surveyServiceSpy.analyzeEnvScan.and.resolveTo({ summary: '', scores: [], themes: [] });
    surveyServiceSpy.analyzeNarrative.and.resolveTo({
      summary: '', themes: [], urgency: '', urgency_label: '', trust_signal: '', trust_label: '',
    });

    userDataSpy = jasmine.createSpyObj('UserDataService', ['getUser']);
    userDataSpy.getUser.and.callFake(() => currentUser);

    apiServiceSpy = jasmine.createSpyObj('ConfigService', ['insert']);
    apiServiceSpy.insert.and.resolveTo({});

    await TestBed.configureTestingModule({
      imports: [SurveyForm],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: SurveyService, useValue: surveyServiceSpy },
        { provide: UserDataService, useValue: userDataSpy },
        { provide: ConfigService, useValue: apiServiceSpy },
      ],
    }).compileComponents();
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / active-survey guard', () => {
    it('loads the survey and wards for an active survey', async () => {
      await setup(makeSurvey({ status: 'active' }));
      expect(component.survey?.id).toBe(1);
      expect(component.wards).toEqual(WARDS);
      expect(component.isLoading).toBeFalse();
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('expands the first collapsible section on load', async () => {
      const survey = makeSurvey({
        sections: [
          makeSection({ id: 10, is_collapsible: false }),
          makeSection({ id: 20, is_collapsible: true }),
          makeSection({ id: 30, is_collapsible: true }),
        ],
      });
      await setup(survey);
      expect(component.expanded[20]).toBeTrue();
      expect(component.expanded[30]).toBeFalsy();
    });

    it('bounces a draft survey back to /field-home without ever setting it on the component', async () => {
      await setup(makeSurvey({ status: 'draft' }));
      expect(component.survey).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/field-home']);
    });

    it('bounces an archived survey back to /field-home', async () => {
      await setup(makeSurvey({ status: 'archived' }));
      expect(component.survey).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/field-home']);
    });

    it('sets loadError if the fetch fails', async () => {
      surveyServiceSpy.getSurveyDetail.and.rejectWith(new Error('network down'));
      fixture = TestBed.createComponent(SurveyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.loadError).toBe('network down');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('chip / answer helpers', () => {
    beforeEach(() => setup());

    it('selectSingle() sets a single answer and toggles it off on repeat', () => {
      component.selectSingle(1, 5);
      expect(component.isSelected(1, 5)).toBeTrue();
      component.selectSingle(1, 5);
      expect(component.isSelected(1, 5)).toBeFalse();
    });

    it('selectSingle() replaces any previous single selection', () => {
      component.selectSingle(1, 5);
      component.selectSingle(1, 6);
      expect(component.optionAnswers[1]).toEqual([6]);
    });

    it('toggleMulti() adds and removes options independently', () => {
      component.toggleMulti(2, 1);
      component.toggleMulti(2, 2);
      expect(component.optionAnswers[2]).toEqual([1, 2]);
      component.toggleMulti(2, 1);
      expect(component.optionAnswers[2]).toEqual([2]);
    });

    it('setBool() toggles a YES/NO answer off when set again', () => {
      component.setBool(3, 'YES');
      expect(component.textAnswers[3]).toBe('YES');
      component.setBool(3, 'YES');
      expect(component.textAnswers[3]).toBe('');
    });

    it('setRating() toggles a star rating off when set again', () => {
      component.setRating(4, 3);
      expect(component.textAnswers[4]).toBe('3');
      component.setRating(4, 3);
      expect(component.textAnswers[4]).toBe('');
    });

    it('toggleSection()/isSectionVisible() flip visibility for collapsible sections', () => {
      expect(component.isSectionVisible(99, true)).toBeFalse();
      component.toggleSection(99);
      expect(component.isSectionVisible(99, true)).toBeTrue();
    });

    it('non-collapsible sections are always visible', () => {
      expect(component.isSectionVisible(1, false)).toBeTrue();
    });
  });

  describe('getSectionIcon()', () => {
    beforeEach(() => setup());

    it('matches a known icon substring case-insensitively', () => {
      expect(component.getSectionIcon('LEAF')).toBe('eco');
      expect(component.getSectionIcon('green-space')).toBe('park');
    });

    it('falls back to "category" for null or unrecognized icons', () => {
      expect(component.getSectionIcon(null)).toBe('category');
      expect(component.getSectionIcon('zzz-unknown')).toBe('category');
    });
  });

  describe('analyzeAndSubmit()', () => {
    it('does nothing if the survey has not loaded', async () => {
      await setup(null);
      await component.analyzeAndSubmit();
      expect(surveyServiceSpy.analyzeEnvScan).not.toHaveBeenCalled();
    });

    it('blocks with an error if no section has any answer yet', async () => {
      await setup(makeSurvey({ sections: [makeSection({ id: 1, questions: [makeQuestion({ id: 1 })] })] }));
      await component.analyzeAndSubmit();
      expect(component.analyzeError).toBe('Please complete at least one section before submitting.');
      expect(surveyServiceSpy.analyzeEnvScan).not.toHaveBeenCalled();
    });

    it('env-scan survey calls analyzeEnvScan and maps scores to severity classes', async () => {
      await setup(makeSurvey({ survey_type: 'scan' }));
      component.textAnswers[1] = 'Sidewalks are cracked';
      surveyServiceSpy.analyzeEnvScan.and.resolveTo({
        summary: 'Summary text',
        scores: [
          { label: 'Safety', value: 'High' },
          { label: 'Safety', value: 'Moderate' },
          { label: 'Safety', value: 'Low' },
          { label: 'Environmental burden', value: 'High' },
          { label: 'Food access', value: 'Good' },
          { label: 'Built environment', value: 'Unrecognized' },
        ],
        themes: ['infrastructure'],
        sentiment: 'Mixed',
        trust_signal: 'Moderate',
      });

      await component.analyzeAndSubmit();

      expect(component.aiSummary).toBe('Summary text');
      expect(component.aiScores).toEqual([
        { label: 'Safety', value: 'High', cls: 'positive' },
        { label: 'Safety', value: 'Moderate', cls: 'neutral' },
        { label: 'Safety', value: 'Low', cls: 'critical' },
        { label: 'Environmental burden', value: 'High', cls: 'warning' },
        { label: 'Food access', value: 'Good', cls: 'positive' },
        { label: 'Built environment', value: 'Unrecognized', cls: 'critical' },
      ]);
      expect(component.showAiResult).toBeTrue();
      expect(component.isAnalyzing).toBeFalse();
    });

    it('narrative survey calls analyzeNarrative and populates narrative-specific fields', async () => {
      await setup(makeSurvey({ survey_type: 'narrative' }));
      component.textAnswers[1] = 'Residents reported flooding';
      surveyServiceSpy.analyzeNarrative.and.resolveTo({
        summary: 'Narrative summary',
        themes: ['flooding'],
        urgency: 'High',
        urgency_label: 'Elevated concern',
        trust_signal: 'Low',
        trust_label: 'Residents feel unheard',
      });

      await component.analyzeAndSubmit();

      expect(surveyServiceSpy.analyzeNarrative).toHaveBeenCalled();
      expect(surveyServiceSpy.analyzeEnvScan).not.toHaveBeenCalled();
      expect(component.aiSummary).toBe('Narrative summary');
      expect(component.aiUrgency).toBe('High');
      expect(component.aiUrgencyLabel).toBe('Elevated concern');
      expect(component.aiTrustSignal).toBe('Low');
      expect(component.aiTrustLabel).toBe('Residents feel unheard');
    });

    it('sets analyzeError when the AI call fails', async () => {
      await setup(makeSurvey());
      component.textAnswers[1] = 'Some observation';
      surveyServiceSpy.analyzeEnvScan.and.rejectWith(new Error('AI unavailable'));

      await component.analyzeAndSubmit();

      expect(component.analyzeError).toBe('AI unavailable');
      expect(component.isAnalyzing).toBeFalse();
    });
  });

  describe('submit()', () => {
    function surveyWithToneAndTrust(): SurveyDetail {
      return makeSurvey({
        sections: [makeSection({
          id: 1,
          questions: [
            makeQuestion({
              id: 1, label: 'Engagement Tone', question_type: 'single_chip',
              options: [{ id: 1, label: 'Calm', value: 'calm', color_variant: 'positive', display_order: 1 },
                        { id: 2, label: 'Urgent', value: 'urgent', color_variant: 'critical', display_order: 2 }],
            }),
            makeQuestion({
              id: 2, label: 'Institutional Trust', question_type: 'single_chip',
              options: [{ id: 3, label: 'Trust Erosion', value: 'erosion', color_variant: 'critical', display_order: 1 }],
            }),
            makeQuestion({ id: 3, label: 'Notes', question_type: 'textarea' }),
          ],
        })],
      });
    }

    it('blocks submission when the session has no resolvable user id', async () => {
      currentUser = {};
      await setup(makeSurvey());
      await component.submit();
      expect(component.submitError).toBe('Session expired. Please log in again.');
      expect(apiServiceSpy.insert).not.toHaveBeenCalled();
    });

    it('sends the expected payload shape, deriving user id from user.ID', async () => {
      await setup(makeSurvey());
      component.selectedWardId = 1;
      component.locationText = 'Main St';
      component.textAnswers[1] = 'Cracked sidewalk';

      await component.submit();

      expect(apiServiceSpy.insert).toHaveBeenCalledTimes(1);
      const req: any = apiServiceSpy.insert.calls.mostRecent().args[0];
      expect(req.table_name).toBe('survey_submissions');
      const row = req.insertDataArray[0];
      expect(row.survey_id).toBe(1);
      expect(row.user_id).toBe(42);
      expect(row.ward_id).toBe(1);
      expect(row.location_text).toBe('Main St');
      const ai = JSON.parse(row.ai_analysis);
      expect(ai.field_notes).toEqual([{ label: 'Notes', note: 'Cracked sidewalk' }]);
    });

    it('reads an Urgent engagement-tone chip, but FLAGGING_ENABLED=false keeps status "submitted"', async () => {
      await setup(surveyWithToneAndTrust());
      component.optionAnswers[1] = [2]; // "Urgent" tone chip

      await component.submit();

      const row = apiServiceSpy.insert.calls.mostRecent().args[0] as any;
      const ai = JSON.parse(row.insertDataArray[0].ai_analysis);
      expect(ai.sentiment).toBe('Urgent');
      // Documents the current feature-flag gate: flagging logic still computes
      // isUrgent, but status only becomes 'flagged' once FLAGGING_ENABLED is true.
      expect(row.insertDataArray[0].status).toBe('submitted');
    });

    it('maps an institutional-trust chip mentioning "erosion" to trust_signal "Erosion"', async () => {
      await setup(surveyWithToneAndTrust());
      component.optionAnswers[2] = [3]; // "Trust Erosion" chip

      await component.submit();

      const row = apiServiceSpy.insert.calls.mostRecent().args[0] as any;
      const ai = JSON.parse(row.insertDataArray[0].ai_analysis);
      expect(ai.trust_signal).toBe('Erosion');
    });

    it('falls back to the AI-provided sentiment/trust_signal when no chip is set', async () => {
      await setup(surveyWithToneAndTrust());
      component.aiSentiment = 'Mixed';
      component.aiTrustSignal = 'Moderate';

      await component.submit();

      const row = apiServiceSpy.insert.calls.mostRecent().args[0] as any;
      const ai = JSON.parse(row.insertDataArray[0].ai_analysis);
      expect(ai.sentiment).toBe('Mixed');
      expect(ai.trust_signal).toBe('Moderate');
    });

    it('on success, increments the today count, shows a success state, and navigates home after a delay', fakeAsync(() => {
      setup(makeSurvey());
      tick();
      fixture.detectChanges();

      component.submit();
      tick();

      expect(surveyServiceSpy.incrementTodayCount).toHaveBeenCalled();
      expect(component.submitSuccess).toBeTrue();
      expect(component.showAiResult).toBeFalse();
      expect(navigateSpy).not.toHaveBeenCalled();

      tick(1500);
      expect(navigateSpy).toHaveBeenCalledWith(['/field-home']);
    }));

    it('on failure, sets submitError and does not navigate', async () => {
      await setup(makeSurvey());
      apiServiceSpy.insert.and.rejectWith(new Error('DB write failed'));

      await component.submit();

      expect(component.submitError).toBe('DB write failed');
      expect(component.isSubmitting).toBeFalse();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('resetAi()', () => {
    it('clears all AI result fields and any submit error', async () => {
      await setup();
      component.showAiResult = true;
      component.aiSummary = 'x';
      component.aiScores = [{ label: 'a', value: 'b', cls: 'c' }];
      component.aiThemes = ['t'];
      component.aiSentiment = 'Mixed';
      component.aiTrustSignal = 'Low';
      component.aiUrgency = 'High';
      component.aiUrgencyLabel = 'l';
      component.aiTrustLabel = 'l2';
      component.submitError = 'oops';

      component.resetAi();

      expect(component.showAiResult).toBeFalse();
      expect(component.aiSummary).toBe('');
      expect(component.aiScores).toEqual([]);
      expect(component.aiThemes).toEqual([]);
      expect(component.aiSentiment).toBe('');
      expect(component.aiTrustSignal).toBe('');
      expect(component.aiUrgency).toBe('');
      expect(component.aiUrgencyLabel).toBe('');
      expect(component.aiTrustLabel).toBe('');
      expect(component.submitError).toBe('');
    });
  });

  describe('goBack()', () => {
    it('navigates to /field-home', async () => {
      await setup();
      component.goBack();
      expect(navigateSpy).toHaveBeenCalledWith(['/field-home']);
    });
  });
});
