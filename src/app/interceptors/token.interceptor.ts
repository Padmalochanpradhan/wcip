import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return from(handle(req, next, auth));
};

async function handle(req: any, next: any, auth: AuthService) {
  // Refresh token if expired
  if (auth.isTokenExpired()) {
    await auth.refreshToken();
  }

  const token = auth.getIdToken();
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        return from(refreshAndRetry(req, next, auth));
      }
      return throwError(() => error);
    })
  ).toPromise();
}

async function refreshAndRetry(req: any, next: any, auth: AuthService) {
  const newToken = await auth.refreshToken();

  if (!newToken) {
    auth.logout();
    return throwError(() => 'Session expired');
  }

  const newReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${auth.getAccessToken()}`
    }
  });

  return next(newReq).toPromise();
}
