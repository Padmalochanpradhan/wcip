import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from './api.service';
import { QualitygapRequest } from '../models/requests/dashboardRequest'; 
import { QualitygapsDialog } from '../views/dialogs/qualitygaps-dialog/qualitygaps-dialog';

@Injectable({ providedIn: 'root' })
export class QualitygapDialogService {

  constructor(
    private readonly apiService: ConfigService,
    private readonly dialog: MatDialog,
    private readonly sanitizer: DomSanitizer
  ) {}

  // ============================
  // SHOW QUALITY GAP DIALOG
  // ============================
  async showQualitygapDialog(row: any): Promise<void> {
    try {
      const request: QualitygapRequest = {
        medicaid_id: row.medicaid_id
      };

      const res = await this.apiService.gualitygapList<any>(request);
      const qualitygapList = res?.data ?? [];

      this.openDialog(row, qualitygapList);

    } catch (error) {
      console.error('Quality gap fetch failed', error);
      alert('Unable to load quality gap list. Please try again.');
    }
  }

  // ============================
  // OPEN DIALOG
  // ============================
  private openDialog(row: any, qualitygapList: any[]): void {

    const title = `QUALITY GAPS LIST - ${row.FIRST_NAME} ${row.LAST_NAME} (#${row.MEM_NO})`;

    this.dialog.open(QualitygapsDialog, {
      width: '80vw',
      maxWidth: '1200px',
      panelClass: 'xl-dialog',
      data: {
        title,
        qualitygapList
      }
    });
  }


}
