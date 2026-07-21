/**
 * Auth service — handles the pre-session login flow only.
 *
 * These methods call Lambdas directly by URL (not via ConfigService/commonPostApi)
 * because the user session does not exist yet and the login component needs to
 * orchestrate the full flow manually:
 *
 *   1. login()               → WCAuthentication     (verify credentials, return user + pageAccess)
 *   2. loginSuccessReset()   → WCLoginSuccessReset  (clear failed-attempt counter on success)
 *   3. loginfailedincrement()→ WCLoginFailedIncrement (increment counter + lock after 5 failures)
 *   4. lockedUser()          → WCLockedCognitoUser  (disable Cognito user after lockout)
 *
 * Steps 3 and 4 are only called on a failed login; step 2 is only called on success.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoginRequest, UsernameRequest } from '../models/requests/loginRequest';
import { AppEnvService } from './app-env.service';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly environmentService: AppEnvService,
  ) {}

  /** Verifies credentials and returns user data + page access list. */
  async login<TResponse>(request: LoginRequest): Promise<TResponse> {
    const body = JSON.stringify(request);
    const requestUrl = `${this.environmentService.endpointUrl()}/WCAuthentication-${this.environmentService.envType()}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    try {
      const result = await firstValueFrom(
        this.httpClient.post<TResponse>(requestUrl, body, { headers })
      );
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /** Increments the failed-attempt counter; locks the DB row at 5 attempts. */
  async loginfailedincrement<TResponse>(request: UsernameRequest): Promise<TResponse> {
    const body = JSON.stringify(request);
    const requestUrl = `${this.environmentService.endpointUrl()}/WCLoginFailedIncrement-${this.environmentService.envType()}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    try {
      const result = await firstValueFrom(
        this.httpClient.post<TResponse>(requestUrl, body, { headers })
      );
      return result;
    } catch (error) {
      console.error('Login failed increment error:', error);
      throw error;
    }
  }

  /** Disables the Cognito user after the DB lock flag is set (dual lockout). */
  async lockedUser<TResponse>(request: UsernameRequest): Promise<TResponse> {
    const body = JSON.stringify(request);
    const requestUrl = `${this.environmentService.endpointUrl()}/WCLockedCognitoUser-${this.environmentService.envType()}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    try {
      const result = await firstValueFrom(
        this.httpClient.post<TResponse>(requestUrl, body, { headers })
      );
      return result;
    } catch (error) {
      console.error('Lock Cognito user error:', error);
      throw error;
    }
  }

  /** Resets the failed-attempt counter and clears the lock on successful login. */
  async loginSuccessReset<TResponse>(request: UsernameRequest): Promise<TResponse> {
    const body = JSON.stringify(request);
    const requestUrl = `${this.environmentService.endpointUrl()}/WCLoginSuccessReset-${this.environmentService.envType()}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    try {
      const result = await firstValueFrom(
        this.httpClient.post<TResponse>(requestUrl, body, { headers })
      );
      return result;
    } catch (error) {
      console.error('Login success reset error:', error);
      throw error;
    }
  }
}
