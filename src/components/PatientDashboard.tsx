import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User, Appointment, CareCategory, ProfessionalType, PROFESSIONAL_TYPES_CONFIG, isProfessionalAcceptingPatients } from '../types';
import { calculateMatchScore } from '../services/matchingEngine';
import { BookingModal } from './BookingModal';
import { ProfessionalSearchCard } from './ProfessionalSearchCard';
import { PatientMatchingModal } from './PatientMatchingModal';
import { PatientFormList } from './clinicalForms/PatientFormList';
import { clinicalFormStorage } from '../services/clinicalFormStorage';
import { PatientMoodTrackerView } from './moodTracker/PatientMoodTrackerView';
import { DailyMoodQuickCheck } from './moodTracker/DailyMoodQuickCheck';
import { formatDateBR } from '../utils/dateUtils';
import {

  Search,
  Calendar,
  Clock,
  Video,
  Shield,
  FileText,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  UserCheck,
  BookOpen,
  Brain,
  Heart,
  HeartHandshake,
  Sparkles,
  Edit3,
  Smile,
} from 'lucide-react';

interface PatientDashboardProps {
  onJoinRoom: (appointment: Appointment) => void;
  onOpenAuth: () => void;
  activeSubTab?: string;
  navNonce?: number;
  externalSearch?: { query: string; nonce: number } | null;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onJoinRoom,
  onOpenAuth,
  activeSubTab = 'catalog',
  navNonce = 0,
  externalSearch = null,
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<
    'catalog' | 'appointments' | 'patient_forms' | 'patient_records' | 'mood_tracker'
  >((activeSubTab as any) || 'catalog');
  const catalogListRef = React.useRef<HTMLDivElement>(null);

  const [pendingFormsCount, setPendingFormsCount] = useState<number>(() =>
    user
      ? clinicalFormStorage.getDispatchesByPatient(user.id).filter(d => d.status === 'pending').length
      : 0
  );

  React.useEffect(() => {
    const validTabs = ['catalog', 'appointments', 'patient_forms', 'patient_records', 'mood_tracker'];
    if (activeSubTab && validTabs.includes(activeSubTab)) {
      setCurrentTab(activeSubTab as any);
    }
  }, [activeSubTab, navNonce]);

  React.useEffect(() => {
    if (!user) return;
    const unsub = clinicalFormStorage.subscribe(() => {
      setPendingFormsCount(
        clinicalFormStorage.getDispatchesByPatient(user.id).filter(d => d.status === 'pending').length
      );
    });
    return () => unsub();
  }, [user]);

  // All Professionals from storage with real-time Firestore sync
  const [professionals, setProfessionals] = useState<User[]>(() =>
    storage.getProfessionals()
  );

  // Appointments with real-time Firestore sync
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    user ? storage.getAppointments(user.id, 'patient') : []
  );

  React.useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setProfessionals(storage.getProfessionals());
      if (user) {
        setAppointments(storage.getAppointments(user.id, 'patient'));
      }
    });
    return () => unsubscribe();
  }, [user]);
  // Care category filter: 'all' | 'therapy' | 'biblical'
  const [categoryFilter, setCategoryFilter] = useState<'all' | CareCategory>('all');
  // Specific professional type filter: 'all' | ProfessionalType
  const [profTypeFilter, setProfTypeFilter] = useState<'all' | ProfessionalType>('all');
  // Search & Price
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(300);
  // Social care & availability filters
  const [onlySocialFilter, setOnlySocialFilter] = useState<boolean>(false);
  const [onlyAcceptingFilter, setOnlyAcceptingFilter] = useState<boolean>(false);

  React.useEffect(() => {
    if (!externalSearch || !externalSearch.query) return;
    setCurrentTab('catalog');
    setCategoryFilter('all');
    setProfTypeFilter('all');
    setMaxPrice(350);
    setOnlySocialFilter(false);
    setOnlyAcceptingFilter(false);
    setSearchTerm(externalSearch.query);

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = catalogListRef.current;
        if (!el) return;
        const header = document.querySelector('header');
        const headerOffset = header ? header.getBoundingClientRect().height + 16 : 84;
        const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerOffset);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [externalSearch]);

  // Booking Modal
  const [selectedProfessionalForBooking, setSelectedProfessionalForBooking] = useState<User | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Matching Profile Modal
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);

  const refreshAppointments = () => {
    if (user) {
      setAppointments(storage.getAppointments(user.id, 'patient'));
    }
  };

  const handleBookingSuccess = (newApt: Appointment) => {
    refreshAppointments();
    setBookingSuccessMsg(`Consulta com ${newApt.psychologistName} agendada para ${formatDateBR(newApt.date)} às ${newApt.time}!`);
    setCurrentTab('appointments');
    setTimeout(() => setBookingSuccessMsg(''), 6000);
  };

  // Filter professionals according to category, type, price, and search keywords
  const filteredProfessionals = professionals.filter(p => {
    // Category filter: therapy vs biblical
    if (categoryFilter === 'therapy') {
      const isTherapy = p.careCategory === 'therapy' || p.role === 'psychologist' || p.role === 'therapist' || p.role === 'psychoanalyst';
      if (!isTherapy) return false;
    } else if (categoryFilter === 'biblical') {
      const isBiblical = p.careCategory === 'biblical' || p.role === 'pastor' || p.professionalType === 'pastor';
      if (!isBiblical) return false;
    }

    // Specific professional type filter
    if (profTypeFilter !== 'all') {
      if (p.professionalType !== profTypeFilter && p.role !== profTypeFilter) {
        return false;
      }
    }

    // Social Care filter
    if (onlySocialFilter) {
      const hasSocialSlot = storage.getAvailabilitySlots(p.id).some(s => s.isSocial && s.isActive);
      if (!hasSocialSlot) return false;
    }

    // Availability status filter
    if (onlyAcceptingFilter && !isProfessionalAcceptingPatients(p)) {
      return false;
    }

    // Price
    if (p.hourlyRate && p.hourlyRate > maxPrice) {
      return false;
    }

    // Keyword search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(term);
      const matchesBio = p.bio?.toLowerCase().includes(term);
      const matchesChurch = p.ministryOrChurch?.toLowerCase().includes(term);
      const matchesReg = p.registrationNumber?.toLowerCase().includes(term) || p.crp?.toLowerCase().includes(term);
      const matchesApproach = p.approaches?.some(a => a.toLowerCase().includes(term));
      const matchesClinicalTag = p.clinicalTags?.some(t => t.toLowerCase().includes(term));
      if (!matchesName && !matchesBio && !matchesChurch && !matchesReg && !matchesApproach && !matchesClinicalTag) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const aAccepting = isProfessionalAcceptingPatients(a);
    const bAccepting = isProfessionalAcceptingPatients(b);
    if (aAccepting !== bAccepting) {
      return aAccepting ? -1 : 1;
    }
    if (user && user.patientProfile) {
      return calculateMatchScore(b, user).score - calculateMatchScore(a, user).score;
    }
    return 0;
  });

  const acceptingProfessionalsCount = filteredProfessionals.filter(p => isProfessionalAcceptingPatients(p)).length;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 md:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-colors duration-200 min-w-0 max-w-full overflow-hidden">
        <div className="min-w-0">
          <span className="text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wider block mb-1">
            Espaço de Cuidado & Acolhimento
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Olá, {user ? user.name.split(' ')[0] : 'Visitante'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Encontre o suporte adequado para o seu momento: <strong>terapia emocional, comportamental e psicológica</strong> com psicólogos, terapeutas e psicanalistas, ou <strong>aconselhamento bíblico</strong> com pastores experientes.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold self-stretch lg:self-auto overflow-x-auto min-w-0 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'catalog' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Encontrar Especialista
          </button>
          <button
            onClick={() => setCurrentTab('appointments')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'appointments' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Minhas Consultas ({appointments.length})
          </button>
          <button
            onClick={() => setCurrentTab('patient_forms')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'patient_forms' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>Meus Questionários</span>
            {pendingFormsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
                {pendingFormsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab('patient_records')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'patient_records' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Orientações de Cuidado
          </button>
          <button
            onClick={() => setCurrentTab('mood_tracker')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'mood_tracker' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>Diário de Humor</span>
          </button>
        </div>
      </div>


      {/* Daily Mood Quick Check for logged in patient */}
      {user && currentTab === 'catalog' && (
        <DailyMoodQuickCheck
          patientId={user.id}
          patientName={user.name.split(' ')[0]}
          onOpenLogModal={() => setCurrentTab('mood_tracker')}
        />
      )}

      {/* Patient Matching Profile Banner */}
      {user && (
        <div className="bg-gradient-to-r from-teal-50 to-slate-50 dark:from-teal-950/40 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-700 dark:bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-teal-950 dark:text-teal-200">
                  {user.patientProfile ? 'Perfil de Acolhimento & Matching Ativo' : 'Complete seu Perfil de Acolhimento'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                  {user.patientProfile ? 'Compatibilidade Ativa' : 'Recomendado'}
                </span>
              </div>
              <p className="text-xs text-teal-900/80 dark:text-teal-300/80 mt-0.5 max-w-2xl leading-relaxed">
                {user.patientProfile
                  ? `Seu contexto (${user.patientProfile.reasonsForCare.length} queixa(s) informadas) está sendo utilizado para sugerir seu perfil aos profissionais com vivência pessoal e abordagem compatíveis.`
                  : 'Informe os motivos da sua busca, sua faixa etária e vivência familiar para ser sugerido aos profissionais que têm o perfil exato para acolher sua história.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMatchingModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl shadow-xs transition-colors whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-2"
          >
            {user.patientProfile ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Atualizar Meu Perfil</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preencher Agora</span>
              </>
            )}
          </button>
        </div>
      )}

      {bookingSuccessMsg && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{bookingSuccessMsg}</span>
        </div>
      )}

      {/* Tab 1: Catálogo de Profissionais */}
      {currentTab === 'catalog' && (
        <div className="space-y-6">
          {/* Main Category Segmentation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors duration-200">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                O que você está buscando hoje?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Option 1: Todos */}
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setProfTypeFilter('all');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    categoryFilter === 'all'
                      ? 'border-sky-700 dark:border-sky-500 bg-sky-50/70 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 ring-1 ring-sky-700 dark:ring-sky-500 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    <span className="font-bold text-xs sm:text-sm">Todos os Especialistas</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Ver todos os profissionais cadastrados na plataforma.
                  </p>
                </button>

                {/* Option 2: Terapia Emocional, Comportamental & Psicológica */}
                <button
                  onClick={() => {
                    setCategoryFilter('therapy');
                    if (profTypeFilter === 'pastor') setProfTypeFilter('all');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    categoryFilter === 'therapy'
                      ? 'border-sky-700 dark:border-sky-500 bg-sky-50/70 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 ring-1 ring-sky-700 dark:ring-sky-500 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    <span className="font-bold text-xs sm:text-sm">Terapia & Saúde Mental</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Terapia emocional, comportamental e psicológica (Psicólogos, Terapeutas e Psicanalistas).
                  </p>
                </button>

                {/* Option 3: Aconselhamento Bíblico */}
                <button
                  onClick={() => {
                    setCategoryFilter('biblical');
                    setProfTypeFilter('pastor');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    categoryFilter === 'biblical'
                      ? 'border-amber-700 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 ring-1 ring-amber-700 dark:ring-amber-500 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span className="font-bold text-xs sm:text-sm">Aconselhamento Bíblico</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Acolhimento pastoral e suporte espiritual fundamentado nas Sagradas Escrituras (Pastores).
                  </p>
                </button>
              </div>
            </div>

            {/* Sub-Filters: Type of Professional, Keyword Search, Max Price */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search input */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, abordagem, igreja ou tema (ex: ansiedade, casamento)..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-600 dark:focus:ring-sky-400"
                />
              </div>

              {/* Sub-Type Filter Dropdown */}
              <div className="md:col-span-4">
                <select
                  value={profTypeFilter}
                  onChange={e => setProfTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 dark:focus:ring-sky-400"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Todas as Especialidades</option>
                  {(categoryFilter === 'all' || categoryFilter === 'therapy') && (
                    <>
                      <option value="psychologist" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Psicólogos(as) (CRP)</option>
                      <option value="therapist" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Terapeutas (Emocional / Integrativa)</option>
                      <option value="psychoanalyst" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Psicanalistas (Análise Clínica)</option>
                    </>
                  )}
                  {(categoryFilter === 'all' || categoryFilter === 'biblical') && (
                    <option value="pastor" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Pastores(as) (Aconselhamento Bíblico)</option>
                  )}
                </select>
              </div>

              {/* Price Filter Slider & Social Toggle */}
              <div className="md:col-span-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                  <span>Até R$ {maxPrice},00</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={350}
                  step={10}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-sky-700 dark:accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Social Care & Accepting New Patients Filter Toggles */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyAcceptingFilter(!onlyAcceptingFilter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    onlyAcceptingFilter
                      ? 'bg-sky-700 text-white border-sky-800 shadow-2xs'
                      : 'bg-sky-50/70 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Somente aceitando novos pacientes</span>
                  {onlyAcceptingFilter && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => setOnlySocialFilter(!onlySocialFilter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    onlySocialFilter
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Filtrar vagas de Atendimento Social</span>
                  {onlySocialFilter && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                </button>
              </div>

              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Atendimento social voltado ao acolhimento acessível de pessoas em vulnerabilidade.
              </span>
            </div>
          </div>

          {/* Active filter count banner */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 flex-wrap gap-2">
            <span>
              Exibindo <strong>{filteredProfessionals.length}</strong> {filteredProfessionals.length === 1 ? 'profissional' : 'profissionais'}
              {' '}({acceptingProfessionalsCount} aceitando novos pacientes)
              {onlySocialFilter && ' · com vagas sociais ativas'}
            </span>
            {(categoryFilter !== 'all' || profTypeFilter !== 'all' || searchTerm || maxPrice < 300 || onlySocialFilter || onlyAcceptingFilter) && (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setProfTypeFilter('all');
                  setSearchTerm('');
                  setMaxPrice(300);
                  setOnlySocialFilter(false);
                  setOnlyAcceptingFilter(false);
                }}
                className="text-sky-700 dark:text-sky-400 hover:underline font-semibold"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* List of Professional Cards */}
          <div ref={catalogListRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map(prof => (
              <ProfessionalSearchCard
                key={prof.id}
                professional={prof}
                patientUser={user}
                onBook={selectedProf => {
                  if (!user) {
                    onOpenAuth();
                  } else {
                    setSelectedProfessionalForBooking(selectedProf);
                  }
                }}
              />
            ))}
          </div>

          {filteredProfessionals.length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum profissional encontrado com os filtros atuais</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tente alternar para outra categoria ou redefinir a busca.</p>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setProfTypeFilter('all');
                  setSearchTerm('');
                  setMaxPrice(300);
                  setOnlySocialFilter(false);
                  setOnlyAcceptingFilter(false);
                }}
                className="mt-3 px-4 py-2 text-xs font-semibold text-sky-700 hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Minhas Consultas */}
      {currentTab === 'appointments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Minhas Consultas e Aconselhamentos Agendados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acesse suas teleconsultas online e visualize o histórico de atendimentos terapêuticos e bíblicos.
              </p>
            </div>
          </div>

          {!user ? (
            <div className="py-12 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Acesse sua conta para ver suas consultas</p>
              <button
                onClick={onOpenAuth}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg shadow-xs"
              >
                Fazer Login
              </button>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Você ainda não tem consultas agendadas</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                Encontre o profissional ideal para a sua necessidade (psicólogo, terapeuta, psicanalista ou pastor) e agende seu horário com segurança.
              </p>
              <button
                onClick={() => setCurrentTab('catalog')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg shadow-xs"
              >
                Ver Especialistas Disponíveis
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map(apt => {
                const isToday = apt.date === todayStr;

                return (
                  <div
                    key={apt.id}
                    className={`p-5 rounded-xl border transition-all ${
                      isToday && apt.status === 'scheduled'
                        ? 'bg-sky-50/50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {apt.psychologistAvatar ? (
                          <img
                            src={apt.psychologistAvatar}
                            alt={apt.psychologistName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center text-sm">
                            {apt.psychologistName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {apt.psychologistName}
                            </span>
                            {apt.psychologistCrp && (
                              <span className="text-xs text-sky-800 dark:text-sky-300 font-medium">
                                {apt.psychologistCrp}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                apt.status === 'scheduled'
                                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              {apt.status === 'scheduled' ? 'Agendada' : 'Realizada'}
                            </span>
                            {apt.isSocial && (
                              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded inline-flex items-center gap-1 shadow-2xs">
                                <HeartHandshake className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  Atendimento Social{apt.socialRate !== undefined ? ` (R$ ${apt.socialRate})` : ''}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
                            <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                              <Calendar className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                              {formatDateBR(apt.date)}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                              <Clock className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                              {apt.time} às {apt.endTime}
                            </span>
                          </div>

                          {apt.notesFromPatient && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              Sua demanda inicial: "{apt.notesFromPatient}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => onJoinRoom(apt)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg shadow-xs transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Entrar no Teleatendimento
                          </button>
                        )}

                        {apt.meetingUrl && (
                          <a
                            href={apt.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            Google Meet
                          </a>
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

      {/* Tab: Meus Questionários e Acompanhamento */}
      {currentTab === 'patient_forms' && (
        <PatientFormList
          patientId={user?.id || 'pat_lucas'}
          patientName={user?.name || 'Paciente'}
          patientEmail={user?.email}
        />
      )}

      {/* Tab 3: Orientações & Apoio */}
      {currentTab === 'patient_records' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Como escolher entre Terapia e Aconselhamento Bíblico */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-5 h-5 text-sky-700 dark:text-sky-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Qual Modalidade de Cuidado Escolher?
              </h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-sky-50/60 dark:bg-sky-950/50 rounded-xl border border-sky-100 dark:border-sky-800/80">
                <strong className="text-sky-950 dark:text-sky-200 font-bold block mb-1">
                  🧠 Terapia Emocional, Comportamental & Psicológica:
                </strong>
                <p>
                  Indicada para tratamento de ansiedade, depressão, estresse, fobias, autoconhecimento e padrões cognitivo-comportamentais com psicólogos (CRP), psicanalistas e terapeutas integrativos.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/50 rounded-xl border border-amber-100 dark:border-amber-800/80">
                <strong className="text-amber-950 dark:text-amber-200 font-bold block mb-1">
                  📖 Aconselhamento Bíblico & Pastoral:
                </strong>
                <p>
                  Indicado para pessoas e famílias que buscam orientação espiritual, restauração conjugal à luz da fé, dilemas morais e fortalecimento bíblico com pastores ordenados e conselheiros cristãos.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Canais de Apoio Emergencial */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <PhoneCall className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Canais de Apoio Emergencial
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Teleconsultas e aconselhamentos não substituem prontos-socorros em situações de emergência grave, crise aguda ou risco iminente.
            </p>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="font-bold flex items-center justify-between">
                <span>CVV - Centro de Valorização da Vida</span>
                <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300">Ligue 188</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Atendimento telefônico gratuito, confidencial e 24 horas por dia em todo o território nacional.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <span><strong>SAMU:</strong> Ligue 192 em caso de emergência médica imediata.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Diário de Humor & Bem-Estar */}
      {currentTab === 'mood_tracker' && (
        <PatientMoodTrackerView
          patientId={user?.id || 'pat_lucas'}
          patientName={user ? user.name.split(' ')[0] : 'Lucas'}
        />
      )}

      {/* Modal de Agendamento */}
      {selectedProfessionalForBooking && (
        <BookingModal
          isOpen={!!selectedProfessionalForBooking}
          onClose={() => setSelectedProfessionalForBooking(null)}
          psychologist={selectedProfessionalForBooking}
          onBookingSuccess={handleBookingSuccess}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* Modal de Acolhimento & Matching do Paciente */}
      <PatientMatchingModal
        isOpen={isMatchingModalOpen}
        onClose={() => setIsMatchingModalOpen(false)}
      />
    </div>
  );
};
