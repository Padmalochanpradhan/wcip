import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AdminStateService } from '../../services/admin-state.service';

@Component({
  selector: 'app-admin-staff-activity',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './admin-staff-activity.html',
  styleUrl: './admin-staff-activity.css'
})
export class AdminStaffActivity {
  constructor(readonly state: AdminStateService) {}
}
