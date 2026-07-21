import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-password-warning-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './password-warning-dialog.html',
  styleUrl: './password-warning-dialog.css',
})
export class PasswordWarningDialog {

  isExpired = false;

  constructor(
    private readonly dialogRef: MatDialogRef<PasswordWarningDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      is_password_expired: boolean;
    }
  ) {
    this.isExpired = data.is_password_expired;
  }

  changePassword(): void {
    this.dialogRef.close('change');
  }

  skip(): void {
    this.dialogRef.close('skip');
  }
}
