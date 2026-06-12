import { Component } from '@angular/core';
import { AdminStateService } from '../../services/admin-state.service';

@Component({
  selector: 'app-admin-wards',
  standalone: true,
  imports: [],
  templateUrl: './admin-wards.html',
  styleUrl: './admin-wards.css'
})
export class AdminWards {
  constructor(readonly state: AdminStateService) {}
}
