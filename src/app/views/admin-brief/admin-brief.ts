import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';
import { SurveyService } from '../../services/survey.service';
import { CommunityBenchmarks } from '../../models/survey.models';

@Component({
  selector: 'app-admin-brief',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-brief.html',
  styleUrl: './admin-brief.css'
})
export class AdminBrief implements OnInit {
  readonly today = new Date();

  benchmarks: CommunityBenchmarks | null = null;
  benchmarksLoading = false;
  benchmarksError = '';

  constructor(
    readonly state: AdminStateService,
    private readonly surveyService: SurveyService,
    private readonly titleService: Title
  ) {}

  async ngOnInit() {
    this.titleService.setTitle('WellCentricPulse : COMMUNITY INTELLIGENCE BRIEF');
    await Promise.all([this.state.load(), this.loadBenchmarks()]);
  }

  async loadBenchmarks() {
    this.benchmarksLoading = true;
    this.benchmarksError = '';
    try {
      this.benchmarks = await this.surveyService.getCommunityBenchmarks();
    } catch (err: any) {
      this.benchmarksError = err?.message || 'Failed to load community benchmarks.';
    } finally {
      this.benchmarksLoading = false;
    }
  }

  async refresh() {
    await Promise.all([this.state.load(), this.loadBenchmarks()]);
  }

  print() {
    window.print();
  }
}
