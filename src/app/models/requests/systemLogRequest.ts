// models/requests/systemLogRequest.ts
export interface SystemLogRequest {
  table_name: string;
  insertDataArray: SystemLogData[];
}

export interface SystemLogData {
  medicaid_id: string;
  log_name: string;
  log_details: string;
  log_status: 'SUCCESS' | 'FAILED';
  log_by: number;
  action_type: string;
}
