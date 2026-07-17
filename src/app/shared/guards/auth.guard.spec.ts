import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { UserDataService } from '../../services/user-data-service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let isLoggedIn: boolean;
  let navigateSpy: jasmine.Spy;

  beforeEach(() => {
    isLoggedIn = false;
    navigateSpy = jasmine.createSpy('navigate');

    TestBed.configureTestingModule({
      providers: [
        { provide: UserDataService, useValue: { isLoggedIn: () => isLoggedIn } },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    });
  });

  it('allows navigation when the user is logged in', () => {
    isLoggedIn = true;
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('blocks navigation and redirects to /login when not logged in', () => {
    isLoggedIn = false;
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
