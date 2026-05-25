import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfigService } from './api.service'; 
import { Injectable } from '@angular/core';
import { AlteraddressDialog } from '../views/dialogs/alteraddress-dialog/alteraddress-dialog';

@Injectable({ providedIn: 'root' })
export class AlterAddressDialogService {

  constructor(
    private readonly dialog: MatDialog,
    private readonly apiService: ConfigService
  ) {}

  async showalterAddressListDialog(
    row: any
  ): Promise<MatDialogRef<AlteraddressDialog>> {

    try {
      const request = { medicaid_id: row.medicaid_id };
      const res = await this.apiService.alternateaddressList<any>(request);

      return this.dialog.open(AlteraddressDialog, {
        width: '80vw',
        maxWidth: '900px',
        disableClose: true,
        data: {
          title: `ALTERNATE ADDRESS - ${row.FIRST_NAME} ${row.LAST_NAME} (#${row.MEM_NO})`,
          member: row,
          alt_address: res?.data?.altaddress ?? []
        }
      });

    } catch (error) {
      console.error('Failed to load alternate address list', error);
      throw error; // let caller decide what to do
    }
  }
}
