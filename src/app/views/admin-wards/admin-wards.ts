import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminStateService } from '../../services/admin-state.service';
import { HeaderService } from '../../services/header.service';

@Component({
  selector: 'app-admin-wards',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './admin-wards.html',
  styleUrl: './admin-wards.css'
})
export class AdminWards implements OnInit {
  constructor(
    readonly state: AdminStateService,
    private readonly headerService: HeaderService
  ) {}

  ngOnInit() { this.headerService.setTitle('WARD BREAKDOWN'); }
}
