import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { SurveySubmission } from '../../models/survey.models';
import { HeaderService } from '../../services/header.service';
import { FLAGGING_ENABLED } from '../../config/feature-flags';

@Component({
  selector: 'app-submissions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './submissions-list.html',
  styleUrl: './submissions-list.css'
})
export class SubmissionsList implements OnInit {
  submissions: SurveySubmission[] = [];
  isLoading = true;
  loadError = '';
  flagging = new Set<number>();
  readonly flaggingEnabled = FLAGGING_ENABLED;

  /* ── Quick filter chips ── */
  quickFilter = 'all';

  /* ── Advanced search ── */
  showSearch     = false;
  filterDateFrom = '';
  filterDateTo   = '';
  filterSurvey   = '';
  filterWard     = '';

  constructor(
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly userData: UserDataService,
    private readonly headerService: HeaderService
  ) {}

  async ngOnInit() {
    this.headerService.setTitle('SUBMISSIONS');
    try {
      const user = this.userData.getUser<any>();
      this.submissions = await this.surveyService.getSubmissions(user?.ID || user?.id || 0);
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load submissions.';
    } finally {
      this.isLoading = false;
    }
  }

  /* ── Filter options derived from loaded submissions ── */
  get surveyOptions(): string[] {
    return [...new Set(this.submissions.map(s => s.survey_title || 'Environmental Scan').filter(Boolean))].sort();
  }

  get wardOptions(): string[] {
    return [...new Set(this.submissions.map(s => s.ward_name || '').filter(Boolean))].sort();
  }

  get surveyChips(): { title: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const s of this.submissions) {
      const t = s.survey_title || 'Environmental Scan';
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  get urgentCount(): number {
    return this.submissions.filter(s => this.isUrgent(s)).length;
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterDateFrom || this.filterDateTo || this.filterSurvey || this.filterWard);
  }

  /* ── Filtered list ── */
  get filteredSubmissions(): SurveySubmission[] {
    return this.submissions.filter(s => {
      // Quick filter chips
      if (this.quickFilter === 'urgent') {
        if (!this.isUrgent(s)) return false;
      } else if (this.quickFilter !== 'all') {
        if ((s.survey_title || 'Environmental Scan') !== this.quickFilter) return false;
      }

      // Advanced search filters
      const dateStr = (s.submitted_at || s.created_at || '').slice(0, 10);
      if (this.filterDateFrom && dateStr < this.filterDateFrom) return false;
      if (this.filterDateTo   && dateStr > this.filterDateTo)   return false;
      if (this.filterSurvey && (s.survey_title || 'Environmental Scan') !== this.filterSurvey) return false;
      if (this.filterWard   && (s.ward_name   || '') !== this.filterWard)                      return false;
      return true;
    });
  }

  toggleSearch() { this.showSearch = !this.showSearch; }

  clearFilters() {
    this.filterDateFrom = '';
    this.filterDateTo   = '';
    this.filterSurvey   = '';
    this.filterWard     = '';
  }

  isUrgent(s: SurveySubmission): boolean {
    if (s.status === 'flagged') return true;
    if (s.ai_analysis?.sentiment === 'Urgent') return true;
    if (s.survey_title?.toLowerCase().includes('narrative')) return false;
    const sc = s.ai_analysis?.scores ?? [];
    return sc.some(c =>
      (c.cls === 'critical' && (c.label === 'Safety' || c.label === 'Environmental burden')) ||
      /^safety:\s*(low|critical)/i.test(c.label ?? '')
    );
  }

  async markFlagged(event: Event, sub: SurveySubmission) {
    event.stopPropagation();
    if (this.flagging.has(sub.id)) return;
    this.flagging.add(sub.id);
    try {
      await this.surveyService.flagSubmission(sub.id);
      sub.status = 'flagged';
    } catch {
      // leave status unchanged on error
    } finally {
      this.flagging.delete(sub.id);
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
