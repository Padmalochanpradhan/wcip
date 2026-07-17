/**
 * SystemLogService — writes audit entries to the SYSTEM_LOG table.
 *
 * Wraps ConfigService.insert() with a typed payload so callers don't
 * need to know the table name or construct the insertDataArray shape.
 *
 * Usage:
 *   this.systemLog.addSystemLog({
 *     log_name:    'USER_UNLOCK',
 *     log_details: 'Admin unlocked user john@example.com',
 *     log_status:  'SUCCESS',
 *     log_by:      adminUserId,
 *     action_type: 'UPDATE'
 *   });
 */

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
      table_name: 'SYSTEM_LOG',
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
