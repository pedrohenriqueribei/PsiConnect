export type RecordStatus = 'active' | 'paused' | 'discharged' | 'abandoned' | 'referred';

export const RECORD_STATUS_LABELS: Record<RecordStatus, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Ativo em Atendimento', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  paused: { label: 'Em Pausa Temporária', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  discharged: { label: 'Alta Clínica Concluída', color: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-200' },
  abandoned: { label: 'Abandono de Tratamento', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
  referred: { label: 'Encaminhado a Outro Especialista', color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200' },
};

export type SuicideRiskLevel = 'none' | 'passive' | 'active' | 'imminent';
export type SelfHarmRiskLevel = 'none' | 'historical' | 'recent' | 'active';
export type ViolenceRiskLevel = 'none' | 'domestic' | 'third_party' | 'other';

export interface IdentifiedRisks {
  suicideRisk: SuicideRiskLevel;
  selfHarmRisk: SelfHarmRiskLevel;
  violenceRisk: ViolenceRiskLevel;
  hasActiveRisk: boolean;
  riskObservations?: string;
  safetyPlanActive?: boolean;
}

export type EvolutionTrend = 'melhora' | 'estavel' | 'piora';

export interface EvolutionScaleInfo {
  score: number; // 1 to 5
  trend: EvolutionTrend;
  label: string;
  description: string;
}

export const EVOLUTION_SCALE_MAP: Record<number, EvolutionScaleInfo> = {
  1: { score: 1, trend: 'piora', label: '1 - Piora Significativa', description: 'Agravamento acentuado de sintomas, sofrimento intenso ou crise aguda.' },
  2: { score: 2, trend: 'piora', label: '2 - Leve Piora', description: 'Oscilação negativa de humor, dificuldades pontuais ou reativação de queixas.' },
  3: { score: 3, trend: 'estavel', label: '3 - Estável / Sem Alterações', description: 'Manutenção do quadro clínico, sem recaídas nem ganhos substanciais.' },
  4: { score: 4, trend: 'melhora', label: '4 - Melhora Progressiva', description: 'Redução evidente de sintomas, adesão a tarefas e regulação emocional.' },
  5: { score: 5, trend: 'melhora', label: '5 - Melhora Expressiva / Excelente', description: 'Grande autonomia, resolução de conflitos centrais, aproximação da alta.' },
};

export interface SessionAttachment {
  id: string;
  name: string;
  category: 'test' | 'medical_report' | 'homework' | 'tcle' | 'other';
  url: string;
  size: string;
  uploadedAt: string;
}

export interface SessionVersionHistory {
  versionNumber: number;
  editedAt: string;
  editedBy: string;
  authorId: string;
  changesSummary: string;
  previousContent: {
    summaryContent: string;
    interventions: string;
    evolutionScore: number;
    evolutionTrend: EvolutionTrend;
    evolutionNotes: string;
    emotionalState: string;
    nextSessionTasks?: string;
  };
}

export interface EvolutionSession {
  id: string;
  sessionNumber: number; // 1, 2, 3...
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  modality: 'online' | 'presencial';
  emotionalState: string; // Estado emocional observado (ex: Ansioso, Eutímico, Lábil)
  summaryContent: string; // Resumo do conteúdo da sessão (dado sensível criptografado)
  interventions: string; // Intervenções e técnicas realizadas (dado sensível criptografado)
  evolutionTrend: EvolutionTrend;
  evolutionScore: number; // 1 a 5
  evolutionNotes: string; // Observações da evolução
  risks: IdentifiedRisks; // Ideação, autolesão, violência com alerta visual
  nextSessionTasks?: string; // Tarefas / orientações para a próxima sessão
  nextSessionAppointmentId?: string; // Vinculado a agendamento
  nextSessionDate?: string; // Data e horário previsto
  attachments?: SessionAttachment[];
  createdAt: string;
  updatedAt: string;
  versions: SessionVersionHistory[]; // Histórico imutável de alterações
  milestoneAchieved?: string; // Marco clínico alcançado nesta sessão
  milestoneCategory?: 'alliance' | 'insight' | 'symptom_reduction' | 'behavioral' | 'autonomy' | 'discharge';
}

export interface ClinicalMilestone {
  id: string;
  title: string;
  description: string;
  sessionNumber?: number;
  date: string;
  category: 'alliance' | 'insight' | 'symptom_reduction' | 'behavioral' | 'autonomy' | 'discharge';
  achieved: boolean;
  notes?: string;
}

export interface RecordIdentification {
  fullName: string;
  socialName?: string;
  birthDate: string; // YYYY-MM-DD
  gender: string; // Feminino, Masculino, Não-binário, Outro
  cpf: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  profession: string;
  education: string;
  maritalStatus: string;
}

export interface LegalGuardian {
  name: string;
  relationship: string; // Mãe, Pai, Tutor Legal, etc.
  cpf: string;
  contact: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phonePrimary: string;
  phoneSecondary?: string;
}

export interface ResponsibleProfessional {
  id: string;
  name: string;
  type: 'psychologist' | 'therapist' | 'psychoanalyst' | 'pastor';
  role?: string;
  registration: string; // CRP, CRT, etc.
  email?: string;
}

export interface InitialDemand {
  chiefComplaint: string; // Queixa principal
  reasonForCare: string; // Motivo da busca
  treatmentStartDate: string; // Data de início
  referral?: string; // Encaminhamento (médico, escola, etc.)
}

export interface PatientClinicalHistory {
  familyHistory: string; // Dinâmica e histórico familiar
  socialHistory: string; // Rede de apoio, trabalho, social
  previousMentalHealth: string; // Saúde mental anterior e diagnósticos prévios
  medications: string; // Medicações em uso atual e dosagens
  psychiatricFollowUp: boolean; // Faz acompanhamento psiquiátrico?
  psychiatristName?: string;
  hospitalizationHistory: string; // Histórico de internações
}

export interface InitialAssessment {
  diagnosticHypothesis: string; // Hipótese diagnóstica / CID-11 / DSM-5 / Formulação
  theoreticalApproach: string; // TCC, Fenomenologia, Psicanálise, Gestalt, etc.
}

export interface TherapeuticPlan {
  goals: string[]; // Objetivos do tratamento
  sessionFrequency: 'weekly' | 'biweekly' | 'twice_weekly' | 'monthly';
  strategiesAndTechniques: string[];
  reassessmentMilestone?: string;
}

export interface ConsentsAndLGPD {
  tcleAccepted: boolean;
  tcleAcceptedAt?: string;
  lgpdAuthorized: boolean;
  lgpdAuthorizedAt?: string;
  signatureType: 'digital' | 'electronic' | 'manual';
  signedBy: string;
  consentDocumentUrl?: string;
}

export interface GeneralAttachment {
  id: string;
  name: string;
  category: 'tcle' | 'scale_inventory' | 'psychiatric_report' | 'school_report' | 'legal_document' | 'other';
  fileType: string;
  size: string;
  url?: string;
  uploadedAt: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'visualizacao'
    | 'criacao_prontuario'
    | 'edicao_dados'
    | 'registro_sessao'
    | 'edicao_sessao'
    | 'exportacao_pdf'
    | 'alteracao_status';
  actorId: string;
  actorName: string;
  actorRole: string;
  ipOrDevice: string;
  details: string;
  legalBasis: string; // 'CFP Resolução 01/2009 & LGPD Art. 11'
}

export interface PsychologicalRecord {
  id: string;
  patientId: string;
  professionalId: string;
  createdAt: string;
  updatedAt: string;
  status: RecordStatus;
  closureDate?: string;
  closureReason?: string;

  // 1. Identificação
  identification: RecordIdentification;

  // 2. Responsável legal (obrigatório se menor de 18 anos)
  isMinor: boolean;
  legalGuardian?: LegalGuardian;

  // 3. Contato de emergência
  emergencyContact: EmergencyContact;

  // 4. Profissional responsável
  professional: ResponsibleProfessional;

  // 5. Demanda inicial
  initialDemand: InitialDemand;

  // 6. Histórico
  history: PatientClinicalHistory;

  // 7. Avaliação inicial
  initialAssessment: InitialAssessment;

  // 8. Plano terapêutico
  therapeuticPlan: TherapeuticPlan;

  // 9. Consentimentos
  consents: ConsentsAndLGPD;

  // Registros de Sessões (Evoluções)
  sessions: EvolutionSession[];

  // Marcos Clínicos da Jornada do Paciente
  milestones?: ClinicalMilestone[];

  // Anexos gerais do prontuário
  attachments: GeneralAttachment[];

  // Logs de Auditoria
  auditLogs: AuditLogEntry[];

  // Conformidade & Criptografia
  isEncrypted: boolean;
  encryptionAlgorithm: string;
  retentionUntil: string; // 5 anos mínimo conforme Resolução CFP 01/2009 art. 4º
}
