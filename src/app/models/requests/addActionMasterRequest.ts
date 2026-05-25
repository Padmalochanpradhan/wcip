export class AddActionMasterRequest {
    user_id?: string; 
}
export interface SystemLogData {
  medicaid_id: string;
  log_name: string;
  log_details: string;
  log_status: string;
  log_by: number;
  action_type: string;
}

export interface LogRequest {
  table_name: string;
  insertDataArray: SystemLogData[];
}
