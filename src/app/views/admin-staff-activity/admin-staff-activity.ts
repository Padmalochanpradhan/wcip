import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';
import { HeaderService } from '../../services/header.service';

@Component({
  selector: 'app-admin-staff-activity',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-staff-activity.html',
  styleUrl: './admin-staff-activity.css'
})
export class AdminStaffActivity implements OnInit {
  constructor(
    readonly state: AdminStateService,
    private readonly headerService: HeaderService
  ) {}

  ngOnInit() { this.headerService.setTitle('STAFF ACTIVITY'); }
}
