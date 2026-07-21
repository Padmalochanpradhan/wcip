import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AdminStateService } from './admin-state.service';
import { AiAnalysis, SurveySubmission } from '../models/survey.models';

/** Builds a minimal, valid SurveySubmission with sensible defaults for tests to override. */
function makeSubmission(overrides: Partial<SurveySubmission> = {}): SurveySubmission {
  return {
    id: 1,
    survey_id: 1,
    survey_title: 'Environmental Scan',
    user_id: 1,
    ward_id: 1,
    ward_name: 'Ward 1',
    location_text: 'Main St',
    status: 'submitted',
    ai_analysis: null,
    submitted_at: '2026-06-01T12:00:00.000Z',
    created_at: '2026-06-01T12:00:00.000Z',
    staff_name: 'Jane Doe',
    ...overrides,
  };
}

function makeAi(overrides: Partial<AiAnalysis> = {}): AiAnalysis {
  return {
    summary: '',
    scores: [],
    themes: [],
    ...overrides,
  };
}

describe('AdminStateService', () => {
  let service: AdminStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(AdminStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── isUrgent() ─────────────────────────────────────────────────────────
  describe('isUrgent()', () => {
    it('is urgent when status is flagged, regardless of anything else', () => {
      const sub = makeSubmission({ status: 'flagged', ai_analysis: null });
      expect(service.isUrgent(sub)).toBeTrue();
    });

    it('is urgent when AI sentiment is Urgent', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ sentiment: 'Urgent' }) });
      expect(service.isUrgent(sub)).toBeTrue();
    });

    it('narrative submissions never fall through to score-based urgency', () => {
      const sub = makeSubmission({
        survey_title: 'Narrative Field Input',
        ai_analysis: makeAi({ scores: [{ label: 'Safety', value: 'Low', cls: 'critical' }] }),
      });
      expect(service.isUrgent(sub)).toBeFalse();
    });

    it('is urgent when an Environmental Scan has a critical Safety score', () => {
      const sub = makeSubmission({
        survey_title: 'Environmental Scan',
        ai_analysis: makeAi({ scores: [{ label: 'Safety', value: 'Low', cls: 'critical' }] }),
      });
      expect(service.isUrgent(sub)).toBeTrue();
    });

    it('is urgent when an Environmental Scan has a critical Environmental burden score', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Environmental burden', value: 'Critical', cls: 'critical' }] }),
      });
      expect(service.isUrgent(sub)).toBeTrue();
    });

    it('a critical score on an unrelated label does not trigger urgency', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Food access', value: 'Desert', cls: 'critical' }] }),
      });
      expect(service.isUrgent(sub)).toBeFalse();
    });

    it('catches legacy imported rows via the raw "Safety: Low" label fallback (no cls set)', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Safety: Low', value: '', cls: '' }] }),
      });
      expect(service.isUrgent(sub)).toBeTrue();
    });

    it('is not urgent with no flag, no urgent sentiment, and no critical scores', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Safety', value: 'High', cls: 'positive' }] }),
      });
      expect(service.isUrgent(sub)).toBeFalse();
    });
  });

  // ── trust() ────────────────────────────────────────────────────────────
  describe('trust()', () => {
    it('defaults to moderate when there is no ai_analysis', () => {
      expect(service.trust(makeSubmission({ ai_analysis: null }))).toBe('moderate');
    });

    it('uses the AI trust_signal when present ("Low" -> low)', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ trust_signal: 'Low' }) });
      expect(service.trust(sub)).toBe('low');
    });

    it('treats "Erosion" trust_signal as low', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ trust_signal: 'Erosion' }) });
      expect(service.trust(sub)).toBe('low');
    });

    it('uses "High" trust_signal as high', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ trust_signal: 'High' }) });
      expect(service.trust(sub)).toBe('high');
    });

    it('narrative rows with no trust_signal default to moderate', () => {
      const sub = makeSubmission({
        survey_title: 'Narrative Field Input',
        ai_analysis: makeAi({ trust_signal: undefined }),
      });
      expect(service.trust(sub)).toBe('moderate');
    });

    it('scan rows with no trust_signal fall back to the Safety score (critical -> low)', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Safety', value: 'Low', cls: 'critical' }] }),
      });
      expect(service.trust(sub)).toBe('low');
    });

    it('scan rows fall back to moderate when a score is only "warning"', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Food access', value: 'Poor', cls: 'warning' }] }),
      });
      expect(service.trust(sub)).toBe('moderate');
    });

    it('scan rows fall back to high when scores exist with no warning/critical', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Safety', value: 'High', cls: 'positive' }] }),
      });
      expect(service.trust(sub)).toBe('high');
    });

    it('trust only looks at the Safety score, not Environmental burden', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ scores: [{ label: 'Environmental burden', value: 'Critical', cls: 'critical' }] }),
      });
      expect(service.trust(sub)).not.toBe('low');
    });
  });

  // ── sentiment() ────────────────────────────────────────────────────────
  describe('sentiment()', () => {
    it('returns urgent when isUrgent() is true, overriding any AI sentiment', () => {
      const sub = makeSubmission({ status: 'flagged', ai_analysis: makeAi({ sentiment: 'Positive' }) });
      expect(service.sentiment(sub)).toBe('urgent');
    });

    it('uses the AI-provided sentiment when not urgent', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ sentiment: 'Negative' }) });
      expect(service.sentiment(sub)).toBe('negative');
    });

    it('falls back to mixed when there are no scores and no AI sentiment', () => {
      const sub = makeSubmission({ ai_analysis: makeAi() });
      expect(service.sentiment(sub)).toBe('mixed');
    });
  });

  // ── headline() ─────────────────────────────────────────────────────────
  describe('headline()', () => {
    it('extracts the "Field Notes" entry from field_notes when present', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({
          field_notes: [
            { label: 'Input Type', note: 'Interview' },
            { label: 'Field Notes', note: 'Immediate attention and observation needed' },
          ],
        }),
      });
      expect(service.headline(sub)).toBe('Immediate attention and observation needed');
    });

    it('returns an empty string when there is no "Field Notes" entry', () => {
      const sub = makeSubmission({
        ai_analysis: makeAi({ field_notes: [{ label: 'Safety & perceived risk', note: 'Low' }] }),
      });
      expect(service.headline(sub)).toBe('');
    });

    it('returns an empty string when there is no ai_analysis at all', () => {
      expect(service.headline(makeSubmission({ ai_analysis: null }))).toBe('');
    });
  });

  // ── urgentTags() ───────────────────────────────────────────────────────
  describe('urgentTags()', () => {
    it('includes an Urgent tag when flagged', () => {
      const sub = makeSubmission({ status: 'flagged' });
      expect(service.urgentTags(sub)).toContain(jasmine.objectContaining({ text: 'Urgent', cls: 'ut' }));
    });

    it('includes a Trust: Low tag when trust is low', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ trust_signal: 'Low' }) });
      expect(service.urgentTags(sub)).toContain(jasmine.objectContaining({ text: 'Trust: Low', cls: 'tl' }));
    });

    it('includes the first theme as a tag', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ themes: ['Transportation', 'Housing'] }) });
      expect(service.urgentTags(sub)).toContain(jasmine.objectContaining({ text: 'Transportation', cls: 'th' }));
    });

    it('never returns more than 3 tags', () => {
      const sub = makeSubmission({
        status: 'flagged',
        ai_analysis: makeAi({ trust_signal: 'Low', themes: ['A', 'B', 'C'] }),
      });
      expect(service.urgentTags(sub).length).toBeLessThanOrEqual(3);
    });

    it('returns no tags for an unremarkable submission', () => {
      const sub = makeSubmission({ ai_analysis: makeAi({ trust_signal: 'High' }) });
      expect(service.urgentTags(sub)).toEqual([]);
    });
  });

  // ── Ward filter + total ───────────────────────────────────────────────
  describe('ward filtering', () => {
    beforeEach(() => {
      service.submissions = [
        makeSubmission({ id: 1, ward_name: 'Ward 1' }),
        makeSubmission({ id: 2, ward_name: 'Ward 2' }),
        makeSubmission({ id: 3, ward_name: 'Ward 1' }),
      ];
    });

    it('total reflects all submissions when no ward filter is set', () => {
      service.compute();
      expect(service.total).toBe(3);
    });

    it('setFilter narrows total to only the matching ward and recomputes', () => {
      service.setFilter('Ward 1');
      expect(service.total).toBe(2);
    });

    it('setFilter("") clears the filter back to all submissions', () => {
      service.setFilter('Ward 1');
      service.setFilter('');
      expect(service.total).toBe(3);
    });

    it('allWards lists every distinct ward name, sorted', () => {
      expect(service.allWards).toEqual(['Ward 1', 'Ward 2']);
    });
  });

  // ── Date filter (timezone-safety) ─────────────────────────────────────
  describe('date filtering', () => {
    beforeEach(() => {
      service.submissions = [
        makeSubmission({ id: 1, submitted_at: '2026-06-01T04:00:00.000Z' }), // early UTC morning
        makeSubmission({ id: 2, submitted_at: '2026-06-15T12:00:00.000Z' }),
        makeSubmission({ id: 3, submitted_at: '2026-06-30T23:00:00.000Z' }),
      ];
    });

    it('setDateFilter narrows to submissions within the [from, to] range (inclusive)', () => {
      service.setDateFilter('2026-06-01', '2026-06-15');
      expect(service.total).toBe(2);
    });

    it('a from-date matching the submission day includes that submission (no off-by-one)', () => {
      // Regression check for the UTC-parse-then-local-shift bug: a plain
      // `new Date("2026-06-01")` construction would shift to the previous
      // local day west of UTC, wrongly excluding this same-day submission.
      service.setDateFilter('2026-06-01', '');
      expect(service.total).toBeGreaterThanOrEqual(1);
      expect(service.total).toBe(3);
    });

    it('setDateFilter("", "") clears the date filter', () => {
      service.setDateFilter('2026-06-01', '2026-06-15');
      service.setDateFilter('', '');
      expect(service.total).toBe(3);
    });
  });

  // ── compute() aggregates ──────────────────────────────────────────────
  describe('compute() aggregates', () => {
    beforeEach(() => {
      service.submissions = [
        makeSubmission({ id: 1, survey_title: 'Narrative Field Input', ward_id: 1, ward_name: 'Ward 1', user_id: 1, status: 'flagged' }),
        makeSubmission({ id: 2, survey_title: 'Environmental Scan', ward_id: 1, ward_name: 'Ward 1', user_id: 2 }),
        makeSubmission({ id: 3, survey_title: 'Environmental Scan', ward_id: 2, ward_name: 'Ward 2', user_id: 2 }),
      ];
      service.compute();
    });

    it('splits totals into narratives vs scans', () => {
      expect(service.totalNarratives).toBe(1);
      expect(service.totalScans).toBe(2);
    });

    it('counts distinct active wards and reporting staff', () => {
      expect(service.wardsActive).toBe(2);
      expect(service.staffReporting).toBe(2);
    });

    it('counts urgent flags from the flagged submission', () => {
      expect(service.urgentFlags).toBe(1);
    });

    it('builds one wardStats entry per ward with correct counts', () => {
      const ward1 = service.wardStats.find(w => w.name === 'Ward 1');
      const ward2 = service.wardStats.find(w => w.name === 'Ward 2');
      expect(ward1?.count).toBe(2);
      expect(ward2?.count).toBe(1);
    });

    it('urgentSubs contains only urgent submissions', () => {
      expect(service.urgentSubs.every(s => service.isUrgent(s))).toBeTrue();
      expect(service.urgentSubs.length).toBe(1);
    });
  });

  describe('wardStats themes — category vs. AI themes precedence', () => {
    it('uses the Airtable "Topic" category when present, not the granular AI themes', () => {
      service.submissions = [
        makeSubmission({
          id: 1, ward_id: 1, ward_name: 'Ward 1',
          ai_analysis: makeAi({ category: 'Housing', themes: ['neighborhood safety', 'property maintenance'] }),
        }),
      ];
      service.compute();
      const ward1 = service.wardStats.find(w => w.name === 'Ward 1');
      expect(ward1?.themes).toEqual(['Housing']);
    });

    it('falls back to AI themes for submissions with no stored category (older imports, scan rows)', () => {
      service.submissions = [
        makeSubmission({
          id: 1, ward_id: 1, ward_name: 'Ward 1',
          ai_analysis: makeAi({ themes: ['neighborhood safety', 'property maintenance'] }),
        }),
      ];
      service.compute();
      const ward1 = service.wardStats.find(w => w.name === 'Ward 1');
      expect(ward1?.themes).toEqual(['neighborhood safety', 'property maintenance']);
    });

    it('mixes category and fallback themes within the same ward independently per submission', () => {
      service.submissions = [
        makeSubmission({ id: 1, ward_id: 1, ward_name: 'Ward 1', ai_analysis: makeAi({ category: 'Environmental' }) }),
        makeSubmission({ id: 2, ward_id: 1, ward_name: 'Ward 1', ai_analysis: makeAi({ category: 'Environmental' }) }),
        makeSubmission({ id: 3, ward_id: 1, ward_name: 'Ward 1', ai_analysis: makeAi({ themes: ['pothole reports'] }) }),
      ];
      service.compute();
      const ward1 = service.wardStats.find(w => w.name === 'Ward 1');
      // sorted by frequency: 'Environmental' (2) ahead of 'pothole reports' (1)
      expect(ward1?.themes).toEqual(['Environmental', 'pothole reports']);
    });
  });

  // ── topThemes ──────────────────────────────────────────────────────────
  describe('topThemes', () => {
    it('aggregates the Airtable "Topic" category across all submissions, sorted by frequency', () => {
      service.submissions = [
        makeSubmission({ id: 1, ai_analysis: makeAi({ category: 'Housing' }) }),
        makeSubmission({ id: 2, ai_analysis: makeAi({ category: 'Housing' }) }),
        makeSubmission({ id: 3, ai_analysis: makeAi({ category: 'Safety' }) }),
      ];
      service.compute();
      expect(service.topThemes).toEqual([
        { label: 'Housing', count: 2, pct: 67 },
        { label: 'Safety', count: 1, pct: 33 },
      ]);
    });

    it('falls back to granular AI themes for submissions with no stored category', () => {
      service.submissions = [
        makeSubmission({ id: 1, ai_analysis: makeAi({ themes: ['neighborhood safety'] }) }),
      ];
      service.compute();
      expect(service.topThemes).toEqual([{ label: 'neighborhood safety', count: 1, pct: 100 }]);
    });

    it('is capped at the top 8 themes', () => {
      service.submissions = Array.from({ length: 10 }, (_, i) =>
        makeSubmission({ id: i + 1, ai_analysis: makeAi({ category: `Topic ${i}` }) })
      );
      service.compute();
      expect(service.topThemes.length).toBe(8);
    });

    it('is empty when there are no submissions', () => {
      service.submissions = [];
      service.compute();
      expect(service.topThemes).toEqual([]);
    });
  });
});
