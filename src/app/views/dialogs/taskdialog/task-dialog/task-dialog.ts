import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { ConfigService } from '../../../../services/api.service'; 
import { UserDataService } from '../../../../services/user-data-service';
import { LogRequest, TaskRequest,UpdateTaskRequest } from '../../../../models/requests/dashboardRequest';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinner } from "@angular/material/progress-spinner";



@Component({
  selector: 'app-task-dialog',
  standalone: true,
   providers: [provideNativeDateAdapter()], // ✅ REQUIRED
  imports: [
    CommonModule, // Needed for *ngFor, *ngIf
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule, // ✅ Provides DateAdapter
    MatCardModule,
    MatProgressSpinner
],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.css'
})
export class TaskDialog implements OnInit {

  addTaskFormGroup!: FormGroup;
  showAddTask = false;
  isLoading = false;
  isEditMode = false;
  currentTaskId: number | null = null;
  action_ativity_type: any[] = [];
  navigatorList: any[] = [];
  loginid: any;
  dialog: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly apiService: ConfigService,
    private readonly userData: UserDataService,
    private readonly dialogRef: MatDialogRef<TaskDialog>
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadDropdowns();
  }

  private buildForm(): void {
    this.addTaskFormGroup = this.fb.group({
      task_next_panel_id: ['', Validators.required],
      task_date: ['', Validators.required],
      task_assign_to: ['', Validators.required],
      task_status: ['', Validators.required],
      task_action_note: ['']
    });
  }

  private loadDropdowns(): void {
    // Load real APIs here
     this.apiService.masterdata<any>()
      .then(res => { 
        this.action_ativity_type = res.data.actionActivityType || [];
        this.navigatorList = res.data.navigatorList || [];       
      });
  }

  toggleAddTask(): void {
    this.showAddTask = !this.showAddTask;

    if (!this.showAddTask) {
      this.resetForm();
    }
  }

  editTask(task: any): void {
    this.isEditMode = true;
    this.showAddTask = true;
    this.currentTaskId = task.id;
    this.addTaskFormGroup.patchValue({
      task_next_panel_id: task.action_id,
      task_date: task.task_date ? new Date(task.task_date) : null,
      task_assign_to: task.assign_to,
      task_status: task.status,
      task_action_note: task.action_note
    });
  }

  async submitTask(): Promise<void> {
  if (this.addTaskFormGroup.invalid) {
    this.addTaskFormGroup.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  const v = this.addTaskFormGroup.value;

  try {
    const user = this.userData.getUser();
    this.loginid = user.ID;

    if (this.isEditMode) {
      await this.handleUpdate(v);
    } else {
      await this.handleInsert(v);
    }

    this.afterSuccess();

  } catch (err) {
    console.error('Task submit failed', err);
    alert('Something went wrong while saving task');
  } finally {
    this.isLoading = false;
  }
}

private async handleUpdate(v: any): Promise<void> {
  if (!this.currentTaskId) {
    throw new Error('No task selected for update');
  }

  const payload: UpdateTaskRequest = {
    table_name: 'MEM_TASK_FOLLOW_UP',
    id_field_name: 'id',
    id_field_value: this.currentTaskId,
    updateData: {
      action_id: v.task_next_panel_id,
      assign_to: v.task_assign_to,
      action_date: this.formatDateForApi(v.task_date),
      action_note: v.task_action_note,
      status: v.task_status
    }
  };

  await this.updateTask(payload);
  await this.addTaskLog('UPDATE TASK');

  // 🔁 Update UI row
  const index = this.data.taskList.findIndex(
    (t: any) => t.id === this.currentTaskId
  );

  if (index !== -1) {
    const activity = this.action_ativity_type.find(a => a.id === v.task_next_panel_id);
    const navigator = this.navigatorList.find(n => n.ID === v.task_assign_to);

    this.data.taskList[index] = {
      ...this.data.taskList[index],
      action_id: v.task_next_panel_id,
      action_type: activity?.action_type || '',
      task_date: this.formatDateForApi(v.task_date),
      status: v.task_status,
      assign_to: v.task_assign_to,
      FistName: navigator?.FistName || '',
      LastName: navigator?.LastName || '',
      action_note: v.task_action_note
    };
  }
}

private async handleInsert(v: any): Promise<void> {
  const payload: TaskRequest = {
    table_name: 'MEM_TASK_FOLLOW_UP',
    insertDataArray: [{
      medicaid_id: this.data.member.medicaid_id,
      action_id: v.task_next_panel_id,
      assign_to: v.task_assign_to,
      action_date: this.formatDateForApi(v.task_date),
      action_note: v.task_action_note || '',
      status: v.task_status,
      add_by: this.loginid
    }]
  };

  await this.addTask(payload);
  await this.addTaskLog('ADD TASK');

  // 🔁 Add row to UI
  const activity = this.action_ativity_type.find(a => a.id === v.task_next_panel_id);
  const navigator = this.navigatorList.find(n => n.ID === v.task_assign_to);

  this.data.taskList.unshift({
    id: Date.now(),
    action_id: v.task_next_panel_id,
    action_type: activity?.action_type || '',
    task_date: this.formatDateForApi(v.task_date),
    status: v.task_status,
    assign_to: v.task_assign_to,
    FistName: navigator?.FistName || '',
    LastName: navigator?.LastName || '',
    action_note: v.task_action_note
  });
}

private addTaskLog(type: 'ADD TASK' | 'UPDATE TASK'): Promise<any> {
  const payload: LogRequest = {
    table_name: 'MEM_SYSTEM_LOG',
    insertDataArray: [{
      medicaid_id: this.data.member.medicaid_id,
      log_name: type,
      log_details: `${type} FOR ${this.data.member.medicaid_id}`,
      log_status: 'SUCCESS',
      log_by: this.loginid,
      action_type: type
    }]
  };

  return this.add_system_log(payload);
}
   
  updateTask(request: UpdateTaskRequest): Promise<any> {
    return this.apiService.update<any,UpdateTaskRequest>(request);
  }

  addTask(request: TaskRequest): Promise<any> {
     return this.apiService.insert<any, TaskRequest>(request);
  }

  add_system_log(request: LogRequest): Promise<any> {
    return this.apiService.insert<any, LogRequest>(request);
  }

  private afterSuccess(): void {
    this.isLoading = false;
    this.resetForm();
    this.showAddTask = false;

    // 🔔 Notify parent that data changed
    this.dialogRef.close({ refresh: true });
  }

  private resetForm(): void {
    this.isEditMode = false;
    this.currentTaskId = null;
    this.addTaskFormGroup.reset();
  }

  close(): void {
    this.dialogRef.close({ refresh: false });
  }

  private formatDateForApi(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

}
