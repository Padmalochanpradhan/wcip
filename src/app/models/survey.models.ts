export interface Ward {
  id: number;
  name: string;
  code: string;
}

export interface Survey {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  survey_type: string;
  daily_prompt: string;
  status: string;
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
