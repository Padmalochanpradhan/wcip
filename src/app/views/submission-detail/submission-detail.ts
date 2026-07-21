import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../services/survey.service';
import { SurveySubmission } from '../../models/survey.models';

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './submission-detail.html',
  styleUrl: './submission-detail.css'
})
export class SubmissionDetail implements OnInit {
  submission: SurveySubmission | null = null;
  isLoading = true;
  loadError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly surveyService: SurveyService
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      this.submission = await this.surveyService.getSubmissionDetail(id);
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load submission.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    const isAdmin = this.router.url.startsWith('/admin');
    this.router.navigate([isAdmin ? '/admin/submissions' : '/submissions']);
  }

  statusClass(status: string): string {
    return {
      submitted: 'sd-status-submitted',
      reviewed:  'sd-status-reviewed',
      flagged:   'sd-status-flagged',
      draft:     'sd-status-draft',
    }[status] || 'sd-status-draft';
  }

  scoreClass(label: string): 'pos' | 'neu' | 'neg' {
    if (/(Poor|Critical|Desert|Low safety|Unsafe)/i.test(label)) return 'neg';
    if (/(Good|Abundant|Low burden|High safety)/i.test(label)) return 'pos';
    return 'neu';
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }
}
