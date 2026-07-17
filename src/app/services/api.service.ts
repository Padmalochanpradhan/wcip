/**
 * ConfigService — central API gateway for all WC Lambda calls.
 *
 * Every method maps to one Lambda function via commonPostApi, which appends
 * the environment suffix (-prod / -dev) and posts to the API Gateway endpoint.
 *
 * Lambda mapping:
 *   insert()              → WCMultipleinsert       (generic INSERT)
 *   insertUsers()         → WCCreateUser            (staff_roster INSERT + Cognito)
 *   update()              → WCMultiplefieldupdate   (generic UPDATE, table-whitelisted)
 *   updateUser()          → WCUpdateUser            (staff_roster UPDATE)
 *   wcUserPasswordUpdate()→ WCUserPasswordUpdate    (password hash update)
 *   users()               → WCUserslist             (staff list for Manage Users)
 *   pageaccess()          → WCGetPageAccessList     (all ROLE_PAGE_ACCESS rules)
 *   checkuserexist()      → WCGetUserByEmail        (duplicate-email check)
 *   createCognitoUser()   → WCCreateCognitoUser     (Cognito user creation)
 *   updateCognitoUser()   → WCUpdateCognitoUser     (Cognito attribute/password update)
 *   unlockUser()          → WCAdminUnLockedCognitoUser (re-enable locked Cognito user)
 *   resetUserMfa()        → WCResetUserMfa          (recreate Cognito user to clear a stuck TOTP device — also issues a new password, see WCResetUserMfa.js)
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppEnvService } from './app-env.service';
import { commonPostApi } from '../utilities/functions';
import { UsernameRequest } from '../models/requests/userRequest';

@Injectable({ providedIn: 'root' })
export class ConfigService {

  constructor(
    private readonly httpClient: HttpClient,
    private readonly environmentService: AppEnvService
  ) {}

  async insert<TResponse, TRequest>(request: TRequest): Promise<TResponse> {
    return commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCMultipleinsert',
      request
    );
  }

  async insertUsers<TResponse, TRequest>(request: TRequest): Promise<TResponse> {
    return commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCCreateUser',
      request
    );
  }

  async update<TResponse, TRequest>(request: TRequest): Promise<TResponse> {
    return commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCMultiplefieldupdate',
      request
    );
  }

  async updateUser<TResponse, TRequest>(request: TRequest): Promise<TResponse> {
    return commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCUpdateUser',
      request
    );
  }

  async wcUserPasswordUpdate(request: { ID: number; Password: string }): Promise<any> {
    return commonPostApi<any>(
      this.httpClient,
      this.environmentService,
      'WCUserPasswordUpdate',
      request
    );
  }

  async users<TResponse>(): Promise<TResponse> {
    return await commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCUserslist',
      {}
    );
  }

  async pageaccess<TResponse>(): Promise<TResponse> {
    return await commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCGetPageAccessList',
      {}
    );
  }

  async checkuserexist<TResponse>(request: UsernameRequest): Promise<TResponse> {
    return await commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCGetUserByEmail',
      request
    );
  }

  async createCognitoUser(request: any): Promise<string> {
    const res: any = await commonPostApi(
      this.httpClient,
      this.environmentService,
      'WCCreateCognitoUser',
      request
    );

    const parsed = this.parseLambdaBody(res);

    if ((res.statusCode ?? parsed?.statusCode) !== 200 || parsed?.status === 'error') {
      throw new Error(
        parsed?.message || parsed?.error ||
        'Failed to create user. Password does not meet policy requirements.'
      );
    }

    const cognitoUsername = parsed?.user?.cognitoUsername;
    if (!cognitoUsername) {
      throw new Error('Cognito username not returned');
    }
    return cognitoUsername;
  }

  async updateCognitoUser(
    username: string,
    attributes: any,
    newPassword?: string
  ): Promise<any> {
    const cognitoPayload: any = { username, attributes };
    if (newPassword) cognitoPayload.newPassword = newPassword;

    const res: any = await commonPostApi(
      this.httpClient,
      this.environmentService,
      'WCUpdateCognitoUser',
      cognitoPayload
    );

    const parsed = this.parseLambdaBody(res);
    const statusCode = res?.statusCode ?? parsed?.statusCode;

    if (statusCode !== 200) {
      throw new Error(
        parsed?.message || parsed?.error ||
        res?.message || res?.error ||
        'Failed to update Cognito user'
      );
    }
    return parsed;
  }

  async unlockUser<TResponse, TRequest>(request: TRequest): Promise<TResponse> {
    return commonPostApi<TResponse>(
      this.httpClient,
      this.environmentService,
      'WCAdminUnLockedCognitoUser',
      request
    );
  }

  async resetUserMfa<TRequest>(request: TRequest): Promise<any> {
    const res: any = await commonPostApi(
      this.httpClient,
      this.environmentService,
      'WCResetUserMfa',
      request
    );

    const parsed = this.parseLambdaBody(res);
    const statusCode = res?.statusCode ?? parsed?.statusCode;

    if (statusCode !== 200) {
      throw new Error(
        parsed?.message || parsed?.error ||
        res?.message || res?.error ||
        'Failed to reset MFA for this user.'
      );
    }
    return parsed;
  }

  /**
   * Normalises Lambda responses regardless of API Gateway integration type.
   * Proxy integrations return { body: string }; non-proxy integrations return
   * { data: string } or the payload directly at the top level.
   */
  private parseLambdaBody(res: any): any {
    if (res?.body) {
      return typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
    }
    if (res?.data) {
      return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    }
    return res;
  }
}
