import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-submissions.html',
  styleUrl: './admin-submissions.css'
})
export class AdminSubmissions {

  /* ── Quick filter chips ── */
  quickFilter: 'all' | 'urgent' | 'narrative' | 'scan' = 'all';

  /* ── Local search filters (date, survey, user) ── */
  showSearch     = false;
  filterDateFrom = '';
  filterDateTo   = '';
  filterSurvey   = '';
  filterUser     = '';

  /* ── Ward filter delegates to shared state (synced with sidebar) ── */
  get filterWard(): string         { return this.state.filterWard; }
  set filterWard(v: string)        { this.state.setFilter(v); }

  constructor(
    private readonly router: Router,
    readonly state: AdminStateService
  ) {}

  get isLoading() { return this.state.isLoading; }
  get loadError()  { return this.state.loadError; }

  /* ── Filter options derived from all submissions ── */
  get surveyOptions(): string[] {
    return [...new Set(this.state.submissions.map(s => s.survey_title || 'Field Scan').filter(Boolean))].sort();
  }

  get userOptions(): string[] {
    return [...new Set(this.state.submissions.map(s => s.staff_name || '').filter(Boolean))].sort();
  }

  get wardOptions(): string[] { return this.state.allWards; }

  /* ── Filtered list ── */
  get filteredSubmissions() {
    return this.state.submissions.filter(s => {
      // Quick filter chips
      if (this.quickFilter === 'urgent'    && !this.state.isUrgent(s)) return false;
      if (this.quickFilter === 'narrative' && !s.survey_title?.toLowerCase().includes('narrative')) return false;
      if (this.quickFilter === 'scan'      &&  s.survey_title?.toLowerCase().includes('narrative')) return false;

      // Advanced search filters
      const dateStr = (s.submitted_at || s.created_at || '').slice(0, 10);
      if (this.filterDateFrom && dateStr < this.filterDateFrom) return false;
      if (this.filterDateTo   && dateStr > this.filterDateTo)   return false;
      if (this.filterSurvey && (s.survey_title || 'Field Scan') !== this.filterSurvey) return false;
      if (this.filterUser   && (s.staff_name  || '') !== this.filterUser)              return false;
      if (this.filterWard   && (s.ward_name   || '') !== this.filterWard)              return false;
      return true;
    });
  }

  get urgentCount()    { return this.state.submissions.filter(s => this.state.isUrgent(s)).length; }
  get narrativeCount() { return this.state.submissions.filter(s => s.survey_title?.toLowerCase().includes('narrative')).length; }
  get scanCount()      { return this.state.submissions.filter(s => !s.survey_title?.toLowerCase().includes('narrative')).length; }

  get hasActiveFilters(): boolean {
    return !!(this.filterDateFrom || this.filterDateTo || this.filterSurvey || this.filterUser || this.filterWard);
  }

  toggleSearch() { this.showSearch = !this.showSearch; }

  clearFilters() {
    this.filterDateFrom = '';
    this.filterDateTo   = '';
    this.filterSurvey   = '';
    this.filterUser     = '';
    this.state.setFilter('');
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
