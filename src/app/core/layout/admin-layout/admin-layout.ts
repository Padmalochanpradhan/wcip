import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UserDataService } from '../../../services/user-data-service';
import { IdleTimeoutService } from '../../../services/idle-timeout';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, MatIconModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {
  constructor(
    private readonly router: Router,
    private readonly userData: UserDataService,
    private readonly idleService: IdleTimeoutService,
    private readonly sidebar: SidebarService
  ) {}

  get userName(): string {
    const u = this.userData.getUser<any>();
    return [u?.FistName, u?.LastName].filter(Boolean).join(' ') || 'Admin';
  }

  get todayStr(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  toggleSidebar()   { this.sidebar.toggle(); }
  goHome()          { this.router.navigate(['/admin']); }
  changePassword()  { this.router.navigate(['/change-password'], { state: { returnTo: '/admin' } }); }
  signOut()         { this.idleService.logout(); }
}
