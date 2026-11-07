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
  SUGGESTED_FORMATIONS_BY_TYPE,
  SUGGESTED_SPECIALIZATIONS_BY_TYPE,
} from '../types';
import { AvailabilityManager } from './AvailabilityManager';
import { MedicalRecordModal } from './MedicalRecordModal';
import { PatientInviteModal } from './PatientInviteModal';
import { PsychologicalRecordModule } from './psychologicalRecord/PsychologicalRecordModule';
import { PatientJourneyD3Chart } from './psychologicalRecord/PatientJourneyD3Chart';
import { ClinicalFormsModule } from './clinicalForms/ClinicalFormsModule';
import { psychologicalRecordStorage } from '../services/psychologicalRecordStorage';
import { clinicalFormStorage } from '../services/clinicalFormStorage';
import { PsychologicalRecord } from '../types/psychologicalRecord';
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
  GraduationCap,
  X,
  Plus,
  Activity,
  LayoutGrid,
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
  const [currentTab, setCurrentTab] = useState<
    'agenda' | 'availability' | 'records' | 'matching' | 'profile' | 'journey' | 'forms'
  >((activeSubTab as any) || 'agenda');
  const [mobileNavLayout, setMobileNavLayout] = useState<'pills' | 'grid'>('pills');
  const [selectedProntuarioPatientId, setSelectedProntuarioPatientId] = useState<string | undefined>(undefined);
  const [selectedJourneyPatientId, setSelectedJourneyPatientId] = useState<string | undefined>(undefined);

  // Unread forms count for real-time notification badge
  const [unreadFormsCount, setUnreadFormsCount] = useState<number>(() =>
    clinicalFormStorage.getUnreadSubmissionsCount(user?.id || 'psy_clara')
  );

  React.useEffect(() => {
    const unsub = clinicalFormStorage.subscribe(() => {
      setUnreadFormsCount(clinicalFormStorage.getUnreadSubmissionsCount(user?.id || 'psy_clara'));
    });
    return () => unsub();
  }, [user?.id]);

  // Psychological Records for Patient Journey D3 Chart
  const [psychologicalRecords, setPsychologicalRecords] = useState<PsychologicalRecord[]>(() =>
    psychologicalRecordStorage.getRecordsByProfessional(user?.id || 'psy_clara')
  );

  React.useEffect(() => {
    const profId = user?.id || 'psy_clara';
    const recs = psychologicalRecordStorage.getRecordsByProfessional(profId);
    setPsychologicalRecords(recs);

    const unsubscribe = psychologicalRecordStorage.subscribe(allRecs => {
      const filtered = allRecs.filter(r => r.professionalId === profId);
      setPsychologicalRecords(filtered);
    });
    return () => unsubscribe();
  }, [user?.id]);

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

  // Formações acadêmicas (+ de 1)
  const [profFormations, setProfFormations] = useState<string[]>(
    user?.formations || user?.professionalProfile?.formations || [SUGGESTED_FORMATIONS_BY_TYPE[pType]?.[0] || 'Graduação']
  );
  const [customFormationInput, setCustomFormationInput] = useState('');

  // Especializações clínicas (+ de 1)
  const [profSpecializations, setProfSpecializations] = useState<string[]>(
    user?.specializations || user?.professionalProfile?.specializations || [SUGGESTED_SPECIALIZATIONS_BY_TYPE[pType]?.[0] || 'Atendimento Clínico']
  );
  const [customSpecializationInput, setCustomSpecializationInput] = useState('');

  const toggleFormation = (f: string) => {
    setProfFormations(prev =>
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

  const handleAddCustomFormation = () => {
    const trimmed = customFormationInput.trim();
    if (trimmed && !profFormations.includes(trimmed)) {
      setProfFormations(prev => [...prev, trimmed]);
      setCustomFormationInput('');
    }
  };

  const handleRemoveFormation = (f: string) => {
    setProfFormations(prev => prev.filter(item => item !== f));
  };

  const toggleSpecialization = (s: string) => {
    setProfSpecializations(prev =>
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };

  const handleAddCustomSpecialization = () => {
    const trimmed = customSpecializationInput.trim();
    if (trimmed && !profSpecializations.includes(trimmed)) {
      setProfSpecializations(prev => [...prev, trimmed]);
      setCustomSpecializationInput('');
    }
  };

  const handleRemoveSpecialization = (s: string) => {
    setProfSpecializations(prev => prev.filter(item => item !== s));
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
      formations: profFormations,
      specializations: profSpecializations,
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
      formations: profFormations,
      specializations: profSpecializations,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 md:p-8 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 transition-colors duration-200 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center gap-4 min-w-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center text-xl shrink-0">
              {user?.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {user?.name}
              </h1>
              <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                {getBadgeIcon()}
                <span>{currentProfConfig.label}</span>
              </span>
              {user?.ministryOrChurch && (
                <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  {user.ministryOrChurch}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {getPortalTitle()} · Atendimento seguro por teleconferência, gestão de grade e registros confidenciais.
            </p>
          </div>
        </div>

        {/* Mobile-First Quick Nav Hub */}
        <div className="w-full xl:w-auto min-w-0 max-w-full self-stretch xl:self-auto space-y-2.5">
          {/* Mobile view selector and toggle (hidden on desktop md:) */}
          <div className="flex md:hidden items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Opções Rápidas
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            </div>

            {/* Mobile layout switcher: Barra (swipe) vs Grade (grid) */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
              <button
                type="button"
                onClick={() => setMobileNavLayout('pills')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  mobileNavLayout === 'pills'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Barra
              </button>
              <button
                type="button"
                onClick={() => setMobileNavLayout('grid')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  mobileNavLayout === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Grade</span>
              </button>
            </div>
          </div>

          {/* Option A: Mobile-First 2-Column Touch Grid (Active when user taps Grade on mobile) */}
          {mobileNavLayout === 'grid' && (
            <div className="w-full min-w-0 max-w-full grid md:hidden grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-150">
              {[
                {
                  id: 'agenda' as const,
                  label: 'Agenda',
                  badge: todayApts.length > 0 ? `${todayApts.length} hoje` : undefined,
                  badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
                  icon: Calendar,
                  desc: todayApts.length > 0 ? `${todayApts.length} marcada(s) hoje` : 'Nenhuma consulta hoje',
                },
                {
                  id: 'matching' as const,
                  label: 'Pacientes Sugeridos',
                  badge: highMatchCount > 0 ? `${highMatchCount}` : undefined,
                  badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                  icon: Sparkles,
                  desc: `${highMatchCount} compatíveis`,
                },
                {
                  id: 'availability' as const,
                  label: 'Disponibilidade',
                  badge: `${activeSlots}`,
                  badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
                  icon: Clock,
                  desc: `${activeSlots} horários ativos`,
                },
                {
                  id: 'records' as const,
                  label: pType === 'pastor' ? 'Fichas Pastorais' : 'Prontuários (PEP)',
                  badge: undefined,
                  badgeColor: '',
                  icon: ShieldCheck,
                  desc: 'Evoluções e sigilo',
                },
                {
                  id: 'forms' as const,
                  label: 'Formulários Clínicos',
                  badge: unreadFormsCount > 0 ? `${unreadFormsCount}` : undefined,
                  badgeColor: 'bg-amber-400 text-slate-900 border-amber-500 font-black animate-pulse',
                  icon: FileText,
                  desc: unreadFormsCount > 0 ? `${unreadFormsCount} não lida(s)` : 'Questionários e escalas',
                },
                {
                  id: 'journey' as const,
                  label: 'Jornada (D3)',
                  badge: 'D3',
                  badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
                  icon: Activity,
                  desc: 'Linha temporal visual',
                },
                {
                  id: 'profile' as const,
                  label: 'Meu Perfil',
                  badge: undefined,
                  badgeColor: '',
                  icon: UserIcon,
                  desc: 'Dados e abordagens',
                },
              ].map(item => {
                const isSelected = currentTab === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'records') setSelectedProntuarioPatientId(undefined);
                      setCurrentTab(item.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between min-h-[82px] cursor-pointer ${
                      isSelected
                        ? 'bg-sky-700 text-white border-sky-800 shadow-md ring-2 ring-sky-500/40'
                        : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-sky-50 dark:bg-slate-700 text-sky-700 dark:text-sky-400'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                            isSelected
                              ? 'bg-white text-sky-900 border-white/50'
                              : `${item.badgeColor}`
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold leading-tight block truncate w-full">
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] block truncate w-full mt-0.5 ${
                        isSelected ? 'text-sky-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Option B: Touch-Optimized Responsive Carousel (Always on desktop md:, or on mobile in 'pills' mode) */}
          <div
            className={`${
              mobileNavLayout === 'grid' ? 'hidden md:flex' : 'flex'
            } w-full min-w-0 max-w-full items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold overflow-x-auto overscroll-x-contain scroll-smooth snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
          >
            {[
              {
                id: 'agenda' as const,
                label: `Agenda (${todayApts.length} hoje)`,
                badge: undefined,
                badgeColor: '',
                icon: Calendar,
              },
              {
                id: 'matching' as const,
                label: 'Pacientes Sugeridos',
                badge: highMatchCount > 0 ? `${highMatchCount}` : undefined,
                badgeColor: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
                icon: Sparkles,
              },
              {
                id: 'availability' as const,
                label: `Disponibilidade (${activeSlots})`,
                badge: undefined,
                badgeColor: '',
                icon: Clock,
              },
              {
                id: 'records' as const,
                label: pType === 'pastor' ? 'Fichas Pastorais' : 'Prontuários (PEP)',
                badge: undefined,
                badgeColor: '',
                icon: ShieldCheck,
              },
              {
                id: 'forms' as const,
                label: 'Formulários Clínicos',
                badge: unreadFormsCount > 0 ? `${unreadFormsCount}` : undefined,
                badgeColor: 'bg-amber-400 text-slate-900 border-amber-500 font-black animate-pulse',
                icon: FileText,
              },
              {
                id: 'journey' as const,
                label: 'Jornada (D3)',
                badge: 'D3',
                badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                icon: Activity,
              },
              {
                id: 'profile' as const,
                label: 'Editar Perfil & Tags',
                badge: undefined,
                badgeColor: '',
                icon: UserIcon,
              },
            ].map(tab => {
              const isSelected = currentTab === tab.id;
              const IconComp = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'records') setSelectedProntuarioPatientId(undefined);
                    setCurrentTab(tab.id);
                  }}
                  className={`snap-start px-3.5 py-2.5 sm:py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 min-h-[42px] sm:min-h-0 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-700 dark:bg-sky-600 text-white shadow-xs font-bold'
                      : 'bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-600/50'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-sky-700 dark:text-sky-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/40'
                          : `${tab.badgeColor}`
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Sessões Hoje</span>
            <Calendar className="w-4 h-4 text-sky-700 dark:text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{todayApts.length}</span>
          <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {todayApts.length > 0 ? 'Consultas marcadas para hoje' : 'Nenhuma consulta pendente hoje'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Pessoas Atendidas</span>
            <Users className="w-4 h-4 text-sky-700 dark:text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{uniquePatients}</span>
          <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pacientes / assessorados cadastrados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Horários na Grade</span>
            <Clock className="w-4 h-4 text-sky-700 dark:text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{activeSlots}</span>
          <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {activeSocialSlots > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {activeSocialSlots} {activeSocialSlots === 1 ? 'vaga social' : 'vagas sociais'} ativas
              </span>
            ) : (
              'Horários semanais abertos'
            )}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Honorário / Sessão</span>
            <DollarSign className="w-4 h-4 text-sky-700 dark:text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            R$ {user?.hourlyRate || currentProfConfig.defaultRate}
          </span>
          <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1">Duração média de 50 minutos</span>
        </div>
      </div>

      {/* Tab 1: Agenda de Consultas */}
      {currentTab === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
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
                        ? 'bg-sky-50/40 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Patient info & DateTime */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {apt.patientName}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{apt.patientEmail}</span>
                          {apt.patientPhone && (
                            <>
                              <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{apt.patientPhone}</span>
                            </>
                          )}
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              apt.status === 'scheduled'
                                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300'
                                : apt.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {apt.status === 'scheduled' ? 'Agendada' : apt.status === 'completed' ? 'Concluída' : 'Cancelada'}
                          </span>
                          {apt.isSocial && (
                            <span className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>
                                Atendimento Social{apt.socialRate !== undefined ? ` (R$ ${apt.socialRate})` : ''}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                          <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                            {apt.date}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <Clock className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                            {apt.time} às {apt.endTime}
                          </span>
                          {isToday && (
                            <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
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

                        <button
                          onClick={() => {
                            setSelectedJourneyPatientId(apt.patientId);
                            setCurrentTab('journey');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Visualizar a Jornada Clínica e Gráfico D3 do Paciente"
                        >
                          <Activity className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Jornada (D3)</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProntuarioPatientId(apt.patientId);
                            setCurrentTab('forms');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-800 hover:text-indigo-950 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="Enviar ou ver formulários e pesquisas clínicas deste paciente"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Formulários</span>
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

      {/* Tab 4: Jornada do Paciente com Gráfico Interativo D3 */}
      {currentTab === 'journey' && (
        <div className="space-y-6">
          {psychologicalRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 transition-colors duration-200">
              <Compass className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Nenhum prontuário encontrado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Para visualizar a Jornada Clínica e os marcos alcançados, abra um prontuário na aba Prontuários (PEP) e registre a primeira sessão.
              </p>
              <button
                onClick={() => setCurrentTab('records')}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-colors shadow-xs"
              >
                Ir para Prontuários (PEP)
              </button>
            </div>
          ) : (
            (() => {
              const activeRecord =
                psychologicalRecords.find(r => r.patientId === selectedJourneyPatientId) ||
                psychologicalRecords[0];

              return (
                <PatientJourneyD3Chart
                  record={activeRecord}
                  allRecords={psychologicalRecords}
                  onSelectPatient={patientId => setSelectedJourneyPatientId(patientId)}
                  onAddMilestone={milestone => {
                    const profMeta = {
                      id: user?.id || 'psy_clara',
                      name: user?.name || 'Dra. Clara Vasconcellos',
                      role: (user?.professionalType as string) || 'psychologist',
                    };
                    psychologicalRecordStorage.addMilestoneToRecord(
                      activeRecord.id,
                      milestone,
                      profMeta
                    );
                  }}
                  onOpenSessionModal={() => {
                    setSelectedProntuarioPatientId(activeRecord.patientId);
                    setCurrentTab('records');
                  }}
                />
              );
            })()
          )}
        </div>
      )}

      {/* Tab Forms: Módulo de Formulários de Pesquisa & Acompanhamento Clínico */}
      {currentTab === 'forms' && (
        <ClinicalFormsModule
          professionalId={user?.id || 'psy_clara'}
          professionalName={user?.name || 'Profissional'}
          initialPatientId={selectedProntuarioPatientId}
        />
      )}

      {/* Tab Matching: Pacientes Sugeridos por Inteligência de Afinidade */}
      {currentTab === 'matching' && (
        <div className="space-y-6">
          {/* Header & Methodology Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs transition-colors duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Pacientes Recomendados por Compatibilidade</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      Score Ponderado (100%)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Algoritmo refinado com pesos estritos: <strong>Faixa etária (30%)</strong>, <strong>Motivos do atendimento & experiência clínica (30%)</strong>, <strong>Estado civil (20%)</strong> e <strong>Filhos (20%)</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentTab('profile')}
                className="px-4 py-2 text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl transition-colors whitespace-nowrap self-start md:self-auto flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Configurar Minhas Tags ({selectedAffinityTags.length})</span>
              </button>
            </div>

            {/* Active Professional Matching Profile Context Bar */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Sua Vivência Pessoal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {AGE_GROUP_LABELS[profAgeGroup]} ({profApproximateAge} anos) · {MARITAL_STATUS_LABELS[profMaritalStatus]}
                </span>
                <span className="block text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  {profHasChildren ? 'Com filhos' : 'Sem filhos'} · {profYearsOfExp} anos de prática clínica
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px] mb-1">
                  Tags de Identificação com as quais você mais se identifica:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAffinityTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Filters */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filtrar por Compatibilidade:
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setMinScoreFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      minScoreFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todos ({recommendedPatients.length})
                  </button>
                  <button
                    onClick={() => setMinScoreFilter('80')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      minScoreFilter === '80'
                        ? 'bg-white dark:bg-slate-700 text-sky-900 dark:text-sky-300 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Alta Compatibilidade (80%+)
                  </button>
                  <button
                    onClick={() => setMinScoreFilter('90')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      minScoreFilter === '90'
                        ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
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
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-600 max-w-xs truncate"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 transition-colors duration-200">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Nenhum paciente encontrado com estes filtros
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Tente ajustar os filtros de pontuação mínima ou alterar as tags selecionadas no seu perfil profissional.
              </p>
              <button
                onClick={() => {
                  setMinScoreFilter('all');
                  setAgeGroupFilter('all');
                  setReasonFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
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
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-6 shadow-xs hover:shadow-md ${
                      isHighMatch ? 'border-sky-300 dark:border-sky-700 ring-1 ring-sky-200/60 dark:ring-sky-800/40' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      {/* Left: Patient Info & Match Score */}
                      <div className="space-y-4 flex-1">
                        <div className="flex items-start justify-between sm:justify-start sm:gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-base border border-slate-200/80 dark:border-slate-700 shrink-0">
                              {patient.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                  {patient.name}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums inline-flex items-center gap-1.5 border shadow-2xs ${
                                    match.score >= 90
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                      : match.score >= 80
                                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                  }`}
                                >
                                  {match.score >= 90 ? (
                                    <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                  )}
                                  {match.score}% Compatibilidade
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                <span>{profile?.approximateAge ? `${profile.approximateAge} anos` : 'Idade informada'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{profile ? AGE_GROUP_LABELS[profile.ageGroup] : 'Faixa etária não declarada'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{profile ? MARITAL_STATUS_LABELS[profile.maritalStatus] : ''}</span>
                                {profile?.hasChildren && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-sky-800 dark:text-sky-400 font-medium">
                                      {profile.childrenDetails || 'Tem filhos'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Score de Compatibilidade com Decomposição dos 4 Pesos (30% + 30% + 20% + 20%) */}
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-xs border border-sky-200 dark:border-sky-800">
                                <Target className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                                  Score de Compatibilidade Ponderado
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Faixa (30%), Motivos (30%), Estado Civil (20%), Filhos (20%)
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                                {match.scoreBreakdown?.totalScore ?? match.score}
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400"> / 100 pts</span>
                              </span>
                              <span className="block text-[10px] font-bold text-sky-700 dark:text-sky-400">
                                {match.score}% Compatível
                              </span>
                            </div>
                          </div>

                          {/* Barra de Progresso Segmentada por Pilar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex shadow-inner">
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
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Faixa Etária</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                  {match.scoreBreakdown?.ageGroupScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">/30</span>
                                </span>
                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">30%</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Motivos</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                  {match.scoreBreakdown?.reasonsScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">/30</span>
                                </span>
                                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded">30%</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Estado Civil</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                  {match.scoreBreakdown?.maritalScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">/20</span>
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">20%</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Filhos</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                  {match.scoreBreakdown?.childrenScore ?? 0}
                                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">/20</span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">20%</span>
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

                          {/* Especializações Clínicas que deram match */}
                          {match.matchedSpecializations && match.matchedSpecializations.length > 0 && (
                            <div className="pt-2 border-t border-sky-200/60 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-emerald-600" />
                                Especializações Afins:
                              </span>
                              {match.matchedSpecializations.map(spec => (
                                <span
                                  key={spec}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Formações Acadêmicas que qualificam para a demanda */}
                          {match.matchedFormations && match.matchedFormations.length > 0 && (
                            <div className="pt-1.5 border-t border-sky-200/60 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                Formações Acadêmicas Qualificadas:
                              </span>
                              {match.matchedFormations.map(form => (
                                <span
                                  key={form}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-950 border border-indigo-300 shadow-2xs"
                                >
                                  {form}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Tags de Experiência Clínica que deram match */}
                          {match.matchedClinicalTags && match.matchedClinicalTags.length > 0 && (
                            <div className="pt-1.5 border-t border-sky-200/60 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-sky-950 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-sky-600" />
                                Foco Clínico Sintonizado:
                              </span>
                              {match.matchedClinicalTags.map(ct => (
                                <span
                                  key={ct}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs max-w-4xl space-y-6 transition-colors duration-200">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Perfil Profissional, Vivência Pessoal e Tags de Identificação
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure seus dados profissionais e as tags de afinidade com as quais mais se identifica para potencializar o motor de matching inteligente com pacientes.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Perfil e tags de afinidade atualizados com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Seção Nova de Matching: Vivência Pessoal e Tags */}
            <div className="p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 space-y-4">
              <div className="border-b border-sky-200/60 dark:border-sky-800/80 pb-2">
                <h3 className="text-sm font-bold text-sky-950 dark:text-sky-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  Critérios de Afinidade & Vivência Pessoal (Motor de Matching)
                </h3>
                <p className="text-xs text-sky-800/80 dark:text-sky-300/80 mt-0.5">
                  Estes dados permitem conectar você a pessoas em fases de vida afins (ex: psicóloga de meia-idade e mãe de família sugerida para pacientes com demandas e idades compatíveis).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sua Faixa Etária
                  </label>
                  <select
                    value={profAgeGroup}
                    onChange={e => setProfAgeGroup(e.target.value as AgeGroup)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
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

            {/* Formações Acadêmicas (+ de 1) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-700" />
                  <label className="text-xs font-bold text-slate-800">
                    Formações Acadêmicas & Cursos Formativos (+ de 1)
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100/80 border border-indigo-200 px-2 py-0.5 rounded-full">
                  {profFormations.length} cadastrada(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Graduações, mestrados, doutorados e especializações acadêmicas. O matching utiliza essas formações para conectar com pacientes com demandas qualificadas.
              </p>

              {/* Formações ativas */}
              <div className="flex flex-wrap gap-1.5">
                {profFormations.map(f => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg"
                  >
                    <GraduationCap className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFormation(f)}
                      className="text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded p-0.5 transition-colors"
                      title="Remover formação"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Sugestões rápidas */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Sugestões rápidas para seu perfil (clique para alternar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(SUGGESTED_FORMATIONS_BY_TYPE[selectedType] || []).map(f => {
                    const isSelected = profFormations.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFormation(f)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                        }`}
                      >
                        <span>{f}</span>
                        {isSelected ? (
                          <Check className="w-3 h-3 text-indigo-200 shrink-0" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input customizado */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customFormationInput}
                  onChange={e => setCustomFormationInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomFormation();
                    }
                  }}
                  placeholder="Adicionar outra formação (ex: Mestrado em Psicologia Clínica - PUC-SP)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFormation}
                  disabled={!customFormationInput.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Especializações Clínicas (+ de 1) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <label className="text-xs font-bold text-slate-800">
                    Especializações Clínicas & Títulos (+ de 1)
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {profSpecializations.length} cadastrada(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Especialidades de atuação clínica direta. Pacientes com queixas relacionadas a essas áreas serão sugeridos com alta pontuação de compatibilidade.
              </p>

              {/* Especializações ativas */}
              <div className="flex flex-wrap gap-1.5">
                {profSpecializations.map(s => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg"
                  >
                    <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialization(s)}
                      className="text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100 rounded p-0.5 transition-colors"
                      title="Remover especialização"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Sugestões rápidas */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Sugestões clínicas para seu perfil (clique para alternar):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {(SUGGESTED_SPECIALIZATIONS_BY_TYPE[selectedType] || []).map(s => {
                    const isSelected = profSpecializations.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialization(s)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                        }`}
                      >
                        <span>{s}</span>
                        {isSelected ? (
                          <Check className="w-3 h-3 text-emerald-200 shrink-0" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input customizado */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customSpecializationInput}
                  onChange={e => setCustomSpecializationInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSpecialization();
                    }
                  }}
                  placeholder="Adicionar outra especialização (ex: TCC em Transtornos de Ansiedade)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSpecialization}
                  disabled={!customSpecializationInput.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Adicionar
                </button>
              </div>
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
