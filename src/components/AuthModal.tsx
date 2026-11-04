import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserRole,
  ProfessionalType,
  PROFESSIONAL_TYPES_CONFIG,
  CLINICAL_EXPERIENCE_TAGS,
  SUGGESTED_FORMATIONS_BY_TYPE,
  SUGGESTED_SPECIALIZATIONS_BY_TYPE,
} from '../types';
import { BrandLogo } from './BrandLogo';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  FileCheck,
  DollarSign,
  Sparkles,
  AlertCircle,
  BookOpen,
  Brain,
  Leaf,
  Compass,
  Building2,
  Info,
  Tag,
  Plus,
  Check,
  GraduationCap,
  Award,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  initialMode?: 'login' | 'register';
  onAuthSuccess?: () => void;
  onPatientRegistered?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'patient',
  initialMode = 'login',
  onAuthSuccess,
  onPatientRegistered,
}) => {
  const { login, register, signInWithGoogle, switchDemoUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [accountCategory, setAccountCategory] = useState<'patient' | 'professional'>(
    initialRole === 'patient' ? 'patient' : 'professional'
  );
  const [selectedProfessionalType, setSelectedProfessionalType] = useState<ProfessionalType>(
    initialRole === 'pastor'
      ? 'pastor'
      : initialRole === 'therapist'
      ? 'therapist'
      : initialRole === 'psychoanalyst'
      ? 'psychoanalyst'
      : 'psychologist'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [ministryOrChurch, setMinistryOrChurch] = useState('');
  const [approach, setApproach] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(180);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Formações acadêmicas e cursos formativos (+ de 1)
  const [formations, setFormations] = useState<string[]>([
    SUGGESTED_FORMATIONS_BY_TYPE[selectedProfessionalType]?.[0] || 'Graduação em Psicologia',
  ]);
  const [customFormationInput, setCustomFormationInput] = useState('');

  // Especializações clínicas (+ de 1)
  const [specializations, setSpecializations] = useState<string[]>([
    SUGGESTED_SPECIALIZATIONS_BY_TYPE[selectedProfessionalType]?.[0] || 'Terapia Cognitivo-Comportamental (TCC)',
  ]);
  const [customSpecializationInput, setCustomSpecializationInput] = useState('');

  // Clinical tags multi-selection state (ex: Ansiedade, Luto, Relacionamentos)
  const [selectedClinicalTags, setSelectedClinicalTags] = useState<string[]>([
    'Ansiedade',
    'Luto',
    'Relacionamentos',
  ]);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleToggleFormation = (item: string) => {
    setFormations(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    );
  };

  const handleAddCustomFormation = () => {
    const trimmed = customFormationInput.trim();
    if (trimmed && !formations.includes(trimmed)) {
      setFormations(prev => [...prev, trimmed]);
      setCustomFormationInput('');
    }
  };

  const handleRemoveFormation = (item: string) => {
    setFormations(prev => prev.filter(f => f !== item));
  };

  const handleToggleSpecialization = (item: string) => {
    setSpecializations(prev =>
      prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
    );
  };

  const handleAddCustomSpecialization = () => {
    const trimmed = customSpecializationInput.trim();
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations(prev => [...prev, trimmed]);
      setCustomSpecializationInput('');
    }
  };

  const handleRemoveSpecialization = (item: string) => {
    setSpecializations(prev => prev.filter(s => s !== item));
  };

  const toggleClinicalTag = (tag: string) => {
    setSelectedClinicalTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedClinicalTags.includes(trimmed)) {
      setSelectedClinicalTags(prev => [...prev, trimmed]);
      setCustomTagInput('');
    }
  };

  // Update default approach and rate when professional type changes
  React.useEffect(() => {
    const config = PROFESSIONAL_TYPES_CONFIG[selectedProfessionalType];
    setApproach(config.defaultApproaches[0]);
    setHourlyRate(config.defaultRate);
    const defaultForm = SUGGESTED_FORMATIONS_BY_TYPE[selectedProfessionalType]?.[0];
    const defaultSpec = SUGGESTED_SPECIALIZATIONS_BY_TYPE[selectedProfessionalType]?.[0];
    setFormations(prev => (prev.length === 0 && defaultForm ? [defaultForm] : prev));
    setSpecializations(prev => (prev.length === 0 && defaultSpec ? [defaultSpec] : prev));
  }, [selectedProfessionalType]);

  // Sync mode and role whenever modal opens or props change
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setAccountCategory(initialRole === 'patient' ? 'patient' : 'professional');
      if (initialRole !== 'patient') {
        setSelectedProfessionalType(
          initialRole === 'pastor'
            ? 'pastor'
            : initialRole === 'therapist'
            ? 'therapist'
            : initialRole === 'psychoanalyst'
            ? 'psychoanalyst'
            : 'psychologist'
        );
      }
      setErrorMessage('');
    }
  }, [isOpen, initialMode, initialRole]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, mode, accountCategory, selectedProfessionalType]);

  if (!isOpen) return null;

  const currentProfConfig = PROFESSIONAL_TYPES_CONFIG[selectedProfessionalType];

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setLoading(true);
    const resolvedRole: UserRole =
      accountCategory === 'patient' ? 'patient' : selectedProfessionalType;
    const res = await signInWithGoogle(resolvedRole);
    setLoading(false);
    if (res.success) {
      onAuthSuccess?.();
      onClose();
    } else {
      setErrorMessage(res.error || 'Erro ao conectar via Google.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (mode === 'login') {
      const res = login(email, password);
      setLoading(false);
      if (res.success) {
        onAuthSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.error || 'Erro ao efetuar login.');
      }
    } else {
      if (!name.trim()) {
        setErrorMessage('Por favor, informe seu nome completo.');
        setLoading(false);
        return;
      }

      if (accountCategory === 'professional') {
        if (selectedProfessionalType === 'psychologist' && !registrationNumber.trim()) {
          setErrorMessage('Por favor, informe seu registro de CRP (Conselho Regional de Psicologia).');
          setLoading(false);
          return;
        }

        const careCategory = selectedProfessionalType === 'pastor' ? 'biblical' : 'therapy';
        const finalCrp = selectedProfessionalType === 'psychologist' ? registrationNumber.trim() : undefined;

        // Combina a abordagem principal com as tags de experiência clínica
        const combinedApproaches = Array.from(
          new Set([approach, ...selectedClinicalTags])
        );

        const res = register({
          name,
          email,
          passwordHash: password,
          role: selectedProfessionalType,
          professionalType: selectedProfessionalType,
          careCategory,
          phone,
          crp: finalCrp,
          registrationNumber: finalCrp,
          ministryOrChurch: selectedProfessionalType === 'pastor' ? ministryOrChurch : undefined,
          approaches: combinedApproaches,
          clinicalTags: selectedClinicalTags,
          formations: formations.length > 0 ? formations : [SUGGESTED_FORMATIONS_BY_TYPE[selectedProfessionalType]?.[0] || 'Graduação'],
          specializations: specializations.length > 0 ? specializations : [SUGGESTED_SPECIALIZATIONS_BY_TYPE[selectedProfessionalType]?.[0] || 'Atendimento Clínico'],
          professionalProfile: {
            ageGroup: '36-50',
            approximateAge: 38,
            maritalStatus: 'married',
            hasChildren: false,
            yearsOfExperience: 5,
            affinityTags: selectedClinicalTags.length > 0 ? selectedClinicalTags : [approach],
            formations: formations,
            specializations: specializations,
            acceptsNewMatchedPatients: true,
            updatedAt: new Date().toISOString(),
          },
          hourlyRate: Number(hourlyRate),
          sessionDuration: 50,
          defaultMeetingType: 'native',
        });

        setLoading(false);
        if (res.success) {
          onAuthSuccess?.();
          onClose();
        } else {
          setErrorMessage(res.error || 'Erro ao realizar cadastro.');
        }
      } else {
        // Patient registration
        const res = register({
          name,
          email,
          passwordHash: password,
          role: 'patient',
          phone,
        });

        setLoading(false);
        if (res.success) {
          onPatientRegistered?.();
          onAuthSuccess?.();
          onClose();
        } else {
          setErrorMessage(res.error || 'Erro ao realizar cadastro.');
        }
      }
    }
  };

  const handleSelectDemo = (userId: string) => {
    switchDemoUser(userId);
    onAuthSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex items-start sm:items-center justify-center">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Modal Header (Fixed at the top) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showText={false} animated={true} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {mode === 'login'
                    ? 'Fazer Login no PsiConnect'
                    : accountCategory === 'professional'
                    ? `Cadastro de ${currentProfConfig.label}`
                    : 'Cadastro de Paciente'}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full">
                  Firebase Firestore Ativo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'login'
                  ? 'Acesse com sua conta para gerenciar consultas e atendimentos'
                  : accountCategory === 'professional'
                  ? selectedProfessionalType === 'pastor'
                    ? 'Cadastre seu ministério para acolhimento e aconselhamento bíblico'
                    : 'Cadastre seu perfil clínico para atendimentos de terapia emocional e psicológica'
                  : 'Cadastre-se para agendar sessões de terapia ou aconselhamento bíblico'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div ref={scrollContainerRef} className="overflow-y-auto flex-1 overscroll-contain">
          {/* Mode Switcher Tabs */}
          <div className="p-6 pb-2">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`py-1.5 rounded-md transition-all ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entrar (Já Tenho Conta)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className={`py-1.5 rounded-md transition-all ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>
          </div>

          {/* Google Firebase Login Button */}
          <div className="px-6 py-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors hover:border-slate-400 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'login' ? 'Continuar com o Google (Firebase Auth)' : 'Cadastrar com o Google (Firebase Auth)'}</span>
            </button>

            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400">
                <span className="bg-white px-2">{mode === 'login' ? 'ou acesse com e-mail e senha' : 'ou preencha os dados do formulário'}</span>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Category Selector on Register */}
            {mode === 'register' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Qual é o seu objetivo?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountCategory('patient')}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-all ${
                        accountCategory === 'patient'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 ring-1 ring-sky-600 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold">Sou Paciente</span>
                    <span className="text-[10px] text-slate-500">
                      Buscar terapia ou aconselhamento bíblico
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountCategory('professional')}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-all ${
                      accountCategory === 'professional'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 ring-1 ring-sky-600 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold">Sou Profissional</span>
                    <span className="text-[10px] text-slate-500">
                      Psicólogo, Terapeuta, Psicanalista ou Pastor
                    </span>
                  </button>
                </div>
              </div>

              {/* Sub-Selector for 4 Professional Types */}
              {accountCategory === 'professional' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Tipo de Atuação Profissional:
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* 1. Psicólogo */}
                    <button
                      type="button"
                      onClick={() => setSelectedProfessionalType('psychologist')}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                        selectedProfessionalType === 'psychologist'
                          ? 'border-sky-600 bg-sky-50/80 text-sky-950 ring-1 ring-sky-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Brain className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold">Psicólogo(a)</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          Terapia psicológica & CRP
                        </span>
                      </div>
                    </button>

                    {/* 2. Terapeuta */}
                    <button
                      type="button"
                      onClick={() => setSelectedProfessionalType('therapist')}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                        selectedProfessionalType === 'therapist'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Leaf className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold">Terapeuta</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          Terapia emocional e integrativa
                        </span>
                      </div>
                    </button>

                    {/* 3. Psicanalista */}
                    <button
                      type="button"
                      onClick={() => setSelectedProfessionalType('psychoanalyst')}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                        selectedProfessionalType === 'psychoanalyst'
                          ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-1 ring-purple-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold">Psicanalista</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          Análise clínica do inconsciente
                        </span>
                      </div>
                    </button>

                    {/* 4. Pastor / Conselheiro Bíblico */}
                    <button
                      type="button"
                      onClick={() => setSelectedProfessionalType('pastor')}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                        selectedProfessionalType === 'pastor'
                          ? 'border-amber-600 bg-amber-50/80 text-amber-950 ring-1 ring-amber-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold">Pastor / Conselheiro</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          Aconselhamento bíblico
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Informational banner about categorization */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                    <span>
                      {selectedProfessionalType === 'pastor' ? (
                        <strong>
                          Orientação Bíblica: Seu perfil ficará disponível especificamente para pessoas em busca de aconselhamento bíblico e pastoral.
                        </strong>
                      ) : (
                        <span>
                          Terapia & Saúde Mental: Seu perfil ficará visível para pessoas buscando <strong>terapia emocional, comportamental e psicológica</strong>.
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields: Name */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={
                    accountCategory === 'professional'
                      ? selectedProfessionalType === 'pastor'
                        ? 'Pr. Seu Nome Sobrenome'
                        : selectedProfessionalType === 'psychologist'
                        ? 'Dr(a). Seu Nome Sobrenome'
                        : 'Seu Nome Profissional'
                      : 'Seu Nome Completo'
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* Phone */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>
          )}

          {/* Professional Credentials: Only Psychologists require and show CRP */}
          {mode === 'register' && accountCategory === 'professional' && (
            <>
              {selectedProfessionalType === 'psychologist' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registro Profissional CRP (Conselho Regional de Psicologia) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={e => setRegistrationNumber(e.target.value)}
                      placeholder="Ex: CRP 06/138420"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Obrigatório para validação junto ao Conselho Federal de Psicologia (CFP).
                  </p>
                </div>
              )}

              {selectedProfessionalType === 'pastor' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Igreja, Ministério ou Denominação
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={ministryOrChurch}
                      onChange={e => setMinistryOrChurch(e.target.value)}
                      placeholder="Ex: Ministério da Família / Igreja Batista Esperança"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {selectedProfessionalType === 'pastor' ? 'Área de Aconselhamento' : 'Abordagem Principal'}
                  </label>
                  <select
                    value={approach}
                    onChange={e => setApproach(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 bg-white"
                  >
                    {currentProfConfig.defaultApproaches.map((ap, i) => (
                      <option key={i} value={ap}>
                        {ap}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Honorário da Sessão (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={hourlyRate}
                      onChange={e => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>
              </div>

              {/* 1. Formações Acadêmicas e Cursos Formativos (+ de 1) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-700" />
                    <label className="text-xs font-bold text-slate-800">
                      Formações Acadêmicas (+ de 1)
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100/80 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {formations.length} informada(s)
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  Adicione suas graduações, mestrados, doutorados e formações clínicas (você pode incluir mais de uma formação). O algoritmo de matching valida seu perfil acadêmico para demandas específicas.
                </p>

                {/* Sugestões Rápidas de Formação */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Sugestões rápidas (clique para selecionar):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(SUGGESTED_FORMATIONS_BY_TYPE[selectedProfessionalType] || []).map(f => {
                      const isSelected = formations.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleToggleFormation(f)}
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

                {/* Formações Cadastradas com botão de remoção */}
                {formations.length > 0 && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Suas formações ativas ({formations.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formations.map(f => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg"
                        >
                          <GraduationCap className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-[280px]">{f}</span>
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
                  </div>
                )}

                {/* Inserção de Formação Personalizada */}
                <div className="pt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <GraduationCap className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
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
                      placeholder="Adicionar formação com instituição (ex: Mestrado em Psicologia - USP)..."
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
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

              {/* 2. Especializações Clínicas & Títulos (+ de 1) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <label className="text-xs font-bold text-slate-800">
                      Especializações Clínicas & Áreas de Atuação (+ de 1)
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {specializations.length} selecionada(s)
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  Selecione ou adicione suas especialidades clínicas (ex: <strong>Terapia de Casal</strong>, <strong>Ansiedade e Pânico</strong>, <strong>Neuropsicologia</strong>). O algoritmo utilizará essas especializações para sugerir pacientes com queixas afins.
                </p>

                {/* Sugestões Rápidas de Especialização */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Sugestões clínicas (clique para selecionar):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {(SUGGESTED_SPECIALIZATIONS_BY_TYPE[selectedProfessionalType] || []).map(s => {
                      const isSelected = specializations.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleToggleSpecialization(s)}
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

                {/* Especializações Cadastradas com botão de remoção */}
                {specializations.length > 0 && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Suas especializações ativas ({specializations.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {specializations.map(s => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg"
                        >
                          <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[280px]">{s}</span>
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
                  </div>
                )}

                {/* Inserção de Especialização Personalizada */}
                <div className="pt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Award className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
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
                      placeholder="Adicionar outra especialização (ex: Tanatologia e Luto, Psicossomática)..."
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
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

              {/* 3. Multi-seleção de Tags de Experiência Clínica (Matching Inteligente) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-700" />
                    <label className="text-xs font-bold text-slate-800">
                      Experiência Clínica & Foco de Atuação (Matching)
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-800 bg-sky-100/80 border border-sky-200 px-2 py-0.5 rounded-full">
                    {selectedClinicalTags.length} selecionada(s)
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  Selecione as queixas e temas com os quais você tem maior experiência (ex: <strong>Ansiedade</strong>, <strong>Luto</strong>, <strong>Relacionamentos</strong>). O algoritmo de matching utilizará essas tags para refinar a compatibilidade e sugerir pacientes com demandas clínicas afins.
                </p>

                {/* Chips de Multiseleção */}
                <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-36 overflow-y-auto pr-1">
                  {Array.from(new Set([...CLINICAL_EXPERIENCE_TAGS, ...selectedClinicalTags])).map(tag => {
                    const isSelected = selectedClinicalTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleClinicalTag(tag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-sky-700 text-white border-sky-700 shadow-2xs font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                        }`}
                      >
                        <span>{tag}</span>
                        {isSelected ? (
                          <Check className="w-3 h-3 text-sky-200 shrink-0" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Inserção de Tag Personalizada */}
                <div className="pt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={e => setCustomTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      placeholder="Adicionar outra tag (ex: Síndrome do Pânico, TDAH)..."
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar com Senha' : 'Concluir Cadastro'}
          </button>
        </form>

        {/* Demo Fast Access Bar */}
        <div className="mx-6 mb-6 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-700" />
              Acesso Rápido de Teste (Clique para Alternar):
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectDemo('psy_clara')}
              className="py-1 px-2 bg-white hover:bg-sky-50 text-sky-900 border border-slate-200 rounded text-left font-medium transition-colors truncate"
              title="Dra. Clara - Psicóloga (TCC)"
            >
              🧠 Dra. Clara (Psicóloga)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('ther_camila')}
              className="py-1 px-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-slate-200 rounded text-left font-medium transition-colors truncate"
              title="Camila Rezende - Terapeuta Integrativa"
            >
              🌿 Camila (Terapeuta)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('psy_renata')}
              className="py-1 px-2 bg-white hover:bg-purple-50 text-purple-900 border border-slate-200 rounded text-left font-medium transition-colors truncate"
              title="Dra. Renata - Psicanalista"
            >
              🔍 Dra. Renata (Psicanalista)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('pas_david')}
              className="py-1 px-2 bg-white hover:bg-amber-50 text-amber-950 border border-amber-200 rounded text-left font-semibold transition-colors truncate"
              title="Pr. David Ferreira - Aconselhamento Bíblico"
            >
              📖 Pr. David (Pastor Bíblico)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('pat_lucas')}
              className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded text-left font-medium transition-colors truncate"
              title="Lucas - Paciente"
            >
              👤 Lucas (Paciente Terapia)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('pat_mariana')}
              className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded text-left font-medium transition-colors truncate"
              title="Mariana - Paciente Aconselhamento"
            >
              👤 Mariana (Paciente Bíblico)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
