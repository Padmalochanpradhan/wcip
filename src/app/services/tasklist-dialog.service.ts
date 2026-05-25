import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfigService } from './api.service';
import { TaskDialog } from '../views/dialogs/taskdialog/task-dialog/task-dialog';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TaskListDialogService {

  constructor(
    private readonly dialog: MatDialog,
    private readonly apiService: ConfigService
  ) {}

  async showtaskListDialog(row: any): Promise<MatDialogRef<TaskDialog>> {
    try {
      const res = await this.apiService.taskList<any>({
        medicaid_id: row.medicaid_id
      });

      return this.dialog.open(TaskDialog, {
        width: '80vw',
        maxWidth: '1200px',
        panelClass: 'xxl-dialog',
        data: {
          title: `MANAGE TASK - ${row.FIRST_NAME} ${row.LAST_NAME} (#${row.MEM_NO})`,
          member: row,
          taskList: res?.data || []
        }
      });

    } catch (err) {
      console.error('Failed to load task list', err);
      throw err;
    }
  }
}

