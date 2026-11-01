import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import {
  Appointment,
  MedicalRecord,
  ProfessionalType,
  PROFESSIONAL_TYPES_CONFIG,
  AgeGroup,
  MaritalStatus,
  PatientMatchResult,
  ProfessionalMatchingProfile,
  User,
  CLINICAL_EXPERIENCE_TAGS,
} from '../types';
import { AvailabilityManager } from './AvailabilityManager';
import { MedicalRecordModal } from './MedicalRecordModal';
import { PatientInviteModal } from './PatientInviteModal';
import { PsychologicalRecordModule } from './psychologicalRecord/PsychologicalRecordModule';
import {
  getRecommendedPatientsForProfessional,
  PROFESSIONAL_AFFINITY_TAGS,
  AGE_GROUP_LABELS,
  MARITAL_STATUS_LABELS,
  REASONS_FOR_CARE_LIST,
} from '../services/matchingEngine';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  User as UserIcon,
  CheckCircle2,
  ExternalLink,
  Users,
  DollarSign,
  Building2,
  Brain,
  Leaf,
  Compass,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Tag,
  Filter,
  Award,
  ChevronRight,
  MessageSquare,
  Check,
  Flame,
  ShieldCheck,
  Target,
  BarChart3,
} from 'lucide-react';

interface PsychologistDashboardProps {
  onJoinRoom: (appointment: Appointment) => void;
  activeSubTab?: string;
}

export const PsychologistDashboard: React.FC<PsychologistDashboardProps> = ({
  onJoinRoom,
  activeSubTab = 'agenda',
}) => {
  const { user, updateProfile } = useAuth();
  const [currentTab, setCurrentTab] = useState<'agenda' | 'availability' | 'records' | 'matching' | 'profile'>(
    (activeSubTab as any) || 'agenda'
  );
  const [selectedProntuarioPatientId, setSelectedProntuarioPatientId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab as any);
    }
  }, [activeSubTab]);

  const pType: ProfessionalType = (user?.professionalType ||
    (user?.role === 'pastor'
      ? 'pastor'
      : user?.role === 'therapist'
      ? 'therapist'
      : user?.role === 'psychoanalyst'
      ? 'psychoanalyst'
      : 'psychologist')) as ProfessionalType;

  const currentProfConfig = PROFESSIONAL_TYPES_CONFIG[pType] || PROFESSIONAL_TYPES_CONFIG.psychologist;

  // Appointments with real-time Firestore sync
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    user ? storage.getAppointments(user.id, 'psychologist') : []
  );

  // Matching & Suggestions states
  const [allPatients, setAllPatients] = useState<User[]>(() => storage.getAllPatients());

  React.useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      if (user) {
        setAppointments(storage.getAppointments(user.id, 'psychologist'));
      }
      setAllPatients(storage.getAllPatients());
    });
    return () => unsubscribe();
  }, [user]);

  // Selected appointment for Medical/Pastoral Record Modal
  const [recordAppointment, setRecordAppointment] = useState<Appointment | null>(null);

  // Filter state for appointments
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  const [selectedInviteMatch, setSelectedInviteMatch] = useState<PatientMatchResult | null>(null);
  const [minScoreFilter, setMinScoreFilter] = useState<'all' | '80' | '90'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all');

  // Professional Matching Profile states
  const existingProfProfile = user?.professionalProfile;
  const [profAgeGroup, setProfAgeGroup] = useState<AgeGroup>(
    existingProfProfile?.ageGroup || '36-50'
  );
  const [profApproximateAge, setProfApproximateAge] = useState<string>(
    existingProfProfile?.approximateAge ? String(existingProfProfile.approximateAge) : '44'
  );
  const [profMaritalStatus, setProfMaritalStatus] = useState<MaritalStatus>(
    existingProfProfile?.maritalStatus || 'married'
  );
  const [profHasChildren, setProfHasChildren] = useState<boolean>(
    existingProfProfile?.hasChildren ?? true
  );
  const [profYearsOfExp, setProfYearsOfExp] = useState<string>(
    existingProfProfile?.yearsOfExperience ? String(existingProfProfile.yearsOfExperience) : '12'
  );
  const [selectedAffinityTags, setSelectedAffinityTags] = useState<string[]>(
    existingProfProfile?.affinityTags || [
      'Crise de Meia-Idade',
      'Casamento & Terapia de Casal',
      'Maternidade Real & Puerpério',
      'Família & Pais com Filhos',
      'Ansiedade & Regulação Emocional',
      'Burnout & Saúde Ocupacional',
    ]
  );
  const [welcomeIntro, setWelcomeIntro] = useState<string>(
    existingProfProfile?.welcomeIntro || ''
  );

  // Clinical tags state (ex: Ansiedade, Luto, Relacionamentos)
  const [profClinicalTags, setProfClinicalTags] = useState<string[]>(
    user?.clinicalTags || ['Ansiedade', 'Luto', 'Relacionamentos']
  );
  const [customClinicalTagInput, setCustomClinicalTagInput] = useState('');

  const toggleClinicalTag = (tag: string) => {
    setProfClinicalTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomClinicalTag = () => {
    const trimmed = customClinicalTagInput.trim();
    if (trimmed && !profClinicalTags.includes(trimmed)) {
      setProfClinicalTags(prev => [...prev, trimmed]);
      setCustomClinicalTagInput('');
    }
  };

  // Profile edit states
  const [bio, setBio] = useState(user?.bio || '');
  const [registrationNumber, setRegistrationNumber] = useState(user?.registrationNumber || user?.crp || '');
  const [ministryOrChurch, setMinistryOrChurch] = useState(user?.ministryOrChurch || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate || currentProfConfig.defaultRate);
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedType, setSelectedType] = useState<ProfessionalType>(pType);
  const [approachesText, setApproachesText] = useState(
    user?.approaches?.join(', ') || currentProfConfig.defaultApproaches.join(', ')
  );
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Refresh lists
  const refreshAppointments = () => {
    if (user) {
      setAppointments(storage.getAppointments(user.id, 'psychologist'));
    }
  };

  const handleUpdateStatus = (id: string, newStatus: Appointment['status']) => {
    storage.updateAppointmentStatus(id, newStatus);
    refreshAppointments();
  };

  const toggleAffinityTag = (tag: string) => {
    setSelectedAffinityTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const appArray = approachesText.split(',').map(s => s.trim()).filter(Boolean);
    const careCategory = selectedType === 'pastor' ? 'biblical' : 'therapy';

    // Garante que as tags clínicas também fiquem vinculadas ao perfil de afinidade
    const mergedAffinityTags = Array.from(
      new Set([...selectedAffinityTags, ...profClinicalTags])
    );

    const updatedProfProfile: ProfessionalMatchingProfile = {
      ageGroup: profAgeGroup,
      approximateAge: profApproximateAge ? parseInt(profApproximateAge, 10) : undefined,
      maritalStatus: profMaritalStatus,
      hasChildren: profHasChildren,
      yearsOfExperience: profYearsOfExp ? parseInt(profYearsOfExp, 10) : undefined,
      affinityTags: mergedAffinityTags,
      welcomeIntro: welcomeIntro.trim(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveProfessionalMatchingProfile(user.id, updatedProfProfile);

    updateProfile({
      bio,
      crp: registrationNumber,
      registrationNumber,
      ministryOrChurch: selectedType === 'pastor' ? ministryOrChurch : undefined,
      professionalType: selectedType,
      role: selectedType,
      careCategory,
      hourlyRate: Number(hourlyRate),
      phone,
      approaches: appArray,
      clinicalTags: profClinicalTags,
      professionalProfile: updatedProfProfile,
    });

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === todayStr && a.status === 'scheduled');
  const uniquePatients = new Set(appointments.map(a => a.patientId)).size;
  const userSlots = user ? storage.getAvailabilitySlots(user.id) : [];
  const activeSlots = userSlots.filter(s => s.isActive).length;
  const activeSocialSlots = userSlots.filter(s => s.isActive && s.isSocial).length;

  // Filtered appointments
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  // All medical / counseling records for professional
  const allRecords: MedicalRecord[] = user ? storage.getMedicalRecords(user.id) : [];

  // Recommended Patients based on intelligent matching
  const recommendedPatients: PatientMatchResult[] = user
    ? getRecommendedPatientsForProfessional(user, allPatients)
    : [];

  const highMatchCount = recommendedPatients.filter(r => r.score >= 80).length;

  const filteredMatches = recommendedPatients.filter(r => {
    if (minScoreFilter === '80' && r.score < 80) return false;
    if (minScoreFilter === '90' && r.score < 90) return false;
    if (ageGroupFilter !== 'all' && r.patient.patientProfile?.ageGroup !== ageGroupFilter) return false;
    if (reasonFilter !== 'all') {
      const hasReason = r.patient.patientProfile?.reasonsForCare.some(rc =>
        rc.toLowerCase().includes(reasonFilter.toLowerCase())
      );
      if (!hasReason) return false;
    }
    return true;
  });

  const getPortalTitle = () => {
    switch (pType) {
      case 'pastor':
        return 'Portal do Pastor & Conselheiro Bíblico';
      case 'therapist':
        return 'Portal do Terapeuta Integrativo & Emocional';
      case 'psychoanalyst':
        return 'Portal do Psicanalista Clínico';
      case 'psychologist':
      default:
        return 'Portal do Psicólogo Clínico';
    }
  };

  const getBadgeIcon = () => {
    switch (pType) {
      case 'pastor':
        return <BookOpen className="w-3.5 h-3.5 text-amber-700" />;
      case 'therapist':
        return <Leaf className="w-3.5 h-3.5 text-emerald-700" />;
      case 'psychoanalyst':
        return <Compass className="w-3.5 h-3.5 text-purple-700" />;
      case 'psychologist':
      default:
        return <Brain className="w-3.5 h-3.5 text-sky-700" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xl">
              {user?.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {user?.name}
              </h1>
              <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                {getBadgeIcon()}
                <span>{currentProfConfig.label}</span>
              </span>
              {user?.ministryOrChurch && (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-600" />
                  {user.ministryOrChurch}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {getPortalTitle()} · Atendimento seguro por teleconferência, gestão de grade e registros confidenciais.
            </p>
          </div>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setCurrentTab('agenda')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'agenda' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agenda ({todayApts.length} hoje)
          </button>
          <button
            onClick={() => setCurrentTab('matching')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'matching' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-700" />
            <span>Pacientes Sugeridos</span>
            {highMatchCount > 0 && (
              <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-bold">
                {highMatchCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab('availability')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'availability' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disponibilidade ({activeSlots})
          </button>
          <button
            onClick={() => {
              setSelectedProntuarioPatientId(undefined);
              setCurrentTab('records');
            }}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'records' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {pType === 'pastor' ? 'Fichas Pastorais' : 'Prontuários (PEP)'}
          </button>
          <button
            onClick={() => setCurrentTab('profile')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'profile' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Editar Perfil & Tags
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sessões Hoje</span>
            <Calendar className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{todayApts.length}</span>
          <span className="block text-[11px] text-slate-400 mt-1">
            {todayApts.length > 0 ? 'Consultas marcadas para hoje' : 'Nenhuma consulta pendente hoje'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pessoas Atendidas</span>
            <Users className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{uniquePatients}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Pacientes / assessorados cadastrados</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Horários na Grade</span>
            <Clock className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{activeSlots}</span>
          <span className="block text-[11px] text-slate-400 mt-1">
            {activeSocialSlots > 0 ? (
              <span className="text-emerald-700 font-semibold">
                {activeSocialSlots} {activeSocialSlots === 1 ? 'vaga social' : 'vagas sociais'} ativas
              </span>
            ) : (
              'Horários semanais abertos'
            )}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Honorário / Sessão</span>
            <DollarSign className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            R$ {user?.hourlyRate || currentProfConfig.defaultRate}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">Duração média de 50 minutos</span>
        </div>
      </div>

      {/* Tab 1: Agenda de Consultas */}
      {currentTab === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Agenda de Atendimentos
              </h2>
              <p className="text-xs text-slate-500">
                Gerencie suas teleconsultas, acerte horários e acesse as salas virtuais seguras.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Todas ({appointments.length})
              </button>
              <button
                onClick={() => setStatusFilter('scheduled')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  statusFilter === 'scheduled' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Agendadas
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Concluídas
              </button>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhuma consulta encontrada neste filtro</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Quando pessoas agendarem horários livres na sua grade semanal, as consultas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map(apt => {
                const isToday = apt.date === todayStr;
                return (
                  <div
                    key={apt.id}
                    className={`p-5 rounded-xl border transition-all ${
                      isToday && apt.status === 'scheduled'
                        ? 'bg-sky-50/40 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Patient info & DateTime */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {apt.patientName}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{apt.patientEmail}</span>
                          {apt.patientPhone && (
                            <>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-500">{apt.patientPhone}</span>
                            </>
                          )}
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              apt.status === 'scheduled'
                                ? 'bg-sky-100 text-sky-800'
                                : apt.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {apt.status === 'scheduled' ? 'Agendada' : apt.status === 'completed' ? 'Concluída' : 'Cancelada'}
                          </span>
                          {apt.isSocial && (
                            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                Atendimento Social{apt.socialRate !== undefined ? ` (R$ ${apt.socialRate})` : ''}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-sky-700" />
                            {apt.date}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-sky-700" />
                            {apt.time} às {apt.endTime}
                          </span>
                          {isToday && (
                            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                              (Hoje)
                            </span>
                          )}
                        </div>

                        {apt.notesFromPatient && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-2xl">
                            <strong className="text-slate-700">Demanda informada:</strong> {apt.notesFromPatient}
                          </p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => onJoinRoom(apt)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Entrar na Sala Virtual
                          </button>
                        )}

                        {apt.meetingUrl && (
                          <a
                            href={apt.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            Google Meet
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setSelectedProntuarioPatientId(apt.patientId);
                            setCurrentTab('records');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 hover:text-sky-950 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          title="Abrir Prontuário Psicológico Completo do Paciente"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-700" />
                          {pType === 'pastor' ? 'Ficha de Aconselhamento' : 'Prontuário (PEP)'}
                        </button>

                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'completed')}
                            className="px-2.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Marcar como Concluída"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Gestão de Disponibilidade */}
      {currentTab === 'availability' && <AvailabilityManager />}

      {/* Tab 3: Módulo de Prontuário Psicológico (PEP) Completo */}
      {currentTab === 'records' && (
        <PsychologicalRecordModule initialPatientId={selectedProntuarioPatientId} />
      )}

      {/* Tab Matching: Pacientes Sugeridos por Inteligência de Afinidade */}
      {currentTab === 'matching' && (
        <div className="space-y-6">
          {/* Header & Methodology Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Pacientes Recomendados por Compatibilidade</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                      Score Ponderado (100%)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Algoritmo refinado com pesos estritos: <strong>Faixa etária (30%)</strong>, <strong>Motivos do atendimento & experiência clínica (30%)</strong>, <strong>Estado civil (20%)</strong> e <strong>Filhos (20%)</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentTab('profile')}
                className="px-4 py-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-xl transition-colors whitespace-nowrap self-start md:self-auto flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Configurar Minhas Tags ({selectedAffinityTags.length})</span>
              </button>
            </div>

            {/* Active Professional Matching Profile Context Bar */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Sua Vivência Pessoal:</span>
                <span className="font-semibold text-slate-800">
                  {AGE_GROUP_LABELS[profAgeGroup]} ({profApproximateAge} anos) · {MARITAL_STATUS_LABELS[profMaritalStatus]}
                </span>
                <span className="block text-slate-500 text-[11px] mt-0.5">
                  {profHasChildren ? 'Com filhos' : 'Sem filhos'} · {profYearsOfExp} anos de prática clínica
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-slate-400 font-medium block text-[11px] mb-1">
                  Tags de Identificação com as quais você mais se identifica:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAffinityTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Filters */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filtrar por Compatibilidade:
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setMinScoreFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      minScoreFilter === 'all'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({recommendedPatients.length})
                  </button>
                  <button
                    onClick={() => setMinScoreFilter('80')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      minScoreFilter === '80'
                        ? 'bg-white text-sky-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Alta Compatibilidade (80%+)
                  </button>
                  <button
                    onClick={() => setMinScoreFilter('90')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      minScoreFilter === '90'
                        ? 'bg-white text-emerald-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Máxima Compatibilidade (90%+)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <select
                  value={ageGroupFilter}
                  onChange={e => setAgeGroupFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  <option value="all">Todas as faixas etárias</option>
                  <option value="18-25">18 a 25 anos (Jovens)</option>
                  <option value="26-35">26 a 35 anos</option>
                  <option value="36-50">36 a 50 anos (Meia-Idade)</option>
                  <option value="51+">Acima de 50 anos</option>
                </select>

                <select
                  value={reasonFilter}
                  onChange={e => setReasonFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-600 max-w-xs truncate"
                >
                  <option value="all">Todas as queixas de busca</option>
                  {REASONS_FOR_CARE_LIST.map(r => (
                    <option key={r.id} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Matches List */}
          {filteredMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Nenhum paciente encontrado com estes filtros
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente ajustar os filtros de pontuação mínima ou alterar as tags selecionadas no seu perfil profissional.
              </p>
              <button
                onClick={() => {
                  setMinScoreFilter('all');
                  setAgeGroupFilter('all');
                  setReasonFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-sky-800 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredMatches.map(match => {
                const patient = match.patient;
                const profile = patient.patientProfile;
                const isHighMatch = match.score >= 85;

                return (
                  <div
                    key={patient.id}
                    className={`bg-white rounded-2xl border transition-all p-6 shadow-xs hover:shadow-md ${
                      isHighMatch ? 'border-sky-300 ring-1 ring-sky-200/60' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      {/* Left: Patient Info & Match Score */}
                      <div className="space-y-4 flex-1">
                        <div className="flex items-start justify-between sm:justify-start sm:gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center font-bold text-base border border-slate-200/80 shrink-0">
                              {patient.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-slate-900">
                                  {patient.name}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums inline-flex items-center gap-1.5 border shadow-2xs ${
                                    match.score >= 90
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : match.score >= 80
                                      ? 'bg-sky-50 text-sky-800 border-sky-300'
                                      : 'bg-slate-50 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {match.score >= 90 ? (
                                    <Flame className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                  )}
                                  {match.score}% Compatibilidade
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                                <span>{profile?.approximateAge ? `${profile.approximateAge} anos` : 'Idade informada'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{profile ? AGE_GROUP_LABELS[profile.ageGroup] : 'Faixa etária não declarada'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{profile ? MARITAL_STATUS_LABELS[profile.maritalStatus] : ''}</span>
                                {profile?.hasChildren && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-sky-800 font-medium">
                                      {profile.childrenDetails || 'Tem filhos'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Score de Compatibilidade com Decomposição dos 4 Pesos (30% + 30% + 20% + 20%) */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs border border-sky-200">
                                <Target className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-900 block leading-tight">
                                  Score de Compatibilidade Ponderado
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Faixa (30%), Motivos (30%), Estado Civil (20%), Filhos (20%)
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                                {match.scoreBreakdown?.totalScore ?? match.score}
                                <span className="text-xs font-medium text-slate-500"> / 100 pts</span>
                              </span>
                              <span className="block text-[10px] font-bold text-sky-700">
                                {match.score}% Compatível
                              </span>
                            </div>
                          </div>

                          {/* Barra de Progresso Segmentada por Pilar */}
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                            <div
                              style={{ width: `${((match.scoreBreakdown?.ageGroupScore ?? 0) / 100) * 100}%` }}
                              className="bg-indigo-500 h-full transition-all"
                              title={`Faixa Etária: ${match.scoreBreakdown?.ageGroupScore ?? 0}/30 pts`}
                            />
                            <div
                              style={{ width: `${((match.scoreBreakdown?.reasonsScore ?? 0) / 100) * 100}%` }}
                              className="bg-sky-500 h-full transition-all"
                              title={`Motivos do Atendimento: ${match.scoreBreakdown?.reasonsScore ?? 0}/30 pts`}
                            />
                            <div
                              style={{ width: `${((match.scoreBreakdown?.maritalScore ?? 0) / 100) * 100}%` }}
                              className="bg-amber-500 h-full transition-all"
                              title={`Estado Civil: ${match.scoreBreakdown?.maritalScore ?? 0}/20 pts`}
                            />
                            <div
                              style={{ width: `${((match.scoreBreakdown?.childrenScore ?? 0) / 100) * 100}%` }}
                              className="bg-emerald-500 h-full transition-all"
                              title={`Filhos: ${match.scoreBreakdown?.childrenScore ?? 0}/20 pts`}
                            />
                          </div>

                          {/* 4 Cards de Pontuação Individual */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Faixa Etária</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 tabular-nums">
                                  {match.scoreBreakdown?.ageGroupScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400">/30</span>
                                </span>
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">30%</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Motivos</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 tabular-nums">
                                  {match.scoreBreakdown?.reasonsScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400">/30</span>
                                </span>
                                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">30%</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Estado Civil</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 tabular-nums">
                                  {match.scoreBreakdown?.maritalScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400">/20</span>
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">20%</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Filhos</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 tabular-nums">
                                  {match.scoreBreakdown?.childrenScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400">/20</span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">20%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Match Highlights Badge Area */}
                        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2">
                          <span className="text-[11px] font-bold text-sky-950 uppercase tracking-wider block">
                            Por que este perfil combina com você:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-sky-900">
                            {match.matchHighlights.map((hl, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                                <span>{hl}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Tags de Experiência Clínica que deram match */}
                          {match.matchedClinicalTags && match.matchedClinicalTags.length > 0 && (
                            <div className="pt-1.5 border-t border-sky-200/60 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                Experiência Clínica Sintonizada:
                              </span>
                              {match.matchedClinicalTags.map(ct => (
                                <span
                                  key={ct}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs"
                                >
                                  {ct}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Patient Personal Demand Narrative */}
                        {profile?.personalNote && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                              Relato Pessoal do Paciente:
                            </span>
                            <p className="text-xs text-slate-700 italic leading-relaxed">
                              "{profile.personalNote}"
                            </p>
                          </div>
                        )}

                        {/* Reasons for seeking care tags */}
                        {profile?.reasonsForCare && profile.reasonsForCare.length > 0 && (
                          <div>
                            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                              Queixas e Motivos Selecionados pelo Paciente:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {profile.reasonsForCare.map(reason => {
                                const isShared = match.sharedTags.includes(reason);
                                return (
                                  <span
                                    key={reason}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      isShared
                                        ? 'bg-sky-100 text-sky-900 font-semibold border border-sky-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {reason} {isShared && '✓'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="lg:w-60 flex flex-col justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:border-slate-100 lg:pl-6 shrink-0">
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>Modalidade Desejada:</span>
                              <span className="font-semibold text-slate-800">
                                {profile?.preferredCareCategory === 'biblical'
                                  ? 'Aconselhamento Bíblico'
                                  : profile?.preferredCareCategory === 'both'
                                  ? 'Aberto a ambos'
                                  : 'Terapia Psicológica'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>Cadastrado em:</span>
                              <span className="tabular-nums text-slate-700">
                                {patient.joinedAt.split('T')[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedInviteMatch(match)}
                          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Acolher & Convidar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Profile: Editar Perfil e Configurar Tags de Matching */}
      {currentTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs max-w-4xl space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Perfil Profissional, Vivência Pessoal e Tags de Identificação
            </h2>
            <p className="text-xs text-slate-500">
              Configure seus dados profissionais e as tags de afinidade com as quais mais se identifica para potencializar o motor de matching inteligente com pacientes.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Perfil e tags de afinidade atualizados com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Seção Nova de Matching: Vivência Pessoal e Tags */}
            <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-4">
              <div className="border-b border-sky-200/60 pb-2">
                <h3 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-700" />
                  Critérios de Afinidade & Vivência Pessoal (Motor de Matching)
                </h3>
                <p className="text-xs text-sky-800/80 mt-0.5">
                  Estes dados permitem conectar você a pessoas em fases de vida afins (ex: psicóloga de meia-idade e mãe de família sugerida para pacientes com demandas e idades compatíveis).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sua Faixa Etária
                  </label>
                  <select
                    value={profAgeGroup}
                    onChange={e => setProfAgeGroup(e.target.value as AgeGroup)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map(ag => (
                      <option key={ag} value={ag}>
                        {AGE_GROUP_LABELS[ag]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Idade Exata
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={100}
                    value={profApproximateAge}
                    onChange={e => setProfApproximateAge(e.target.value)}
                    placeholder="Ex: 44"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={profMaritalStatus}
                    onChange={e => setProfMaritalStatus(e.target.value as MaritalStatus)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {(Object.keys(MARITAL_STATUS_LABELS) as MaritalStatus[]).map(ms => (
                      <option key={ms} value={ms}>
                        {MARITAL_STATUS_LABELS[ms]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tem Filhos?
                  </label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setProfHasChildren(true)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        profHasChildren
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfHasChildren(false)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        !profHasChildren
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-seleção de Tags de Experiência Clínica */}
              <div className="p-4 bg-white rounded-xl border border-sky-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-700" />
                    <label className="text-xs font-bold text-slate-900">
                      Experiência Clínica Principal (ex: Ansiedade, Luto, Relacionamentos)
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-800 bg-sky-100/70 border border-sky-200 px-2 py-0.5 rounded-full">
                    {profClinicalTags.length} selecionada(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Selecione as queixas e temas clínicos com os quais você tem maior vivência prática. O motor de afinidade cruza diretamente essas tags com os formulários de acolhimento dos pacientes.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.from(new Set([...CLINICAL_EXPERIENCE_TAGS, ...profClinicalTags])).map(tag => {
                    const isSelected = profClinicalTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleClinicalTag(tag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-sky-700 text-white border-sky-700 shadow-2xs font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{tag}</span>
                        {isSelected && <Check className="w-3 h-3 text-sky-200 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={customClinicalTagInput}
                    onChange={e => setCustomClinicalTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomClinicalTag();
                      }
                    }}
                    placeholder="Adicionar outra tag clínica personalizada..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomClinicalTag}
                    disabled={!customClinicalTagInput.trim()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg disabled:opacity-40 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tags de Identificação que Você Mais se Identifica (Selecione para o Matching):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {PROFESSIONAL_AFFINITY_TAGS.map(tag => {
                    const isSelected = selectedAffinityTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleAffinityTag(tag)}
                        className={`text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'bg-sky-700 text-white border-sky-700 font-semibold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{tag}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-200 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensagem de Acolhimento Prévia para Pacientes Sugeridos
                </label>
                <input
                  type="text"
                  value={welcomeIntro}
                  onChange={e => setWelcomeIntro(e.target.value)}
                  placeholder="Ex: Acolho mulheres e casais na meia-idade enfrentando sobrecarga emocional e transições familiares."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>

            {/* Modalidade / Tipo de Atuação */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Modalidade de Atuação Profissional
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedType('psychologist')}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    selectedType === 'psychologist'
                      ? 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🧠 Psicólogo(a)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('therapist')}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    selectedType === 'therapist'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🌿 Terapeuta
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('psychoanalyst')}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    selectedType === 'psychoanalyst'
                      ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🔍 Psicanalista
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('pastor')}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    selectedType === 'pastor'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📖 Pastor(a)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedType === 'psychologist' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registro Profissional CRP (Conselho Regional de Psicologia) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={e => setRegistrationNumber(e.target.value)}
                    placeholder="Ex: CRP 06/138420"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Exigido para atuação ética em psicologia clínica (CFP).
                  </p>
                </div>
              )}

              {selectedType === 'pastor' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Igreja, Denominação ou Ministério
                  </label>
                  <input
                    type="text"
                    value={ministryOrChurch}
                    onChange={e => setMinistryOrChurch(e.target.value)}
                    placeholder="Ex: Comunidade da Graça / Igreja Batista"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone / WhatsApp Profissional
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Honorário por Sessão de 50 min (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {selectedType === 'pastor'
                  ? 'Áreas de Aconselhamento Bíblico (Separadas por vírgula)'
                  : 'Abordagens e Especialidades Gerais (Separadas por vírgula)'}
              </label>
              <input
                type="text"
                value={approachesText}
                onChange={e => setApproachesText(e.target.value)}
                placeholder="Ex: TCC, Ansiedade, Mindfulness ou Aconselhamento Bíblico, Família"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Biografia e Apresentação para Pacientes / Buscadores
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Escreva sobre sua formação acadêmica, experiência ministerial ou clínica e forma de acolhimento..."
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 leading-relaxed font-sans"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
              >
                Salvar Alterações e Tags do Perfil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Prontuário Médico / Pastoral */}
      {recordAppointment && (
        <MedicalRecordModal
          isOpen={!!recordAppointment}
          onClose={() => {
            setRecordAppointment(null);
            refreshAppointments();
          }}
          appointment={recordAppointment}
          onOpenFullRecord={patientId => {
            setRecordAppointment(null);
            setSelectedProntuarioPatientId(patientId);
            setCurrentTab('records');
          }}
        />
      )}

      {/* Modal de Convite & Acolhimento de Paciente */}
      {selectedInviteMatch && (
        <PatientInviteModal
          isOpen={!!selectedInviteMatch}
          onClose={() => setSelectedInviteMatch(null)}
          matchResult={selectedInviteMatch}
        />
      )}
    </div>
  );
};
