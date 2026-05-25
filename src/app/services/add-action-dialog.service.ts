import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from './api.service';
import { AddAction } from '../views/shared/components/add-action/add-action';
import { firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AddActionDialogService {
  isLoading = false;
  constructor(
    private readonly dialog: MatDialog,
  ) {}
  
showAddActionDialog(medicaid_id: string,  member_name: string,  member_dob: string,addr: string,  phone: string,  practice: string,PCP_TAX_ID:number): Promise<boolean> {
  this.isLoading = true;
  const dialogRef = this.dialog.open(AddAction, {
    width: '95vw',
    maxWidth: '100vw',
    maxHeight: '95vh',
    panelClass: 'add-action-dialog',
    data: { medicaid_id, member_name, member_dob,addr, phone, practice,PCP_TAX_ID }
  });

  return firstValueFrom(dialogRef.afterClosed());
}


}
