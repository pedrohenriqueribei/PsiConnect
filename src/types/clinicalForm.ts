export type QuestionType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'likert_scale'
  | 'yes_no_justification';

export type FormCategory =
  | 'anxiety'
  | 'mood'
  | 'followup'
  | 'burnout'
  | 'anamnesis'
  | 'general';

export type FormStatus = 'draft' | 'published';

export type PeriodicityType = 'weekly' | 'biweekly' | 'monthly' | 'on_demand';

export interface LikertScaleConfig {
  min: number; // e.g. 0
  max: number; // e.g. 10
  step?: number; // default 1
  minLabel: string; // e.g. "0 - Nenhuma ansiedade"
  maxLabel: string; // e.g. "10 - Ansiedade extrema"
}

export interface FormQuestion {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // for radio and checkbox
  scaleConfig?: LikertScaleConfig; // for likert_scale
  justificationPrompt?: string; // for yes_no_justification
}

export interface ClinicalForm {
  id: string;
  professionalId: string; // Strict tenant / owner isolation
  professionalName: string;
  title: string;
  description: string;
  category: FormCategory;
  status: FormStatus; // 'draft' | 'published'
  isAnonymous: boolean; // Optional anonymous/confidential research
  allowMultipleSubmissions: boolean; // Patient can submit multiple times over time
  periodicity?: PeriodicityType;
  questions: FormQuestion[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface FormDispatch {
  id: string;
  formId: string;
  formTitle: string;
  professionalId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  sentAt: string; // Mandatory ISO timestamp of dispatch
  deadline?: string; // Optional deadline (YYYY-MM-DD or ISO)
  status: 'pending' | 'completed' | 'expired';
  submissionCount: number;
  lastSubmittedAt?: string;
  shareToken: string;
}

export interface QuestionAnswer {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  value: string | string[] | number | boolean;
  scaleValue?: number; // Numeric value if likert_scale
  justification?: string; // Optional justification for yes_no_justification
}

export interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  dispatchId?: string;
  professionalId: string; // Strict owner isolation
  patientId: string;
  patientName: string;
  patientEmail?: string;
  submittedAt: string; // Mandatory ISO timestamp of response submission
  answers: QuestionAnswer[];
  encryptedPayload?: string; // AES-256-GCM cipher envelope
  isReadByProfessional: boolean;
  readAt?: string;
  notesFromProfessional?: string;
}
