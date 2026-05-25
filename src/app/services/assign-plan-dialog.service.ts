import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AssignplanDialog } from '../views/dialogs/assignplan-dialog/assignplan-dialog';
import { ConfigService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AssignPlanDialogService {

  constructor(
    private readonly dialog: MatDialog,
    private readonly apiService: ConfigService
  ) {}

  async open(rows: any[], planList: any[]): Promise<any> {
    try {
      const dialogRef: MatDialogRef<AssignplanDialog> = this.dialog.open(AssignplanDialog, {
        width: '700px',
        maxWidth: '90vw',
        disableClose: true,
        data: {
          title: `ASSIGN PLAN TO (${rows.length}) ${rows.length === 1 ? 'MEMBER' : 'MEMBERS'}`,
          members: rows,
          planList
        }
      });

      return dialogRef.afterClosed().toPromise();

    } catch (error) {
      console.error('Failed to open Assign Plan dialog', error);
      throw error;
    }
  }
}
