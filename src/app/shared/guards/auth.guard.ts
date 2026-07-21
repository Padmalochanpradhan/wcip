import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserDataService } from '../../services/user-data-service';

export const authGuard: CanActivateFn = () => {
  const userData = inject(UserDataService);
  const router   = inject(Router);

  if (userData.isLoggedIn()) return true;

  router.navigate(['/login']);
  return false;
};
