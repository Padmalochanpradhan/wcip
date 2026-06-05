import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AdduserDialog } from '../views/dialogs/adduser-dialog/adduser-dialog';

@Injectable({ providedIn: 'root' })
export class UsersDialogService {

  constructor(private readonly dialog: MatDialog) {}

  /** ---------------- ADD USER ---------------- */
  addUsersDialog(roles: any[]): MatDialogRef<AdduserDialog> {
    return this.openDialog({ title: 'ADD USER', roles, isEditMode: false });
  }

  editUsersDialog(roles: any[], user: any): MatDialogRef<AdduserDialog> {
    return this.openDialog({ title: 'UPDATE USER', roles, user, isEditMode: true });
  }

  /** ---------------- PRIVATE COMMON DIALOG ---------------- */
  private openDialog(data: any): MatDialogRef<AdduserDialog> {
    return this.dialog.open(AdduserDialog, {
      width: '940px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      data
    });
  }
  
}
