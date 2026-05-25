import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from './api.service';
import { CallListRequest } from '../models/requests/dashboardRequest';
import { ActionDialog } from '../views/dialogs/action-dialog/action-dialog';

@Injectable({ providedIn: 'root' })
export class CallListDialogService {

  constructor(
    private readonly apiService: ConfigService,
    private readonly dialog: MatDialog,
    private readonly sanitizer: DomSanitizer
  ) {}

  // ============================
  // OPEN CALL LIST DIALOG
  // ============================
  async showcallListDialog(row: any): Promise<void> {
    try {
      const request: CallListRequest = {
        medicaid_id: row.medicaid_id
      };

      const res = await this.apiService.callList<any>(request);
      const callList = res?.data ?? [];

      this.openDialog(row, callList);

    } catch (error) {
      console.error('Failed to load call list', error);
      alert('Unable to load call history. Please try again.');
    }
  }

  // ============================
  // DIALOG CONTENT BUILDER
  // ============================
  private openDialog(row: any, callList: any[]): void {
    const html = this.buildHtml(callList);

    const title = `CALL LIST - ${row.FIRST_NAME} ${row.LAST_NAME} (#${row.MEM_NO})`;

    this.dialog.open(ActionDialog, {
      width: '80vw',
      maxWidth: '1000px',
      data: {
        title,
        htmlContent: this.sanitizer.bypassSecurityTrustHtml(html)
      }
    });
  }

  // ============================
  // HTML BUILDER
  // ============================
  private buildHtml(callList: any[]): string {
    if (!callList.length) {
      return `<p style="text-align:center;color:#777">No call list available</p>`;
    }

    return `
      <table class="table table-striped txupper" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th>Sl.No</th>
            <th>DATE</th>
            <th>ACTION</th>
            <th>OUTCOME</th>
            <th>NOTE</th>
          </tr>
        </thead>
        <tbody style="text-align:center;">
          ${callList.map((q, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${this.formatDate(q.action_date)}</td>
              <td>${q.action_type ?? ''}</td>
              <td>${q.action_result ?? ''}</td>
              <td>${q.action_note ?? ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ============================
  // DATE FORMATTER
  // ============================
  private formatDate(date: any): string {
    if (!date) return '';

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }
}
