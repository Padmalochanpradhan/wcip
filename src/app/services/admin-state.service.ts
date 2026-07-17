import { Injectable } from '@angular/core';
import { SurveyService } from './survey.service';
import { SurveySubmission } from '../models/survey.models';

@Injectable({ providedIn: 'root' })
export class AdminStateService {

  submissions: SurveySubmission[] = [];
  isLoading = false;
  loadError = '';
  filterWard     = '';
  filterDateFrom = '';
  filterDateTo   = '';

  totalNarratives = 0;
  totalScans      = 0;
  surveyTotals: { title: string; count: number }[] = [];
  wardsActive     = 0;
  staffReporting  = 0;
  urgentFlags     = 0;
  lowTrustCount   = 0;

  weekBuckets:   { label: string; narratives: number; scans: number }[] = [];
  wardStats:     { name: string; count: number; urgent: number; narratives: number; scans: number; lowTrust: number; staff: number; themes: string[]; surveys: { title: string; count: number }[] }[] = [];
  staffStats:    { name: string; count: number; narratives: number; scans: number; urgent: number; lastDate: string; pct: number }[] = [];
  trustBars:     { label: string; count: number; pct: number; color: string; share: string }[] = [];
  sentimentBars: { label: string; count: number; pct: number; color: string }[] = [];
  urgentSubs:    SurveySubmission[] = [];

  get total() { return this.filtered.length; }

  get allWards(): string[] {
    return [...new Set(
      this.submissions.map(s => s.ward_name || (s.ward_id ? `Ward ${s.ward_id}` : ''))
    )].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  private get filtered(): SurveySubmission[] {
    let result = this.submissions;
    if (this.filterWard) {
      result = result.filter(s =>
        (s.ward_name || (s.ward_id ? `Ward ${s.ward_id}` : '')) === this.filterWard
      );
    }
    if (this.filterDateFrom) {
      const from = this.parseLocalDate(this.filterDateFrom); // local midnight of the selected day
      result = result.filter(s => new Date(s.submitted_at || s.created_at) >= from);
    }
    if (this.filterDateTo) {
      const to = this.parseLocalDate(this.filterDateTo);
      to.setHours(23, 59, 59, 999); // local end-of-day of the selected day
      result = result.filter(s => new Date(s.submitted_at || s.created_at) <= to);
    }
    return result;
  }

  // <input type="date"> gives "YYYY-MM-DD". new Date("YYYY-MM-DD") parses that as UTC
  // midnight, which then shifts to the previous local day in any timezone west of UTC.
  // Parsing the components explicitly constructs local midnight instead.
  private parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  setFilter(ward: string): void {
    this.filterWard = ward;
    this.compute();
  }

  setDateFilter(from: string, to: string): void {
    this.filterDateFrom = from;
    this.filterDateTo   = to;
    this.compute();
  }

  constructor(private readonly surveyService: SurveyService) {}

  async load(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    try {
      this.submissions = await this.surveyService.getAllSubmissions();
      this.compute();
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load data.';
    } finally {
      this.isLoading = false;
    }
  }

  compute() {
    const s = this.filtered;

    this.totalNarratives = s.filter(x => x.survey_title?.toLowerCase().includes('narrative')).length;
    this.totalScans      = s.length - this.totalNarratives;

    const surveyCountMap = new Map<string, number>();
    for (const x of s) {
      const t = x.survey_title || 'Field Scan';
      surveyCountMap.set(t, (surveyCountMap.get(t) ?? 0) + 1);
    }
    this.surveyTotals = [...surveyCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([title, count]) => ({ title, count }));

    this.wardsActive     = new Set(s.map(x => x.ward_id).filter(Boolean)).size;
    this.staffReporting  = new Set(s.map(x => x.user_id)).size;
    this.urgentFlags     = s.filter(x => this.isUrgent(x)).length;
    this.lowTrustCount   = s.filter(x => this.trust(x) === 'low').length;

    // Week buckets — 8 weeks back
    const now = new Date();
    this.weekBuckets = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (7 - i) * 7 - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const inWeek = s.filter(x => {
        const d = new Date(x.submitted_at || x.created_at);
        return d >= start && d <= end;
      });
      const narr = inWeek.filter(x => x.survey_title?.toLowerCase().includes('narrative')).length;
      return { label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), narratives: narr, scans: inWeek.length - narr };
    });

    // Ward stats
    const wm = new Map<string, { name: string; count: number; urgent: number; narratives: number; scans: number; lowTrust: number; staffIds: Set<number>; themes: Map<string, number>; surveyMap: Map<string, number> }>();
    for (const x of s) {
      const n = x.ward_name || (x.ward_id ? `Ward ${x.ward_id}` : 'Unknown');
      if (!wm.has(n)) wm.set(n, { name: n, count: 0, urgent: 0, narratives: 0, scans: 0, lowTrust: 0, staffIds: new Set(), themes: new Map<string, number>(), surveyMap: new Map<string, number>() });
      const w = wm.get(n)!;
      w.count++;
      if (this.isUrgent(x)) w.urgent++;
      if (x.survey_title?.toLowerCase().includes('narrative')) w.narratives++;
      else w.scans++;
      if (this.trust(x) === 'low') w.lowTrust++;
      if (x.user_id) w.staffIds.add(x.user_id);
      // Prefer the broad content category (Airtable "Topic") for the ward chips;
      // fall back to granular AI themes for rows imported before category capture
      // existed, or scan rows, which have no Topic column.
      const category = x.ai_analysis?.category;
      if (category) {
        w.themes.set(category, (w.themes.get(category) || 0) + 1);
      } else {
        for (const theme of (x.ai_analysis?.themes ?? [])) {
          w.themes.set(theme, (w.themes.get(theme) || 0) + 1);
        }
      }
      const title = x.survey_title || 'Field Scan';
      w.surveyMap.set(title, (w.surveyMap.get(title) ?? 0) + 1);
    }
    this.wardStats = [...wm.values()]
      .sort((a, b) => b.count - a.count)
      .map(w => ({
        name: w.name, count: w.count, urgent: w.urgent,
        narratives: w.narratives, scans: w.scans,
        lowTrust: w.lowTrust, staff: w.staffIds.size,
        themes: [...w.themes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t),
        surveys: [...w.surveyMap.entries()].sort((a, b) => b[1] - a[1]).map(([title, count]) => ({ title, count })),
      }));

    // Staff stats
    const stm = new Map<string, { name: string; count: number; narratives: number; scans: number; urgent: number; lastDate: string }>();
    for (const x of s) {
      const n = x.staff_name || `User ${x.user_id}`;
      if (!stm.has(n)) stm.set(n, { name: n, count: 0, narratives: 0, scans: 0, urgent: 0, lastDate: '' });
      const st = stm.get(n)!;
      st.count++;
      if (x.survey_title?.toLowerCase().includes('narrative')) st.narratives++;
      else st.scans++;
      if (this.isUrgent(x)) st.urgent++;
      const d = x.submitted_at || x.created_at;
      if (!st.lastDate || d > st.lastDate) st.lastDate = d;
    }
    const maxCount = Math.max(...[...stm.values()].map(st => st.count), 1);
    this.staffStats = [...stm.values()]
      .sort((a, b) => b.count - a.count)
      .map(st => ({ ...st, pct: Math.round(st.count / maxCount * 100) }));

    // Trust distribution
    const hi  = s.filter(x => this.trust(x) === 'high').length;
    const mid = s.filter(x => this.trust(x) === 'moderate').length;
    const lo  = s.filter(x => this.trust(x) === 'low').length;
    const mt  = Math.max(hi, mid, lo, 1);
    const tot = s.length || 1;
    this.trustBars = [
      { label: 'High',     count: hi,  pct: hi  / mt * 100, color: '#2B7A6F', share: `${Math.round(hi  / tot * 100)}%` },
      { label: 'Moderate', count: mid, pct: mid / mt * 100, color: '#E6A817', share: `${Math.round(mid / tot * 100)}%` },
      { label: 'Low',      count: lo,  pct: lo  / mt * 100, color: '#E53935', share: `${Math.round(lo  / tot * 100)}%` },
    ];

    // Sentiment distribution
    const sp = s.filter(x => this.sentiment(x) === 'positive').length;
    const sm = s.filter(x => this.sentiment(x) === 'mixed').length;
    const sn = s.filter(x => this.sentiment(x) === 'negative').length;
    const su = s.filter(x => this.sentiment(x) === 'urgent').length;
    const ms = Math.max(sp, sm, sn, su, 1);
    this.sentimentBars = [
      { label: 'Positive', count: sp, pct: sp / ms * 100, color: '#2B7A6F' },
      { label: 'Mixed',    count: sm, pct: sm / ms * 100, color: '#E6A817' },
      { label: 'Negative', count: sn, pct: sn / ms * 100, color: '#E53935' },
      { label: 'Urgent',   count: su, pct: su / ms * 100, color: '#7B0000' },
    ];

    // Flagged submissions
    this.urgentSubs = [...s]
      .filter(x => this.isUrgent(x))
      .sort((a, b) => (b.submitted_at || b.created_at) > (a.submitted_at || a.created_at) ? 1 : -1)
      .slice(0, 8);
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

  trust(s: SurveySubmission): 'high' | 'moderate' | 'low' {
    const ai = s.ai_analysis;
    if (!ai) return 'moderate';
    if (ai.trust_signal) {
      const ts = ai.trust_signal.toLowerCase();
      return (ts.includes('low') || ts.includes('erosion')) ? 'low'
           : ts.includes('high') ? 'high' : 'moderate';
    }
    if (s.survey_title?.toLowerCase().includes('narrative')) return 'moderate';
    const sc = ai.scores ?? [];
    if (!sc.length) return 'moderate';
    const hasLowTrust = sc.some(c =>
      (c.cls === 'critical' && c.label === 'Safety') ||
      /^safety:\s*(low|critical)/i.test(c.label ?? '')
    );
    if (hasLowTrust) return 'low';
    if (sc.some(c => c.cls === 'warning')) return 'moderate';
    return 'high';
  }

  sentiment(s: SurveySubmission): 'positive' | 'mixed' | 'negative' | 'urgent' {
    if (this.isUrgent(s)) return 'urgent';
    const ai = s.ai_analysis;
    if (ai?.sentiment) {
      const sent = ai.sentiment.toLowerCase();
      if (sent === 'positive') return 'positive';
      if (sent === 'negative') return 'negative';
      if (sent === 'mixed')    return 'mixed';
    }
    const sc = ai?.scores ?? [];
    if (!sc.length) return 'mixed';
    if (sc.some(c => c.cls === 'critical' || c.cls === 'neg')) return 'negative';
    if (sc.some(c => c.cls === 'warning') && sc.some(c => c.cls === 'positive' || c.cls === 'pos')) return 'mixed';
    if (sc.some(c => c.cls === 'warning')) return 'negative';
    return 'positive';
  }

  // Short headline for a submission card — the staff-entered "Field Notes"
  // value when present (narrative imports/submissions carry one), else blank.
  headline(sub: SurveySubmission): string {
    return sub.ai_analysis?.field_notes?.find(fn => fn.label === 'Field Notes')?.note || '';
  }

  urgentTags(sub: SurveySubmission): { text: string; cls: string }[] {
    const tags: { text: string; cls: string }[] = [];
    if (sub.status === 'flagged')      tags.push({ text: 'Urgent',     cls: 'ut' });
    if (this.trust(sub) === 'low')     tags.push({ text: 'Trust: Low', cls: 'tl' });
    const th = sub.ai_analysis?.themes?.[0];
    if (th)                            tags.push({ text: th,           cls: 'th' });
    return tags.slice(0, 3);
  }

  maxWeek() { return Math.max(...this.weekBuckets.map(b => b.narratives + b.scans), 1); }
  maxWard() { return Math.max(...this.wardStats.map(w => w.count), 1); }

  fmt(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  fmtShort(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
