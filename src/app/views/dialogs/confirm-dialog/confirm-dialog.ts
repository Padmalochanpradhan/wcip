import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UpdateMemberRequest, LogRequest } from '../../../models/requests/dashboardRequest';
import { ConfigService } from '../../../services/api.service';
import { UserDataService } from '../../../services/user-data-service';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { PhoneFormatPipe } from '../../../pipes/phone-format.pipe';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatFormFieldModule, MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner, PhoneFormatPipe, ReactiveFormsModule
  ],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialog {

  isLoading = false;
  noteForm!: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialog>,
    private readonly apiService: ConfigService, private readonly fb: FormBuilder,
    private readonly userData: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.noteForm = this.fb.group({
      note: ['', Validators.required]
    });
  }

  // ============================
  // CONFIRM ACTION
  // ============================
  async confirm(result: boolean, medicaidId: number, type: number): Promise<void> {
    if (!result) {
      this.dialogRef.close({ refresh: false });
      return;
    }

    this.isLoading = true;

    try {
      const note = this.noteForm.value.note.trim();

      await this.markNoLongerPatient(medicaidId, type, note);
      await this.logAction(medicaidId, type, note);

      // ✅ notify parent
      this.dialogRef.close({
        refresh: true,
        medicaid_id: medicaidId,
        note: note
      });

    } catch (error) {
      console.error('No longer patient update failed', error);
      alert('Failed to update patient status. Please try again.');

    } finally {
      this.isLoading = false;
    }
  }

  // ============================
  // UPDATE MEMBER
  // ============================
  private markNoLongerPatient(medicaidId: number, type: number, note: string): Promise<any> {
    const payload: UpdateMemberRequest = {
      table_name: 'MEM_MEMBERS',
      id_field_name: 'RECIP_NO',
      id_field_value: medicaidId,
      updateData: {
        NO_LONGER_PATIENT_FLAG: type,
        NO_LONGER_PATIENT_DATE: new Date().toISOString().slice(0, 10),
        NO_LONGER_PATIENT_NOTE: note
      }
    };

    return this.apiService.update(payload);
  }

  // ============================
  // SYSTEM LOG
  // ============================
  private logAction(medicaidId: number, type: number, note: string): Promise<any> {

    const user = this.userData.getUser();
    let msg = "";
    if (type == 1) {
      msg = "MARK AS NO LONGER PATIENT";
    } else {
      msg = "MARK AS CURRENT PATIENT";
    }

 
    const logPayload: LogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [{
        medicaid_id: medicaidId,
        log_name: msg,
        log_details: note,
        log_status: 'SUCCESS',
        log_by: user.ID,
        action_type: msg
      }]
    };

    return this.apiService.insert(logPayload);
  }
}
