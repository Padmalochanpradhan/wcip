# Airtable CSV import (one-off)

Imports the old Airtable exports — **Environmental Scans** and **Narrative
Inputs** — into `survey_submissions` via the existing `WCimportSurveyData`
Lambda, the same way the app itself would.

## What changed to support this

- `functions/WCimportSurveyData.js` previously only knew how to build
  `ai_analysis` for Narrative Inputs rows. It now auto-detects Environmental
  Scan rows (presence of `AI Scores` / `Raw Scan Data` columns) and:
  - parses `AI Scores` (`"Label: Value | Label: Value"`) into `scores: [{label, value}]`
  - parses `Raw Scan Data` (`"[Section]\n  key: value\n..."`) into `field_notes`, one entry per bracketed section
  - resolves the target survey by title match against "scan" instead of the (nonexistent, for this CSV) `Topic` column
  - **this Lambda needs to be redeployed** before running the script with `--commit`, otherwise scan rows will still land with empty `scores`.

## Usage

```powershell
# 1. Dry run first (default) — parses both files, no data sent anywhere.
#    A native file picker opens; select one or both CSVs (multi-select works).
node scripts/airtable-import/import.js

# Review the output in scripts/airtable-import/logs/*.dry-run.json

# 2. Get an auth token: log into the app in a browser, open DevTools console, run:
#    localStorage.getItem('id_token')
#    copy the value (no quotes)

# 3. Commit for real
$env:WC_ID_TOKEN = "<paste id_token here>"
node scripts/airtable-import/import.js --commit
```

Or skip the file picker and pass paths directly:

```powershell
node scripts/airtable-import/import.js --file "C:\path\Environmental Scans-Grid view.csv" --file "C:\path\Narrative Inputs-Grid view (1).csv" --commit
```

## Notes / things to check after a `--commit` run

- Read the `inserted` / `skipped` / `errors` counts and the JSON log written
  to `scripts/airtable-import/logs/*.result.json`.
- `ward_id`, `user_id` (staff), and `survey_id` are resolved server-side by
  name lookup (case-insensitive, trimmed). Rows where the `Staff Name` or
  `Ward` text doesn't exactly match `staff_roster.name` / `wards.name` will
  import with a `null` staff/ward rather than fail — worth spot-checking a
  sample of imported rows against the CSV.
- Duplicate imports: the Lambda doesn't dedupe. Re-running `--commit` on the
  same file will insert duplicate rows. If a run partially fails, re-running
  the whole file will re-insert the rows that already succeeded.
- The import Lambda has no auth check of its own (relies on API Gateway's
  Cognito authorizer) — an expired/invalid token will surface as a 401/403
  from the script.
