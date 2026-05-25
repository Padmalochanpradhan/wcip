import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { SurveyService } from '../../../services/survey.service';
import { UserDataService } from '../../../services/user-data-service';
import { Survey } from '../../../models/survey.models';

@Component({
  selector: 'app-survey-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule],
  templateUrl: './survey-layout.html',
  styleUrl: './survey-layout.css'
})
export class SurveyLayout implements OnInit, OnDestroy {
  greeting = '';
  userName = '';
  submittedCount = 0;
  surveys: Survey[] = [];

  private countSub!: Subscription;

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

  constructor(
    private readonly router: Router,
    private readonly userData: UserDataService,
    private readonly surveyService: SurveyService
  ) {}

  async ngOnInit() {
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const user = this.userData.getUser<any>();
    this.userName = user?.name || user?.username || '';

    this.countSub = this.surveyService.todayCount$.subscribe(n => this.submittedCount = n);

    try {
      this.surveys = await this.surveyService.getSurveys();
      const userId = user?.id || user?.ID || 0;
      await this.surveyService.getTodayCount(userId);
    } catch { /* surveys/count are non-blocking */ }
  }

  ngOnDestroy() {
    this.countSub?.unsubscribe();
  }

  getIcon(icon: string): string {
    return this.iconMap[icon] || 'assignment';
  }

  signOut() {
    this.userData.clearUser();
    this.router.navigate(['/login']);
  }
}
