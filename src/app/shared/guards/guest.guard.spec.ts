import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';

import { guestGuard } from './guest.guard';
import { UserDataService } from '../../services/user-data-service';

describe('guestGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guestGuard(...guardParameters));

  let isLoggedIn: boolean;
  let currentUser: any;
  let navigateSpy: jasmine.Spy;

  beforeEach(() => {
    isLoggedIn = false;
    currentUser = null;
    navigateSpy = jasmine.createSpy('navigate');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserDataService,
          useValue: { isLoggedIn: () => isLoggedIn, getUser: () => currentUser },
        },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    });
  });

  it('allows navigation to /login when the user is not logged in', () => {
    isLoggedIn = false;
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('redirects an already-logged-in admin (role_id 2) to /admin, replacing the history entry', () => {
    isLoggedIn = true;
    currentUser = { role_id: 2 };
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin'], { replaceUrl: true });
  });

  it('redirects an already-logged-in field user (non-admin role) to /field-home', () => {
    isLoggedIn = true;
    currentUser = { role_id: 1 };
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/field-home'], { replaceUrl: true });
  });
});
