import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './services/idle-timeout';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('wcip');
  constructor(private readonly idleService: IdleTimeoutService) {}

  ngOnInit(): void {

    // Check session when app loads
    this.idleService.checkSession();

    // Start idle monitoring
    this.idleService.startWatching();
  }

  ngOnDestroy(): void {
    // ✅ Prevent memory leaks
    this.idleService.stopWatching();
  }
}
