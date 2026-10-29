import {
  User,
  AvailabilitySlot,
  Appointment,
  MedicalRecord,
  ChatMessage,
  PatientMatchingProfile,
  ProfessionalMatchingProfile,
} from '../types';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'serpsi_users_v2',
  CURRENT_USER: 'serpsi_current_user_v2',
  SLOTS: 'serpsi_slots_v1',
  APPOINTMENTS: 'serpsi_appointments_v1',
  RECORDS: 'serpsi_medical_records_v1',
  CHAT: 'serpsi_chat_messages_v1',
};

// Initial Seed with realistic clinical & pastoral data across all professional types
const INITIAL_USERS: User[] = [
  {
    id: 'psy_clara',
    name: 'Dra. Clara Vasconcellos',
    email: 'clara.psico@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'psychologist',
    professionalType: 'psychologist',
    careCategory: 'therapy',
    phone: '(11) 98452-3310',
    crp: 'CRP 06/138420',
    registrationNumber: 'CRP 06/138420',
    bio: 'Especialista em Terapia Cognitivo-Comportamental (TCC) e Mindfulness pela USP. Atuo há 12 anos no tratamento de transtornos de ansiedade, sobrecarga feminina, estresse ocupacional e conflitos conjugais com foco em evidências científicas e acolhimento humano.',
    hourlyRate: 180,
    sessionDuration: 50,
    approaches: ['Terapia Cognitivo-Comportamental (TCC)', 'Transtornos de Ansiedade', 'Mindfulness', 'Burnout & Estresse', 'Crise de Meia-Idade'],
    avatar: '/src/assets/images/avatar_psico_clara_1792608795986.jpg',
    city: 'São Paulo',
    state: 'SP',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-clara',
    professionalProfile: {
      ageGroup: '36-50',
      approximateAge: 44,
      maritalStatus: 'married',
      hasChildren: true,
      yearsOfExperience: 14,
      affinityTags: [
        'Crise de Meia-Idade',
        'Casamento & Terapia de Casal',
        'Maternidade Real & Puerpério',
        'Família & Pais com Filhos',
        'Burnout & Saúde Ocupacional',
        'Ansiedade & Regulação Emocional',
      ],
      preferredPatientAgeGroups: ['36-50', '26-35', '51+'],
      acceptsNewMatchedPatients: true,
      welcomeIntro: 'Acolho mulheres e casais na meia-idade enfrentando sobrecarga emocional, conciliação familiar e transições de vida com escuta clínica empática.',
      updatedAt: '2025-01-15T09:00:00Z',
    },
    joinedAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'psy_marcos',
    name: 'Dr. Marcos Alencar',
    email: 'marcos.psico@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'psychologist',
    professionalType: 'psychologist',
    careCategory: 'therapy',
    phone: '(11) 97120-4491',
    crp: 'CRP 06/112504',
    registrationNumber: 'CRP 06/112504',
    bio: 'Psicólogo clínico com abordagem Fenomenológica-Existencial e Gestalt-terapia. Mestre em Psicologia pela PUC-SP. Experiência de 15 anos no acompanhamento de transições de vida, crises existenciais na meia-idade e relações interpessoais.',
    hourlyRate: 195,
    sessionDuration: 50,
    approaches: ['Gestalt-terapia', 'Fenomenologia Existencial', 'Relacionamentos Interpessoais', 'Autoconhecimento'],
    avatar: '/src/assets/images/avatar_psico_marcos_1792608796718.jpg',
    city: 'Campinas',
    state: 'SP',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-marcos',
    professionalProfile: {
      ageGroup: '36-50',
      approximateAge: 46,
      maritalStatus: 'married',
      hasChildren: true,
      yearsOfExperience: 15,
      affinityTags: [
        'Crise de Meia-Idade',
        'Gestalt & Autoconhecimento',
        'Transição de Carreira & Maturidade',
        'Luto & Conflitos Existenciais',
        'Família & Pais com Filhos',
      ],
      preferredPatientAgeGroups: ['36-50', '51+'],
      acceptsNewMatchedPatients: true,
      updatedAt: '2025-02-10T14:30:00Z',
    },
    joinedAt: '2025-02-10T14:30:00Z',
  },
  {
    id: 'psy_renata',
    name: 'Dra. Renata Mendonça',
    email: 'renata.psico@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'psychoanalyst',
    professionalType: 'psychoanalyst',
    careCategory: 'therapy',
    phone: '(21) 99318-6205',
    bio: 'Psicanalista clínica com formação pelo Instituto Brasileiro de Psicanálise e doutora pela UFRJ. Acompanha adultos e mulheres em processos de luto, depressão, angústia e elaboração de conflitos inconscientes profundos.',
    hourlyRate: 220,
    sessionDuration: 50,
    approaches: ['Psicanálise Freudiana & Lacaniana', 'Elaboração de Luto & Perdas', 'Depressão & Vazio', 'Conflitos Inconscientes'],
    avatar: '/src/assets/images/avatar_psico_renata_1792608797120.jpg',
    city: 'Rio de Janeiro',
    state: 'RJ',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-renata',
    professionalProfile: {
      ageGroup: '36-50',
      approximateAge: 42,
      maritalStatus: 'divorced',
      hasChildren: true,
      yearsOfExperience: 13,
      affinityTags: [
        'Luto & Conflitos Existenciais',
        'Depressão & Reestruturação Cognitiva',
        'Crise de Meia-Idade',
        'Família & Pais com Filhos',
      ],
      preferredPatientAgeGroups: ['26-35', '36-50', '51+'],
      acceptsNewMatchedPatients: true,
      updatedAt: '2025-03-01T10:00:00Z',
    },
    joinedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'ther_camila',
    name: 'Camila Rezende',
    email: 'camila.terapeuta@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'therapist',
    professionalType: 'therapist',
    careCategory: 'therapy',
    phone: '(11) 98321-9980',
    bio: 'Terapeuta Integrativa e Comportamental especializada em regulação emocional, alívio de estresse e desenvolvimento para jovens profissionais. Conduz atendimentos dinâmicos com foco em presença e autocompaixão.',
    hourlyRate: 150,
    sessionDuration: 50,
    approaches: ['Terapia Emocional e Comportamental', 'Inteligência Emocional', 'Mindfulness & Respiração', 'Gestão do Estresse'],
    avatar: '/src/assets/images/avatar_terapeuta_camila_1793309224240.jpg',
    city: 'Belo Horizonte',
    state: 'MG',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-camila',
    professionalProfile: {
      ageGroup: '26-35',
      approximateAge: 27,
      maritalStatus: 'single',
      hasChildren: false,
      yearsOfExperience: 3,
      affinityTags: [
        'Jovens Adultos & Identidade',
        'Ansiedade & Regulação Emocional',
        'Burnout & Saúde Ocupacional',
        'Autoestima & Relações Interpessoais',
      ],
      preferredPatientAgeGroups: ['18-25', '26-35'],
      acceptsNewMatchedPatients: true,
      welcomeIntro: 'Ajudo jovens adultos em início de trajetória profissional a lidarem com ansiedade e autocobrança.',
      updatedAt: '2025-02-18T11:00:00Z',
    },
    joinedAt: '2025-02-18T11:00:00Z',
  },
  {
    id: 'pas_david',
    name: 'Pr. David Ferreira',
    email: 'pastor.david@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'pastor',
    professionalType: 'pastor',
    careCategory: 'biblical',
    phone: '(11) 97654-3210',
    ministryOrChurch: 'Ministério Fé & Família / Comunidade Esperança',
    bio: 'Pastor e conselheiro bíblico há 16 anos, com pós-graduação em Aconselhamento Pastoral e Família. Dedicado a acolher pessoas e casais em busca de conselho bíblico, conforto espiritual, restauração conjugal e discernimento sob a luz da Palavra de Deus.',
    hourlyRate: 120,
    sessionDuration: 50,
    approaches: ['Aconselhamento Bíblico das Escrituras', 'Orientação Conjugal & Familiar', 'Princípios Bíblicos de Vida', 'Acolhimento Espiritual & Luto'],
    avatar: '/src/assets/images/avatar_pastor_david_1793309212629.jpg',
    city: 'São Paulo',
    state: 'SP',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-david',
    professionalProfile: {
      ageGroup: '36-50',
      approximateAge: 50,
      maritalStatus: 'married',
      hasChildren: true,
      yearsOfExperience: 16,
      affinityTags: [
        'Aconselhamento Bíblico & Família',
        'Casamento & Terapia de Casal',
        'Crise de Meia-Idade',
        'Família & Pais com Filhos',
      ],
      preferredPatientAgeGroups: ['26-35', '36-50', '51+'],
      acceptsNewMatchedPatients: true,
      welcomeIntro: 'Acolhimento pastoral e bíblico para restauração de lares e fortalecimento do casamento.',
      updatedAt: '2025-01-20T08:00:00Z',
    },
    joinedAt: '2025-01-20T08:00:00Z',
  },
  {
    id: 'pat_luciana',
    name: 'Luciana Ramos Silva',
    email: 'luciana.ramos@gmail.com',
    passwordHash: 'senha123',
    role: 'patient',
    phone: '(11) 98341-2299',
    patientProfile: {
      ageGroup: '36-50',
      approximateAge: 43,
      maritalStatus: 'married',
      hasChildren: true,
      childrenDetails: '2 filhos (10 e 14 anos)',
      reasonsForCare: [
        'Crise de Meia-Idade e Sentido de Vida',
        'Conflitos Conjugais & Casamento',
        'Burnout & Pressão Profissional',
      ],
      personalNote: 'Estou sentindo exaustão acumulada conciliando a rotina de trabalho com a criação dos filhos. Meu casamento está distante e sinto que cheguei aos 43 anos sem tempo para mim mesma. Gostaria de uma psicóloga experiente de meia-idade que compreenda este momento de vida.',
      preferredCareCategory: 'therapy',
      preferredGender: 'female',
      completedAt: '2025-03-01T10:00:00Z',
    },
    joinedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'pat_patricia',
    name: 'Patrícia Albuquerque',
    email: 'patricia.maternidade@gmail.com',
    passwordHash: 'senha123',
    role: 'patient',
    phone: '(11) 97651-4433',
    patientProfile: {
      ageGroup: '36-50',
      approximateAge: 38,
      maritalStatus: 'married',
      hasChildren: true,
      childrenDetails: '1 filha (5 anos)',
      reasonsForCare: [
        'Maternidade, Paternidade & Filhos',
        'Ansiedade, Estresse Crônico & Pânico',
      ],
      personalNote: 'Sobrecarga com a maternidade e crises recorrentes de ansiedade após retornar ao trabalho presencial.',
      preferredCareCategory: 'therapy',
      preferredGender: 'female',
      completedAt: '2025-03-05T14:00:00Z',
    },
    joinedAt: '2025-03-05T14:00:00Z',
  },
  {
    id: 'pat_lucas',
    name: 'Lucas Gabriel Ribeiro',
    email: 'lucas.paciente@gmail.com',
    passwordHash: 'senha123',
    role: 'patient',
    phone: '(11) 98712-4590',
    patientProfile: {
      ageGroup: '18-25',
      approximateAge: 23,
      maritalStatus: 'single',
      hasChildren: false,
      reasonsForCare: [
        'Ansiedade, Estresse Crônico & Pânico',
        'Transições de Vida e Carreira',
        'Autoestima & Relações Interpessoais',
      ],
      personalNote: 'Cobrança excessiva no primeiro emprego após a faculdade e crises de ansiedade antes de apresentações.',
      preferredCareCategory: 'therapy',
      preferredGender: 'no_preference',
      completedAt: '2025-03-10T11:00:00Z',
    },
    joinedAt: '2025-03-10T11:00:00Z',
  },
  {
    id: 'pat_mariana',
    name: 'Mariana Duarte Souza',
    email: 'mariana.paciente@gmail.com',
    passwordHash: 'senha123',
    role: 'patient',
    phone: '(11) 99124-7788',
    patientProfile: {
      ageGroup: '26-35',
      approximateAge: 31,
      maritalStatus: 'stable_union',
      hasChildren: false,
      reasonsForCare: [
        'Transições de Vida e Carreira',
        'Ansiedade, Estresse Crônico & Pânico',
      ],
      personalNote: 'Planejando transição de carreira e casamento nos próximos meses, buscando clareza e controle de estresse.',
      preferredCareCategory: 'therapy',
      completedAt: '2025-03-12T15:20:00Z',
    },
    joinedAt: '2025-03-12T15:20:00Z',
  },
  {
    id: 'pat_roberto',
    name: 'Roberto Caldeira',
    email: 'roberto.familia@gmail.com',
    passwordHash: 'senha123',
    role: 'patient',
    phone: '(11) 97112-9988',
    patientProfile: {
      ageGroup: '36-50',
      approximateAge: 49,
      maritalStatus: 'married',
      hasChildren: true,
      childrenDetails: '3 filhos adolescentes',
      reasonsForCare: [
        'Orientação Bíblica & Fé Familiar',
        'Conflitos Conjugais & Casamento',
        'Crise de Meia-Idade e Sentido de Vida',
      ],
      personalNote: 'Buscando orientação bíblica e reconciliação matrimonial para conduzir minha família com sabedoria e fé.',
      preferredCareCategory: 'biblical',
      completedAt: '2025-03-14T09:30:00Z',
    },
    joinedAt: '2025-03-14T09:30:00Z',
  },
];

function getTodayFormatted(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// Availability slots (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb)
const INITIAL_SLOTS: AvailabilitySlot[] = [
  { id: 'slot_1', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', isActive: true, startDate: getTodayFormatted(0), endDate: getTodayFormatted(30) },
  { id: 'slot_2', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', isActive: true, startDate: getTodayFormatted(0), endDate: getTodayFormatted(30) },
  { id: 'slot_3', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '14:00', endTime: '15:00', isActive: true, startDate: getTodayFormatted(0), endDate: getTodayFormatted(30), isSocial: true, socialRate: 40 },
  { id: 'slot_4', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '16:00', endTime: '17:00', isActive: true, isSocial: true, socialRate: 40 },
  { id: 'slot_5', psychologistId: 'psy_clara', dayOfWeek: 3, startTime: '09:00', endTime: '10:00', isActive: true, startDate: getTodayFormatted(0), endDate: getTodayFormatted(60) },
  { id: 'slot_6', psychologistId: 'psy_clara', dayOfWeek: 3, startTime: '11:00', endTime: '12:00', isActive: true, startDate: getTodayFormatted(0), endDate: getTodayFormatted(60) },
  { id: 'slot_7', psychologistId: 'psy_clara', dayOfWeek: 3, startTime: '15:00', endTime: '16:00', isActive: true, isSocial: true, socialRate: 40 },
  { id: 'slot_8', psychologistId: 'psy_clara', dayOfWeek: 4, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_9', psychologistId: 'psy_clara', dayOfWeek: 4, startTime: '15:00', endTime: '16:00', isActive: true },
  { id: 'slot_10', psychologistId: 'psy_clara', dayOfWeek: 5, startTime: '10:00', endTime: '11:00', isActive: true },

  { id: 'slot_11', psychologistId: 'psy_marcos', dayOfWeek: 2, startTime: '08:00', endTime: '09:00', isActive: true },
  { id: 'slot_12', psychologistId: 'psy_marcos', dayOfWeek: 2, startTime: '10:00', endTime: '11:00', isActive: true, isSocial: true, socialRate: 50 },
  { id: 'slot_13', psychologistId: 'psy_marcos', dayOfWeek: 2, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_14', psychologistId: 'psy_marcos', dayOfWeek: 4, startTime: '09:00', endTime: '10:00', isActive: true },
  { id: 'slot_15', psychologistId: 'psy_marcos', dayOfWeek: 4, startTime: '11:00', endTime: '12:00', isActive: true },
  { id: 'slot_16', psychologistId: 'psy_marcos', dayOfWeek: 5, startTime: '13:00', endTime: '14:00', isActive: true, isSocial: true, socialRate: 50 },

  { id: 'slot_17', psychologistId: 'psy_renata', dayOfWeek: 1, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_18', psychologistId: 'psy_renata', dayOfWeek: 1, startTime: '16:00', endTime: '17:00', isActive: true },
  { id: 'slot_19', psychologistId: 'psy_renata', dayOfWeek: 2, startTime: '15:00', endTime: '16:00', isActive: true, isSocial: true, socialRate: 60 },
  { id: 'slot_20', psychologistId: 'psy_renata', dayOfWeek: 3, startTime: '10:00', endTime: '11:00', isActive: true },

  { id: 'slot_21', psychologistId: 'ther_camila', dayOfWeek: 1, startTime: '11:00', endTime: '12:00', isActive: true, isSocial: true, socialRate: 35 },
  { id: 'slot_22', psychologistId: 'ther_camila', dayOfWeek: 2, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_23', psychologistId: 'ther_camila', dayOfWeek: 4, startTime: '16:00', endTime: '17:00', isActive: true },
  { id: 'slot_24', psychologistId: 'ther_camila', dayOfWeek: 5, startTime: '09:00', endTime: '10:00', isActive: true, isSocial: true, socialRate: 35 },

  { id: 'slot_25', psychologistId: 'pas_david', dayOfWeek: 2, startTime: '10:00', endTime: '11:00', isActive: true },
  { id: 'slot_26', psychologistId: 'pas_david', dayOfWeek: 2, startTime: '15:00', endTime: '16:00', isActive: true },
  { id: 'slot_27', psychologistId: 'pas_david', dayOfWeek: 4, startTime: '19:00', endTime: '20:00', isActive: true, isSocial: true, socialRate: 0 },
  { id: 'slot_28', psychologistId: 'pas_david', dayOfWeek: 6, startTime: '09:00', endTime: '10:00', isActive: true, isSocial: true, socialRate: 0 },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_today_1',
    psychologistId: 'psy_clara',
    psychologistName: 'Dra. Clara Vasconcellos',
    psychologistAvatar: '/src/assets/images/avatar_psico_clara_1792608795986.jpg',
    psychologistCrp: 'CRP 06/138420',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    patientPhone: '(11) 98712-4590',
    date: getTodayFormatted(0),
    time: '14:00',
    endTime: '14:50',
    status: 'scheduled',
    meetingType: 'native',
    notesFromPatient: 'Gostaria de focar nas crises de ansiedade recentes no trabalho e insônia.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt_past_1',
    psychologistId: 'psy_clara',
    psychologistName: 'Dra. Clara Vasconcellos',
    psychologistAvatar: '/src/assets/images/avatar_psico_clara_1792608795986.jpg',
    psychologistCrp: 'CRP 06/138420',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    patientPhone: '(11) 98712-4590',
    date: getTodayFormatted(-7),
    time: '14:00',
    endTime: '14:50',
    status: 'completed',
    meetingType: 'native',
    notesFromPatient: 'Primeira sessão de acolhimento e anamnese.',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'apt_upcoming_2',
    psychologistId: 'psy_marcos',
    psychologistName: 'Dr. Marcos Alencar',
    psychologistAvatar: '/src/assets/images/avatar_psico_marcos_1792608796718.jpg',
    psychologistCrp: 'CRP 06/112504',
    patientId: 'pat_mariana',
    patientName: 'Mariana Duarte Souza',
    patientEmail: 'mariana.paciente@gmail.com',
    patientPhone: '(11) 99124-7788',
    date: getTodayFormatted(2),
    time: '10:00',
    endTime: '10:50',
    status: 'scheduled',
    meetingType: 'native',
    notesFromPatient: 'Dificuldade de tomada de decisão sobre mudança de carreira.',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: 'rec_lucas_1',
    appointmentId: 'apt_past_1',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    psychologistId: 'psy_clara',
    sessionDate: getTodayFormatted(-7),
    chiefComplaint: 'Relata episódios recorrentes de aperto no peito, taquicardia e pensamentos catastróficos vinculados a cobranças de metas na empresa.',
    clinicalEvolution: 'Paciente cooperativo e lúcido. Boa capacidade reflexiva. Identificados gatilhos automáticos de autocobrança excessiva. Iniciada introdução ao modelo cognitivo (pensamento - emoção - comportamento).',
    privateNotes: 'Apresenta esquema de perfeccionismo disfuncional. Observar histórico familiar de ansiedade generalizada na próxima sessão. Indicada técnica de respiração diafragmática 4-7-8.',
    recommendations: 'Preencher Registro de Pensamentos Disfuncionais (RPD) quando sentir palpitação ou ansiedade acima de nível 6/10.',
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    appointmentId: 'apt_today_1',
    senderId: 'psy_clara',
    senderName: 'Dra. Clara Vasconcellos',
    senderRole: 'psychologist',
    text: 'Olá Lucas! Já estou conectada na sala. Fique à vontade para entrar quando estiver pronto.',
    timestamp: '13:58',
  },
];

class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Erro ao salvar no storage local:', err);
    }
  }

  // --- Auth & Users ---
  getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  async saveUserToFirestore(user: User): Promise<void> {
    try {
      const path = `users/${user.id}`;
      await setDoc(doc(db, 'users', user.id), {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.joinedAt,
        ...(user.professionalType ? { professionalType: user.professionalType } : {}),
        ...(user.careCategory ? { careCategory: user.careCategory } : {}),
        ...(user.phone ? { phone: user.phone } : {}),
        ...(user.crp ? { crp: user.crp } : {}),
        ...(user.registrationNumber ? { registrationNumber: user.registrationNumber } : {}),
        ...(user.ministryOrChurch ? { ministryOrChurch: user.ministryOrChurch } : {}),
        ...(user.bio ? { bio: user.bio } : {}),
        ...(user.hourlyRate ? { hourlyRate: user.hourlyRate } : {}),
        ...(user.sessionDuration ? { sessionDuration: user.sessionDuration } : {}),
        ...(user.avatar ? { avatar: user.avatar } : {}),
        ...(user.city ? { city: user.city } : {}),
        ...(user.state ? { state: user.state } : {}),
        ...(user.defaultMeetingType ? { defaultMeetingType: user.defaultMeetingType } : {}),
        ...(user.externalMeetingUrl ? { externalMeetingUrl: user.externalMeetingUrl } : {}),
        ...(user.patientProfile ? { patientProfile: user.patientProfile } : {}),
        ...(user.professionalProfile ? { professionalProfile: user.professionalProfile } : {}),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  }

  saveUser(newUser: Omit<User, 'id' | 'joinedAt'>): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existing) {
      return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' };
    }

    const createdUser: User = {
      ...newUser,
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      joinedAt: new Date().toISOString(),
    };

    users.push(createdUser);
    this.setItem(STORAGE_KEYS.USERS, users);

    // If Firebase Auth is authenticated, also sync to Firestore
    if (auth.currentUser) {
      this.saveUserToFirestore(createdUser).catch(err => console.warn('Sync to Firestore deferred:', err));
    }

    return { success: true, user: createdUser };
  }

  updateUser(updated: User): void {
    const users = this.getUsers().map(u => (u.id === updated.id ? updated : u));
    this.setItem(STORAGE_KEYS.USERS, users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === updated.id) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, updated);
    }

    if (auth.currentUser && auth.currentUser.uid === updated.id) {
      const path = `users/${updated.id}`;
      updateDoc(doc(db, 'users', updated.id), {
        name: updated.name,
        ...(updated.professionalType !== undefined ? { professionalType: updated.professionalType } : {}),
        ...(updated.careCategory !== undefined ? { careCategory: updated.careCategory } : {}),
        ...(updated.phone !== undefined ? { phone: updated.phone } : {}),
        ...(updated.crp !== undefined ? { crp: updated.crp } : {}),
        ...(updated.registrationNumber !== undefined ? { registrationNumber: updated.registrationNumber } : {}),
        ...(updated.ministryOrChurch !== undefined ? { ministryOrChurch: updated.ministryOrChurch } : {}),
        ...(updated.bio !== undefined ? { bio: updated.bio } : {}),
        ...(updated.hourlyRate !== undefined ? { hourlyRate: updated.hourlyRate } : {}),
        ...(updated.sessionDuration !== undefined ? { sessionDuration: updated.sessionDuration } : {}),
        ...(updated.avatar !== undefined ? { avatar: updated.avatar } : {}),
        ...(updated.city !== undefined ? { city: updated.city } : {}),
        ...(updated.state !== undefined ? { state: updated.state } : {}),
        ...(updated.defaultMeetingType !== undefined ? { defaultMeetingType: updated.defaultMeetingType } : {}),
        ...(updated.externalMeetingUrl !== undefined ? { externalMeetingUrl: updated.externalMeetingUrl } : {}),
        ...(updated.patientProfile !== undefined ? { patientProfile: updated.patientProfile } : {}),
        ...(updated.professionalProfile !== undefined ? { professionalProfile: updated.professionalProfile } : {}),
      }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, path);
      });
    }
  }

  findUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  getProfessionals(careCategory?: 'therapy' | 'biblical', professionalType?: string): User[] {
    let list = this.getUsers().filter(u => u.role !== 'patient');
    if (careCategory) {
      list = list.filter(u => u.careCategory === careCategory);
    }
    if (professionalType && professionalType !== 'all') {
      list = list.filter(u => u.professionalType === professionalType || u.role === professionalType);
    }
    return list;
  }

  getPsychologists(): User[] {
    return this.getProfessionals();
  }

  getAllPatients(): User[] {
    return this.getUsers().filter(u => u.role === 'patient');
  }

  savePatientMatchingProfile(patientId: string, profile: PatientMatchingProfile): User | null {
    const user = this.getUsers().find(u => u.id === patientId);
    if (!user) return null;
    const updatedUser: User = {
      ...user,
      patientProfile: profile,
    };
    this.updateUser(updatedUser);
    return updatedUser;
  }

  saveProfessionalMatchingProfile(profId: string, profile: ProfessionalMatchingProfile): User | null {
    const user = this.getUsers().find(u => u.id === profId);
    if (!user) return null;
    const updatedUser: User = {
      ...user,
      professionalProfile: profile,
    };
    this.updateUser(updatedUser);
    return updatedUser;
  }

  // --- Disponibilidade e Horários ---
  getAvailabilitySlots(psychologistId?: string): AvailabilitySlot[] {
    const all = this.getItem<AvailabilitySlot[]>(STORAGE_KEYS.SLOTS, INITIAL_SLOTS);
    if (!psychologistId) return all;
    return all.filter(s => s.psychologistId === psychologistId);
  }

  addAvailabilitySlot(slot: Omit<AvailabilitySlot, 'id'>): AvailabilitySlot {
    const all = this.getAvailabilitySlots();
    const newSlot: AvailabilitySlot = {
      ...slot,
      id: 'slot_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    all.push(newSlot);
    this.setItem(STORAGE_KEYS.SLOTS, all);

    if (auth.currentUser && auth.currentUser.uid === slot.psychologistId) {
      const path = `slots/${newSlot.id}`;
      setDoc(doc(db, 'slots', newSlot.id), {
        id: newSlot.id,
        psychologistId: newSlot.psychologistId,
        dayOfWeek: newSlot.dayOfWeek,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        isActive: newSlot.isActive,
        ...(newSlot.startDate ? { startDate: newSlot.startDate } : {}),
        ...(newSlot.endDate ? { endDate: newSlot.endDate } : {}),
        ...(newSlot.isSocial !== undefined ? { isSocial: newSlot.isSocial } : {}),
        ...(newSlot.socialRate !== undefined ? { socialRate: newSlot.socialRate } : {}),
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, path);
      });
    }

    return newSlot;
  }

  addAvailabilitySlotsBatch(newSlotsData: Omit<AvailabilitySlot, 'id'>[]): AvailabilitySlot[] {
    if (newSlotsData.length === 0) return [];
    const all = this.getAvailabilitySlots();
    const createdList: AvailabilitySlot[] = [];

    newSlotsData.forEach((slot, index) => {
      const newSlot: AvailabilitySlot = {
        ...slot,
        id: 'slot_' + Date.now().toString(36) + '_' + index + '_' + Math.random().toString(36).substring(2, 5),
      };
      createdList.push(newSlot);
      all.push(newSlot);

      if (auth.currentUser && auth.currentUser.uid === slot.psychologistId) {
        const path = `slots/${newSlot.id}`;
        setDoc(doc(db, 'slots', newSlot.id), {
          id: newSlot.id,
          psychologistId: newSlot.psychologistId,
          dayOfWeek: newSlot.dayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          isActive: newSlot.isActive,
          ...(newSlot.startDate ? { startDate: newSlot.startDate } : {}),
          ...(newSlot.endDate ? { endDate: newSlot.endDate } : {}),
          ...(newSlot.isSocial !== undefined ? { isSocial: newSlot.isSocial } : {}),
          ...(newSlot.socialRate !== undefined ? { socialRate: newSlot.socialRate } : {}),
        }).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, path);
        });
      }
    });

    this.setItem(STORAGE_KEYS.SLOTS, all);
    return createdList;
  }

  removeAvailabilitySlot(slotId: string): void {
    const all = this.getAvailabilitySlots().filter(s => s.id !== slotId);
    this.setItem(STORAGE_KEYS.SLOTS, all);

    if (auth.currentUser) {
      const path = `slots/${slotId}`;
      deleteDoc(doc(db, 'slots', slotId)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, path);
      });
    }
  }

  removeAvailabilitySlotsBatch(slotIds: string[]): void {
    const set = new Set(slotIds);
    const all = this.getAvailabilitySlots().filter(s => !set.has(s.id));
    this.setItem(STORAGE_KEYS.SLOTS, all);

    if (auth.currentUser) {
      slotIds.forEach(slotId => {
        const path = `slots/${slotId}`;
        deleteDoc(doc(db, 'slots', slotId)).catch(err => {
          handleFirestoreError(err, OperationType.DELETE, path);
        });
      });
    }
  }

  toggleAvailabilitySlot(slotId: string): void {
    const all = this.getAvailabilitySlots().map(s => (s.id === slotId ? { ...s, isActive: !s.isActive } : s));
    this.setItem(STORAGE_KEYS.SLOTS, all);

    const target = all.find(s => s.id === slotId);
    if (auth.currentUser && target && auth.currentUser.uid === target.psychologistId) {
      const path = `slots/${slotId}`;
      updateDoc(doc(db, 'slots', slotId), { isActive: target.isActive }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, path);
      });
    }
  }

  // --- Agendamentos ---
  getAppointments(userId?: string, role?: 'psychologist' | 'patient'): Appointment[] {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    if (!userId) return all;
    if (role === 'psychologist') {
      return all.filter(a => a.psychologistId === userId);
    } else if (role === 'patient') {
      return all.filter(a => a.patientId === userId);
    }
    return all.filter(a => a.psychologistId === userId || a.patientId === userId);
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find(a => a.id === id);
  }

  createAppointment(apt: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Appointment {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const newApt: Appointment = {
      ...apt,
      id: 'apt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    all.unshift(newApt);
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);

    if (auth.currentUser) {
      const path = `appointments/${newApt.id}`;
      const firestoreData = Object.fromEntries(
        Object.entries(newApt).filter(([_, v]) => v !== undefined)
      );
      setDoc(doc(db, 'appointments', newApt.id), firestoreData).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, path);
      });
    }

    return newApt;
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): void {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS).map(a =>
      a.id === id ? { ...a, status } : a
    );
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);

    const target = all.find(a => a.id === id);
    if (auth.currentUser && target) {
      const path = `appointments/${id}`;
      updateDoc(doc(db, 'appointments', id), { status }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, path);
      });
    }
  }

  // --- Prontuário Eletrônico do Paciente (PEP) ---
  getMedicalRecords(psychologistId?: string, patientId?: string): MedicalRecord[] {
    let records = this.getItem<MedicalRecord[]>(STORAGE_KEYS.RECORDS, INITIAL_RECORDS);
    if (psychologistId) {
      records = records.filter(r => r.psychologistId === psychologistId);
    }
    if (patientId) {
      records = records.filter(r => r.patientId === patientId);
    }
    return records;
  }

  getRecordByAppointment(appointmentId: string): MedicalRecord | undefined {
    return this.getMedicalRecords().find(r => r.appointmentId === appointmentId);
  }

  saveMedicalRecord(recordData: Omit<MedicalRecord, 'id' | 'updatedAt'> & { id?: string }): MedicalRecord {
    const all = this.getMedicalRecords();
    const existingIndex = all.findIndex(r => r.id === recordData.id || r.appointmentId === recordData.appointmentId);

    if (existingIndex >= 0) {
      const updated: MedicalRecord = {
        ...all[existingIndex],
        ...recordData,
        updatedAt: new Date().toISOString(),
      };
      all[existingIndex] = updated;
      this.setItem(STORAGE_KEYS.RECORDS, all);

      if (auth.currentUser && auth.currentUser.uid === updated.psychologistId) {
        const path = `medicalRecords/${updated.id}`;
        setDoc(doc(db, 'medicalRecords', updated.id), updated).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, path);
        });
      }
      return updated;
    } else {
      const created: MedicalRecord = {
        ...recordData,
        id: recordData.id || ('rec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(created);
      this.setItem(STORAGE_KEYS.RECORDS, all);

      if (auth.currentUser && auth.currentUser.uid === created.psychologistId) {
        const path = `medicalRecords/${created.id}`;
        setDoc(doc(db, 'medicalRecords', created.id), created).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, path);
        });
      }
      return created;
    }
  }

  // --- Chat de Consulta em Tempo Real ---
  getChatMessages(appointmentId: string): ChatMessage[] {
    const all = this.getItem<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_MESSAGES);
    return all.filter(m => m.appointmentId === appointmentId);
  }

  sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const all = this.getItem<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_MESSAGES);
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      ...message,
      id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp,
    };
    all.push(newMsg);
    this.setItem(STORAGE_KEYS.CHAT, all);

    if (auth.currentUser) {
      const path = `messages/${newMsg.id}`;
      setDoc(doc(db, 'messages', newMsg.id), newMsg).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, path);
      });
    }

    return newMsg;
  }

  // Real-time Firestore Listeners
  subscribeChat(appointmentId: string, onUpdate: (messages: ChatMessage[]) => void): Unsubscribe {
    const path = 'messages';
    try {
      const q = query(collection(db, path), where('appointmentId', '==', appointmentId));
      return onSnapshot(
        q,
        snapshot => {
          if (!snapshot.empty) {
            const list: ChatMessage[] = [];
            snapshot.forEach(d => list.push(d.data() as ChatMessage));
            list.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            onUpdate(list);
          } else {
            onUpdate(this.getChatMessages(appointmentId));
          }
        },
        error => {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      );
    } catch {
      onUpdate(this.getChatMessages(appointmentId));
      return () => {};
    }
  }
}

export const storage = new StorageService();
