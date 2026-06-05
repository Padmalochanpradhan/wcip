import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { SurveyService } from '../../services/survey.service';
import { Survey } from '../../models/survey.models';
import { SurveyFormDialog } from '../dialogs/survey-form-dialog/survey-form-dialog';

@Component({
  selector: 'app-admin-surveys',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-surveys.html',
  styleUrl: './admin-surveys.css'
})
export class AdminSurveys implements OnInit {
  surveys: Survey[] = [];
  isLoading = true;
  loadError = '';

  constructor(
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.isLoading = true;
    this.loadError = '';
    try {
      this.surveys = await this.surveyService.getSurveys();
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load surveys.';
    } finally {
      this.isLoading = false;
    }
  }

  createSurvey() {
    const ref = this.dialog.open(SurveyFormDialog, {
      width: '560px', disableClose: true, data: { survey: null }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.load(); });
  }

  editSurvey(survey: Survey, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open(SurveyFormDialog, {
      width: '560px', disableClose: true, data: { survey }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.load(); });
  }

  openBuilder(id: number) {
    this.router.navigate(['/admin/surveys', id]);
  }

  goBack() { this.router.navigate(['/admin']); }

  statusClass(status: string) {
    return status === 'active' ? 'asv-active' : status === 'archived' ? 'asv-archived' : 'asv-draft';
  }
}
