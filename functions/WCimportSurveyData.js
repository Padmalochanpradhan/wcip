const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: WCimportSurveyData-prod
  Input:  { rows: AirtableRow[] }
  Output: { inserted, skipped, errors }

  Imports Airtable CSV exports into survey_submissions. Handles two Airtable
  grid shapes:
    - Narrative Inputs   (Input Type, Topic, Engagement Tone, Trust Observed,
                           Field Notes, AI Sentiment, AI Trust Signal, ...)
    - Environmental Scans (Raw Scan Data, AI Scores, ...)
  Row shape is auto-detected per-row via presence of 'AI Scores' / 'Raw Scan Data'.
  Resolves ward_id, user_id, survey_id via live DB lookups.
  Builds ai_analysis JSON from the AI* columns.
*/

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body ?? event);
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'rows must be a non-empty array' })
    };
  }

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    // ── Load lookup tables ──────────────────────────────────────────────
    const [wards]   = await db.execute('SELECT id, name FROM wards');
    const [staff]   = await db.execute('SELECT id, name FROM staff_roster');
    const [surveys] = await db.execute("SELECT id, title FROM surveys WHERE status = 'active'");

    const wardMap   = new Map(wards.map(w  => [w.name.toLowerCase().trim(),  w.id]));
    const staffMap  = new Map(staff.map(s  => [s.name.toLowerCase().trim(),  s.id]));
    // survey title → id, keyed by lowercased title word for fuzzy match
    const surveyList = surveys.map(s => ({ id: s.id, title: s.title.toLowerCase().trim() }));

    function resolveWard(wardStr) {
      return wardMap.get((wardStr || '').toLowerCase().trim()) ?? null;
    }

    function resolveStaff(nameStr) {
      return staffMap.get((nameStr || '').toLowerCase().trim()) ?? null;
    }

    function resolveSurvey(topic, isScanRow) {
      // Environmental Scan rows have no 'Topic' column — match on survey title instead.
      if (isScanRow) {
        for (const s of surveyList) {
          if (s.title.includes('environmental scan') || s.title.includes('scan')) return s.id;
        }
        return null;
      }

      // Narrative Input rows: 'Topic' is a content category (Environmental, Housing,
      // Transportation, Workforce & Jobs, ...), NOT a survey name — every narrative
      // row belongs to the single Narrative Input survey. Match on survey title
      // first (mirrors the scan branch above) so a Topic of "Environmental" can't
      // collide with a survey literally titled "Environmental Scan".
      for (const s of surveyList) {
        if (s.title.includes('narrative')) return s.id;
      }

      // Fallback: only reached if no survey is titled "...narrative...". Fuzzy-match
      // the topic text against survey titles directly.
      const t = (topic || '').toLowerCase().trim();
      if (!t) return null; // guard: empty topic must not match every survey below

      // exact match first
      for (const s of surveyList) {
        if (s.title === t) return s.id;
      }
      // contains match
      for (const s of surveyList) {
        if (s.title.includes(t) || t.includes(s.title)) return s.id;
      }
      // word-level match (e.g. "Workforce & Jobs" → "workforce")
      const words = t.split(/\W+/).filter(w => w.length > 3);
      for (const s of surveyList) {
        if (words.some(w => s.title.includes(w))) return s.id;
      }
      return null;
    }

    // "AI Scores" column looks like:
    //   "Built environment: Fair | Environmental burden: Moderate | Food access: Limited | Safety: Low"
    function parseScores(scoreStr) {
      if (!scoreStr) return [];
      return scoreStr
        .split('|')
        .map(pair => {
          const [label, value] = pair.split(':').map(s => (s || '').trim());
          return { label, value };
        })
        .filter(s => s.label);
    }

    // "Raw Scan Data" column looks like:
    //   "[Built environment]\n  Housing quality: Good\n  Sidewalk condition: Good\n[Safety & perceived risk]\n  ..."
    // Parsed into one field_note per bracketed section, note = its key:value lines joined.
    function parseRawScanData(raw) {
      if (!raw) return [];
      const sections = [];
      let currentLabel = null;
      let currentLines = [];

      for (const line of raw.split(/\r?\n/)) {
        const headerMatch = line.match(/^\s*\[(.+?)\]\s*$/);
        if (headerMatch) {
          if (currentLabel) sections.push({ label: currentLabel, note: currentLines.join('; ').trim() });
          currentLabel = headerMatch[1].trim();
          currentLines = [];
        } else if (line.trim()) {
          currentLines.push(line.trim());
        }
      }
      if (currentLabel) sections.push({ label: currentLabel, note: currentLines.join('; ').trim() });

      return sections.filter(s => s.note);
    }

    function buildAiAnalysis(row, isScanRow) {
      const rawThemes = (row['AI Themes'] || '');
      const themes    = rawThemes.split(',').map(t => t.trim()).filter(Boolean);
      // 'Topic' is the broad content bucket (Environmental, Housing, Transportation,
      // Workforce & Jobs, ...) — narrative rows only, scan rows have no Topic column.
      const category  = (row['Topic'] || '').trim() || undefined;

      if (isScanRow) {
        return {
          summary:      row['AI Summary'] || '',
          scores:       parseScores(row['AI Scores']),
          themes,
          sentiment:    '',
          trust_signal: '',
          field_notes:  parseRawScanData(row['Raw Scan Data']),
        };
      }

      const fieldNotes = [
        { label: 'Input Type',      note: row['Input Type']       || '' },
        { label: 'Engagement Tone', note: row['Engagement Tone']  || '' },
        { label: 'Trust Observed',  note: row['Trust Observed']   || '' },
        { label: 'Field Notes',     note: row['Field Notes']      || '' },
        { label: 'Sentiment Note',  note: row['AI Sentiment Note']|| '' },
      ].filter(fn => fn.note.trim());

      return {
        summary:      row['AI Summary']      || '',
        scores:       [],
        themes,
        sentiment:    row['AI Sentiment']    || '',
        trust_signal: row['AI Trust Signal'] || '',
        field_notes:  fieldNotes,
        category,
      };
    }

    // ── Process rows ────────────────────────────────────────────────────
    const inserted = [];
    const skipped  = [];
    const errors   = [];

    for (const row of rows) {
      try {
        const staffName  = (row['Staff Name'] || '').trim();
        const wardName   = (row['Ward']       || '').trim();
        const topic      = (row['Topic']      || '').trim();
        const submittedAt = row['Submitted At'] || new Date().toISOString();
        const isScanRow  = ('AI Scores' in row) || ('Raw Scan Data' in row);

        const ward_id   = resolveWard(wardName);
        const user_id   = resolveStaff(staffName);
        const survey_id = resolveSurvey(topic, isScanRow);

        // Skip rows with no usable identifiers
        if (!staffName && !wardName) {
          skipped.push({ row: staffName || '(empty)', reason: 'No staff or ward' });
          continue;
        }

        const aiAnalysis   = buildAiAnalysis(row, isScanRow);
        const location_text = (row['Location'] || '').trim();

        // Flag urgent sentiment submissions automatically
        const status = (row['AI Sentiment'] || '').toLowerCase() === 'urgent'
          ? 'flagged'
          : 'submitted';

        await db.execute(
          `INSERT INTO survey_submissions
             (survey_id, user_id, ward_id, location_text, status, ai_analysis, submitted_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            survey_id,
            user_id,
            ward_id,
            location_text,
            status,
            JSON.stringify(aiAnalysis),
            submittedAt,
            submittedAt,
          ]
        );

        inserted.push({
          staff:   staffName,
          ward:    wardName,
          topic,
          ward_id_resolved:   ward_id   !== null,
          user_id_resolved:   user_id   !== null,
          survey_id_resolved: survey_id !== null,
        });
      } catch (rowErr) {
        errors.push({ row: row['Staff Name'], error: rowErr.message });
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        inserted: inserted.length,
        skipped:  skipped.length,
        errors:   errors.length,
        details:  { inserted, skipped, errors },
      })
    };

  } catch (err) {
    console.error('WCimportSurveyData error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
