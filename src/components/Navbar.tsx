import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isProfessionalRole, ProfessionalType } from '../types';
import { clinicalFormStorage } from '../services/clinicalFormStorage';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { 
  Activity, 
  User as UserIcon, 
  LogOut, 
  Calendar, 
  Clock, 
  FileText, 
  Search, 
  Shield, 
  ChevronDown, 
  LogIn, 
  UserPlus, 
  Heart, 
  Menu, 
  X,
  Sparkles,
  BookOpen,
  Brain,
  Leaf,
  Compass,
  Smile,
  Building2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: (role: 'patient' | 'psychologist') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenLogin, 
  onOpenRegister 
}) => {
  const { user, role, logout, switchDemoUser, firebaseUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const registerDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const isProf = isProfessionalRole(role);

  const [unreadFormsCount, setUnreadFormsCount] = useState<number>(() =>
    user ? clinicalFormStorage.getUnreadSubmissionsCount(user.id) : 0
  );

  useEffect(() => {
    if (!user) return;
    const unsub = clinicalFormStorage.subscribe(() => {
      setUnreadFormsCount(clinicalFormStorage.getUnreadSubmissionsCount(user.id));
    });
    return () => unsub();
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (registerDropdownRef.current && !registerDropdownRef.current.contains(e.target as Node)) {
        setRegisterMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProfessionalDisplayRole = () => {
    if (!user) return '';
    if (user.role === 'pastor' || user.professionalType === 'pastor') {
      return 'Pastor / Conselheiro Bíblico';
    }
    if (user.role === 'therapist' || user.professionalType === 'therapist') {
      return user.registrationNumber ? `Terapeuta · ${user.registrationNumber.split(' ')[0]}` : 'Terapeuta';
    }
    if (user.role === 'psychoanalyst' || user.professionalType === 'psychoanalyst') {
      return 'Psicanalista Clínico(a)';
    }
    return user.crp ? `Psicólogo(a) · ${user.crp.split(' ')[0]}` : 'Psicólogo(a)';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => {
            setActiveTab(isProf ? 'agenda' : role === 'patient' ? 'catalog' : 'home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center cursor-pointer whitespace-nowrap shrink-0 group min-w-0"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setActiveTab(isProf ? 'agenda' : role === 'patient' ? 'catalog' : 'home');
            }
          }}
        >
          <BrandLogo size="md" animated={true} />
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-4 2xl:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 min-w-0 overflow-hidden">
          {user ? (
            isProf ? (
              <>
                <button
                  onClick={() => setActiveTab('agenda')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'agenda' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Minha Agenda</span>
                </button>
                <button
                  onClick={() => setActiveTab('matching')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'matching' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                  <span>Pacientes Sugeridos</span>
                </button>
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'availability' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Disponibilidade</span>
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'records' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{user.role === 'pastor' ? 'Aconselhamento' : 'Prontuários (PEP)'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'forms' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                  <span>Formulários</span>
                  {unreadFormsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black shrink-0">
                      {unreadFormsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'profile' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>Meu Perfil</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'catalog' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Especialistas</span>
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'appointments' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Consultas</span>
                </button>
                <button
                  onClick={() => setActiveTab('patient_forms')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'patient_forms' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Questionários</span>
                </button>
                <button
                  onClick={() => setActiveTab('patient_records')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'patient_records' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Orientações</span>
                </button>
                <button
                  onClick={() => setActiveTab('mood_tracker')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'mood_tracker' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Smile className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Diário de Humor</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'profile' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                  }`}
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>Meu Perfil</span>
                </button>
              </>
            )

          ) : (
            <>
              <button
                onClick={() => setActiveTab('home')}
                className={`hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === 'home' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                }`}
              >
                Início
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === 'catalog' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                }`}
              >
                Especialistas Disponíveis
              </button>
              <button
                onClick={() => setActiveTab('ethics')}
                className={`hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === 'ethics' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                }`}
              >
                Ética & Princípios
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === 'contact' ? 'border-sky-700 dark:border-sky-400 text-sky-800 dark:text-sky-300 font-semibold' : 'border-transparent'
                }`}
              >
                Fale Conosco
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action / User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-semibold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {user.name.split(' ')[0]} {user.name.split(' ')[1] || ''}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isProf ? getProfessionalDisplayRole() : 'Paciente'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-sky-800 dark:text-sky-400">
                        {isProf ? getProfessionalDisplayRole() : 'Paciente'}
                      </span>
                      {firebaseUser && (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded">
                          🔥 Firebase Auth
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Link direto para Meu Perfil */}
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                        activeTab === 'profile'
                          ? 'bg-sky-700 text-white shadow-xs'
                          : 'text-slate-800 dark:text-slate-100 bg-sky-50/80 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeTab === 'profile' ? 'bg-white/20 text-white' : 'bg-sky-600 text-white shadow-2xs'
                        }`}>
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight">Meu Perfil</span>
                          <span className={`text-[10px] font-normal block ${
                            activeTab === 'profile' ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            Ver e editar dados
                          </span>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold ${
                        activeTab === 'profile' ? 'text-white' : 'text-sky-700 dark:text-sky-400'
                      }`}>
                        Acessar →
                      </span>
                    </button>

                    {isProf && (
                      <button
                        onClick={() => {
                          setActiveTab('clinic-unit');
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all mt-1 ${
                          activeTab === 'clinic-unit'
                            ? 'bg-sky-700 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            activeTab === 'clinic-unit' ? 'bg-white/20 text-white' : 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
                          }`}>
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <span>Unidade Clínica</span>
                        </div>
                        {user.clinicUnitId && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unidade vinculada" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                      Trocar Conta de Teste:
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          switchDemoUser('psy_clara');
                          setActiveTab('agenda');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                          user.id === 'psy_clara' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Brain className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>Dra. Clara (Psicóloga - TCC)</span>
                      </button>

                      <button
                        onClick={() => {
                          switchDemoUser('ther_camila');
                          setActiveTab('agenda');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                          user.id === 'ther_camila' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Camila Rezende (Terapeuta)</span>
                      </button>

                      <button
                        onClick={() => {
                          switchDemoUser('psy_renata');
                          setActiveTab('agenda');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                          user.id === 'psy_renata' ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Dra. Renata (Psicanalista)</span>
                      </button>

                      <button
                        onClick={() => {
                          switchDemoUser('pas_david');
                          setActiveTab('agenda');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                          user.id === 'pas_david' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Pr. David (Pastor Bíblico)</span>
                      </button>

                      <button
                        onClick={() => {
                          switchDemoUser('pat_lucas');
                          setActiveTab('catalog');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                          user.id === 'pat_lucas' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                        <span>Lucas (Paciente)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await logout();
                      setActiveTab('home');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Encerrar Sessão
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Botão: Fazer login (acessar) */}
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs transition-colors whitespace-nowrap"
                title="Acessar com sua conta existente"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                <span className="hidden xs:inline">Fazer Login</span>
                <span className="xs:hidden">Entrar</span>
              </button>

              {/* Botão: Se cadastrar */}
              <div className="relative" ref={registerDropdownRef}>
                <button
                  onClick={() => setRegisterMenuOpen(!registerMenuOpen)}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl shadow-xs transition-colors whitespace-nowrap"
                  aria-expanded={registerMenuOpen}
                  aria-haspopup="true"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Se Cadastrar</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${registerMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {registerMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Como você deseja se cadastrar?
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setRegisterMenuOpen(false);
                        onOpenRegister('patient');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sky-700 group-hover:text-white transition-colors">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-800 dark:group-hover:text-sky-400">
                            Como Paciente
                          </span>
                          <span className="text-[9px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-1.5 py-0.2 rounded-full">
                            Acolhimento
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Buscar terapia emocional, comportamental ou aconselhamento bíblico.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setRegisterMenuOpen(false);
                        onOpenRegister('psychologist');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-3 group border-t border-slate-100 dark:border-slate-800"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                            Como Profissional
                          </span>
                          <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-full">
                            4 Especialidades
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Psicólogos (CRP), Terapeutas, Psicanalistas e Pastores / Conselheiros Bíblicos.
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-0.5 sm:ml-1"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 shadow-lg">
          {/* Quick theme switcher row in mobile menu */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Aparência da Plataforma
            </span>
            <ThemeToggle showLabel={true} />
          </div>

          <div className="space-y-1">
            {user ? (
              isProf ? (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('agenda');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'agenda' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Minha Agenda
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('matching');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'matching' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Pacientes Sugeridos
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('availability');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'availability' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Disponibilidade
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('records');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'records' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Prontuários & Registros
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('forms');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center justify-between ${
                      activeTab === 'forms' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Formulários Clínicos</span>
                    {unreadFormsCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
                        {unreadFormsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'profile' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    <span>Meu Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('clinic-unit');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'clinic-unit' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    <span>Unidade Clínica</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('catalog');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'catalog' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Encontrar Especialistas
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('appointments');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'appointments' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Minhas Consultas
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('mood_tracker');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'mood_tracker' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Smile className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Diário de Humor</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('patient_forms');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'patient_forms' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Meus Questionários
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('patient_records');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeTab === 'patient_records' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Orientações de Cuidado
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'profile' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    <span>Meu Perfil</span>
                  </button>
                </>
              )
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    activeTab === 'home' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Início
                </button>
                <button
                  onClick={() => {
                    setActiveTab('catalog');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    activeTab === 'catalog' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Especialistas Disponíveis
                </button>
                <button
                  onClick={() => {
                    setActiveTab('ethics');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    activeTab === 'ethics' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Ética, Sigilo & Princípios
                </button>
                <button
                  onClick={() => {
                    setActiveTab('contact');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    activeTab === 'contact' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Fale Conosco
                </button>
              </>
            )}
          </div>

          {!user && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
                Acesso & Cadastro
              </p>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <LogIn className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <span>Fazer Login</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister('patient');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-xs"
              >
                <Heart className="w-4 h-4" />
                <span>Cadastrar como Paciente</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister('psychologist');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors"
              >
                <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Cadastrar como Profissional</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
