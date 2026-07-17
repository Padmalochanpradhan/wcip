import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ConfigService } from '../../services/api.service';
import { UserDataService } from '../../services/user-data-service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css'
})
export class ChangePassword implements OnInit {

  oldPassword     = '';
  newPassword     = '';
  confirmPassword = '';
  isLoading       = false;
  errorMessage    = '';

  showOldPassword     = false;
  showNewPassword     = false;
  showConfirmPassword = false;

  // True when redirected here right after login (30-day forced reset or the
  // soft expiry-warning dialog) — the user just proved their current password
  // seconds ago, so we don't ask them to re-enter it. False for a voluntary
  // change triggered from within the app, which does require the old password.
  fromLogin = false;

  // Set only for the voluntary path (passed by the "Change password" menu
  // links) — where Cancel should return the user without ending their session.
  returnTo = '';

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  constructor(
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly apiService: ConfigService,
    private readonly userData: UserDataService,
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    this.titleService.setTitle('WellCentricPulse : CHANGE PASSWORD');
    this.fromLogin = !!window.history.state?.fromLogin;
    this.returnTo  = window.history.state?.returnTo || '';
  }

  cancel() {
    if (this.returnTo) {
      // Voluntary change, abandoned — session is still valid, just go back.
      this.router.navigate([this.returnTo]);
    } else {
      // Forced reset (or no known return point) — don't let an expired
      // password slip back into the app; end the session and require login.
      this.userData.clearUser();
      this.router.navigate(['/login']);
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (!this.fromLogin && !this.oldPassword) {
      this.errorMessage = 'Please enter your current password.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const policyError = this.validatePasswordPolicy(this.newPassword);
    if (policyError) {
      this.errorMessage = policyError;
      return;
    }

    const user = this.userData.getUser<any>();
    if (!user) {
      this.errorMessage = 'Session expired. Please login again.';
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    try {
      if (this.fromLogin) {
        // Mandatory reset right after login — no old-password check here since
        // Cognito auth already succeeded moments ago at the login screen.
        const cognitoId = user.cognito_username || user.email;
        if (cognitoId) {
          await this.apiService.updateCognitoUser(cognitoId, {}, this.newPassword);
        }
      } else {
        // Voluntary change from within the app — verifies oldPassword against
        // Cognito and rejects if it's wrong or the new password fails the pool's
        // policy. Nothing else runs unless this succeeds.
        await this.authService.changePassword(this.oldPassword, this.newPassword);
      }
    } catch (error: any) {
      this.errorMessage = this.describeCognitoError(error);
      this.isLoading = false;
      return;
    }

    try {
      // Keep the DB password hash in sync — WCAuthentication authenticates
      // against this column directly, independent of Cognito. The stored user
      // object uses uppercase ID (see WCAuthentication.js: `sr.id AS ID`).
      const userId = user.ID ?? user.id;
      await this.apiService.wcUserPasswordUpdate({ ID: userId, Password: this.newPassword });
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage =
        'Your password was changed, but we couldn’t sync it to your account record. ' +
        'Please contact an administrator before logging out.';
      return;
    }

    this.isLoading = false;
    this.userData.clearUser();
    this.router.navigate(['/login'], {
      state: { successMessage: 'Password changed successfully. Please login again.' }
    });
  }

  private describeCognitoError(error: any): string {
    const code = error?.name || error?.__type || '';
    switch (code) {
      case 'NotAuthorizedException':
        return 'Current password is incorrect.';
      case 'InvalidPasswordException':
      case 'InvalidParameterException':
        return error?.message || 'New password does not meet the required policy.';
      case 'LimitExceededException':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return error?.message || 'Failed to update password. Please try again.';
    }
  }

  private validatePasswordPolicy(password: string): string | null {
    if (password.length < 8)             return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password))         return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(password))         return 'Password must include at least one lowercase letter.';
    if (!/[0-9]/.test(password))         return 'Password must include at least one number.';
    if (!/[!@#$%^&*]/.test(password))   return 'Password must include at least one special character (! @ # $ % ^ & *).';
    return null;
  }
}
