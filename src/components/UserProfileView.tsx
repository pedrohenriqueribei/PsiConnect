import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  ProfessionalType, 
  CareCategory, 
  AgeGroup, 
  MaritalStatus,
  PROFESSIONAL_TYPES_CONFIG,
  SUGGESTED_FORMATIONS_BY_TYPE,
  SUGGESTED_SPECIALIZATIONS_BY_TYPE,
  CLINICAL_EXPERIENCE_TAGS,
  isProfessionalRole
} from '../types';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Shield,
  CheckCircle2,
  Camera,
  Save,
  ArrowLeft,
  Briefcase,
  Heart,
  Sparkles,
  Plus,
  X,
  Check,
  Lock,
  BookOpen,
  Brain,
  Leaf,
  Compass,
  Video,
  DollarSign,
  Clock,
  Award,
  GraduationCap,
  ExternalLink,
  Calendar,
  AlertCircle,
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Trash2,
  Building2
} from 'lucide-react';
import { ClinicUnitModule } from './clinicUnit/ClinicUnitModule';
import { CameraCaptureModal } from './CameraCaptureModal';
import { processImageFile } from '../utils/imageUtils';
import { maskPhone } from '../utils/maskUtils';

import avatarClara from '../assets/images/avatar_psico_clara_1792608795986.jpg';
import avatarMarcos from '../assets/images/avatar_psico_marcos_1792608796718.jpg';
import avatarRenata from '../assets/images/avatar_psico_renata_1792608797120.jpg';
import avatarCamila from '../assets/images/avatar_terapeuta_camila_1793309224240.jpg';
import avatarDavid from '../assets/images/avatar_pastor_david_1793309212629.jpg';

const CURATED_AVATARS = [
  { id: 'clara', label: 'Dra. Clara', src: avatarClara },
  { id: 'marcos', label: 'Dr. Marcos', src: avatarMarcos },
  { id: 'renata', label: 'Dra. Renata', src: avatarRenata },
  { id: 'camila', label: 'Camila', src: avatarCamila },
  { id: 'david', label: 'Pr. David', src: avatarDavid },
];

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  '18-25': '18 a 25 anos (Jovem Adulto)',
  '26-35': '26 a 35 anos (Adulto)',
  '36-50': '36 a 50 anos (Meia-idade inicial)',
  '51+': '51 anos ou mais (Maturidade)',
};

const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: 'Solteiro(a)',
  married: 'Casado(a)',
  stable_union: 'União Estável',
  divorced: 'Divorciado(a)',
  widowed: 'Viúvo(a)',
};

const PROFESSIONAL_AFFINITY_TAGS = [
  'Família & Pais com Filhos',
  'Casamento & Terapia de Casal',
  'Crise de Meia-Idade',
  'Maternidade Real & Puerpério',
  'Transição de Carreira & Maturidade',
  'Luto & Conflitos Existenciais',
  'Aconselhamento Bíblico & Família',
  'Burnout & Saúde Ocupacional',
  'Jovens Adultos & Identidade',
  'Ansiedade & Regulação Emocional',
  'Depressão & Reestruturação Cognitiva',
  'Gestalt & Autoconhecimento',
];

const REASONS_FOR_CARE_OPTIONS = [
  'Ansiedade, Estresse Crônico & Pânico',
  'Conflitos Conjugais & Casamento',
  'Crise de Meia-Idade e Sentido de Vida',
  'Maternidade, Paternidade & Filhos',
  'Luto, Perdas e Separação',
  'Burnout & Pressão Profissional',
  'Orientação Bíblica & Fé Familiar',
  'Autoestima & Relações Interpessoais',
  'Depressão, Desânimo & Vazio',
  'Transições de Vida e Carreira',
];

interface UserProfileViewProps {
  onBack: () => void;
  initialTab?: 'personal' | 'clinical' | 'clinicUnit' | 'security';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onBack, initialTab }) => {
  const { user, role, updateProfile, firebaseUser } = useAuth();

  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          É necessário estar autenticado para acessar seus dados pessoais.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-xl"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const isProf = isProfessionalRole(role);

  // Tabs: 'personal' | 'clinical' | 'clinicUnit' | 'security'
  const [activeTab, setActiveTab] = useState<'personal' | 'clinical' | 'clinicUnit' | 'security'>(
    initialTab || 'personal'
  );

  // Personal Fields
  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone ? maskPhone(user.phone) : '');
  const [city, setCity] = useState(user.city || '');
  const [state, setState] = useState(user.state || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [avatarFeedbackMsg, setAvatarFeedbackMsg] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setAvatarFeedbackMsg(null);
    try {
      const dataUrl = await processImageFile(file, 400, 0.88);
      setAvatar(dataUrl);
      setAvatarFeedbackMsg('Foto da galeria carregada com sucesso!');
      setTimeout(() => setAvatarFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error('Erro ao processar imagem:', err);
      alert(err.message || 'Erro ao carregar a foto selecionada.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handlePhotoCaptured = (dataUrl: string) => {
    setAvatar(dataUrl);
    setAvatarFeedbackMsg('Foto tirada com a câmera e aplicada com sucesso!');
    setTimeout(() => setAvatarFeedbackMsg(null), 4000);
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    setCustomAvatarUrl('');
    setAvatarFeedbackMsg('Foto removida. O avatar com inicial será exibido.');
    setTimeout(() => setAvatarFeedbackMsg(null), 4000);
  };

  // Professional specific fields
  const [selectedType, setSelectedType] = useState<ProfessionalType>(
    user.professionalType || (user.role as ProfessionalType) || 'psychologist'
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    user.registrationNumber || user.crp || ''
  );
  const [ministryOrChurch, setMinistryOrChurch] = useState(user.ministryOrChurch || '');
  const [hourlyRate, setHourlyRate] = useState<number>(user.hourlyRate ?? 160);
  const [sessionDuration, setSessionDuration] = useState<number>(user.sessionDuration ?? 50);
  const [bio, setBio] = useState(user.bio || '');
  const [approachesText, setApproachesText] = useState(user.approaches?.join(', ') || '');
  const [defaultMeetingType, setDefaultMeetingType] = useState<'native' | 'external'>(
    user.defaultMeetingType || 'native'
  );
  const [externalMeetingUrl, setExternalMeetingUrl] = useState(user.externalMeetingUrl || '');

  // Formations & Specializations for professionals
  const [formations, setFormations] = useState<string[]>(user.formations || []);
  const [customFormationInput, setCustomFormationInput] = useState('');
  const [specializations, setSpecializations] = useState<string[]>(user.specializations || []);
  const [customSpecializationInput, setCustomSpecializationInput] = useState('');
  const [clinicalTags, setClinicalTags] = useState<string[]>(user.clinicalTags || []);
  const [customClinicalTagInput, setCustomClinicalTagInput] = useState('');

  // Professional Matching Profile
  const [profAgeGroup, setProfAgeGroup] = useState<AgeGroup>(
    user.professionalProfile?.ageGroup || '36-50'
  );
  const [profApproximateAge, setProfApproximateAge] = useState<string>(
    user.professionalProfile?.approximateAge ? String(user.professionalProfile.approximateAge) : ''
  );
  const [profMaritalStatus, setProfMaritalStatus] = useState<MaritalStatus>(
    user.professionalProfile?.maritalStatus || 'married'
  );
  const [profHasChildren, setProfHasChildren] = useState<boolean>(
    user.professionalProfile?.hasChildren ?? true
  );
  const [profAffinityTags, setProfAffinityTags] = useState<string[]>(
    user.professionalProfile?.affinityTags || []
  );
  const [welcomeIntro, setWelcomeIntro] = useState(
    user.professionalProfile?.welcomeIntro || ''
  );

  // Patient Matching Profile fields
  const [patientAgeGroup, setPatientAgeGroup] = useState<AgeGroup>(
    user.patientProfile?.ageGroup || '26-35'
  );
  const [patientApproximateAge, setPatientApproximateAge] = useState<string>(
    user.patientProfile?.approximateAge ? String(user.patientProfile.approximateAge) : ''
  );
  const [patientMaritalStatus, setPatientMaritalStatus] = useState<MaritalStatus>(
    user.patientProfile?.maritalStatus || 'single'
  );
  const [patientHasChildren, setPatientHasChildren] = useState<boolean>(
    user.patientProfile?.hasChildren ?? false
  );
  const [childrenDetails, setChildrenDetails] = useState<string>(
    user.patientProfile?.childrenDetails || ''
  );
  const [reasonsForCare, setReasonsForCare] = useState<string[]>(
    user.patientProfile?.reasonsForCare || []
  );
  const [personalNote, setPersonalNote] = useState<string>(
    user.patientProfile?.personalNote || ''
  );
  const [preferredCareCategory, setPreferredCareCategory] = useState<CareCategory | 'both'>(
    user.patientProfile?.preferredCareCategory || 'therapy'
  );
  const [preferredGender, setPreferredGender] = useState<'female' | 'male' | 'no_preference'>(
    user.patientProfile?.preferredGender || 'no_preference'
  );

  // UI status
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleToggleTag = (list: string[], setList: (val: string[]) => void, tag: string) => {
    if (list.includes(tag)) {
      setList(list.filter(t => t !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  const handleAddFormation = () => {
    if (customFormationInput.trim() && !formations.includes(customFormationInput.trim())) {
      setFormations([...formations, customFormationInput.trim()]);
      setCustomFormationInput('');
    }
  };

  const handleAddSpecialization = () => {
    if (customSpecializationInput.trim() && !specializations.includes(customSpecializationInput.trim())) {
      setSpecializations([...specializations, customSpecializationInput.trim()]);
      setCustomSpecializationInput('');
    }
  };

  const handleAddClinicalTag = () => {
    if (customClinicalTagInput.trim() && !clinicalTags.includes(customClinicalTagInput.trim())) {
      setClinicalTags([...clinicalTags, customClinicalTagInput.trim()]);
      setCustomClinicalTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    const updatedApproaches = approachesText
      ? approachesText.split(',').map(s => s.trim()).filter(Boolean)
      : user.approaches || [];

    const updatedData: Partial<User> = {
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      avatar: avatar.trim(),
    };

    if (isProf) {
      updatedData.professionalType = selectedType;
      updatedData.role = selectedType;
      updatedData.careCategory = selectedType === 'pastor' ? 'biblical' : 'therapy';
      updatedData.registrationNumber = registrationNumber.trim();
      if (selectedType === 'psychologist') {
        updatedData.crp = registrationNumber.trim();
      }
      if (selectedType === 'pastor') {
        updatedData.ministryOrChurch = ministryOrChurch.trim();
      }
      updatedData.hourlyRate = Number(hourlyRate);
      updatedData.sessionDuration = Number(sessionDuration);
      updatedData.bio = bio.trim();
      updatedData.approaches = updatedApproaches;
      updatedData.formations = formations;
      updatedData.specializations = specializations;
      updatedData.clinicalTags = clinicalTags;
      updatedData.defaultMeetingType = defaultMeetingType;
      updatedData.externalMeetingUrl = externalMeetingUrl.trim();

      updatedData.professionalProfile = {
        ageGroup: profAgeGroup,
        approximateAge: profApproximateAge ? Number(profApproximateAge) : undefined,
        maritalStatus: profMaritalStatus,
        hasChildren: profHasChildren,
        affinityTags: profAffinityTags,
        formations,
        specializations,
        welcomeIntro: welcomeIntro.trim(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedData.patientProfile = {
        ageGroup: patientAgeGroup,
        approximateAge: patientApproximateAge ? Number(patientApproximateAge) : undefined,
        maritalStatus: patientMaritalStatus,
        hasChildren: patientHasChildren,
        childrenDetails: patientHasChildren ? childrenDetails.trim() : undefined,
        reasonsForCare,
        personalNote: personalNote.trim(),
        preferredCareCategory,
        preferredGender,
        completedAt: user.patientProfile?.completedAt || new Date().toISOString(),
      };
    }

    updateProfile(updatedData);

    setTimeout(() => {
      setSaveLoading(false);
      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSaveSuccess(false), 4500);
    }, 400);
  };

  const getUserRoleLabel = () => {
    if (user.role === 'pastor' || user.professionalType === 'pastor') return 'Pastor / Conselheiro Bíblico';
    if (user.role === 'therapist' || user.professionalType === 'therapist') return 'Terapeuta';
    if (user.role === 'psychoanalyst' || user.professionalType === 'psychoanalyst') return 'Psicanalista';
    if (user.role === 'psychologist' || user.professionalType === 'psychologist') return 'Psicólogo(a) Clínico(a)';
    return 'Paciente';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header bar with breadcrumbs and back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-sky-700 dark:text-sky-400" />
              <span>Meu Perfil</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerencie seus dados pessoais, foto e preferências de acolhimento na plataforma.
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel</span>
        </button>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-bold">Informações salvas com sucesso!</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Seus dados pessoais e preferências foram atualizados e sincronizados em tempo real com segurança.
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input for gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Avatar Feedback Alert */}
      {avatarFeedbackMsg && (
        <div className="p-3.5 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-semibold">{avatarFeedbackMsg}</span>
          </div>
          <button
            onClick={() => setAvatarFeedbackMsg(null)}
            className="text-sky-500 hover:text-sky-700 dark:text-sky-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Hero Identity Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-colors">
        {/* Avatar with quick change overlay & action buttons */}
        <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-md">
              {avatar ? (
                <img
                  src={avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-700 text-white flex items-center justify-center text-3xl font-black">
                  {user.name.charAt(0)}
                </div>
              )}
              {isProcessingImage && (
                <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white text-[11px] font-semibold gap-1.5">
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Processando...</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white shadow-md transition-transform hover:scale-105"
              title="Tirar foto com a câmera"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Quick photo buttons right by the avatar */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors"
              title="Tirar uma selfie com a câmera do dispositivo"
            >
              <Camera className="w-3 h-3 text-sky-600" />
              <span>Tirar Foto</span>
            </button>

            <button
              type="button"
              onClick={handleOpenFilePicker}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Selecionar foto da galeria ou arquivos"
            >
              <FolderOpen className="w-3 h-3 text-slate-500" />
              <span>Galeria</span>
            </button>

            {avatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Remover foto personalizada"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden xs:inline">Remover</span>
              </button>
            )}
          </div>
        </div>

        {/* User Identity Details */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {name || user.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {email}
              </p>
            </div>
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {getUserRoleLabel()}
              </span>
              {firebaseUser && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  🔥 Autenticado
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl line-clamp-2">
            {isProf
              ? bio || 'Adicione uma biografia profissional para apresentar suas especialidades e abordagem aos pacientes.'
              : personalNote || 'Mantenha seus dados e interesses de atendimento atualizados para um melhor suporte e acolhimento.'}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {phone ? maskPhone(phone) : 'Telefone não informado'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {city && state ? `${city}, ${state}` : 'Localidade não informada'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Cadastrado em {new Date(user.joinedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>{showAvatarPicker ? 'Ocultar opções de foto' : 'Mais opções de foto (Galeria de avatares ou URL)'}</span>
              <span>{showAvatarPicker ? '↑' : '↓'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Picker Dropdown Card if toggled */}
      {showAvatarPicker && (
        <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-3xl p-5 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200">
                Opções de Foto de Perfil
              </h3>
            </div>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Cards: Camera & Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 hover:border-sky-500 hover:shadow-md transition-all text-left flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 group-hover:bg-sky-700 group-hover:text-white transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-sky-700 dark:group-hover:text-sky-400">
                  Tirar Foto com a Câmera
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug block">
                  Abra a câmera do dispositivo ou webcam para capturar uma foto instantânea.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenFilePicker}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 hover:border-sky-500 hover:shadow-md transition-all text-left flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  Escolher da Galeria
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug block">
                  Envie uma foto salva do seu celular, tablet ou computador (JPG, PNG).
                </span>
              </div>
            </button>
          </div>

          <div className="space-y-3 pt-1 border-t border-sky-100 dark:border-sky-900/60">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ou escolha um dos avatares ilustrativos disponíveis:
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {CURATED_AVATARS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAvatar(item.src);
                    setCustomAvatarUrl('');
                    setAvatarFeedbackMsg(`Avatar de ${item.label} selecionado!`);
                    setTimeout(() => setAvatarFeedbackMsg(null), 3000);
                  }}
                  className={`relative p-1 rounded-2xl border-2 transition-all ${
                    avatar === item.src
                      ? 'border-sky-600 ring-2 ring-sky-400/50 scale-105'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  {avatar === item.src && (
                    <span className="absolute -top-1 -right-1 bg-sky-700 text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <span className="block text-[10px] text-center mt-1 font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="url"
                value={customAvatarUrl}
                onChange={e => setCustomAvatarUrl(e.target.value)}
                placeholder="Ou cole aqui a URL direta de uma imagem (https://...)"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-600 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (customAvatarUrl.trim()) {
                    setAvatar(customAvatarUrl.trim());
                    setShowAvatarPicker(false);
                    setAvatarFeedbackMsg('Foto definida por URL externa!');
                    setTimeout(() => setAvatarFeedbackMsg(null), 3000);
                  }
                }}
                disabled={!customAvatarUrl.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-xl transition-colors shrink-0"
              >
                Aplicar URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Sections Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'personal'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Dados Pessoais & Contato</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'clinical'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isProf ? (
            <>
              <Briefcase className="w-3.5 h-3.5" />
              <span>Atuação Profissional & Matching</span>
            </>
          ) : (
            <>
              <Heart className="w-3.5 h-3.5" />
              <span>Preferências de Acolhimento & Demandas</span>
            </>
          )}
        </button>

        {/* TAB: UNIDADE CLÍNICA (Após Atuação Profissional & Matching) */}
        <button
          type="button"
          onClick={() => setActiveTab('clinicUnit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'clinicUnit'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Unidade Clínica</span>
          {(user.clinicUnitId || user.clinicUnit) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5" title="Unidade clínica vinculada" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Segurança, LGPD & Ética</span>
        </button>
      </div>

      {/* Tab Unidade Clínica or Main Profile Form */}
      {activeTab === 'clinicUnit' ? (
        <ClinicUnitModule user={user} onUpdateUser={updateProfile} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: DADOS PESSOAIS */}
        {activeTab === 'personal' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Identificação & Informações de Contato
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Estes dados são utilizados para identificação no sistema, agendamentos e emissão de recibos ou termos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  O e-mail é o identificador único da sua conta e está vinculado à sua autenticação segura.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => setPhone(maskPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:bg-white font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Utilizado para notificações de confirmação de agendamentos e lembretes de consultas.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={e => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full px-3 py-2 text-xs text-center uppercase bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Foto de Perfil & Avatar
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Adicione uma foto pessoal tirada agora com a câmera, escolha da sua galeria ou utilize os avatares prontos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shrink-0">
                    {avatar ? (
                      <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-sky-700 text-white flex items-center justify-center font-bold text-base">
                        {name ? name.charAt(0) : 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {avatar ? 'Foto personalizada ativa' : 'Nenhuma foto definida (usando inicial)'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Formatos aceitos: JPG, PNG, WEBP (ajustado automaticamente para 400x400)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tirar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl transition-colors shadow-2xs"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>Escolher da Galeria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-xl hover:bg-sky-100 transition-colors"
                  >
                    <span>Mais Opções</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>

              {/* URL field as secondary fallback */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  placeholder="Ou informe a URL direta de uma imagem externa (https://...)"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DADOS CLÍNICOS / ATUAÇÃO / MATCHING */}
        {activeTab === 'clinical' && (
          <div className="space-y-6">
            {isProf ? (
              /* PROFISSIONAL PROFILE SECTION */
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                    Configuração de Atuação Profissional & Teleconsulta
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Defina suas credenciais, honorários, modalidade de videochamada e apresentação clínica.
                  </p>
                </div>

                {/* Modalidade de atuação */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Área Principal de Atuação
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedType('psychologist')}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition-all text-left ${
                        selectedType === 'psychologist'
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4 text-sky-600" />
                        <span className="font-bold">Psicólogo(a)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block">
                        Terapia com registro CRP
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedType('therapist')}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition-all text-left ${
                        selectedType === 'therapist'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold">Terapeuta</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block">
                        Integrativa & Emocional
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedType('psychoanalyst')}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition-all text-left ${
                        selectedType === 'psychoanalyst'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Compass className="w-4 h-4 text-purple-600" />
                        <span className="font-bold">Psicanalista</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block">
                        Freudiana & Lacaniana
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedType('pastor')}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition-all text-left ${
                        selectedType === 'pastor'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        <span className="font-bold">Pastor / Conselheiro</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block">
                        Aconselhamento Bíblico
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {selectedType === 'psychologist' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Registro Profissional CRP (Conselho Regional) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={registrationNumber}
                        onChange={e => setRegistrationNumber(e.target.value)}
                        placeholder="Ex: CRP 06/138420"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {selectedType === 'pastor' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Igreja, Denominação ou Ministério Pastoral
                      </label>
                      <input
                        type="text"
                        value={ministryOrChurch}
                        onChange={e => setMinistryOrChurch(e.target.value)}
                        placeholder="Ex: Ministério Fé & Família / Comunidade Esperança"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {selectedType !== 'psychologist' && selectedType !== 'pastor' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Registro / Certificação Profissional
                      </label>
                      <input
                        type="text"
                        value={registrationNumber}
                        onChange={e => setRegistrationNumber(e.target.value)}
                        placeholder="Ex: CRT 52140 ou Sociedade de Psicanálise"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Honorário da Sessão (R$)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={hourlyRate}
                        onChange={e => setHourlyRate(Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Teleconsulta Preference */}
                <div className="p-4 bg-sky-50/60 dark:bg-sky-950/40 rounded-2xl border border-sky-200/80 dark:border-sky-800 space-y-3">
                  <h4 className="text-xs font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    Plataforma de Videochamada para Teleconsultas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDefaultMeetingType('native')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        defaultMeetingType === 'native'
                          ? 'border-sky-600 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/30 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>🔒 Sala Virtual Nativa PsiConnect</span>
                        {defaultMeetingType === 'native' && <Check className="w-4 h-4 text-sky-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Criptografia WebRTC em tempo real integrada ao prontuário eletrônico na mesma tela.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDefaultMeetingType('external')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        defaultMeetingType === 'external'
                          ? 'border-sky-600 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/30 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>🌐 Link Externo (Google Meet / Zoom)</span>
                        {defaultMeetingType === 'external' && <Check className="w-4 h-4 text-sky-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Utilize sua própria sala permanente do Google Meet ou serviço de sua preferência.
                      </p>
                    </button>
                  </div>

                  {defaultMeetingType === 'external' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        URL da Sala Externa (Google Meet / Zoom)
                      </label>
                      <input
                        type="url"
                        value={externalMeetingUrl}
                        onChange={e => setExternalMeetingUrl(e.target.value)}
                        placeholder="https://meet.google.com/sua-sala"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Biografia */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Biografia e Apresentação para Pacientes
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Descreva sua formação, linha teórica, acolhimento e experiência clínica..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>

                {/* Abordagens */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Abordagens Clínicas e Metodologias (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={approachesText}
                    onChange={e => setApproachesText(e.target.value)}
                    placeholder="Ex: TCC, Ansiedade, Mindfulness, Terapia de Casal"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                {/* Critérios de Vivência Pessoal para o Matching Inteligente */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                      Motor de Afinidade & Matching com Pacientes
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Estes dados aproximam pessoas em fases de vida afins (ex: mães buscando psicólogas que também sejam mães).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Sua Faixa Etária
                      </label>
                      <select
                        value={profAgeGroup}
                        onChange={e => setProfAgeGroup(e.target.value as AgeGroup)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                      >
                        {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map(ag => (
                          <option key={ag} value={ag}>
                            {AGE_GROUP_LABELS[ag]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Idade Exata
                      </label>
                      <input
                        type="number"
                        min={20}
                        max={100}
                        value={profApproximateAge}
                        onChange={e => setProfApproximateAge(e.target.value)}
                        placeholder="Ex: 44"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Estado Civil
                      </label>
                      <select
                        value={profMaritalStatus}
                        onChange={e => setProfMaritalStatus(e.target.value as MaritalStatus)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                      >
                        {(Object.keys(MARITAL_STATUS_LABELS) as MaritalStatus[]).map(ms => (
                          <option key={ms} value={ms}>
                            {MARITAL_STATUS_LABELS[ms]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tags de Vivência e Afinidade Pessoal
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PROFESSIONAL_AFFINITY_TAGS.map(tag => {
                        const isSel = profAffinityTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(profAffinityTags, setProfAffinityTags, tag)}
                            className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                              isSel
                                ? 'bg-sky-700 text-white border-sky-700 font-semibold shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {tag}
                            {isSel && <Check className="w-3 h-3 inline ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* PATIENT PROFILE SECTION */
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Preferências de Acolhimento & Demandas Pessoais
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Essas informações ajudam o sistema a recomendar especialistas com alta afinidade e experiência específica.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sua Faixa Etária
                    </label>
                    <select
                      value={patientAgeGroup}
                      onChange={e => setPatientAgeGroup(e.target.value as AgeGroup)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map(ag => (
                        <option key={ag} value={ag}>
                          {AGE_GROUP_LABELS[ag]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Idade Aproximada
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={110}
                      value={patientApproximateAge}
                      onChange={e => setPatientApproximateAge(e.target.value)}
                      placeholder="Ex: 34"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estado Civil
                    </label>
                    <select
                      value={patientMaritalStatus}
                      onChange={e => setPatientMaritalStatus(e.target.value as MaritalStatus)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      {(Object.keys(MARITAL_STATUS_LABELS) as MaritalStatus[]).map(ms => (
                        <option key={ms} value={ms}>
                          {MARITAL_STATUS_LABELS[ms]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filhos */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Você tem filhos?
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ajuda a conectar com profissionais experientes em dinâmicas familiares.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPatientHasChildren(true)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                          patientHasChildren
                            ? 'bg-sky-700 text-white border-sky-700'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setPatientHasChildren(false)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                          !patientHasChildren
                            ? 'bg-sky-700 text-white border-sky-700'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {patientHasChildren && (
                    <input
                      type="text"
                      value={childrenDetails}
                      onChange={e => setChildrenDetails(e.target.value)}
                      placeholder="Ex: 2 filhos (idades: 8 e 12 anos)"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                {/* Categoria de cuidado preferida */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Cuidado Desejado
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredCareCategory('therapy')}
                      className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                        preferredCareCategory === 'therapy'
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/30'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-sky-600" />
                        Terapia Emocional
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 block">
                        Psicólogos, terapeutas e psicanalistas
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredCareCategory('biblical')}
                      className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                        preferredCareCategory === 'biblical'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        Aconselhamento Bíblico
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 block">
                        Pastores e conselheiros das Escrituras
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredCareCategory('both')}
                      className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                        preferredCareCategory === 'both'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-indigo-600" />
                        Aberto a Ambos
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 block">
                        Terapia clínica ou acolhimento pastoral
                      </span>
                    </button>
                  </div>
                </div>

                {/* Motivos de busca */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Motivos Principais da Busca por Atendimento
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {REASONS_FOR_CARE_OPTIONS.map(reason => {
                      const isSel = reasonsForCare.includes(reason);
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => handleToggleTag(reasonsForCare, setReasonsForCare, reason)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isSel
                              ? 'bg-sky-700 text-white border-sky-700 font-semibold shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {reason}
                          {isSel && <Check className="w-3 h-3 inline ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nota pessoal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relato Pessoal / O que você gostaria de adiantar ao especialista?
                  </label>
                  <textarea
                    rows={3}
                    value={personalNote}
                    onChange={e => setPersonalNote(e.target.value)}
                    placeholder="Escreva brevemente sobre o que tem vivido, principais desconfortos ou expectativas para as sessões..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SEGURANÇA & PRIVACIDADE */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Segurança dos Dados, LGPD & Sigilo Ético
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Saiba como a plataforma PsiConnect protege suas informações sensíveis e registros clínicos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Criptografia de Dados em Repouso</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Prontuários eletrônicos, questionários clínicos e diários de humor são armazenados com segurança e chaves de acesso estritamente restritas ao profissional e ao paciente correspondente.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Resolução CFP nº 011/2018 & LGPD</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Conformidade rigorosa com as diretrizes do Conselho Federal de Psicologia e com a Lei Geral de Proteção de Dados (Art. 11 - Dados Sensíveis de Saúde).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 dark:text-sky-200">
                  Status da Conta & Autenticação
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Ativa & Segura
                </span>
              </div>
              <p className="text-xs text-sky-900/80 dark:text-sky-300/80">
                Identificador único de usuário: <code className="font-mono text-[11px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">{user.id}</code>
              </p>
              {firebaseUser && (
                <p className="text-[11px] text-sky-800 dark:text-sky-300">
                  Provedor de autenticação: <strong>Google Firebase Auth ({firebaseUser.providerData[0]?.providerId || 'password'})</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Floating / Sticky Save Action Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-md flex items-center justify-between gap-4 sticky bottom-4 z-30">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">
              Suas alterações são salvas diretamente e ficam ativas imediatamente no PsiConnect.
            </span>
            <span className="sm:hidden">
              Salvar alterações no seu perfil.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saveLoading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{saveLoading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
        </form>
      )}

      {/* Interactive In-App Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handlePhotoCaptured}
      />
    </div>
  );
};
