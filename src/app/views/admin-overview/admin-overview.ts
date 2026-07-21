import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';
import { HeaderService } from '../../services/header.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-overview.html',
  styleUrl: './admin-overview.css'
})
export class AdminOverview implements OnInit {
  constructor(
    readonly state: AdminStateService,
    private readonly router: Router,
    private readonly headerService: HeaderService
  ) {}

  ngOnInit() { this.headerService.setTitle('ADMIN OVERVIEW'); }

  openSub(id: number) { this.router.navigate(['/admin/submissions', id]); }

  openUrgentFlags() {
    this.router.navigate(['/admin/submissions'], { state: { quickFilter: 'urgent' } });
  }
}
