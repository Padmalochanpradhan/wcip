import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-busy-indicator',
  standalone: true,
  imports: [MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './busy-indicator.component.html',
  styleUrls: ['./busy-indicator.component.css']
})
export class BusyIndicatorComponent {
  message = 'Please wait...';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message?: string },
    private readonly dialogRef: MatDialogRef<BusyIndicatorComponent>
  ) {
    if (data?.message) {
      this.message = data.message;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
