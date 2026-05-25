import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-action-dialog',
  imports: [MatDialogContent, MatDialogActions,MatButtonModule],
  templateUrl: './action-dialog.html',
  styleUrl: './action-dialog.css',
})
 
export class ActionDialog {

  title: string = '';
  message: string = '';
  htmlContent: string = '';

  constructor(
    private readonly dialogRef: MatDialogRef<ActionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.title = data?.title;
    this.htmlContent = data?.htmlContent;
  }

  close() {
    this.dialogRef.close(true);
  }
}
