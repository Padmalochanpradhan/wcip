import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand
} from "@aws-sdk/client-cognito-identity-provider";
const USER_KEY = 'app_user';
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds
@Injectable({ providedIn: 'root' })
export class AuthService {
  private inactivityTimer: any;
  constructor(private readonly router: Router, private readonly ngZone: NgZone) { this.startInactivityWatcher(); }  // ✅ keep only this, no `router: any`

  // ✅ Start tracking user activity
  private startInactivityWatcher(): void {
    ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(event =>
      window.addEventListener(event, () => this.resetInactivityTimer())
    );
    this.resetInactivityTimer();
  }
  // ✅ Reset inactivity timer
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = setTimeout(() => {
        this.ngZone.run(() => this.logoutDueToInactivity());
      }, INACTIVITY_LIMIT);
    });
  }

  // ✅ Handle logout due to inactivity
  private logoutDueToInactivity(): void {
    this.clearUser();
    sessionStorage.clear();
    this.router.navigate(['/']);
  }

  // ✅ Get full name with role
  getUserName(): string {
    const user = this.getUser();
    return [user?.FistName, user?.LastName].filter(Boolean).join(' ')
      + (user?.ROLE_NAME ? ` (${user.ROLE_NAME})` : '');
  }

  // ✅ Get full name with role
  getName(): string {
    const user = this.getUser();
    return [user?.FistName, user?.LastName].filter(Boolean).join(' ');
  }

  // ✅ Save user data
  setUser(user: any): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Error saving user to localStorage', err);
    }
  }

  // ✅ Get stored user data
  getUser<T = any>(): T | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? (JSON.parse(data) as T) : null;
  }

  // ✅ Remove user data (logout)
  clearUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  // ✅ Check if logged in
  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  // ✅ Logout and redirect
  logout(): void {
    this.clearUser();
    sessionStorage.clear();
    localStorage.clear();
    this.router.navigate(['/']); // works now
  }

  // Congito 
  private readonly client = new CognitoIdentityProviderClient({
    region: environment.cognito.region
  });

  private calculateSecretHash(username: string): string {
    const message = username + environment.cognito.clientId;
    const secretKey = environment.cognito.clientSecret;
    const hash = CryptoJS.HmacSHA256(message, secretKey);
    return CryptoJS.enc.Base64.stringify(hash);
  }

  // ------------------------
  // LOGIN
  // ------------------------
  async login(username: string, password: string) {
    const secretHash = this.calculateSecretHash(username);

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: environment.cognito.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    });

    const result: any = await this.client.send(command);

    // ➤ Case 1: Auth success (no MFA)
    if (result.AuthenticationResult) {
      this.storeTokens(result.AuthenticationResult, username);
      return { status: "SUCCESS", tokens: result.AuthenticationResult };
    }
    // ✅ CASE 2: FIRST TIME → NEED QR CODE
    if (result.ChallengeName === "MFA_SETUP") {

      return {
        status: "MFA_SETUP",
        session: result.Session,
        username: username
      };
    }
    // ✅ CASE 3: NORMAL MFA LOGIN
    if (result.ChallengeName === "SOFTWARE_TOKEN_MFA") {

      return {
        status: "SOFTWARE_TOKEN_MFA",
        session: result.Session,
        username: username
      };
    }

    // ➤ Case 2: MFA Required (SMS sent)
    if (result.ChallengeName === "SMS_MFA") {
      return {
        status: "MFA_REQUIRED",
        session: result.Session,
        challengeName: result.ChallengeName
      };
    }

    throw new Error("Unknown authentication challenge.");
  }
  async confirmMfaCode(username: string, code: string, session: string) {
    const secretHash = this.calculateSecretHash(username);

    const command = new RespondToAuthChallengeCommand({
      ClientId: environment.cognito.clientId,
      ChallengeName: "SMS_MFA",
      Session: session,
      ChallengeResponses: {
        USERNAME: username,
        SMS_MFA_CODE: code,
        SECRET_HASH: secretHash
      }
    });

    const response: any = await this.client.send(command);

    if (response.AuthenticationResult) {
      this.storeTokens(response.AuthenticationResult, username);
      return response.AuthenticationResult;
    }

    throw new Error("MFA validation failed");
  }

  // ------------------------
  // REFRESH TOKEN
  // ------------------------
  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    const username = localStorage.getItem('username');

    if (!refreshToken || !username) return null;

    const secretHash = this.calculateSecretHash(username);

    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: environment.cognito.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash
      }
    });

    try {
      const result: any = await this.client.send(command);

      if (result.AuthenticationResult) {
        this.storeTokens(result.AuthenticationResult, username);
        return result.AuthenticationResult.IdToken;
      }
    } catch (err) {
      console.error("Refresh Token Error:", err);
    }

    return null;
  }

  // ------------------------
  // STORE TOKENS
  // ------------------------
  storeTokens(tokens: any, username: string) {

    const idToken = tokens.IdToken;
    const decoded: any = JSON.parse(atob(idToken.split('.')[1]));

    const cognitoUsername = decoded['sub'];   // REAL USERNAME

    localStorage.setItem('access_token', tokens.AccessToken);
    localStorage.setItem('id_token', idToken);

    // ❗ Store Cognito username instead of email
    localStorage.setItem('username', cognitoUsername);

    if (tokens.RefreshToken) {
      localStorage.setItem('refresh_token', tokens.RefreshToken);
    }

    const expiry = Date.now() + tokens.ExpiresIn * 1000;
    localStorage.setItem('token_expiry', expiry.toString());
  }


  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('token_expiry');
    if (!expiry) return true;
    return Date.now() > Number(expiry);
  }

  getAccessToken() {
    return localStorage.getItem('access_token');
  }
  getIdToken() {
    return localStorage.getItem('id_token');
  }
  async associateSoftwareToken(session: string) {

    const command = new AssociateSoftwareTokenCommand({
      Session: session
    });

    const response: any = await this.client.send(command);

    return response;
  }
  async confirmMfaSetup(username: string, session: string, otp: string) {
    const secretHash = this.calculateSecretHash(username);
    const command =
      new RespondToAuthChallengeCommand({
        ClientId: environment.cognito.clientId,
        ChallengeName: "MFA_SETUP",
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          SOFTWARE_TOKEN_MFA_CODE: otp,
          SECRET_HASH: secretHash
        }
      });
    const result: any =
      await this.client.send(command);
    this.storeTokens(result.AuthenticationResult, username);
    return result;
  }
  async verifyLoginOtp(username: string, session: string, otp: string) {
      const secretHash = this.calculateSecretHash(username);
      const command = new RespondToAuthChallengeCommand({
          ClientId: environment.cognito.clientId,
          ChallengeName: "SOFTWARE_TOKEN_MFA",
          Session: session,
          ChallengeResponses: {
            USERNAME: username,
            SOFTWARE_TOKEN_MFA_CODE: otp,
            SECRET_HASH: secretHash
          }
        });
      const result: any = await this.client.send(command);
      this.storeTokens(result.AuthenticationResult, username);
      return result;
    }
    async verifySoftwareToken(session: string, otp: string) {
    const command = new VerifySoftwareTokenCommand({
      Session: session,
      UserCode: otp
    });
    return await this.client.send(command);
  }
}
