import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Shared between AdminLayout (hamburger button) and AdminDashboard (sidebar element).
 * Used only on mobile — desktop/tablet keep the sidebar always visible.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly openSubject = new BehaviorSubject<boolean>(false);
  readonly open$ = this.openSubject.asObservable();

  toggle() { this.openSubject.next(!this.openSubject.value); }
  close()  { this.openSubject.next(false); }
}
