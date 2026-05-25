import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { switchMap, startWith, debounceTime } from 'rxjs/operators';
import { UserDataService } from './user-data-service';
import { SystemLogService } from './system-log';

@Injectable({
  providedIn: 'root'
})
export class IdleTimeoutService {

  private readonly idleTime = 20 * 60 * 1000; // ✅ 10 minutes
  private subscription!: Subscription;
  private storageSubscription!: Subscription;

  constructor(
    private readonly router: Router,
    private readonly userData: UserDataService,
    private readonly ngZone: NgZone,
    private readonly systemLogService: SystemLogService
  ) {}

  startWatching() {

    // Stop existing watchers
    this.stopWatching();

    const activityEvents$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart')
    );

    this.ngZone.runOutsideAngular(() => {

      this.subscription = activityEvents$
        .pipe(
          debounceTime(500), // ✅ avoid too many triggers
          startWith(null),
          switchMap(() => {
            localStorage.setItem('lastActivity', Date.now().toString());
            return timer(this.idleTime);
          })
        )
        .subscribe(() => {
          this.ngZone.run(() => this.logout());
        });

    });

    // ✅ Sync across tabs
    this.storageSubscription = fromEvent(window, 'storage')
      .pipe(debounceTime(500))
      .subscribe(() => {
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
          this.startWatching(); // reset timer
        }
      });
  }

  stopWatching() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.storageSubscription) {
      this.storageSubscription.unsubscribe();
    }
  }

  checkSession() {

    const lastActivity = localStorage.getItem('lastActivity');

    if (!lastActivity) {
      return;
    }

    const now = Date.now();
    const diff = now - Number(lastActivity);

    if (diff > this.idleTime) {
      this.logout();
    }
  }

  logout() {

    const user = this.userData.getUser();

    if (user) {
      this.systemLogService.addSystemLog({
        log_name: 'LOGOUT',
        log_details: `Auto Logout ${user.EmailID}`,
        log_status: 'SUCCESS',
        log_by: user.ID,
        action_type: user.EmailID
      }).catch(() => {});
    }

    // Clear session
    this.userData.clearUser();
    localStorage.removeItem('lastActivity');

    this.stopWatching();

    this.router.navigate(['/login']);
  }
}