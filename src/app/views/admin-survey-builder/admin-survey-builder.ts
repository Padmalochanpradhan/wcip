import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { SurveyService } from '../../services/survey.service';
import { SurveyDetail, SurveySection, SurveyQuestion } from '../../models/survey.models';
import { SectionFormDialog } from '../dialogs/section-form-dialog/section-form-dialog';
import { QuestionFormDialog } from '../dialogs/question-form-dialog/question-form-dialog';

@Component({
  selector: 'app-admin-survey-builder',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-survey-builder.html',
  styleUrl: './admin-survey-builder.css'
})
export class AdminSurveyBuilder implements OnInit {
  survey: SurveyDetail | null = null;
  isLoading = true;
  loadError = '';
  expanded: Record<number, boolean> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly dialog: MatDialog
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    await this.load(id);
  }

  async load(id: number) {
    this.isLoading = true;
    this.loadError = '';
    try {
      this.survey = await this.surveyService.getSurveyDetail(id);
      this.survey.sections.forEach(s => this.expanded[s.id] = true);
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load survey.';
    } finally {
      this.isLoading = false;
    }
  }

  toggle(id: number) { this.expanded[id] = !this.expanded[id]; }

  addSection() {
    if (!this.survey) return;
    const ref = this.dialog.open(SectionFormDialog, {
      width: '500px', disableClose: true,
      data: { section: null, surveyId: this.survey.id, displayOrder: this.survey.sections.length + 1 }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.load(this.survey!.id); });
  }

  editSection(section: SurveySection, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open(SectionFormDialog, {
      width: '500px', disableClose: true,
      data: { section, surveyId: this.survey!.id }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.load(this.survey!.id); });
  }

  addQuestion(section: SurveySection) {
    const ref = this.dialog.open(QuestionFormDialog, {
      width: '640px', disableClose: true,
      data: { question: null, sectionId: section.id, surveyId: this.survey!.id, displayOrder: section.questions.length + 1 }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.load(this.survey!.id); });
  }

  editQuestion(question: SurveyQuestion, section: SurveySection, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open(QuestionFormDialog, {
      width: '640px', disableClose: true,
      data: { question, sectionId: section.id, surveyId: this.survey!.id }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.load(this.survey!.id); });
  }

  goBack() { this.router.navigate(['/admin/surveys']); }

  typeLabel(t: string): string {
    return { text: 'Text', textarea: 'Textarea', dropdown: 'Dropdown', single_chip: 'Single chip', multi_chip: 'Multi chip', number: 'Number' }[t] || t;
  }
}
