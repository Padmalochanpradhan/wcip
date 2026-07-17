/**
 * HeaderService — page title broadcaster and access control enforcement point.
 *
 * Every page component calls setTitle() in ngOnInit. That call:
 *   1. Broadcasts the new title to the layout header via title$.
 *   2. Checks the user's pageAccess list (loaded at login) against the title.
 *   3. Redirects to /access-denied or /admin/access-denied if the page
 *      is not in the user's allowed pages (status = 0 in ROLE_PAGE_ACCESS).
 *
 * IMPORTANT: If a page component does NOT call setTitle(), access control
 * is never enforced for that page — any authenticated user can visit it.
 * All page components must call this in ngOnInit.
 *
 * The /admin prefix on the current URL determines which denied route to use
 * so the correct layout (admin sidebar vs survey sidebar) is preserved.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { UserDataService } from './user-data-service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class HeaderService {

  constructor(
    private readonly userData: UserDataService,
    private readonly router: Router,
    private readonly titleService: Title
  ) {}

  private readonly titleSource = new BehaviorSubject<string>('Dashboard');
  title$ = this.titleSource.asObservable();

  /**
   * Sets the page title and enforces role-based page access.
   * The title string must match page_name in the PAGES table (case-insensitive).
   */
  setTitle(title: string) {
    this.titleSource.next(title);
    this.titleService.setTitle(`WellCentricPulse : ${title}`);

    const user = this.userData.getUser();

    // No pageAccess means login response was missing the array — treat as denied
    if (!user?.pageAccess) {
      this.router.navigate(['/access-denied']);
      return;
    }

    const roleId = user.role_id;

    const hasAccess = user.pageAccess.some(
      (p: any) =>
        p.role_id === roleId &&
        p.page_name.toUpperCase() === title.toUpperCase()
    );

    if (!hasAccess) {
      this.titleSource.next('403');
      // Preserve the correct layout (admin sidebar vs survey sidebar) on the denied page
      const dest = this.router.url.startsWith('/admin')
        ? ['/admin/access-denied']
        : ['/access-denied'];
      this.router.navigate(dest);
    }
  }
}
