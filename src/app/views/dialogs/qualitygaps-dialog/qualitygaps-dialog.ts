import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogTitle, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-qualitygaps-dialog',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatSortModule,
    MatTableModule, MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogModule],
  templateUrl: './qualitygaps-dialog.html',
  styleUrl: './qualitygaps-dialog.css',
})
export class QualitygapsDialog implements AfterViewInit{
   displayedColumns = [
    'sl',
    'MEASURE_NAME',
    'SUB_MEASURE',
    'PROVIDER_ID',
    'PROVIDER_NAME',
    'PROCESS_STATUS', 
    'ADDED_DATE'
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  @ViewChild('mainPaginator') mainPaginator!: MatPaginator;
  @ViewChild('mainSort') mainSort!: MatSort;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<QualitygapsDialog>
  ) {
    this.dataSource = new MatTableDataSource(data?.qualitygapList || []);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.mainPaginator;
    this.dataSource.sort = this.mainSort;
    this.dataSource.sortingDataAccessor = this.defaultSortingAccessor;
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('en-US');
  }

  private defaultSortingAccessor(item: any, property: string) {
    if (property === 'MEM_INFO') {
      return item.medicaid_id;
    }
    return item[property];
  }
  /** Attach paginator & sorting */
  attachTableFeatures(): void {
    if (this.mainPaginator) this.dataSource.paginator = this.mainPaginator;
    if (this.mainSort) this.dataSource.sort = this.mainSort;
  }


  /** Search filter */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value || '';
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // 🔹 CLOSE DIALOG
  close(): void {
    this.dialogRef.close({ refresh: false });
  }

}
