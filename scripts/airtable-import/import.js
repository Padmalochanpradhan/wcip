#!/usr/bin/env node
/*
  One-off Airtable CSV importer for WCIP.

  Reads "Environmental Scans" and/or "Narrative Inputs" CSV exports (the
  Airtable "Grid view" export format), parses them with the same papaparse
  library the Angular app already depends on, and POSTs the rows to the
  deployed WCimportSurveyData Lambda (via API Gateway), same as the app
  would. Row-shape detection (scan vs narrative) and DB lookups (ward/staff/
  survey) happen server-side in functions/WCimportSurveyData.js.

  Usage:
    node scripts/airtable-import/import.js                 # pick file(s) via dialog, dry run
    node scripts/airtable-import/import.js --file a.csv --file b.csv
    node scripts/airtable-import/import.js --commit         # actually POST to the API
    node scripts/airtable-import/import.js --token "<id_token>" --commit
    $env:WC_ID_TOKEN = "<id_token>"; node scripts/airtable-import/import.js --commit

  Getting a token: log into the WCIP app in a browser, open DevTools console,
  run `localStorage.getItem('id_token')`, copy the value (no quotes).

  Safe by default: without --commit, nothing is sent to the API — parsed
  rows are written to scripts/airtable-import/logs/ for review instead.
*/

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const Papa = require('papaparse');

const API_BASE = 'https://9enzmi08e6.execute-api.us-east-1.amazonaws.com/prod/';
const IMPORT_FN = 'WCimportSurveyData';
const ENV_TYPE = 'prod';
const IMPORT_URL = `${API_BASE}${IMPORT_FN}-${ENV_TYPE}`;

const BATCH_SIZE = 25;
const LOG_DIR = path.join(__dirname, 'logs');

function parseArgs(argv) {
  const args = { files: [], commit: false, token: null, batchSize: BATCH_SIZE };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--commit') args.commit = true;
    else if (a === '--file') args.files.push(argv[++i]);
    else if (a === '--token') args.token = argv[++i];
    else if (a === '--batch-size') args.batchSize = parseInt(argv[++i], 10) || BATCH_SIZE;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
Airtable CSV importer

  --file <path>       CSV file to import (repeatable). If omitted, a native
                       file-picker dialog opens (multi-select supported).
  --commit             Actually POST rows to the API. Without this flag the
                       script only parses and logs what it WOULD send.
  --token <idToken>    Cognito ID token. Falls back to $env:WC_ID_TOKEN.
  --batch-size <n>     Rows per API call (default ${BATCH_SIZE}).
  --help                Show this help.
`);
}

function pickFilesViaDialog() {
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = 'CSV files (*.csv)|*.csv|All files (*.*)|*.*'
$dialog.Title = 'Select Airtable CSV export(s) to import'
$dialog.Multiselect = $true
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  $dialog.FileNames | ForEach-Object { Write-Output $_ }
}
`;
  let out;
  try {
    out = execFileSync('powershell.exe', ['-NoProfile', '-STA', '-Command', psScript], {
      encoding: 'utf8',
    });
  } catch (err) {
    console.error('Could not open file picker dialog:', err.message);
    console.error('Re-run with --file <path> instead.');
    process.exit(1);
  }
  const files = out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return files;
}

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function loadCsvRows(filePath) {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  const result = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (result.errors && result.errors.length) {
    console.warn(`  ${result.errors.length} parse warning(s) in ${path.basename(filePath)}:`);
    result.errors.slice(0, 5).forEach((e) => console.warn(`    row ${e.row}: ${e.message}`));
  }
  return result.data;
}

function classifyRow(row) {
  return 'AI Scores' in row || 'Raw Scan Data' in row ? 'environmental_scan' : 'narrative_input';
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function postBatch(batch, token) {
  const res = await fetch(IMPORT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rows: batch }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${json.error || text}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function processFile(filePath, args) {
  console.log(`\n=== ${path.basename(filePath)} ===`);
  const rows = loadCsvRows(filePath);

  const counts = { environmental_scan: 0, narrative_input: 0 };
  for (const row of rows) counts[classifyRow(row)]++;

  console.log(`  Parsed ${rows.length} row(s)`);
  console.log(`    environmental_scan rows: ${counts.environmental_scan}`);
  console.log(`    narrative_input rows:    ${counts.narrative_input}`);

  const missingIdentifiers = rows.filter(
    (r) => !(r['Staff Name'] || '').trim() && !(r['Ward'] || '').trim()
  ).length;
  if (missingIdentifiers) {
    console.log(`  WARNING: ${missingIdentifiers} row(s) have no Staff Name and no Ward — the import Lambda will skip these.`);
  }

  if (!args.commit) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const outPath = path.join(
      LOG_DIR,
      `${path.basename(filePath, path.extname(filePath))}.dry-run.json`
    );
    fs.writeFileSync(
      outPath,
      JSON.stringify({ file: filePath, counts, missingIdentifiers, rows }, null, 2),
      'utf8'
    );
    console.log(`  Dry run only — nothing sent. Full parsed payload written to:\n    ${outPath}`);
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  const batches = chunk(rows, args.batchSize);
  const totals = { inserted: 0, skipped: 0, errors: 0 };
  const responses = [];

  for (let i = 0; i < batches.length; i++) {
    process.stdout.write(`  Sending batch ${i + 1}/${batches.length} (${batches[i].length} rows)... `);
    try {
      const result = await postBatch(batches[i], args.token);
      totals.inserted += result.inserted || 0;
      totals.skipped += result.skipped || 0;
      totals.errors += result.errors || 0;
      responses.push(result);
      console.log(`ok (inserted ${result.inserted}, skipped ${result.skipped}, errors ${result.errors})`);
    } catch (err) {
      console.log('FAILED');
      console.error(`    ${err.message}`);
      if (err.status === 401 || err.status === 403) {
        console.error('    Your token is likely missing/expired. Get a fresh id_token and re-run with --token.');
      }
      responses.push({ error: err.message, batchIndex: i });
      totals.errors += batches[i].length;
    }
  }

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logPath = path.join(
    LOG_DIR,
    `${path.basename(filePath, path.extname(filePath))}.${Date.now()}.result.json`
  );
  fs.writeFileSync(logPath, JSON.stringify({ file: filePath, totals, responses }, null, 2), 'utf8');
  console.log(`  Totals: inserted ${totals.inserted}, skipped ${totals.skipped}, errors ${totals.errors}`);
  console.log(`  Full response log: ${logPath}`);

  return totals;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();

  const token = args.token || process.env.WC_ID_TOKEN || null;
  if (args.commit && !token) {
    console.error('--commit requires a Cognito ID token: pass --token "<token>" or set $env:WC_ID_TOKEN.');
    console.error('Get one by logging into the app, then in the browser console run: localStorage.getItem(\'id_token\')');
    process.exit(1);
  }
  args.token = token;

  let files = args.files;
  if (!files.length) {
    console.log('No --file given, opening file picker...');
    files = pickFilesViaDialog();
  }
  if (!files.length) {
    console.log('No files selected. Exiting.');
    return;
  }

  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error(`File not found: ${f}`);
      continue;
    }
  }

  console.log(args.commit ? `MODE: LIVE — will POST to ${IMPORT_URL}` : 'MODE: DRY RUN — nothing will be sent (pass --commit to actually import)');

  const grandTotals = { inserted: 0, skipped: 0, errors: 0 };
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const t = await processFile(f, args);
    grandTotals.inserted += t.inserted;
    grandTotals.skipped += t.skipped;
    grandTotals.errors += t.errors;
  }

  if (args.commit) {
    console.log(`\n=== Grand totals: inserted ${grandTotals.inserted}, skipped ${grandTotals.skipped}, errors ${grandTotals.errors} ===`);
  } else {
    console.log('\nDry run complete. Review the JSON in scripts/airtable-import/logs/, then re-run with --commit when ready.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
