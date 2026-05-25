export class DashboardRequest {
     user_id?: number | null;
}

export interface ProviderPerformance {
  priority_count: number;
  call_count: number;
  other_count: number;
  other_call_count: number;
  priority_gaps_count: number;
  priority_complete_gaps_count: number;
  other_gaps_count: number;
  other_complete_gaps_count: number;
  priority_quality_gaps_count: number;
  priority_complete_quality_gaps_count: number;
  other_quality_gaps_count: number;
  other_complete_quality_gaps_count: number;
  priority_pcp_visit_count: number;
  other_pcp_visit_count: number;
  priority_percentage: number;
  priority_color: string;
  other_call_percentage: number;
  other_call_color: string;
  priority_gaps_percentage: number;
  priority_gaps_color: string;
  other_gaps_percentage: number;
  other_gaps_color: string;
  priority_quality_gaps_percentage: number;
  priority_quality_gaps_color: string;
  other_quality_gaps_percentage: number;
  other_quality_gaps_color: string;
  priority_pcp_visit_percentage: number;
  priority_pcp_visit_color: string;
  other_pcp_visit_percentage: number;
  other_pcp_visit_color: string;
  provider_name: string;
}

export class BenefitsRequest {
     medicaid_id?: number | null;
}

export class QualitygapRequest {
     medicaid_id?: number | null;
}

export class RiskgapRequest {
     medicaid_id?: number | null;
}

export class CallListRequest {
     medicaid_id?: number | null;
}

export class TaskListRequest {
     medicaid_id?: number | null;
}

export class NoLongerPatientRequest {
     medicaid_id?: number | null;
}

export class AlterPhoneListRequest {
     medicaid_id?: number | null;
}

export class AlterAddressListRequest {
     medicaid_id?: number | null;
}

export interface TaskInsertData {
  medicaid_id: number;
  action_id: number;
  assign_to: number;
  action_date: string | Date;
  action_note?: string;
  status: string;
  add_by: number;
} 

export interface UpdateTaskRequest {
  table_name: string;
  id_field_name: string;
  id_field_value: number;   // ✅ FIXED (was string)
  updateData: {
    action_id: number;
    assign_to: number;
    action_date: string | Date;
    action_note?: string;
    status: string;
  };
} 

export interface TaskRequest {
  table_name: string;
  insertDataArray: TaskInsertData[];
}

export interface TaskInsertData {
  medicaid_id: number;
  action_id: number;
  assign_to: number;
  action_date: Date | string;
  action_note?: string;
  status: string;
  add_by: number;
}

export interface SystemLogData {
  medicaid_id: number;
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

export interface UpdateMemberRequest {
  table_name: string;
  id_field_name: string;
  id_field_value: number;   // ✅ FIXED (was string)
  updateData: {
    NO_LONGER_PATIENT_FLAG: number;
    NO_LONGER_PATIENT_NOTE: string;
    NO_LONGER_PATIENT_DATE: string | Date; 
  };
}

export interface ConfirmDialogResult {
  refresh: boolean;
  medicaid_id?: number;
   note?: string; 
}

export interface AltphoneRequest {
  table_name: string;
  insertDataArray: AltphoneInsertData[];
}

export interface AltphoneInsertData {
  medicaid_id: number;
  alt_phone_no: string; 
  add_by: number;
}

export interface AltaddressRequest {
  table_name: string;
  insertDataArray: AltaddressInsertData[];
}

export interface AltaddressInsertData {
  medicaid_id: number;
  alt_address: string; 
  alt_city: string; 
  alt_state: string; 
  alt_zip: string; 
  add_date: string | Date; 
  add_by: number;
}

export class PlanexistRequest {
    medicaid_id?: number | null;
    plan_id?: number | null;
}

export interface MemberplanRequest {
  table_name: string;
  insertDataArray: MemberplanInsertData[];
}

export interface MemberplanInsertData {
  medicaid_id: number;
  plan_id: number; 
  added_by: number;
}

export interface TransferRequest {
  table_name: string;
  insertDataArray: TransferInsertData[];
}

export interface TransferInsertData {
  medicaid_id: number;
  department_id: number; 
  referring_reason: string;
  refer_to: number;
  refer_by:number;
}

export class UserListRequest {
    department_id?: number | null; 
}

export interface UpdateoutreachMemberRequest {
  table_name: string;
  id_field_name: string;
  updates: {
    medicaid_id: number;
    Care_Coordinator_id: number;
  }[];
}



