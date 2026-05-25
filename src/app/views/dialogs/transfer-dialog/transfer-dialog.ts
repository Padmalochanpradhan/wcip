import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../../services/api.service';
import { UserDataService } from '../../../services/user-data-service';
import {
  LogRequest,
  TransferRequest,
  UpdateoutreachMemberRequest
} from '../../../models/requests/dashboardRequest';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinner
  ],
  templateUrl: './transfer-dialog.html',
  styleUrl: './transfer-dialog.css'
})
export class TransferDialog implements OnInit {

  isLoading = false;
  transferFormGroup!: FormGroup;
  userList: any[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: ConfigService,
    private readonly userData: UserDataService,
    private readonly dialogRef: MatDialogRef<TransferDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.transferFormGroup = this.fb.group({
      department_id: [null, Validators.required],
      user_id: [null, Validators.required],
      referring_reason: ['']
    });
  }

  // ========================= TRANSFER =========================
  async transfer(): Promise<void> {

    if (this.transferFormGroup.invalid) {
      this.transferFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const user = this.userData.getUser();
      const members = this.normalizeMembers(this.data.members);
      const v = this.transferFormGroup.value;

      await this.insertTransferRecords(members, v, user.ID);
      await this.updateOutreachMembers(members, v.user_id);
      await this.insertLogs(members, user.ID);

      this.afterSuccess(members);

    } catch (error) {
      console.error('Transfer failed', error);
      alert('Transfer failed. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  // ========================= HELPERS =========================
  private normalizeMembers(members: any[]): any[] {
    return Array.isArray(members) ? members : [members];
  }

  private insertTransferRecords(
    members: any[],
    formValue: any,
    userId: number
  ): Promise<any> {

    const payload: TransferRequest = {
      table_name: 'MEM_REFERRING',
      insertDataArray: members.map(m => ({
        medicaid_id: m.medicaid_id,
        department_id: formValue.department_id,
        referring_reason: formValue.referring_reason,
        refer_to: formValue.user_id,
        refer_by: userId
      }))
    };

    return this.apiService.insert(payload);
  }

  private updateOutreachMembers(members: any[], userId: number): Promise<any> {
    const payload: UpdateoutreachMemberRequest = {
      table_name: 'MEM_OUTREACH_MEMBERS',
      id_field_name: 'medicaid_id',
      updates: members.map(m => ({
        medicaid_id: m.medicaid_id,
        Care_Coordinator_id: userId
      }))
    };

    return this.apiService.multipleRowAndFieldUpdate(payload);
  }

  private insertLogs(members: any[], userId: number): Promise<any> {
    const payload: LogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: members.map(m => ({
        medicaid_id: m.medicaid_id,
        log_name: 'TRANSFER MEMBER',
        log_details: `TRANSFER MEMBER ${m.medicaid_id}`,
        log_status: 'SUCCESS',
        log_by: userId,
        action_type: 'TRANSFER MEMBER'
      }))
    };

    return this.apiService.insert(payload);
  }

  // ========================= DEPARTMENT CHANGE =========================
 onDepartmentChange(departmentId: number): void {
    if (!departmentId) return;
    this.isLoading = true;
    this.apiService.getUsersByDepartment({ department_id: departmentId })
      .then((res: any) => {
        this.userList = res?.data || [];
      })
      .finally(() => this.isLoading = false);
  }

  // ========================= SUCCESS =========================
  private afterSuccess(members: any[]): void {
    this.resetForm();

    this.dialogRef.close({
      refresh: true,
      removedIds: members.map(m => m.medicaid_id)
    });
  }

  private resetForm(): void {
    this.transferFormGroup.reset({
      department_id: null,
      user_id: null,
      referring_reason: ''
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
