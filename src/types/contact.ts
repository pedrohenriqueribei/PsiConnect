export type ContactSubject =
  | 'support'
  | 'questions'
  | 'professional'
  | 'partnerships'
  | 'ethics'
  | 'other';

export interface ContactSubjectOption {
  value: ContactSubject;
  label: string;
}

export const CONTACT_SUBJECT_OPTIONS: ContactSubjectOption[] = [
  { value: 'support', label: 'Suporte Técnico' },
  { value: 'questions', label: 'Dúvidas Gerais' },
  { value: 'professional', label: 'Cadastro de Profissionais' },
  { value: 'partnerships', label: 'Parcerias & Convênios' },
  { value: 'ethics', label: 'Orientações sobre Sigilo & CFP' },
  { value: 'other', label: 'Outros Assuntos' }
];

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: ContactSubject | '';
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export interface ContactInquiry extends ContactFormData {
  id: string;
  protocol: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  protocol: string;
  createdAt: string;
  error?: string;
}
