export interface Ward {
  id: number;
  name: string;
  code: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  ward_id: number | null;
  ward_name?: string;
  location_type: string;
  latitude: number | null;
  longitude: number | null;
  client_id: number | null;
}

export interface Survey {
  id: number;
  title: string;
  short_title?: string | null;
  slug: string;
  description: string;
  icon: string;
  survey_type: string;
  daily_prompt: string;
  status: string;
  location_id: number | null;
  location_name?: string;
  location_address?: string;
  location_type?: string;
  location_ward_id?: number | null;
  location_ward_name?: string;
}

export interface QuestionOption {
  id: number;
  label: string;
  value: string;
  color_variant: 'positive' | 'neutral' | 'warning' | 'critical' | 'info';
  display_order: number;
}

export interface SurveyQuestion {
  id: number;
  map_id: number;
  code: string;
  label: string;
  helper_text: string | null;
  placeholder: string | null;
  question_type:
    | 'text' | 'textarea' | 'dropdown'
    | 'single_chip' | 'multi_chip'
    | 'number' | 'date' | 'datetime'
    | 'location' | 'rating' | 'boolean';
  is_required: boolean;
  display_order: number;
  options: QuestionOption[];
}

export interface SurveySection {
  id: number;
  title: string;
  subtitle: string | null;
  icon: string | null;
  badge_label: string | null;
  is_collapsible: boolean;
  is_required: boolean;
  display_order: number;
  questions: SurveyQuestion[];
}

export interface SurveyDetail extends Survey {
  sections: SurveySection[];
}

export interface AnswerPayload {
  question_id: number;
  map_id: number;
  answer_text?: string | null;
  selected_options?: number[] | null;
}

export interface SubmissionPayload {
  survey_id: number;
  user_id: number;
  ward_id: number | null;
  location_text: string;
  answers: AnswerPayload[];
}

export interface AiAnalysis {
  summary: string;
  scores: { label: string; value?: string; cls: string }[];
  themes: string[];
  sentiment?: string;     // 'Positive' | 'Negative' | 'Mixed' | 'Urgent'
  trust_signal?: string;  // 'High' | 'Moderate' | 'Low' | 'Erosion'
  field_notes?: { label: string; note: string }[];
  category?: string;      // broad content bucket from Airtable's "Topic" column (Environmental, Housing, Transportation, ...)
}

export type AirtableRow = Record<string, string>;

export interface AirtableImportResult {
  inserted: number;
  skipped: number;
  errors: number;
  details?: {
    inserted: any[];
    skipped: any[];
    errors: any[];
  };
}

export interface SurveySubmission {
  id: number;
  survey_id: number;
  survey_title?: string;
  user_id: number;
  ward_id: number | null;
  ward_name?: string;
  location_text: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'flagged';
  ai_analysis: AiAnalysis | null;
  submitted_at: string;
  created_at: string;
  staff_name?: string;
  staff_email?: string;
}

// "Community context — public data benchmarks" on the Community Intelligence
// Brief. census/brfss/eji are fetched live server-side; ncqa/samhsa have no
// public API and are static, cited reference figures (see WCGetCommunityBenchmarks.js).
export interface CommunityBenchmark {
  source: string;
  citation: string;
  live: boolean;
  placeholder?: boolean; // true when metrics[].value has not been verified against a real source yet
  error?: string;        // set when a live fetch failed
  metrics: { label: string; value: string }[];
}

export interface CommunityBenchmarks {
  census: CommunityBenchmark;
  brfss: CommunityBenchmark;
  eji: CommunityBenchmark;
  ncqa: CommunityBenchmark;
  samhsa: CommunityBenchmark;
}
