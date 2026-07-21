import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as Papa from 'papaparse';
import { SurveyService } from '../../services/survey.service';
import { HeaderService } from '../../services/header.service';
import { AirtableRow } from '../../models/survey.models';

interface ParsedFile {
  fileName: string;
  rows: AirtableRow[];
  scanCount: number;
  narrativeCount: number;
  missingIdCount: number;
}

const BATCH_SIZE = 25;

@Component({
  selector: 'app-admin-import',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-import.html',
  styleUrl: './admin-import.css'
})
export class AdminImport implements OnInit {
  parsed: ParsedFile | null = null;
  parseError = '';

  isImporting = false;
  importProgress = { current: 0, total: 0 };

  result: { inserted: number; skipped: number; errors: number } | null = null;
  resultError = '';

  constructor(
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly headerService: HeaderService
  ) {}

  ngOnInit() {
    this.headerService.setTitle('IMPORT DATA');
  }

  goBack() {
    this.router.navigate(['/admin/surveys']);
  }

  onFileSelected(event: Event) {
    this.parseError = '';
    this.result = null;
    this.resultError = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = ''; // allow re-selecting the same file again later

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.handleFileText(file.name, String(reader.result ?? ''));
    reader.onerror = () => { this.parseError = 'Could not read the file.'; };
    reader.readAsText(file);
  }

  private handleFileText(fileName: string, text: string) {
    const stripped = this.stripBom(text);
    const parsedCsv = Papa.parse<AirtableRow>(stripped, { header: true, skipEmptyLines: true });

    const rows = (parsedCsv.data || []).filter(
      row => Object.values(row).some(v => (v ?? '').toString().trim() !== '')
    );

    if (rows.length === 0) {
      this.parseError = 'No rows found in that file — check it\'s a valid CSV export.';
      this.parsed = null;
      return;
    }

    let scanCount = 0;
    let narrativeCount = 0;
    let missingIdCount = 0;

    for (const row of rows) {
      if (this.isScanRow(row)) scanCount++; else narrativeCount++;
      if (!(row['Staff Name'] || '').trim() && !(row['Ward'] || '').trim()) missingIdCount++;
    }

    this.parsed = { fileName, rows, scanCount, narrativeCount, missingIdCount };
  }

  private isScanRow(row: AirtableRow): boolean {
    return 'AI Scores' in row || 'Raw Scan Data' in row;
  }

  private stripBom(text: string): string {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  }

  cancelPreview() {
    this.parsed = null;
  }

  startOver() {
    this.result = null;
    this.resultError = '';
  }

  async confirmImport() {
    if (!this.parsed || this.isImporting) return;

    const rows = this.parsed.rows;
    const batches: AirtableRow[][] = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) batches.push(rows.slice(i, i + BATCH_SIZE));

    this.isImporting = true;
    this.resultError = '';
    this.importProgress = { current: 0, total: batches.length };

    const totals = { inserted: 0, skipped: 0, errors: 0 };

    try {
      for (const batch of batches) {
        const res = await this.surveyService.importAirtableData(batch);
        totals.inserted += res?.inserted ?? 0;
        totals.skipped += res?.skipped ?? 0;
        totals.errors += res?.errors ?? 0;
        this.importProgress.current++;
      }
      this.parsed = null;
    } catch (err: any) {
      this.resultError = (err?.message || 'Import failed partway through.') +
        ' Rows already sent in completed batches may already be imported — check totals below before retrying.';
    } finally {
      this.isImporting = false;
      this.result = totals;
    }
  }
}
