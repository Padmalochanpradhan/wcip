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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepicker } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from '@angular/material/core';
import { PlanRequest, UpdatePlanRequest } from '../../../models/requests/planRequest';

@Component({
  selector: 'app-plans-dialog',
   providers: [provideNativeDateAdapter()], 
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinner,
    MatDatepicker
],
  templateUrl: './plans-dialog.html',
  styleUrl: './plans-dialog.css',
})
export class PlansDialog implements OnInit{

  plansFormGroup!: FormGroup;
  hidePassword = true;
  isLoading = false;
  isEditMode = false;
  currentPlanId: number | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly apiService: ConfigService,
    private readonly dialogRef: MatDialogRef<PlansDialog>
  ) {}

  // 🔹 INIT
  ngOnInit(): void {
    this.buildForm();

    if (this.data?.isEditMode && this.data?.plan) {
      this.enableEditMode(this.data.plan);
    }
  }

  // 🔹 FORM BUILDER
  private buildForm(): void {
    this.plansFormGroup = this.fb.group({
      plan_name: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],  
      status: ['', Validators.required]
    });
  }

  // 🔹 EDIT MODE SETUP
  private enableEditMode(plan: any): void {
    this.isEditMode = true;
    this.currentPlanId = plan.id;

    this.plansFormGroup.patchValue({
      plan_name: plan.plan_name,
      start_date: plan.start_date ? new Date(plan.start_date) : null,
      end_date: plan.end_date ? new Date(plan.end_date) : null,
      status: plan.status 
    });
     
  }

  // 🔹 SUBMIT HANDLER
  async submitPlan(): Promise<void> {
    if (this.plansFormGroup.invalid) {
      this.plansFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.plansFormGroup.getRawValue();
    if (!this.checkDates(formValue.start_date, formValue.end_date)) {
        this.isLoading = false;
        return; 
      }

    try {
      await this.processPlan(formValue);
      this.dialogRef.close({ refresh: true });

    } catch (error: any) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
    }
  }

  // 🔹 PROCESS ADD / UPDATE
  private async processPlan(formValue: any): Promise<void> {
    if (this.isEditMode) {
      await this.updatePlan(formValue);
    } else {      
      await this.insertPlan(formValue);
    }
  } 

  // 🔹 INSERT PLAN
  private async insertPlan(formValue: any): Promise<void> {
    const payload: PlanRequest = {
      table_name: 'MEM_PLAN_MASTER',
      insertDataArray: [{
        plan_name: formValue.plan_name,
        start_date: this.formatDateToYMD(formValue.start_date),
        end_date: this.formatDateToYMD(formValue.end_date),
        status: formValue.status 
      }]
    };

    await this.apiService.insert<any, PlanRequest>(payload);
  }

  formatDateToYMD(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`; // m/d/Y format
  }

   

  // 🔹 UPDATE PLAN
  private async updatePlan(formValue: any): Promise<void> {
    if (!this.currentPlanId) {
      throw { code: 'PLAN_ID_MISSING' };
    }

    const payload: UpdatePlanRequest = {
      table_name: 'MEM_PLAN_MASTER',
      id_field_name: 'id',
      id_field_value: this.currentPlanId,
      updateData: {
        plan_name: formValue.plan_name,
        start_date: this.formatDateToYMD(formValue.start_date),
        end_date: this.formatDateToYMD(formValue.end_date),
        status: Number(formValue.status)
      }
    };

    await this.apiService.update<any, UpdatePlanRequest>(payload);
  }

  // 🔹 ERROR HANDLER
  private handleError(error: any): void {
    console.error('❌ Plan operation failed:', error);

    switch (error?.code) {
      case 'PLAN_ID_MISSING':
        alert('Plan ID missing. Please refresh and try again.');
        break;

      default:
        alert('Something went wrong. Please try again.');
    }
  }

  checkDates(startDate: any, endDate: any) {
    if (!startDate || !endDate)
    return alert("Start date and end date are required.");

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert("Start date cannot be greater than end date.");
      return false;
    }
    return true;
  }

  // 🔹 CLOSE DIALOG
  close(): void {
    this.dialogRef.close({ refresh: false });
  }

}
