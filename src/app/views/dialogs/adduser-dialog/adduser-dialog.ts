import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ConfigService } from '../../../services/api.service';
import {
  UserRequest,
  UpdateUserRequest,
  UsernameRequest
} from '../../../models/requests/userRequest';

@Component({
  selector: 'app-adduser-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinner
  ],
  templateUrl: './adduser-dialog.html',
  styleUrls: ['./adduser-dialog.css']
})
export class AdduserDialog implements OnInit {

  addUserFormGroup!: FormGroup;
  hidePassword = true;
  isLoading = false;
  isEditMode = false;
  currentUserId: number | null = null;
  cognitoUsername: string | null = null;
  errorMessage: string = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly apiService: ConfigService,
    private readonly dialogRef: MatDialogRef<AdduserDialog>
  ) { }

  // 🔹 INIT
  ngOnInit(): void {
    this.buildForm();

    if (this.data?.isEditMode && this.data?.user) {
      this.enableEditMode(this.data.user);
    }
      this.addUserFormGroup.get('password')?.valueChanges.subscribe(() => {
        this.errorMessage = '';
      });
  }

  // 🔹 FORM BUILDER
  private buildForm(): void {
    this.addUserFormGroup = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      status: ['', Validators.required]
    });
  }

  // 🔹 EDIT MODE SETUP
  private enableEditMode(user: any): void {
    this.isEditMode = true;
    this.currentUserId = user.ID;
    this.cognitoUsername = user.cognito_username;

    // 🔥 Make password optional in edit mode
    const passwordControl = this.addUserFormGroup.get('password');
    passwordControl?.clearValidators(); // remove required & minlength
    passwordControl?.setValidators([Validators.minLength(6)]); // optional but validate if typed
    passwordControl?.updateValueAndValidity();

    this.addUserFormGroup.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.roleId,
      status: Number(user.member_status)
    });

    this.addUserFormGroup.get('email')?.disable();
  }


  // 🔹 SUBMIT HANDLER
  async submitUser(): Promise<void> {
    if (this.addUserFormGroup.invalid) {
      this.addUserFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.addUserFormGroup.getRawValue();

    try {
      await this.processUser(formValue);
      this.dialogRef.close({ refresh: true });

    } catch (error: any) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
    }
  }

  // 🔹 PROCESS ADD / UPDATE
  private async processUser(formValue: any): Promise<void> {
    if (this.isEditMode) {
      await this.updateUser(formValue);
    } else {
      await this.checkEmailExists(formValue.email);
      await this.insertUser(formValue);
    }
  }

  // 🔹 EMAIL CHECK
  private async checkEmailExists(email: string): Promise<void> {
    const params: UsernameRequest = { username: email };
    const res = await this.apiService.checkuserexist<any>(params);

    if (Array.isArray(res?.data) && res.data.length > 0) {
      throw { code: 'EMAIL_EXISTS' };
    }
  }

  // 🔹 INSERT USER
  private async insertUser(formValue: any): Promise<void> {
    try {
      // 1️⃣ Create Cognito user
      const cognitoPayload = {
        email: formValue.email,
        password: formValue.password
      };

      const cognitoUsername =
        await this.apiService.createCognitoUser(cognitoPayload);



      // 2️⃣ Insert into DB
      const payload = {
        FistName: formValue.firstName.trim(),
        LastName: formValue.lastName.trim(),
        EmailID: formValue.email,
        Password: formValue.password,
        role_id: formValue.role,
        member_status: Number(formValue.status),
        cognito_username: cognitoUsername
      };

      await this.apiService.insertUsers(payload);

    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  }



private async updateUser(formValue: any): Promise<void> {

  if (!this.currentUserId) {
    throw { code: 'USER_ID_MISSING' };
  }

  try {

    // Update Cognito first
    if (formValue.password) {
      if (!this.cognitoUsername) {
        throw { code: 'COGNITO_USERNAME_MISSING' };
      }
      await this.apiService.updateCognitoUser(
        this.cognitoUsername,
        {},
        formValue.password
      );

    }

    // Update DB only if Cognito success
    const payload = {
      ID: this.currentUserId,
      FistName: formValue.firstName.trim(),
      LastName: formValue.lastName.trim(),
      ...(formValue.password && { Password: formValue.password }),
      role_id: formValue.role,
      member_status: Number(formValue.status)
    };

    await this.apiService.updateUser(payload);

  }
  catch (error: any) {

    this.errorMessage =
      error?.message ||
      'Password does not meet Cognito password policy';

    this.addUserFormGroup.get('password')?.setErrors({
      invalidPassword: true
    });

    throw error;
  }
}


// 🔹 ERROR HANDLER
 private handleError(error: any): void {



  if (error?.code === 'EMAIL_EXISTS') {
    this.addUserFormGroup.get('email')?.setErrors({ exists: true });
    return;
  }

  this.errorMessage =
    error?.message ||
    error?.error?.message ||
    'Failed to create user. Please ensure the password meets the required policy.';
}

  // 🔹 CLOSE DIALOG
  close(): void {
    this.dialogRef.close({ refresh: false });
  }
}
