import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserDataService } from '../../services/user-data-service';

/**
 * Inverse of authGuard — blocks an already-logged-in user from landing on
 * /login (e.g. via browser Back after login), bouncing them to their home
 * route instead. Uses replaceUrl so the /login entry doesn't pile up in
 * history, keeping Back/Forward behaving predictably.
 */
export const guestGuard: CanActivateFn = () => {
  const userData = inject(UserDataService);
  const router   = inject(Router);

  if (!userData.isLoggedIn()) return true;

  const user = userData.getUser<any>();
  router.navigate([user?.role_id === 2 ? '/admin' : '/field-home'], { replaceUrl: true });
  return false;
};
