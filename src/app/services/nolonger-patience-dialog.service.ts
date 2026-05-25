import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from './api.service'; 
import { ConfirmDialog } from '../views/dialogs/confirm-dialog/confirm-dialog';
import {UnlockUserConfirm } from '../views/dialogs/unlock-user-confirm/unlock-user-confirm'
import {MatIconModule} from '@angular/material/icon'
import { ConfirmDialogResult } from '../models/requests/dashboardRequest';
import { HtmlParser } from '@angular/compiler';

@Injectable({ providedIn: 'root' })
export class NolongerPatientDialogService {

  constructor(
    private readonly dialog: MatDialog
  ) {}

  // ============================
  // OPEN CONFIRM DIALOG
  // ============================
  async confirmbox(row: any): Promise<ConfirmDialogResult | undefined> {
    try {
      const dialogRef = this.dialog.open(ConfirmDialog, {
        width: '80vw',
        maxWidth: '600px',
        data: {
          title: 'CONFIRM ACTION',
          messaage:'Are you sure, she/he is no longer a patient?',
          funAction: 'confirm',
          name: `${row.FIRST_NAME} ${row.LAST_NAME}`,
          phone: row.OTHER_PHONE,
          birth: row.BIRTH,
          medicaid_id: row.medicaid_id, 
          action:1
        }
      });

      return await dialogRef.afterClosed().toPromise();

    } catch (error) {
      console.error('Confirm dialog failed', error);
      return undefined;
    }
  }

  // ============================
  // OPEN CONFIRM DIALOG
  // ============================
  async confirmboxUndo(row: any): Promise<ConfirmDialogResult | undefined> {
    try {
      const dialogRef = this.dialog.open(ConfirmDialog, {
        width: '80vw',
        maxWidth: '600px',
        data: {
          title: 'CONFIRM ACTION',
          messaage:'Are you sure she/he is currently a patient?',
          name: `${row.FIRST_NAME} ${row.LAST_NAME}`,
          phone: row.phone,
          birth: row.BIRTH,
          medicaid_id: row.medicaid_id, 
          MEM_NO: row.MEM_NO,
          FIRST_NAME: row.FIRST_NAME,
          LAST_NAME: row.LAST_NAME, 
          OTHER_ADDR1: row.OTHER_ADDR1,
          OTHER_PHONE: row.OTHER_PHONE,
          latest_alt_address: row.latest_alt_address,
          latest_alt_phone: row.latest_alt_phone,
          PCP_TAX_ID: row.PCP_TAX_ID,
          PCP_VISIT_DATE: row.PCP_VISIT_DATE,
          PCP_VISIT_FLAG: row.PCP_VISIT_FLAG,
          PRIORITY_FLAG: row.PRIORITY_FLAG,
          upcoming_task_date: row.upcoming_task_date || 'N/A',
          Call_count: row.Call_count,
          risk_gap_count: row.risk_gap_count,
          risk_comp_count: row.risk_comp_count,
          risk_perf: row.risk_perf,
          quality_count: row.quality_count,
          quality_comp_count: row.quality_comp_count,
          quality_perf: row.quality_perf,
          action:0
        }
      });

      return await dialogRef.afterClosed().toPromise();

    } catch (error) {
      console.error('Confirm dialog failed', error);
      return undefined;
    }
  }
  async confirmUnlockUser(row: any): Promise<ConfirmDialogResult | undefined> {
  try {
    const dialogRef = this.dialog.open(UnlockUserConfirm, {
      width: '80vw',
      maxWidth: '500px',
      data: {
        title: 'UNLOCK USER',
        messaage: 'Are you sure you want to unlock this user?',
        name: `${row.firstName} ${row.lastName}`,
        email: row.email,
        role: row.role,
        action: 'unlock',   // 👈 custom action
        userId: row.ID,
        cognito_username: row.cognito_username
      }
    });

    return await dialogRef.afterClosed().toPromise();

  } catch (error) {
    console.error('Unlock dialog failed', error);
    return undefined;
  }
} 
}
