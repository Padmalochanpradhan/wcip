import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { ConfigService } from '../../services/api.service';
import { SurveyDetail, Ward } from '../../models/survey.models';

@Component({
  selector: 'app-survey-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './survey-form.html',
  styleUrl: './survey-form.css'
})
export class SurveyForm implements OnInit, OnDestroy {
  private routeSub!: Subscription;
  survey: SurveyDetail | null = null;
  wards: Ward[] = [];
  isLoading = true;
  loadError = '';

  selectedWardId: number | null = null;
  locationText = '';

  optionAnswers: Record<number, number[]> = {};
  textAnswers:   Record<number, string>   = {};
  dropdownAnswers: Record<number, number | null> = {};
  expanded: Record<number, boolean> = {};

  /* ── Analyze state ── */
  isAnalyzing  = false;
  analyzeError = '';
  showAiResult = false;
  aiSummary    = '';
  aiScores: { label: string; cls: 'pos' | 'neu' | 'neg' }[] = [];
  aiThemes: string[] = [];

  /* ── Submit state ── */
  isSubmitting  = false;
  submitError   = '';
  submitSuccess = false;

  readonly sectionIconMap: Record<string, string> = {
    building:    'domain',
    house:       'home',
    environment: 'cloud',
    exposure:    'air',
    safety:      'lock',
    transport:   'directions_bus',
    food:        'local_grocery_store',
    green:       'park',
    leaf:        'eco',
    climate:     'thermostat',
    experience:  'chat',
    narrative:   'edit_note',
    pencil:      'edit_note',
    default:     'category',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly userData: UserDataService,
    private readonly apiService: ConfigService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.loadSurvey(Number(params.get('id')));
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  private async loadSurvey(id: number) {
    this.survey        = null;
    this.isLoading     = true;
    this.loadError     = '';
    this.optionAnswers  = {};
    this.textAnswers    = {};
    this.dropdownAnswers = {};
    this.expanded       = {};
    this.selectedWardId = null;
    this.locationText   = '';
    this.showAiResult   = false;
    this.submitSuccess  = false;
    this.analyzeError   = '';
    this.submitError    = '';

    try {
      [this.survey, this.wards] = await Promise.all([
        this.surveyService.getSurveyDetail(id),
        this.surveyService.getWards()
      ]);
      const first = this.survey?.sections?.find(s => s.is_collapsible);
      if (first) this.expanded[first.id] = true;
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load survey.';
    } finally {
      this.isLoading = false;
    }
  }

  /* ── Section toggle ── */
  toggleSection(sectionId: number) {
    this.expanded[sectionId] = !this.expanded[sectionId];
  }

  isSectionVisible(sectionId: number, isCollapsible: boolean): boolean {
    return !isCollapsible || !!this.expanded[sectionId];
  }

  /* ── Chip helpers ── */
  isSelected(questionId: number, optionId: number): boolean {
    return (this.optionAnswers[questionId] || []).includes(optionId);
  }

  selectSingle(questionId: number, optionId: number) {
    const cur = this.optionAnswers[questionId] || [];
    this.optionAnswers[questionId] = cur.length === 1 && cur[0] === optionId ? [] : [optionId];
  }

  toggleMulti(questionId: number, optionId: number) {
    if (!this.optionAnswers[questionId]) this.optionAnswers[questionId] = [];
    const idx = this.optionAnswers[questionId].indexOf(optionId);
    if (idx > -1) this.optionAnswers[questionId].splice(idx, 1);
    else           this.optionAnswers[questionId].push(optionId);
  }

  /* ── Icon helper ── */
  getSectionIcon(icon: string | null): string {
    if (!icon) return 'category';
    const key = Object.keys(this.sectionIconMap).find(k => icon.toLowerCase().includes(k));
    return key ? this.sectionIconMap[key] : this.sectionIconMap['default'];
  }

  /* ── Build plain-text summary of all answers for AI ── */
  private buildEnvDataString(): string {
    if (!this.survey) return '';
    let result = '';
    for (const section of this.survey.sections) {
      let sectionData = '';
      for (const q of section.questions) {
        if (q.question_type === 'textarea' || q.question_type === 'text') {
          const val = this.textAnswers[q.id];
          if (val?.trim()) sectionData += `  ${q.label}: ${val.trim()}\n`;
        } else if (q.question_type === 'single_chip' || q.question_type === 'multi_chip') {
          const ids = this.optionAnswers[q.id] || [];
          if (ids.length) {
            const labels = ids.map(id => q.options.find(o => o.id === id)?.label || '').filter(Boolean);
            sectionData += `  ${q.label}: ${labels.join(', ')}\n`;
          }
        } else if (q.question_type === 'dropdown') {
          const val = this.dropdownAnswers[q.id];
          if (val != null) {
            const label = q.options.find(o => o.id === val)?.label;
            if (label) sectionData += `  ${q.label}: ${label}\n`;
          }
        }
      }
      if (sectionData) result += `[${section.title}]\n${sectionData}`;
    }
    return result;
  }

  /* ── Step 1: Analyze with Claude, show AI result ── */
  async analyzeAndSubmit() {
    if (!this.survey) return;

    const envData = this.buildEnvDataString();
    if (!envData.trim()) {
      this.analyzeError = 'Please complete at least one section before submitting.';
      return;
    }

    const ward      = this.selectedWardId
      ? (this.wards.find(w => w.id === this.selectedWardId)?.name || 'Unknown ward')
      : 'Unknown ward';
    const location  = this.locationText || 'unspecified location';
    const user      = this.userData.getUser<any>();
    const staffName = [user?.FistName, user?.LastName].filter(Boolean).join(' ') || 'Unknown';

    this.isAnalyzing  = true;
    this.analyzeError = '';
    this.showAiResult = false;
    this.submitSuccess = false;

    try {
      const result = await this.surveyService.analyzeEnvScan(envData, ward, location, staffName);

      this.aiSummary = result.summary;
      this.aiScores  = (result.scores || []).map(s => ({
        label: s,
        cls:   /(Poor|Critical|Desert|Low safety|Unsafe)/i.test(s) ? 'neg'
             : /(Good|Abundant|Low burden|High safety)/i.test(s)   ? 'pos' : 'neu'
      }));
      this.aiThemes  = result.themes || [];
      this.showAiResult = true;
    } catch (err: any) {
      this.analyzeError = err?.message || 'Analysis failed. Please try again.';
    } finally {
      this.isAnalyzing = false;
    }
  }

  /* ── Step 2: Submit answers to backend ── */
  async submit() {
    if (!this.survey) return;
    this.isSubmitting = true;
    this.submitError  = '';

    try {
      const user = this.userData.getUser<any>();

      await this.apiService.insert<any, any>({
        table_name: 'survey_submissions',
        insertDataArray: [{
          survey_id:     this.survey.id,
          user_id:       user?.ID || user?.id || 0,
          ward_id:       this.selectedWardId,
          location_text: this.locationText,
          status:        'submitted',
          ai_analysis:   JSON.stringify({
            summary: this.aiSummary,
            scores:  this.aiScores,
            themes:  this.aiThemes
          }),
          submitted_at:  new Date().toISOString()
        }]
      });

      this.surveyService.incrementTodayCount();
      this.showAiResult  = false;
      this.submitSuccess = true;
      setTimeout(() => this.router.navigate(['/field-home']), 1500);
    } catch (err: any) {
      this.submitError = err?.message || 'Submission failed. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  /* ── Reset AI panel (edit scan) ── */
  resetAi() {
    this.showAiResult = false;
    this.aiSummary    = '';
    this.aiScores     = [];
    this.aiThemes     = [];
    this.submitError  = '';
  }

  goBack() {
    this.router.navigate(['/field-home']);
  }
}
