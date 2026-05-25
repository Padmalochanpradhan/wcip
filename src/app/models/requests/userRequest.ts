export class UsernameRequest {
     username?: string;
}

export interface UserRequest {
  table_name: string;
  insertDataArray: UserInsertData[];
}

export interface UserInsertData {
  FistName: string;
  LastName: string;
  EmailID: string;
  Password: string; 
  role_id: number;
  department_id: number;  
  member_status: number; 
}

export interface UpdateUserRequest {
  table_name: string;
  id_field_name: string;
  id_field_value: number; 
  updateData: {
    FistName: string;
    LastName: string; 
    Password: string; 
    role_id: number;
    department_id: number;  
    member_status: number; 
  };
} 