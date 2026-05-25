export interface MemberFileRequest {
  table_name: string;
  insertDataArray: MemberFileInsertData[];
}

export interface MemberFileInsertData {
  ADDRESS_1: string;
  ADDRESS_2: string;
  AGT_REC_EM: string;
  AGT_REC_NM: string; 
  AGT_REC_PH: string;
  CELL_PHONE: string;  
  CITY: string;
  CONTRACT_NO: string;
  COUNTY: string;
  DISENROLL_DESC: string;
  DISENROLL_RSN_CD: string;
  DT_OF_BIRTH: string | Date; 
  EMAIL: string;
  ENROLL_DT: string | Date;  
  FIRST_NM: string;
  HOME_TELEPHONE: string; 
  INSERT_SESSION_ID: string;
  LAST_NM: string;
  MBR_PERIOD: string;
  MEDICAID_ID: string;
  MEDICARE_ID: string;
  MIDDLE_NM: string; 
  NETWORK_ID: string;
  NETWORK_NAME: string;  
  PBP: string;
  PCP_EFF_DT_S: string | Date;
  PCP_NPI: string;
  PCP_TAX_ID: string;
  PLAN_ID: string;
  PLAN_NAME: string;
  RISK_SCORE: string; 
  SEX: string;
  STATE: string;  
  SUBSCRIBER_ID: string;
  ZIP_CODE: string;
}