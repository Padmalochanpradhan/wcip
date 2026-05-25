export class UserIdRequest {
    user_id?: string; 
}
export class MedicaidIdRequest {
    medicaid_id?: string; 
}
export class MultipleRowInsertRequest {
  table_name?: string;
  insertDataArray?: any[];
}
export class MultipleRowAndFieldUpdateRequest {
  table_name?: string;
  id_field_name?: string;
  updates?: any[];
}
export class Actionresultfollowup {
  scheduled_type?: string;
  role_id?: any;
}
export class navigatorListRequest { 
  role_id?: string;
}