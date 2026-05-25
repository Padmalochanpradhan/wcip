export class RiskGapsRequest {
  start_date?: any;
  end_date?: any;
  gaps_type?: string;
}

// Single report row
export class RiskGapReport {
  RECIP_NO?: string;
  MEDICARE_NO?: string;
  FIRST_NAME?: string;
  LAST_NAME?: string;
  BIRTH?: string;
  ObservationDate?: string;
  Observation_Year?: string;
  Observation_Code?: string;
  CPT_Code_Modifier?: string;
  Observation_Code_Set?: string;
  Observation_Result?: string;
  Service_Provider_NPI?: string;
  Service_Provider_Taxonomy_Code?: string;
  Service_Provider_Name?: string;
  Service_Provider_Type?: string;
  Service_Provider_RxProviderFlag?: string;
  Provider_Group_NPI?: string;
  Provider_Group_Taxonomy_Code?: string;
  Provider_Group_Name?: string;
  Source?: string;
  [key: string]: any; // optional for extra columns
}

// API response
export class RiskGapApiResponse {
  data: RiskGapReport[] = [];
  start_date?: string;
  end_date?: string;
}
