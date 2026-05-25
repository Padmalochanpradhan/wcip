import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { SurveyDetail, Ward, AnswerPayload, SubmissionPayload } from '../../models/survey.models';

@Component({
  selector: 'app-survey-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './survey-form.html',
  styleUrl: './survey-form.css'
})
export class SurveyForm implements OnInit {
  survey: SurveyDetail | null = null;
  wards: Ward[] = [];
  isLoading = true;
  loadError = '';
  isSubmitting = false;
  submitError = '';
  submitSuccess = false;

  selectedWardId: number | null = null;
  locationText = '';

  /* question_id → selected option IDs (chips) */
  optionAnswers: Record<number, number[]> = {};
  /* question_id → text/dropdown value */
  textAnswers: Record<number, string> = {};
  /* question_id → selected option ID (dropdown) */
  dropdownAnswers: Record<number, number | null> = {};
  /* section_id → expanded? */
  expanded: Record<number, boolean> = {};

  readonly sectionIconMap: Record<string, string> = {
    building:     'domain',
    house:        'home',
    environment:  'cloud',
    exposure:     'air',
    safety:       'lock',
    transport:    'directions_bus',
    food:         'local_grocery_store',
    green:        'park',
    leaf:         'eco',
    climate:      'thermostat',
    experience:   'chat',
    narrative:    'edit_note',
    pencil:       'edit_note',
    default:      'category',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly userData: UserDataService
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      [this.survey, this.wards] = await Promise.all([
        this.surveyService.getSurveyDetail(id),
        this.surveyService.getWards()
      ]);

      /* expand first collapsible section by default */
      const first = this.survey?.sections?.find(s => s.is_collapsible);
      if (first) this.expanded[first.id] = true;
    } catch (err: any) {
      console.error('Survey load error', err);
      this.loadError = err?.message || 'Failed to load survey. Check console for details.';
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
    else this.optionAnswers[questionId].push(optionId);
  }

  /* ── Icon helpers ── */
  getSectionIcon(icon: string | null): string {
    if (!icon) return 'category';
    const key = Object.keys(this.sectionIconMap).find(k => icon.toLowerCase().includes(k));
    return key ? this.sectionIconMap[key] : this.sectionIconMap['default'];
  }

  /* ── Submit ── */
  async submit() {
    if (!this.survey) return;
    this.isSubmitting = true;
    this.submitError = '';

    try {
      const answers: AnswerPayload[] = [];

      for (const section of this.survey.sections) {
        for (const q of section.questions) {
          if (q.question_type === 'textarea' || q.question_type === 'text') {
            const val = this.textAnswers[q.id];
            if (val?.trim()) {
              answers.push({ question_id: q.id, map_id: q.map_id, answer_text: val });
            }
          } else if (q.question_type === 'dropdown') {
            const val = this.dropdownAnswers[q.id];
            if (val != null) {
              answers.push({ question_id: q.id, map_id: q.map_id, selected_options: [val] });
            }
          } else if (q.question_type === 'single_chip' || q.question_type === 'multi_chip') {
            const opts = this.optionAnswers[q.id];
            if (opts?.length) {
              answers.push({ question_id: q.id, map_id: q.map_id, selected_options: opts });
            }
          }
        }
      }

      const user = this.userData.getUser<any>();
      const payload: SubmissionPayload = {
        survey_id: this.survey.id,
        user_id: user?.id || user?.ID || 0,
        ward_id: this.selectedWardId,
        location_text: this.locationText,
        answers
      };

      await this.surveyService.submitSurvey(payload);
      this.surveyService.incrementTodayCount();
      this.submitSuccess = true;

      setTimeout(() => this.router.navigate(['/field-home']), 1500);
    } catch (err: any) {
      this.submitError = err?.message || 'Submission failed. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/field-home']);
  }
}
