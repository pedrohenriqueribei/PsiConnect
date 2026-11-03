export type UserRole =
  | 'patient'
  | 'psychologist'
  | 'therapist'
  | 'psychoanalyst'
  | 'pastor'
  | 'professional';

export type ProfessionalType = 'psychologist' | 'therapist' | 'psychoanalyst' | 'pastor';

export type CareCategory = 'therapy' | 'biblical';

export interface ProfessionalTypeMeta {
  type: ProfessionalType;
  label: string;
  pluralLabel: string;
  category: CareCategory;
  categoryLabel: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  description: string;
  defaultRate: number;
  defaultApproaches: string[];
}

export const PROFESSIONAL_TYPES_CONFIG: Record<ProfessionalType, ProfessionalTypeMeta> = {
  psychologist: {
    type: 'psychologist',
    label: 'Psicólogo(a)',
    pluralLabel: 'Psicólogos',
    category: 'therapy',
    categoryLabel: 'Terapia Psicológica & Comportamental',
    credentialLabel: 'Registro Profissional (CRP)',
    credentialPlaceholder: 'Ex: CRP 06/138420',
    description: 'Atendimento clínico científico em saúde mental, psicodiagnóstico e psicoterapia com registro ativo no Conselho de Psicologia.',
    defaultRate: 180,
    defaultApproaches: [
      'Terapia Cognitivo-Comportamental (TCC)',
      'Gestalt-terapia',
      'Fenomenologia Existencial',
      'Humanista / ACP',
      'Terapia de Esquemas',
    ],
  },
  therapist: {
    type: 'therapist',
    label: 'Terapeuta',
    pluralLabel: 'Terapeutas',
    category: 'therapy',
    categoryLabel: 'Terapia Emocional & Integrativa',
    credentialLabel: 'Registro / Certificação Profissional',
    credentialPlaceholder: 'Ex: CRT 52140 / Registro Terapêutico',
    description: 'Acompanhamento focado em regulação emocional, comportamento, desenvolvimento pessoal e práticas integrativas de bem-estar.',
    defaultRate: 150,
    defaultApproaches: [
      'Terapia Emocional e Comportamental',
      'Terapia Integrativa / Holística',
      'Inteligência Emocional & Mindfulness',
      'Gestão do Estresse & Burnout',
      'Programação Neurolinguística (PNL)',
    ],
  },
  psychoanalyst: {
    type: 'psychoanalyst',
    label: 'Psicanalista',
    pluralLabel: 'Psicanalistas',
    category: 'therapy',
    categoryLabel: 'Terapia Psicanalítica & Inconsciente',
    credentialLabel: 'Sociedade / Registro de Psicanálise',
    credentialPlaceholder: 'Ex: Membro da Sociedade Psicanalítica / ABP 4120',
    description: 'Investigação aprofundada dos processos inconscientes, análise de sintomas profundos, luto, angústias e história do sujeito.',
    defaultRate: 200,
    defaultApproaches: [
      'Psicanálise Freudiana',
      'Psicanálise Lacaniana',
      'Elaboração de Traumas & Luto',
      'Análise de Conflitos Inconscientes',
      'Psicopatologia Psicanalítica',
    ],
  },
  pastor: {
    type: 'pastor',
    label: 'Pastor(a) / Conselheiro(a) Bíblico(a)',
    pluralLabel: 'Pastores & Conselheiros Bíblicos',
    category: 'biblical',
    categoryLabel: 'Aconselhamento Bíblico & Pastoral',
    credentialLabel: 'Registro Pastoral / Ministério ou Igreja',
    credentialPlaceholder: 'Ex: Convenção Pastoral / Ministério Fé & Família',
    description: 'Aconselhamento à luz dos princípios bíblicos, acolhimento espiritual, restauração familiar e orientação de vida cristã.',
    defaultRate: 120,
    defaultApproaches: [
      'Aconselhamento Bíblico das Escrituras',
      'Aconselhamento Pré-Matrimonial & Casais',
      'Fortalecimento Espiritual & Fé',
      'Superação de Luto & Crises Existenciais',
      'Orientação Familiar e Juventude',
    ],
  },
};

export const isProfessionalRole = (role?: string | null): boolean => {
  return (
    role === 'psychologist' ||
    role === 'therapist' ||
    role === 'psychoanalyst' ||
    role === 'pastor' ||
    role === 'professional'
  );
};

export type AgeGroup = '18-25' | '26-35' | '36-50' | '51+';
export type MaritalStatus = 'single' | 'married' | 'stable_union' | 'divorced' | 'widowed';

export interface PatientMatchingProfile {
  ageGroup: AgeGroup;
  approximateAge?: number;
  maritalStatus: MaritalStatus;
  hasChildren: boolean;
  childrenDetails?: string;
  reasonsForCare: string[]; // Ex: 'Ansiedade e Pânico', 'Conflitos no Casamento', 'Crise de Meia-Idade', 'Maternidade e Família'
  personalNote?: string; // Breve relato do motivo da busca
  preferredCareCategory?: CareCategory | 'both';
  preferredGender?: 'female' | 'male' | 'no_preference';
  completedAt: string;
}

export interface ProfessionalMatchingProfile {
  ageGroup: AgeGroup;
  approximateAge?: number;
  maritalStatus?: MaritalStatus;
  hasChildren?: boolean;
  yearsOfExperience?: number;
  affinityTags: string[]; // Tags de identificação com as quais mais se identifica
  preferredPatientAgeGroups?: AgeGroup[];
  acceptsNewMatchedPatients?: boolean;
  welcomeIntro?: string;
  formations?: string[];
  specializations?: string[];
  updatedAt: string;
}

export const SUGGESTED_FORMATIONS_BY_TYPE: Record<ProfessionalType, string[]> = {
  psychologist: [
    'Graduação em Psicologia',
    'Pós-Graduação em Saúde Mental',
    'Mestrado em Psicologia Clínica',
    'Especialização em Psicoterapia',
    'Aprimoramento em Hospital Geral',
  ],
  therapist: [
    'Graduação em Terapias Integrativas',
    'Formação em Terapia Emocional',
    'Certificação Internacional em Mindfulness',
    'Formação em PNL e Coaching Clínico',
    'Especialização em Práticas Integrativas',
  ],
  psychoanalyst: [
    'Formação em Teoria e Clínica Psicanalítica',
    'Graduação em Psicologia ou Filosofia',
    'Membro de Sociedade Psicanalítica',
    'Especialização em Psicanálise Lacaniana/Freudiana',
    'Pós-Graduação em Psicopatologia Psicanalítica',
  ],
  pastor: [
    'Bacharel em Teologia',
    'Formação em Aconselhamento Bíblico Pastoral',
    'Pós-Graduação em Família e Sociedade',
    'Especialização em Cuidado Pastoral de Crises',
    'Mestrado em Teologia Prática',
  ],
};

export const SUGGESTED_SPECIALIZATIONS_BY_TYPE: Record<ProfessionalType, string[]> = {
  psychologist: [
    'Terapia Cognitivo-Comportamental (TCC)',
    'Transtornos de Ansiedade e Pânico',
    'Neuropsicologia Clínica',
    'Depressão e Transtornos de Humor',
    'Terapia de Casal e Família',
    'Luto e Perdas',
    'Burnout e Saúde Ocupacional',
    'Avaliação Psicológica',
  ],
  therapist: [
    'Regulação Emocional e Redução do Estresse',
    'Mindfulness e Atenção Plena',
    'Inteligência Emocional',
    'Terapia Floral e Práticas Integrativas',
    'Desenvolvimento Pessoal e Autoestima',
    'Transição de Carreira e Propósito',
  ],
  psychoanalyst: [
    'Psicanálise Freudiana',
    'Psicanálise Lacaniana',
    'Análise de Traumas e Sintomas Inconscientes',
    'Elaboração de Luto e Angústia',
    'Psicopatologia do Adulto',
    'Clínica dos Vínculos e Desejo',
  ],
  pastor: [
    'Aconselhamento Pré-Matrimonial e Conjugal',
    'Restauração Familiar e Paternidade',
    'Orientação Bíblica de Crises e Luto',
    'Fortalecimento Espiritual e Vencendo a Culpa',
    'Aconselhamento de Jovens e Liderança Cristã',
    'Cuidado Pastoral com a Saúde Emocional',
  ],
};

export const CLINICAL_EXPERIENCE_TAGS = [
  'Ansiedade',
  'Luto',
  'Relacionamentos',
  'Depressão',
  'Burnout & Estresse',
  'Conflitos Conjugais',
  'Maternidade & Paternidade',
  'Crise de Meia-Idade',
  'Autoestima',
  'Transições de Carreira',
  'Trauma & TEPT',
  'Regulação Emocional',
  'Família & Filhos',
  'Fobias & Pânico',
  'Desenvolvimento Pessoal',
] as const;

export interface MatchScoreBreakdown {
  ageGroupScore: number;    // Peso: 30% (máximo 30 pontos)
  reasonsScore: number;     // Peso: 30% (máximo 30 pontos)
  maritalScore: number;     // Peso: 20% (máximo 20 pontos)
  childrenScore: number;    // Peso: 20% (máximo 20 pontos)
  totalScore: number;       // Score total: 100% (máximo 100 pontos)
}

export interface PatientMatchResult {
  patient: User;
  score: number; // 0 to 100
  scoreBreakdown: MatchScoreBreakdown;
  matchHighlights: string[]; // Motivos claros da afinidade (ex: "Mesma faixa etária", "Ambos casados com filhos")
  sharedTags: string[];
  matchedClinicalTags?: string[]; // Tags de experiência clínica que coincidem com as demandas do paciente
  matchedSpecializations?: string[]; // Especializações que coincidem com queixas do paciente
  matchedFormations?: string[]; // Formações que validam qualificação na queixa
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  professionalType?: ProfessionalType;
  careCategory?: CareCategory;
  phone?: string;
  crp?: string; // Registro profissional (CRP para psicólogos ou mantido para compatibilidade)
  registrationNumber?: string; // Número de registro geral
  ministryOrChurch?: string; // Denominação/Igreja/Ministério para pastores
  bio?: string;
  hourlyRate?: number;
  sessionDuration?: number; // em minutos (ex: 50)
  approaches?: string[];
  formations?: string[]; // Formações acadêmicas e cursos formativos (+ de 1)
  specializations?: string[]; // Especializações clínicas e áreas de especialidade (+ de 1)
  clinicalTags?: string[]; // Tags de experiência clínica (ex: Ansiedade, Luto, Relacionamentos)
  avatar?: string;
  city?: string;
  state?: string;
  defaultMeetingType?: 'native' | 'external';
  externalMeetingUrl?: string;
  patientProfile?: PatientMatchingProfile;
  professionalProfile?: ProfessionalMatchingProfile;
  joinedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  psychologistId: string; // ID do profissional ofertante
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  isActive: boolean;
  startDate?: string; // Data inicial do período (YYYY-MM-DD)
  endDate?: string;   // Data final do período (YYYY-MM-DD)
  isSocial?: boolean; // Indica se é vaga destinada para atendimento social
  socialRate?: number; // Honorário social subsidiado opcional (ex: 35, 40 ou 0)
}

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingType = 'native' | 'external';

export interface Appointment {
  id: string;
  psychologistId: string; // ID do profissional (mantido para compatibilidade técnica)
  psychologistName: string;
  psychologistAvatar?: string;
  psychologistCrp?: string;
  professionalType?: ProfessionalType;
  careCategory?: CareCategory;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  date: string; // formato YYYY-MM-DD
  time: string; // "14:00"
  endTime: string; // "14:50"
  status: AppointmentStatus;
  meetingType: MeetingType;
  meetingUrl?: string;
  notesFromPatient?: string;
  isSocial?: boolean; // Consulta em modalidade de atendimento social
  socialRate?: number; // Valor social cobrado
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  psychologistId: string; // ID do profissional responsável
  professionalType?: ProfessionalType;
  careCategory?: CareCategory;
  sessionDate: string;
  chiefComplaint: string; // Queixa principal ou demanda apresentada
  clinicalEvolution: string; // Evolução clínica ou apontamentos do acolhimento
  privateNotes: string; // Anotações confidenciais do profissional
  recommendations?: string; // Orientações / tarefas intersessão / passagens bíblicas
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export * from './psychologicalRecord';
export * from './clinicalForm';
