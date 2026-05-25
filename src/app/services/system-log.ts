import { Injectable } from '@angular/core';
import { ConfigService } from './api.service';
import { SystemLogRequest } from '../models/requests/systemLogRequest';

export interface SystemLogPayload {
  medicaid_id?: string;
  log_name: string;
  log_details: string;
  log_status: 'SUCCESS' | 'FAILED';
  log_by: number;
  action_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemLogService {

  constructor(private readonly apiService: ConfigService) {}

  addSystemLog(payload: SystemLogPayload) {

    const logRequest: SystemLogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [{
        medicaid_id: payload.medicaid_id ?? '0',
        log_name: payload.log_name,
        log_details: payload.log_details,
        log_status: payload.log_status,
        log_by: payload.log_by,
        action_type: payload.action_type
      }]
    };

    return this.apiService.insert(logRequest);
  }
}
