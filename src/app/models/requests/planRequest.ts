export interface PlanRequest {
  table_name: string;
  insertDataArray: PlanInsertData[];
}

export interface PlanInsertData {
  plan_name: string;
  start_date: string | Date; 
  end_date: string | Date;  
  status: number; 
}

export interface UpdatePlanRequest {
  table_name: string;
  id_field_name: string;
  id_field_value: number; 
  updateData: {
    plan_name: string;
    start_date: string | Date; 
    end_date: string | Date;  
    status: number; 
  };
} 

export interface fileAttachRequest {
  fileName: string;
  fileType: string;
  directory: string;   
  id: string;  
  env: string;  
  bucket: string;  
}

export interface attachmentRequest {
  type: string;
  type_id: number;  
}

export interface attchFileremoveRequest {
  id: number; 
}


export interface S3UploadResponse {
  body: string;   // backend sends JSON string
}

export interface FileRequest {
  table_name: string;
  insertDataArray: FileInsertData[];
}

export interface FileInsertData {
  type: string;
  type_id: number;
  attachment: string;
  title: string;  
  added_by: number;  
  status: number; 
}

export interface UpdateFileRequest {
  table_name: string;
  id_field_name: string;
  id_field_value: number; 
  updateData: {
    attachment: string;
    title: string; 
    status: number;  
  };
} 

export interface UpdateFileStatusRequest {
  table_name: string;
  id_field_name: string;
  id_field_value: number; 
  updateData: { 
    status: number;  
  };
}

