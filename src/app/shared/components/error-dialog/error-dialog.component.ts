import { Component, Inject } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

export interface ErrorDialogData {
  title?: string;
  errorMessage: string;
  errorDetails?: string;
}

@Component({
  selector: 'app-error-dialog',
  standalone: true,                       
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.css'],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule
],
})
export class ErrorDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData,
    public dialogRef: MatDialogRef<ErrorDialogComponent>
  ) {}
}
