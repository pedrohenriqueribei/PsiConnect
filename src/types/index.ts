export type UserRole = 'psychologist' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  crp?: string; // Registro profissional (ex: CRP 06/142980)
  bio?: string;
  hourlyRate?: number;
  sessionDuration?: number; // em minutos (ex: 50)
  approaches?: string[];
  avatar?: string;
  city?: string;
  state?: string;
  defaultMeetingType?: 'native' | 'external';
  externalMeetingUrl?: string;
  joinedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  psychologistId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  isActive: boolean;
}

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingType = 'native' | 'external';

export interface Appointment {
  id: string;
  psychologistId: string;
  psychologistName: string;
  psychologistAvatar?: string;
  psychologistCrp?: string;
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
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  psychologistId: string;
  sessionDate: string;
  chiefComplaint: string; // Queixa principal
  clinicalEvolution: string; // Evolução clínica
  privateNotes: string; // Anotações confidenciais do psicólogo
  recommendations?: string; // Orientações / tarefas intersessão
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
