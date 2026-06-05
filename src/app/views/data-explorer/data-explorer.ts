import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataSourceService } from '../../services/data-source.service';
import { DataSourcePlugin, DataResult, DataSourceParam } from '../../models/data-source.models';

@Component({
  selector: 'app-data-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './data-explorer.html',
  styleUrl: './data-explorer.css'
})
export class DataExplorer implements OnInit {
  sources: DataSourcePlugin[] = [];
  selectedSourceId = '';
  activeSource: DataSourcePlugin | null = null;

  params: Record<string, string> = {};
  multiSelects: Record<string, string[]> = {};

  result: DataResult | null = null;
  isLoading = false;
  error = '';

  filterText = '';

  constructor(
    private readonly router: Router,
    private readonly dataSourceService: DataSourceService
  ) {}

  ngOnInit() {
    this.sources = this.dataSourceService.sources;
    if (this.sources.length) this.selectSource(this.sources[0].id);
  }

  selectSource(id: string) {
    this.selectedSourceId = id;
    this.activeSource = this.dataSourceService.getSource(id) || null;
    this.params = {};
    this.multiSelects = {};
    this.result = null;
    this.error = '';

    // Pre-fill defaults
    this.activeSource?.parameters.forEach(p => {
      if (p.type === 'multiselect') {
        this.multiSelects[p.key] = (p.default || '').split(',').filter(Boolean);
      } else {
        this.params[p.key] = p.default || '';
      }
    });
  }

  async run() {
    if (!this.activeSource) return;
    this.isLoading = true;
    this.error = '';
    this.result = null;

    // Merge multiselects into params as comma-separated
    const merged: Record<string, string> = { ...this.params };
    Object.entries(this.multiSelects).forEach(([k, vals]) => {
      merged[k] = vals.join(',');
    });

    try {
      this.result = await this.dataSourceService.fetch(this.selectedSourceId, merged);
    } catch (err: any) {
      this.error = err?.message || 'API call failed. Check parameters and try again.';
    } finally {
      this.isLoading = false;
    }
  }

  toggleMulti(paramKey: string, value: string) {
    if (!this.multiSelects[paramKey]) this.multiSelects[paramKey] = [];
    const idx = this.multiSelects[paramKey].indexOf(value);
    if (idx > -1) this.multiSelects[paramKey].splice(idx, 1);
    else          this.multiSelects[paramKey].push(value);
  }

  isMultiSelected(paramKey: string, value: string): boolean {
    return (this.multiSelects[paramKey] || []).includes(value);
  }

  get filteredRows(): string[][] {
    if (!this.result) return [];
    if (!this.filterText) return this.result.rows;
    const q = this.filterText.toLowerCase();
    return this.result.rows.filter(row => row.some(cell => (cell || '').toLowerCase().includes(q)));
  }

  formatCell(val: string, header: string): string {
    if (!val || val === '-666666666' || val === 'null') return '—';
    const n = Number(val);
    if (isNaN(n)) return val;
    if (header.toLowerCase().includes('income') || header.toLowerCase().includes('value') || header.toLowerCase().includes('rent')) {
      return '$' + n.toLocaleString();
    }
    return n.toLocaleString();
  }

  copyUrl() {
    if (this.result?.url) navigator.clipboard.writeText(this.result.url);
  }

  goBack() { this.router.navigate(['/field-home']); }

  isTextOrSelect(p: DataSourceParam): boolean { return p.type === 'text' || p.type === 'select'; }
}
