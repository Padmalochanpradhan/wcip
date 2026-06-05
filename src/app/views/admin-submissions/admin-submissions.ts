import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../services/survey.service';
import { SurveySubmission } from '../../models/survey.models';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-submissions.html',
  styleUrl: './admin-submissions.css'
})
export class AdminSubmissions implements OnInit {
  submissions: SurveySubmission[] = [];
  isLoading = true;
  loadError = '';

  /* ── Search state ── */
  showSearch = false;
  filterDateFrom = '';
  filterDateTo   = '';
  filterSurvey   = '';
  filterUser     = '';
  filterWard     = '';

  constructor(
    private readonly router: Router,
    private readonly surveyService: SurveyService
  ) {}

  async ngOnInit() {
    try {
      this.submissions = await this.surveyService.getAllSubmissions();
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load submissions.';
    } finally {
      this.isLoading = false;
    }
  }

  /* ── Filter options derived from loaded data ── */
  get surveyOptions(): string[] {
    return [...new Set(this.submissions.map(s => s.survey_title || 'Field Scan').filter(Boolean))].sort();
  }

  get userOptions(): string[] {
    return [...new Set(this.submissions.map(s => s.staff_name || '').filter(Boolean))].sort();
  }

  get wardOptions(): string[] {
    return [...new Set(this.submissions.map(s => s.ward_name || '').filter(Boolean))].sort();
  }

  /* ── Filtered list ── */
  get filteredSubmissions(): SurveySubmission[] {
    return this.submissions.filter(s => {
      const dateStr = (s.submitted_at || s.created_at || '').slice(0, 10);

      if (this.filterDateFrom && dateStr < this.filterDateFrom) return false;
      if (this.filterDateTo   && dateStr > this.filterDateTo)   return false;
      if (this.filterSurvey && (s.survey_title || 'Field Scan') !== this.filterSurvey) return false;
      if (this.filterUser   && (s.staff_name  || '') !== this.filterUser)              return false;
      if (this.filterWard   && (s.ward_name   || '') !== this.filterWard)              return false;

      return true;
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterDateFrom || this.filterDateTo || this.filterSurvey || this.filterUser || this.filterWard);
  }

  toggleSearch() { this.showSearch = !this.showSearch; }

  clearFilters() {
    this.filterDateFrom = '';
    this.filterDateTo   = '';
    this.filterSurvey   = '';
    this.filterUser     = '';
    this.filterWard     = '';
  }

  openDetail(id: number) { this.router.navigate(['/admin/submissions', id]); }
  goBack()               { this.router.navigate(['/admin']); }

  statusClass(status: string): string {
    return { submitted: 'as-s-submitted', reviewed: 'as-s-reviewed', flagged: 'as-s-flagged', draft: 'as-s-draft' }[status] || 'as-s-draft';
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
