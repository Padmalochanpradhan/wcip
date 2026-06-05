import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UserDataService } from '../../../services/user-data-service';
import { IdleTimeoutService } from '../../../services/idle-timeout';

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
    private readonly idleService: IdleTimeoutService
  ) {}

  get userName(): string {
    const u = this.userData.getUser<any>();
    return [u?.FistName, u?.LastName].filter(Boolean).join(' ') || 'Admin';
  }

  goHome() { this.router.navigate(['/admin']); }

  signOut() {
    this.idleService.logout();
  }
}
