import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  constructor(
    private readonly router: Router,
    private readonly titleService: Title,
    readonly state: AdminStateService
  ) {}

  async ngOnInit() {
    this.titleService.setTitle('WCIP');
    await this.state.load();
  }

  onFilterChange(event: Event) {
    this.state.setFilter((event.target as HTMLSelectElement).value);
  }

  async refresh() { await this.state.load(); }
}
