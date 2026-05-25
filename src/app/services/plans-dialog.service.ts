import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PlansDialog } from '../views/dialogs/plans-dialog/plans-dialog';

@Injectable({ providedIn: 'root' })
export class PlansDialogService {

  constructor(private readonly dialog: MatDialog) {}

  /** ---------------- ADD USER ---------------- */
  addPlansDialog(): MatDialogRef<PlansDialog> {
    return this.openDialog({
      title: 'ADD PLAN',      
      isEditMode: false
    });
  }

  /** ---------------- EDIT USER ---------------- */
  editPlansDialog(plan: any
  ): MatDialogRef<PlansDialog> {

    return this.openDialog({
      title: 'UPDATE PLAN', 
      plan,
      isEditMode: true
    });
  }

  /** ---------------- PRIVATE COMMON DIALOG ---------------- */
  private openDialog(data: any): MatDialogRef<PlansDialog> {
    return this.dialog.open(PlansDialog, {
      width: '940px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      data
    });
  }
  
}
