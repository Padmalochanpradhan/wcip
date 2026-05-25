import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TransferDialog } from '../views/dialogs/transfer-dialog/transfer-dialog';

@Injectable({ providedIn: 'root' })
export class TransferDialogService {

  constructor(private readonly dialog: MatDialog) {}

  async open(rows: any[], departmentList: any[]): Promise<any> {
    try {
      const dialogRef = this.dialog.open(TransferDialog, {
        width: '700px',
        maxWidth: '90vw',
        disableClose: true,
        data: {
          title: `${rows.length} MEMBER SELECTED FOR TRANSFER`,
          members: rows,
          departmentList
        }
      });

      return await dialogRef.afterClosed().toPromise();

    } catch (error) {
      console.error('Transfer dialog open failed', error);
      return null;
    }
  }
}
