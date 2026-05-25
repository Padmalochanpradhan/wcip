import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from './api.service';
import { RiskgapRequest } from '../models/requests/dashboardRequest';
import { RiskgapsDialog } from '../views/dialogs/riskgaps-dialog/riskgaps-dialog';

@Injectable({ providedIn: 'root' })
export class RiskgapDialogService {

  constructor(
    private readonly apiService: ConfigService,
    private readonly dialog: MatDialog,
    private readonly sanitizer: DomSanitizer
  ) {}

  // ============================
  // SHOW RISK GAP DIALOG
  // ============================
  async showRiskgapDialog(row: any): Promise<void> {
    try {
      const request: RiskgapRequest = {
        medicaid_id: row.medicaid_id
      };

      const res = await this.apiService.riskgapList<any>(request);
      const riskgapList = res?.data ?? [];

      this.openDialog(row, riskgapList);

    } catch (error) {
      console.error('Risk gap fetch failed', error);
      alert('Unable to load risk gap list. Please try again.');
    }
  }

  // ============================
  // OPEN DIALOG
  // ============================
  private openDialog(row: any, riskgapList: any[]): void {

    const title = `RISK GAPS LIST - ${row.FIRST_NAME} ${row.LAST_NAME} (#${row.MEM_NO})`;

    this.dialog.open(RiskgapsDialog, {
      width: '80vw',
      maxWidth: '1300px',
      data: {
        title,
        riskgapList 
      }
    });
  }


}
