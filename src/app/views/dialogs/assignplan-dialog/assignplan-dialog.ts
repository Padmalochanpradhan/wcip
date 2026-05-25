import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent } from "@angular/material/card";
import { MatFormField, MatLabel, MatError } from "@angular/material/form-field";
import { MatSelect, MatOption } from "@angular/material/select";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../../services/api.service';
import { UserDataService } from '../../../services/user-data-service';
import {
  LogRequest,
  MemberplanRequest,
  PlanexistRequest
} from '../../../models/requests/dashboardRequest';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-assignplan-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogTitle, MatDialogContent, 
    MatButtonModule, MatCard, MatCardContent, MatFormField, MatLabel, MatSelect, MatOption,
    MatError,
    MatProgressSpinner
],
  templateUrl: './assignplan-dialog.html',
  styleUrls: ['./assignplan-dialog.css'],
})
export class AssignplanDialog implements OnInit {

  assignPlanFormGroup!: FormGroup;
  isLoading = false;
  selectedAction: string | null = null;

  @ViewChild('actionSelect') actionSelect!: MatSelect;

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: ConfigService,
    private readonly userData: UserDataService,
    private readonly dialogRef: MatDialogRef<AssignplanDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.assignPlanFormGroup = this.fb.group({
      plan_id: [null, Validators.required]
    });
  }

  // ============================
  // ASSIGN PLAN
  // ============================
  async assignPlan(): Promise<void> {
  if (this.assignPlanFormGroup.invalid) {
    this.assignPlanFormGroup.markAllAsTouched();
    return;
  }

  const { plan_id } = this.assignPlanFormGroup.value;

  this.isLoading = true;

  try {
    const user = this.userData.getUser();
    const members = Array.isArray(this.data.members)
      ? this.data.members
      : [this.data.members];

    // 1️⃣ VERIFY PLAN
    const planExists = await this.verifyPlanExists(members, plan_id);

    if (planExists) { 
      this.isLoading = false;
      return;
    }

    // 2️⃣ INSERT PLAN
    await this.insertPlan(members, plan_id, user.ID);

    // 3️⃣ LOG SYSTEM
    await this.logPlanAssignment(members, user.ID);

    // ✅ SUCCESS
    this.afterSuccess();

  } catch (err) {
    console.error(err);
    alert('Something went wrong while assigning plan.');
  } finally {
    this.isLoading = false;
  }
}


  // ============================
  // VERIFY PLAN EXISTS
  // ============================
private async verifyPlanExists(
  members: any[],
  plan_id: any
): Promise<boolean> {

  for (const m of members) {
    const res = await this.apiService.checkplanexist<any>({
      medicaid_id: m.medicaid_id,
      plan_id
    });

    if (res?.data?.length > 0) {
      // ✅ Set form error
      this.assignPlanFormGroup
        .get('plan_id')
        ?.setErrors({ exists: true });

      return true; // ⛔ PLAN EXISTS
    }
  }

  return false; // ✅ PLAN DOES NOT EXIST
}


  // ============================
  // INSERT PLAN
  // ============================
  private insertPlan(members: any[], plan_id: any, userId: any): Promise<any> {
    const payload: MemberplanRequest = {
      table_name: 'MEM_PLAN_MEMBERS',
      insertDataArray: members.map(m => ({
        medicaid_id: m.medicaid_id,
        plan_id,
        added_by: userId
      }))
    };
    return this.apiService.insert(payload);
  }

  // ============================
  // LOG ASSIGNMENT
  // ============================
  private logPlanAssignment(members: any[], userId: any): Promise<any> {
    const logPayload: LogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: members.map(m => ({
        medicaid_id: m.medicaid_id,
        log_name: 'ASSIGN PLAN',
        log_details: `PLAN ASSIGNED TO ${m.medicaid_id}`,
        log_status: 'Success',
        log_by: userId,
        action_type: 'ASSIGN PLAN'
      }))
    };
    return this.apiService.insert(logPayload);
  }

  // ============================
  // AFTER SUCCESS
  // ============================
  private afterSuccess(): void {
    this.resetForm();
    this.close();
  }

  private resetForm(): void {
    this.assignPlanFormGroup.reset({ plan_id: null });
    this.selectedAction = null;
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
