import { Injectable } from '@angular/core';
import { AssignPlanDialogService } from './assign-plan-dialog.service';
import { TransferDialogService } from './transfer-dialog.service';

@Injectable({ providedIn: 'root' })
export class ActionHandlerService {

  constructor(
    private readonly transferService: TransferDialogService,
    private readonly assignPlanService: AssignPlanDialogService
  ) {}

  handleAction(action: string, rows: any[],planList: any[],departmentList:any[]): Promise<any> {
    if (!rows || rows.length === 0) {
      return Promise.resolve(null);
    }

    switch (action) {
      case 'transfer':
        return this.transferService.open(rows,departmentList);

      case 'assign':
        return this.assignPlanService.open(rows,planList);

      default:
        return Promise.resolve(null);
    }
  }
}
