import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-overview.html',
  styleUrl: './admin-overview.css'
})
export class AdminOverview {
  constructor(
    readonly state: AdminStateService,
    private readonly router: Router
  ) {}

  openSub(id: number) { this.router.navigate(['/admin/submissions', id]); }
}
