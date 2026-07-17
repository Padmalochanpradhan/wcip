import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';
import { HeaderService } from '../../services/header.service';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-submissions.html',
  styleUrl: './admin-submissions.css'
})
export class AdminSubmissions implements OnInit {

  /* ── Quick filter chips ── */
  quickFilter = 'all';

  /* ── Free-text search box (before Advanced Search, same pattern as Manage Users) ── */
  searchQuery = '';

  /* ── Local search filters (survey, user) ── */
  showSearch     = false;
  filterSurvey   = '';
  filterUser     = '';

  /* ── Pagination — render 25 at a time instead of the full (possibly 1000+) list ── */
  readonly PAGE_SIZE = 25;
  displayLimit = this.PAGE_SIZE;

  /* ── Ward + date filters delegate to shared state (synced with sidebar) ── */
  get filterWard(): string         { return this.state.filterWard; }
  set filterWard(v: string)        { this.state.setFilter(v); this.resetPaging(); }

  get filterDateFrom(): string     { return this.state.filterDateFrom; }
  set filterDateFrom(v: string)    { this.state.setDateFilter(v, this.state.filterDateTo); this.resetPaging(); }

  get filterDateTo(): string       { return this.state.filterDateTo; }
  set filterDateTo(v: string)      { this.state.setDateFilter(this.state.filterDateFrom, v); this.resetPaging(); }

  constructor(
    private readonly router: Router,
    readonly state: AdminStateService,
    private readonly headerService: HeaderService
  ) {}

  ngOnInit() {
    this.headerService.setTitle('ADMIN SUBMISSIONS');
    // Arriving from the Overview page's "Urgent Flags" tile pre-selects the Urgent chip.
    const incomingFilter = window.history.state?.quickFilter;
    if (incomingFilter) this.quickFilter = incomingFilter;
  }

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

  /* ── Survey chips derived from loaded submissions ── */
  get surveyChips(): { title: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const s of this.state.submissions) {
      const t = s.survey_title || 'Field Scan';
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /* ── Filtered list ── */
  get filteredSubmissions() {
    const q = this.searchQuery.toLowerCase().trim();

    return this.state.submissions.filter(s => {
      // Free-text search box
      if (q) {
        const haystack = [
          s.staff_name,
          s.ward_name,
          s.location_text,
          s.survey_title,
          s.ai_analysis?.summary,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Quick filter chips
      if (this.quickFilter === 'urgent') {
        if (!this.state.isUrgent(s)) return false;
      } else if (this.quickFilter !== 'all') {
        if ((s.survey_title || 'Field Scan') !== this.quickFilter) return false;
      }

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

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.resetPaging();
  }

  /* ── Paged slice actually rendered ── */
  get visibleSubmissions() {
    return this.filteredSubmissions.slice(0, this.displayLimit);
  }

  get remainingCount(): number {
    return Math.max(0, this.filteredSubmissions.length - this.displayLimit);
  }

  get hasMore(): boolean {
    return this.remainingCount > 0;
  }

  get nextBatchSize(): number {
    return Math.min(this.PAGE_SIZE, this.remainingCount);
  }

  resetPaging() { this.displayLimit = this.PAGE_SIZE; }
  loadMore()    { this.displayLimit += this.PAGE_SIZE; }
  showAll()     { this.displayLimit = this.filteredSubmissions.length; }

  get urgentCount() { return this.state.submissions.filter(s => this.state.isUrgent(s)).length; }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filterDateFrom || this.filterDateTo || this.filterSurvey || this.filterUser || this.filterWard);
  }

  toggleSearch() { this.showSearch = !this.showSearch; }

  selectQuickFilter(value: string) {
    this.quickFilter = value;
    this.resetPaging();
  }

  onSurveyOrUserFilterChange() {
    this.resetPaging();
  }

  clearFilters() {
    this.searchQuery    = '';
    this.filterSurvey   = '';
    this.filterUser     = '';
    this.state.setFilter('');
    this.state.setDateFilter('', '');
    this.resetPaging();
  }

  openDetail(id: number) { this.router.navigate(['/admin/submissions', id]); }
  goBack()               { this.router.navigate(['/admin']); }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
