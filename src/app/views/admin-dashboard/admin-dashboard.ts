import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AdminStateService } from '../../services/admin-state.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit, OnDestroy {
  sidebarOpen = false;
  private subs = new Subscription();

  constructor(
    private readonly router: Router,
    private readonly titleService: Title,
    readonly state: AdminStateService,
    private readonly sidebar: SidebarService,
    private readonly snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.titleService.setTitle('WellCentricPulse');
    await this.state.load();

    // Sync sidebar open state from service (driven by hamburger in AdminLayout header)
    this.subs.add(
      this.sidebar.open$.subscribe(open => this.sidebarOpen = open)
    );

    // Auto-close sidebar when route changes (user tapped a nav item on mobile)
    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.sidebar.close())
    );
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  closeSidebar() { this.sidebar.close(); }

  onFilterChange(event: Event) {
    this.state.setFilter((event.target as HTMLSelectElement).value);
  }

  onDateFromChange(event: Event) {
    this.state.setDateFilter((event.target as HTMLInputElement).value, this.state.filterDateTo);
  }

  onDateToChange(event: Event) {
    this.state.setDateFilter(this.state.filterDateFrom, (event.target as HTMLInputElement).value);
  }

  clearDateFilter() {
    this.state.setDateFilter('', '');
  }

  async refresh() {
    await this.state.load();
    if (this.state.loadError) {
      this.snackBar.open(`Refresh failed: ${this.state.loadError}`, 'Close', { duration: 5000 });
    } else {
      this.snackBar.open('Data refreshed.', 'Close', { duration: 2000 });
    }
  }

  openBrief() {
    window.open('/admin/brief', '_blank');
  }
}
