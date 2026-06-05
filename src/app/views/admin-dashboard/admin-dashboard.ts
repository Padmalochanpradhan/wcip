import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly title: Title
  ) {}

  ngOnInit() {
    this.title.setTitle('WCIP Admin Dashboard');
  }

  go(path: string) { this.router.navigate([path]); }
}
