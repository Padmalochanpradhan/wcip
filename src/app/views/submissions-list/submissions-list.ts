import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { SurveySubmission } from '../../models/survey.models';

@Component({
  selector: 'app-submissions-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './submissions-list.html',
  styleUrl: './submissions-list.css'
})
export class SubmissionsList implements OnInit {
  submissions: SurveySubmission[] = [];
  isLoading = true;
  loadError = '';

  constructor(
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly userData: UserDataService
  ) {}

  async ngOnInit() {
    try {
      const user = this.userData.getUser<any>();
      this.submissions = await this.surveyService.getSubmissions(user?.ID || user?.id || 0);
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load submissions.';
    } finally {
      this.isLoading = false;
    }
  }

  openDetail(id: number) {
    this.router.navigate(['/submissions', id]);
  }

  goBack() {
    this.router.navigate(['/field-home']);
  }

  statusClass(status: string): string {
    return {
      submitted: 'sl-status-submitted',
      reviewed:  'sl-status-reviewed',
      flagged:   'sl-status-flagged',
      draft:     'sl-status-draft',
    }[status] || 'sl-status-draft';
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  aiSnippet(sub: SurveySubmission): string {
    const summary = sub.ai_analysis?.summary || '';
    return summary.length > 90 ? summary.slice(0, 90) + '…' : summary;
  }
}
