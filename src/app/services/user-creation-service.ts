import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
 
import { Usercreation } from '../views/dialogs/usercreation-dialog/usercreation/usercreation';

@Injectable({ providedIn: 'root' })
export class UserCreationRequestDialogService {

  constructor(private readonly dialog: MatDialog) {}

  /** ---------------- ADD USER ---------------- */
  addPlansDialog(): MatDialogRef<Usercreation> {
    return this.openDialog({
      title: 'APPROVAL FORM',      
      isEditMode: false
    });
  }

  /** ---------------- EDIT USER ---------------- */
  editPlansDialog(plan: any
  ): MatDialogRef<Usercreation> {

    return this.openDialog({
      title: 'UPDATE PLAN', 
      plan,
      isEditMode: true
    });
  }

  /** ---------------- PRIVATE COMMON DIALOG ---------------- */
  private openDialog(data: any): MatDialogRef<Usercreation> {
    return this.dialog.open(Usercreation, {
      width: '600px',
      height: '600px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      data
    });
  }
  
}
