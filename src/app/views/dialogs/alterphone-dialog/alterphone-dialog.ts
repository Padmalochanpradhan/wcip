import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { PhoneFormatPipe } from "../../../pipes/phone-format.pipe";
import { ConfigService } from '../../../services/api.service'; 
import { UserDataService } from '../../../services/user-data-service';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardContent } from "@angular/material/card";
import { MatFormField, MatError, MatFormFieldModule } from "@angular/material/form-field"; 
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule  } from '@angular/forms';
import { AltphoneRequest, LogRequest } from '../../../models/requests/dashboardRequest';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-alterphone-dialog',
  imports: [
    MatDialogContent, MatFormFieldModule, MatInputModule, 
    MatButtonModule, PhoneFormatPipe, CommonModule, MatCard, MatCardContent,
    ReactiveFormsModule, MatFormField, MatError,
    MatProgressSpinner
],
  templateUrl: './alterphone-dialog.html',
  styleUrls: ['./alterphone-dialog.css']
})
export class AlterphoneDialog implements OnInit{
  addAltphoneFormGroup!: FormGroup;
  isLoading = false;

  constructor(
    private readonly dialogRef: MatDialogRef<AlterphoneDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly apiService: ConfigService,
    private readonly userData: UserDataService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.addAltphoneFormGroup = this.fb.group({
      alt_phone_no: ['', Validators.required]
    });
  }

  // ============================
  // SUBMIT HANDLER
  // ============================
  async submitAltphone(): Promise<void> {
    if (this.addAltphoneFormGroup.invalid) {
      this.addAltphoneFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const payload = this.buildPhonePayload();
      await this.apiService.insert(payload);

      await this.logSuccess();
      this.closeWithRefresh();

    } catch (error) {
      console.error('Add alternative phone failed', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ============================
  // PAYLOAD BUILDERS
  // ============================
  private buildPhonePayload(): AltphoneRequest {
    const user = this.userData.getUser();
    const f = this.addAltphoneFormGroup.value;

    return {
      table_name: 'MEM_ALT_PHONE',
      insertDataArray: [{
        medicaid_id: this.data.member.medicaid_id,
        alt_phone_no: f.alt_phone_no,
        add_by: user.ID
      }]
    };
  }

  private logSuccess(): Promise<any> {
    const user = this.userData.getUser();
    const logpayload: LogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [{
        medicaid_id: this.data.member.medicaid_id,
        log_name: 'ADD ALTERNATIVE PHONE',
        log_details: `ADD ALTERNATIVE PHONE FOR ${this.data.member.medicaid_id}`,
        log_status: 'Success',
        log_by: user.ID,
        action_type: 'ADD ALTERNATIVE PHONE'
      }]
    };
    return this.apiService.insert(logpayload);
  }

  // ============================
  // HELPERS
  // ============================
  private closeWithRefresh(): void {
    this.dialogRef.close({
      refresh: true,
      medicaid_id: this.data.member.medicaid_id
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 10);
    let formatted = '';

    if (digits.length > 0) formatted = `(${digits.substring(0, 3)}`;
    if (digits.length >= 4) formatted += `) ${digits.substring(3, 6)}`;
    if (digits.length >= 7) formatted += `-${digits.substring(6, 10)}`;

    input.value = formatted;
    this.addAltphoneFormGroup.get('alt_phone_no')?.setValue(formatted, { emitEvent: false });
  }
}
