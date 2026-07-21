import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './services/idle-timeout';
import { UserDataService } from './services/user-data-service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('wcip');

  // Set from the Navigation API's 'navigate' event (Chrome/Edge only — see
  // watchForBackNavigationOut()) and read by the 'pagehide' handler below.
  private lastNavigationWasTraversal = false;
  private readonly onNavigate = (event: any) => {
    this.lastNavigationWasTraversal = event.navigationType === 'traverse';
  };
  private readonly onPageHide = () => {
    if (this.lastNavigationWasTraversal) {
      this.userData.clearUser();
    }
  };

  // Covers the return trip: back button out of the app, then forward button
  // back into it. The browser can restore the app instance from the
  // back-forward cache (bfcache) rather than re-running Angular's bootstrap,
  // which would silently leave a stale "logged in" view on screen even
  // though onPageHide already cleared storage on the way out. 'pageshow'
  // with persisted:true fires exactly when a page is resurrected from
  // bfcache — never on a fresh load or refresh — so this forces a real
  // logout at that moment. Supported in all major browsers, unlike the
  // Navigation API above, so this applies even where onPageHide can't.
  private readonly onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      this.userData.clearUser();
      this.router.navigate(['/login']);
    }
  };

  constructor(
    private readonly idleService: IdleTimeoutService,
    private readonly userData: UserDataService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {

    // Check session when app loads
    this.idleService.checkSession();

    // Start idle monitoring
    this.idleService.startWatching();

    this.watchForBackNavigationOut();
    window.addEventListener('pageshow', this.onPageShow);
  }

  // Logs the user out if they leave the app via the browser's back/forward
  // button (e.g. back past where they first landed, out to whatever site or
  // page came before). Deliberately does NOT log out on a plain refresh —
  // 'pagehide' fires identically for both, so telling them apart needs the
  // Navigation API to see *why* the page is unloading before it's gone.
  // Unsupported in Safari/Firefox as of now; simply skipped there rather
  // than guessing wrong and logging people out on every refresh.
  private watchForBackNavigationOut(): void {
    const nav = (window as any).navigation;
    if (!nav) return;

    nav.addEventListener('navigate', this.onNavigate);
    window.addEventListener('pagehide', this.onPageHide);
  }

  ngOnDestroy(): void {
    // ✅ Prevent memory leaks
    this.idleService.stopWatching();

    const nav = (window as any).navigation;
    if (nav) nav.removeEventListener('navigate', this.onNavigate);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('pageshow', this.onPageShow);
  }
}
