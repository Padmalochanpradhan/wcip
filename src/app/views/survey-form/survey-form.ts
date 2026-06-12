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
  isAnalyzing    = false;
  analyzeError   = '';
  showAiResult   = false;
  aiSummary      = '';
  aiScores: { label: string; value: string; cls: string }[] = [];
  aiThemes: string[] = [];
  aiSentiment    = '';
  aiTrustSignal  = '';

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
      this.aiScores  = (result.scores || []).map((s: any) => {
        const isStr  = typeof s === 'string';
        const label: string = isStr ? String(s).split(':')[0].trim() : String(s?.label ?? '');
        const value: string = isStr ? (String(s).split(':')[1] ?? '').trim() : String(s?.value ?? '');
        return { label, value, cls: this.scoreToCls(label, value) };
      });
      this.aiThemes      = result.themes       || [];
      this.aiSentiment   = result.sentiment    || '';
      this.aiTrustSignal = result.trust_signal || '';
      this.showAiResult  = true;
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
      const userId: number = Number(user?.ID || user?.id || user?.userId || user?.user_id || 0);
      if (!userId) {
        this.submitError = 'Session expired. Please log in again.';
        this.isSubmitting = false;
        return;
      }

      // Read engagement tone and institutional trust directly from chip selections
      const allQ = this.survey.sections.flatMap(s => s.questions);

      const toneQ = allQ.find(q => /engagement.?tone/i.test(q.label));
      const toneLabels = toneQ
        ? (this.optionAnswers[toneQ.id] ?? []).map(id => toneQ.options.find(o => o.id === id)?.label ?? '').filter(Boolean)
        : [];
      const urgentByTone = toneLabels.some(l => /urgent/i.test(l));

      const trustQ = allQ.find(q => /institutional.?trust|trust.?observed/i.test(q.label));
      const trustLabels = trustQ
        ? (this.optionAnswers[trustQ.id] ?? []).map(id => trustQ.options.find(o => o.id === id)?.label ?? '').filter(Boolean)
        : [];
      const trustLabel = trustLabels[0] ?? '';

      // Flag if engagement tone is Urgent, OR AI says Urgent, OR Safety/Env burden is critical
      const isUrgent =
        urgentByTone ||
        this.aiSentiment === 'Urgent' ||
        this.aiScores.some(sc =>
          sc.cls === 'critical' &&
          (sc.label === 'Safety' || sc.label === 'Environmental burden')
        );

      // Collect all text/textarea answers as field notes
      const fieldNotes: { label: string; note: string }[] = [];
      for (const section of this.survey.sections) {
        for (const q of section.questions) {
          if ((q.question_type === 'textarea' || q.question_type === 'text') && this.textAnswers[q.id]?.trim()) {
            fieldNotes.push({ label: q.label, note: this.textAnswers[q.id].trim() });
          }
        }
      }

      const aiAnalysis: any = {
        summary:     this.aiSummary,
        scores:      this.aiScores,
        themes:      this.aiThemes,
        field_notes: fieldNotes.length ? fieldNotes : undefined,
      };

      // Sentiment: chip takes priority over AI
      if (urgentByTone)          aiAnalysis.sentiment = 'Urgent';
      else if (this.aiSentiment) aiAnalysis.sentiment = this.aiSentiment;

      // Trust signal: chip takes priority over AI
      if (trustLabel) {
        aiAnalysis.trust_signal = /erosion/i.test(trustLabel) ? 'Erosion'
          : /low/i.test(trustLabel) ? 'Low'
          : /moderate/i.test(trustLabel) ? 'Moderate' : 'High';
      } else if (this.aiTrustSignal) {
        aiAnalysis.trust_signal = this.aiTrustSignal;
      }

      await this.apiService.insert<any, any>({
        table_name: 'survey_submissions',
        insertDataArray: [{
          survey_id:     this.survey.id,
          user_id:       userId,
          ward_id:       this.selectedWardId,
          location_text: this.locationText,
          status:        isUrgent ? 'flagged' : 'submitted',
          ai_analysis:   JSON.stringify(aiAnalysis),
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
    this.showAiResult  = false;
    this.aiSummary     = '';
    this.aiScores      = [];
    this.aiThemes      = [];
    this.aiSentiment   = '';
    this.aiTrustSignal = '';
    this.submitError   = '';
  }

  private scoreToCls(label: string, value: string): string {
    const v = (value ?? '').toLowerCase().trim();
    if (label === 'Safety') {
      if (v === 'high')     return 'positive';
      if (v === 'moderate') return 'neutral';
      return 'critical';  // Low, Critical, Unsafe → dangerous
    }
    if (label === 'Environmental burden') {
      if (v === 'low')      return 'positive';
      if (v === 'moderate') return 'neutral';
      if (v === 'high')     return 'warning';
      return 'critical';
    }
    if (['good', 'abundant', 'full'].includes(v)) return 'positive';
    if (['fair', 'moderate', 'limited'].includes(v)) return 'neutral';
    if (['poor'].includes(v)) return 'warning';
    return 'critical';
  }

  goBack() {
    this.router.navigate(['/field-home']);
  }
}
