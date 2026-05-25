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
  async loginfailedincrement<TResponse>(request: UsernameRequest): Promise<TResponse> {
    const body = JSON.stringify(request);
    const requestUrl = `${this.environmentService.endpointUrl()}/loginFailedIncrement-${this.environmentService.envType()}`;
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
  async lockedUser<TResponse>(request: UsernameRequest): Promise<TResponse> {
    const body = JSON.stringify(request);
    const requestUrl = `${this.environmentService.endpointUrl()}/prismLockedCognitoUser-${this.environmentService.envType()}`;
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
  async loginSuccessReset<TResponse>(request: UsernameRequest): Promise<TResponse> {
    const body = JSON.stringify(request);
    const requestUrl = `${this.environmentService.endpointUrl()}/loginSuccessReset-${this.environmentService.envType()}`;
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

}
