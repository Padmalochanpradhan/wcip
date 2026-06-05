import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../services/survey.service';
import { UserDataService } from '../../services/user-data-service';
import { Survey } from '../../models/survey.models';

@Component({
  selector: 'app-survey-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './survey-dashboard.html',
  styleUrl: './survey-dashboard.css'
})
export class SurveyDashboard implements OnInit {
  surveys: Survey[] = [];
  submittedToday = 0;
  todayPrompt = '';
  isLoading = true;

  readonly iconMap: Record<string, string> = {
    pencil:   'edit_note',
    target:   'track_changes',
    scan:     'gps_fixed',
    leaf:     'eco',
    building: 'domain',
    map:      'map',
    camera:   'camera_alt',
    heart:    'favorite',
  };

  readonly iconBg: Record<string, string> = {
    pencil:   '#FFF0E0',
    target:   '#E0F4F1',
    scan:     '#E0F4F1',
    leaf:     '#E8F5E9',
    default:  '#F0F0F0',
  };

  readonly iconColor: Record<string, string> = {
    pencil:   '#E07020',
    target:   '#2B7A6F',
    scan:     '#2B7A6F',
    leaf:     '#388E3C',
    default:  '#666',
  };

  constructor(
    private readonly router: Router,
    private readonly surveyService: SurveyService,
    private readonly userData: UserDataService
  ) {}

  async ngOnInit() {
    try {
      this.surveys = await this.surveyService.getSurveys();
      if (this.surveys.length) {
        this.todayPrompt = this.surveys[0].daily_prompt || '';
      }
      const user = this.userData.getUser<any>();
      this.submittedToday = await this.surveyService.getTodayCount(user?.id || user?.ID || 0);
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      this.isLoading = false;
    }
  }

  getIcon(icon: string): string {
    return this.iconMap[icon] || 'assignment';
  }

  getIconBg(icon: string): string {
    return this.iconBg[icon] || this.iconBg['default'];
  }

  getIconColor(icon: string): string {
    return this.iconColor[icon] || this.iconColor['default'];
  }

  openSurvey(id: number) {
    this.router.navigate(['/survey', id]);
  }

  openSubmissions() {
    this.router.navigate(['/submissions']);
  }

  openDataExplorer() {
    this.router.navigate(['/data-explorer']);
  }
}
