import { User, AvailabilitySlot, Appointment, MedicalRecord, ChatMessage } from '../types';

const STORAGE_KEYS = {
  USERS: 'serpsi_users_v1',
  CURRENT_USER: 'serpsi_current_user_v1',
  SLOTS: 'serpsi_slots_v1',
  APPOINTMENTS: 'serpsi_appointments_v1',
  RECORDS: 'serpsi_medical_records_v1',
  CHAT: 'serpsi_chat_messages_v1',
};

// Seed inicial com fotos geradas e dados realistas de saúde mental
const INITIAL_USERS: User[] = [
  {
    id: 'psy_clara',
    name: 'Dra. Clara Vasconcellos',
    email: 'clara.psico@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'psychologist',
    phone: '(11) 98452-3310',
    crp: 'CRP 06/138420',
    bio: 'Especialista em Terapia Cognitivo-Comportamental (TCC) e Mindfulness pela USP. Atuo há 9 anos no tratamento de transtornos de ansiedade, estresse ocupacional e síndrome do pânico com foco em autonomia e evidências.',
    hourlyRate: 180,
    sessionDuration: 50,
    approaches: ['Terapia Cognitivo-Comportamental', 'Transtornos de Ansiedade', 'Mindfulness', 'Burnout'],
    avatar: '/src/assets/images/avatar_psico_clara_1792608795986.jpg',
    city: 'São Paulo',
    state: 'SP',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-clara',
    joinedAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'psy_marcos',
    name: 'Dr. Marcos Alencar',
    email: 'marcos.psico@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'psychologist',
    phone: '(11) 97120-4491',
    crp: 'CRP 06/112504',
    bio: 'Psicólogo clínico com abordagem Fenomenológica-Existencial e Gestalt-terapia. Mestre em Psicologia pela PUC-SP. Experiência de 12 anos no acompanhamento de transições de vida, crises existenciais e relações interpessoais.',
    hourlyRate: 195,
    sessionDuration: 50,
    approaches: ['Gestalt-terapia', 'Fenomenologia Existencial', 'Relacionamentos', 'Autoconhecimento'],
    avatar: '/src/assets/images/avatar_psico_marcos_1792608796718.jpg',
    city: 'Campinas',
    state: 'SP',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-marcos',
    joinedAt: '2025-02-10T14:30:00Z',
  },
  {
    id: 'psy_renata',
    name: 'Dra. Renata Mendonça',
    email: 'renata.psico@psiconnect.med.br',
    passwordHash: 'senha123',
    role: 'psychologist',
    phone: '(21) 99318-6205',
    crp: 'CRP 05/098712',
    bio: 'Psicanalista membro do Instituto Brasileiro de Psicanálise e doutora pela UFRJ. Acompanha adultos e jovens em processos de luto, depressão, angústia e elaboração de conflitos inconscientes profundos.',
    hourlyRate: 220,
    sessionDuration: 50,
    approaches: ['Psicanálise Freudiana & Lacaniana', 'Elaboração de Luto', 'Depressão', 'Terapia de Casal'],
    avatar: '/src/assets/images/avatar_psico_renata_1792608797120.jpg',
    city: 'Rio de Janeiro',
    state: 'RJ',
    defaultMeetingType: 'native',
    externalMeetingUrl: 'https://meet.google.com/psiconnect-renata',
    joinedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'pat_lucas',
    name: 'Lucas Gabriel Ribeiro',
    email: 'lucas.paciente@gmail.com',
    passwordHash: 'senha123',
    role: 'patient',
    phone: '(11) 98712-4590',
    joinedAt: '2025-03-10T11:00:00Z',
  },
  {
    id: 'pat_mariana',
    name: 'Mariana Duarte Souza',
    email: 'mariana.paciente@gmail.com',
    passwordHash: 'senha123',
    role: 'patient',
    phone: '(11) 99124-7788',
    joinedAt: '2025-03-12T15:20:00Z',
  },
];

// Slots de disponibilidade semanais (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb)
const INITIAL_SLOTS: AvailabilitySlot[] = [
  // Dra. Clara (Segunda, Quarta, Quinta)
  { id: 'slot_1', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', isActive: true },
  { id: 'slot_2', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', isActive: true },
  { id: 'slot_3', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_4', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '16:00', endTime: '17:00', isActive: true },
  { id: 'slot_5', psychologistId: 'psy_clara', dayOfWeek: 3, startTime: '09:00', endTime: '10:00', isActive: true },
  { id: 'slot_6', psychologistId: 'psy_clara', dayOfWeek: 3, startTime: '11:00', endTime: '12:00', isActive: true },
  { id: 'slot_7', psychologistId: 'psy_clara', dayOfWeek: 3, startTime: '15:00', endTime: '16:00', isActive: true },
  { id: 'slot_8', psychologistId: 'psy_clara', dayOfWeek: 4, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_9', psychologistId: 'psy_clara', dayOfWeek: 4, startTime: '15:00', endTime: '16:00', isActive: true },
  { id: 'slot_10', psychologistId: 'psy_clara', dayOfWeek: 5, startTime: '10:00', endTime: '11:00', isActive: true },

  // Dr. Marcos (Terça, Quinta, Sexta)
  { id: 'slot_11', psychologistId: 'psy_marcos', dayOfWeek: 2, startTime: '08:00', endTime: '09:00', isActive: true },
  { id: 'slot_12', psychologistId: 'psy_marcos', dayOfWeek: 2, startTime: '10:00', endTime: '11:00', isActive: true },
  { id: 'slot_13', psychologistId: 'psy_marcos', dayOfWeek: 2, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_14', psychologistId: 'psy_marcos', dayOfWeek: 4, startTime: '09:00', endTime: '10:00', isActive: true },
  { id: 'slot_15', psychologistId: 'psy_marcos', dayOfWeek: 4, startTime: '11:00', endTime: '12:00', isActive: true },
  { id: 'slot_16', psychologistId: 'psy_marcos', dayOfWeek: 5, startTime: '13:00', endTime: '14:00', isActive: true },

  // Dra. Renata (Segunda a Quarta)
  { id: 'slot_17', psychologistId: 'psy_renata', dayOfWeek: 1, startTime: '14:00', endTime: '15:00', isActive: true },
  { id: 'slot_18', psychologistId: 'psy_renata', dayOfWeek: 1, startTime: '16:00', endTime: '17:00', isActive: true },
  { id: 'slot_19', psychologistId: 'psy_renata', dayOfWeek: 2, startTime: '15:00', endTime: '16:00', isActive: true },
  { id: 'slot_20', psychologistId: 'psy_renata', dayOfWeek: 3, startTime: '10:00', endTime: '11:00', isActive: true },
];

function getTodayFormatted(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

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
    return { success: true, user: createdUser };
  }

  updateUser(updated: User): void {
    const users = this.getUsers().map(u => (u.id === updated.id ? updated : u));
    this.setItem(STORAGE_KEYS.USERS, users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === updated.id) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, updated);
    }
  }

  findUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!stored) {
        // Inicializa com Dra. Clara para facilidade de demonstração
        const defaultUser = INITIAL_USERS[0];
        this.setItem(STORAGE_KEYS.CURRENT_USER, defaultUser);
        return defaultUser;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_USERS[0];
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  getPsychologists(): User[] {
    return this.getUsers().filter(u => u.role === 'psychologist');
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
    return newSlot;
  }

  removeAvailabilitySlot(slotId: string): void {
    const all = this.getAvailabilitySlots().filter(s => s.id !== slotId);
    this.setItem(STORAGE_KEYS.SLOTS, all);
  }

  toggleAvailabilitySlot(slotId: string): void {
    const all = this.getAvailabilitySlots().map(s => (s.id === slotId ? { ...s, isActive: !s.isActive } : s));
    this.setItem(STORAGE_KEYS.SLOTS, all);
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
    return newApt;
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): void {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS).map(a =>
      a.id === id ? { ...a, status } : a
    );
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);
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
      return updated;
    } else {
      const created: MedicalRecord = {
        ...recordData,
        id: 'rec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(created);
      this.setItem(STORAGE_KEYS.RECORDS, all);
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
    return newMsg;
  }
}

export const storage = new StorageService();
