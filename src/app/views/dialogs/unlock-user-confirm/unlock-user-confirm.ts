
import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../../services/api.service';
import { UserDataService } from '../../../services/user-data-service';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoginRequest } from '../../../models/requests/loginRequest';
import { Auth } from '../../../services/auth';
@Component({
  selector: 'app-unlock-user-confirm',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatFormFieldModule, MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner, ReactiveFormsModule
  ],
  templateUrl: './unlock-user-confirm.html',
  styleUrl: './unlock-user-confirm.css'
})
export class UnlockUserConfirm {

  isLoading = false;
  noteForm!: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<UnlockUserConfirm>,
    private readonly apiService: ConfigService, private readonly fb: FormBuilder,
    private readonly userData: UserDataService,
    private readonly authService: Auth,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.noteForm = this.fb.group({
      note: ['', Validators.required]
    });
  }

  // ============================
  // CONFIRM ACTION
  // ============================
async confirm(result: boolean): Promise<void> {
//alert(result);
  if (!result) {
    this.dialogRef.close({ refresh: false });
    return;
  }

  
  this.isLoading = true;

  try {
    const note = this.noteForm.value.note.trim();
    
    // ✅ Call unlock API
    await this.unlockUser(this.data.userId, this.data.cognito_username, this.data.email);
   
    const logNote = `Unlocked user ${this.data.email} (${this.data.role})`;
    // ✅ Log action
    await this.logAction(this.data.userId, logNote);

    this.dialogRef.close({
      refresh: true
    });

  } catch (error) {
    console.error('Unlock failed', error);
    alert('Failed to unlock user');
  } finally {
    this.isLoading = false;
  }
}
private async unlockUser(userId: number, cognito_username: string, useremail: string): Promise<any> {
  

  const requestUnkock: LoginRequest = {
    username: useremail
  };
   await this.authService.loginSuccessReset<any>(requestUnkock);
  return this.apiService.unlockUser({
      username: cognito_username
  });
}
private logAction(userId: number, note: string): Promise<any> {

  const user = this.userData.getUser();

  const logPayload = {
    table_name: 'SYSTEM_LOG',
    insertDataArray: [{
     
      log_name: 'UNLOCK USER',
      log_details: note,
      log_status: 'SUCCESS',
      log_by: user.ID,
      action_type: 'UNLOCK'
    }]
  };

  return this.apiService.insert(logPayload);
}
 
 
}
