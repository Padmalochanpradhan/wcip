import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

interface InfoDialogData {
  title?: string;
  errorMessage: string;
  errorDetails?: string;
}

@Component({
  selector: 'app-info-dialog',
  standalone: true, // ✅ recommended in Angular 20
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule
],
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.css'],
})
export class InfoDialogComponent {
  title?: string;
  message!: string;
  errorDetails?: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: InfoDialogData,
    public dialogRef: MatDialogRef<InfoDialogComponent>
  ) {
    this.title = data.title;
    this.message = data.errorMessage;
    this.errorDetails = data.errorDetails;
  }
}
