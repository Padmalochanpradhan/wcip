import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ConfigService } from '../../../services/api.service';
import { UserDataService } from '../../../services/user-data-service';

@Component({
  selector: 'app-reset-mfa-confirm',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner
  ],
  templateUrl: './reset-mfa-confirm.html',
  styleUrl: './reset-mfa-confirm.css'
})
export class ResetMfaConfirm {

  isLoading = false;
  errorMessage = '';
  newPassword = '';
  copied = false;

  constructor(
    private readonly dialogRef: MatDialogRef<ResetMfaConfirm>,
    private readonly apiService: ConfigService,
    private readonly userData: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async confirm(result: boolean): Promise<void> {
    if (!result) {
      this.dialogRef.close({ refresh: false });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // WCResetUserMfa looks up cognito_username from staff_roster by email —
      // it takes the staff email here, not the Cognito sub already in data.
      // It deletes and recreates the Cognito user (the only reliable way to
      // clear a stuck TOTP registration), so it hands back a new password too.
      const res: any = await this.apiService.resetUserMfa({ username: this.data.email });
      this.newPassword = res?.newPassword || '';

      const logNote = `Recreated Cognito account for ${this.data.email} (${this.data.role}) to clear a stuck authenticator app registration`;
      await this.logAction(logNote);
    } catch (error: any) {
      console.error('Reset MFA failed', error);
      this.errorMessage = error?.message || 'Failed to reset MFA for this user.';
    } finally {
      this.isLoading = false;
    }
  }

  async copyPassword(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.newPassword);
      this.copied = true;
    } catch {
      this.copied = false;
    }
  }

  // Only closes once the admin has actually seen (and presumably copied) the
  // new password — there's no other way to retrieve it after this dialog shuts.
  done(): void {
    this.dialogRef.close({ refresh: true });
  }

  private logAction(note: string): Promise<any> {
    const user = this.userData.getUser<any>();

    const logPayload = {
      table_name: 'SYSTEM_LOG',
      insertDataArray: [{
        log_name: 'RESET MFA',
        log_details: note,
        log_status: 'SUCCESS',
        log_by: user?.ID,
        action_type: 'RESET_MFA'
      }]
    };

    return this.apiService.insert(logPayload);
  }
}
