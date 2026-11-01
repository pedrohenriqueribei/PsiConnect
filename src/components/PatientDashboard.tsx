import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User, Appointment, CareCategory, ProfessionalType, PROFESSIONAL_TYPES_CONFIG } from '../types';
import { calculateMatchScore } from '../services/matchingEngine';
import { BookingModal } from './BookingModal';
import { PatientMatchingModal } from './PatientMatchingModal';
import {
  Search,
  Calendar,
  Clock,
  Video,
  Shield,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  UserCheck,
  BookOpen,
  Brain,
  Leaf,
  Compass,
  Building2,
  Heart,
  SlidersHorizontal,
  HeartHandshake,
  Sparkles,
  Edit3,
} from 'lucide-react';

interface PatientDashboardProps {
  onJoinRoom: (appointment: Appointment) => void;
  onOpenAuth: () => void;
  activeSubTab?: string;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onJoinRoom,
  onOpenAuth,
  activeSubTab = 'catalog',
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'catalog' | 'appointments' | 'patient_records'>(
    (activeSubTab as any) || 'catalog'
  );

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
  // Social care filter
  const [onlySocialFilter, setOnlySocialFilter] = useState<boolean>(false);

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
    setBookingSuccessMsg(`Consulta com ${newApt.psychologistName} agendada para ${newApt.date} às ${newApt.time}!`);
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
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const getBadgeInfo = (p: User) => {
    const pType: ProfessionalType = (p.professionalType || (p.role === 'pastor' ? 'pastor' : p.role === 'therapist' ? 'therapist' : p.role === 'psychoanalyst' ? 'psychoanalyst' : 'psychologist')) as ProfessionalType;
    switch (pType) {
      case 'pastor':
        return {
          label: 'Pastor · Aconselhamento Bíblico',
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-200',
          icon: <BookOpen className="w-3.5 h-3.5 text-amber-700" />,
        };
      case 'therapist':
        return {
          label: 'Terapeuta · Emocional & Integrativa',
          bg: 'bg-emerald-50',
          text: 'text-emerald-900',
          border: 'border-emerald-200',
          icon: <Leaf className="w-3.5 h-3.5 text-emerald-700" />,
        };
      case 'psychoanalyst':
        return {
          label: 'Psicanalista · Análise Clínica',
          bg: 'bg-purple-50',
          text: 'text-purple-900',
          border: 'border-purple-200',
          icon: <Compass className="w-3.5 h-3.5 text-purple-700" />,
        };
      case 'psychologist':
      default:
        return {
          label: 'Psicólogo(a) · Saúde Mental & CRP',
          bg: 'bg-sky-50',
          text: 'text-sky-900',
          border: 'border-sky-200',
          icon: <Brain className="w-3.5 h-3.5 text-sky-700" />,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
            Espaço de Cuidado & Acolhimento
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Olá, {user ? user.name.split(' ')[0] : 'Visitante'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Encontre o suporte adequado para o seu momento: <strong>terapia emocional, comportamental e psicológica</strong> com psicólogos, terapeutas e psicanalistas, ou <strong>aconselhamento bíblico</strong> com pastores experientes.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'catalog' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Encontrar Especialista
          </button>
          <button
            onClick={() => setCurrentTab('appointments')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'appointments' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Minhas Consultas ({appointments.length})
          </button>
          <button
            onClick={() => setCurrentTab('patient_records')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'patient_records' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orientações de Cuidado
          </button>
        </div>
      </div>

      {/* Patient Matching Profile Banner */}
      {user && (
        <div className="bg-gradient-to-r from-teal-50 to-slate-50 border border-teal-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-teal-950">
                  {user.patientProfile ? 'Perfil de Acolhimento & Matching Ativo' : 'Complete seu Perfil de Acolhimento'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {user.patientProfile ? 'Compatibilidade Ativa' : 'Recomendado'}
                </span>
              </div>
              <p className="text-xs text-teal-900/80 mt-0.5 max-w-2xl leading-relaxed">
                {user.patientProfile
                  ? `Seu contexto (${user.patientProfile.reasonsForCare.length} queixa(s) informadas) está sendo utilizado para sugerir seu perfil aos profissionais com vivência pessoal e abordagem compatíveis.`
                  : 'Informe os motivos da sua busca, sua faixa etária e vivência familiar para ser sugerido aos profissionais que têm o perfil exato para acolher sua história.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMatchingModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-2"
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
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{bookingSuccessMsg}</span>
        </div>
      )}

      {/* Tab 1: Catálogo de Profissionais */}
      {currentTab === 'catalog' && (
        <div className="space-y-6">
          {/* Main Category Segmentation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
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
                      ? 'border-sky-700 bg-sky-50/70 text-sky-950 ring-1 ring-sky-700 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-sky-700" />
                    <span className="font-bold text-xs sm:text-sm">Todos os Especialistas</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
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
                      ? 'border-sky-700 bg-sky-50/70 text-sky-950 ring-1 ring-sky-700 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-sky-700" />
                    <span className="font-bold text-xs sm:text-sm">Terapia & Saúde Mental</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
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
                      ? 'border-amber-700 bg-amber-50/70 text-amber-950 ring-1 ring-amber-700 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-xs sm:text-sm">Aconselhamento Bíblico</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Acolhimento pastoral e suporte espiritual fundamentado nas Sagradas Escrituras (Pastores).
                  </p>
                </button>
              </div>
            </div>

            {/* Sub-Filters: Type of Professional, Keyword Search, Max Price */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search input */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, abordagem, igreja ou tema (ex: ansiedade, casamento)..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>

              {/* Sub-Type Filter Dropdown */}
              <div className="md:col-span-4">
                <select
                  value={profTypeFilter}
                  onChange={e => setProfTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                >
                  <option value="all">Todas as Especialidades</option>
                  {(categoryFilter === 'all' || categoryFilter === 'therapy') && (
                    <>
                      <option value="psychologist">Psicólogos(as) (CRP)</option>
                      <option value="therapist">Terapeutas (Emocional / Integrativa)</option>
                      <option value="psychoanalyst">Psicanalistas (Análise Clínica)</option>
                    </>
                  )}
                  {(categoryFilter === 'all' || categoryFilter === 'biblical') && (
                    <option value="pastor">Pastores(as) (Aconselhamento Bíblico)</option>
                  )}
                </select>
              </div>

              {/* Price Filter Slider & Social Toggle */}
              <div className="md:col-span-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Até R$ {maxPrice},00</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={350}
                  step={10}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-sky-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Social Care Filter Toggle Pill */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOnlySocialFilter(!onlySocialFilter)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  onlySocialFilter
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Filtrar vagas de Atendimento Social</span>
                {onlySocialFilter && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
              </button>

              <span className="text-[11px] text-slate-400">
                Atendimento social voltado ao acolhimento acessível de pessoas em vulnerabilidade.
              </span>
            </div>
          </div>

          {/* Active filter count banner */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Exibindo <strong>{filteredProfessionals.length}</strong> {filteredProfessionals.length === 1 ? 'profissional' : 'profissionais'} disponíveis
              {onlySocialFilter && ' com vagas sociais ativas'}
            </span>
            {(categoryFilter !== 'all' || profTypeFilter !== 'all' || searchTerm || maxPrice < 300 || onlySocialFilter) && (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setProfTypeFilter('all');
                  setSearchTerm('');
                  setMaxPrice(300);
                  setOnlySocialFilter(false);
                }}
                className="text-sky-700 hover:underline font-semibold"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* List of Professional Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map(prof => {
              const badge = getBadgeInfo(prof);
              const pType: ProfessionalType = (prof.professionalType || (prof.role === 'pastor' ? 'pastor' : prof.role === 'therapist' ? 'therapist' : prof.role === 'psychoanalyst' ? 'psychoanalyst' : 'psychologist')) as ProfessionalType;

              return (
                <div
                  key={prof.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    {/* Header with avatar & name */}
                    <div className="flex items-start gap-4">
                      {prof.avatar ? (
                        <img
                          src={prof.avatar}
                          alt={prof.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xl shrink-0">
                          {prof.name.charAt(0)}
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {prof.name}
                          </h3>
                        </div>

                        {/* Professional Type Badge & Matching Score */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </div>

                          {user && user.patientProfile && (() => {
                            const match = calculateMatchScore(prof, user);
                            return (
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  match.score >= 85
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-sky-50 text-sky-800 border-sky-200'
                                }`}
                                title={match.highlights.join(' · ')}
                              >
                                <Sparkles className="w-3 h-3 text-sky-600" />
                                <span>{match.score}% Compatível</span>
                              </div>
                            );
                          })()}

                          {storage.getAvailabilitySlots(prof.id).some(s => s.isSocial && s.isActive) && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
                              <HeartHandshake className="w-3 h-3 text-emerald-600" />
                              <span>Atendimento Social</span>
                            </div>
                          )}
                        </div>

                        {/* Credential or Church: CRP only for psychologists */}
                        <div className="text-[11px] text-slate-500 font-medium">
                          {pType === 'psychologist' && (prof.crp || prof.registrationNumber) && (
                            <span className="text-sky-900 font-semibold">
                              {prof.crp || prof.registrationNumber}
                            </span>
                          )}
                          {pType === 'pastor' && prof.ministryOrChurch && (
                            <span className="flex items-center gap-1 text-amber-900">
                              <Building2 className="w-3 h-3 text-amber-700" />
                              {prof.ministryOrChurch}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 block">
                          {prof.city ? `${prof.city}, ${prof.state}` : 'Atendimento Online no Brasil'}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {prof.bio || 'Profissional dedicado ao acolhimento e desenvolvimento humano.'}
                    </p>

                    {/* Tags de Experiência Clínica (ex: Ansiedade, Luto, Relacionamentos) */}
                    {prof.clinicalTags && prof.clinicalTags.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Foco Clínico & Temas:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {prof.clinicalTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-200/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approaches / Abordagens */}
                    {prof.approaches && prof.approaches.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {prof.approaches
                          .filter(a => !prof.clinicalTags?.includes(a))
                          .map((app, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                pType === 'pastor'
                                  ? 'bg-amber-50 text-amber-900 border border-amber-100'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {app}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Price & Booking Action */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Sessão de 50 min
                      </span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        R$ {prof.hourlyRate || 180},00
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          onOpenAuth();
                        } else {
                          setSelectedProfessionalForBooking(prof);
                        }
                      }}
                      className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                        pType === 'pastor'
                          ? 'bg-amber-700 hover:bg-amber-800'
                          : 'bg-sky-700 hover:bg-sky-800'
                      }`}
                    >
                      {pType === 'pastor' ? 'Agendar Aconselhamento' : 'Agendar Consulta'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProfessionals.length === 0 && (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum profissional encontrado com os filtros atuais</p>
              <p className="text-xs text-slate-400 mt-1">Tente alternar para outra categoria ou redefinir a busca.</p>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setProfTypeFilter('all');
                  setSearchTerm('');
                  setMaxPrice(300);
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Minhas Consultas e Aconselhamentos Agendados
              </h2>
              <p className="text-xs text-slate-500">
                Acesse suas teleconsultas online e visualize o histórico de atendimentos terapêuticos e bíblicos.
              </p>
            </div>
          </div>

          {!user ? (
            <div className="py-12 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Acesse sua conta para ver suas consultas</p>
              <button
                onClick={onOpenAuth}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
              >
                Fazer Login
              </button>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Você ainda não tem consultas agendadas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Encontre o profissional ideal para a sua necessidade (psicólogo, terapeuta, psicanalista ou pastor) e agende seu horário com segurança.
              </p>
              <button
                onClick={() => setCurrentTab('catalog')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
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
                        ? 'bg-sky-50/50 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {apt.psychologistAvatar ? (
                          <img
                            src={apt.psychologistAvatar}
                            alt={apt.psychologistName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                            {apt.psychologistName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {apt.psychologistName}
                            </span>
                            {apt.psychologistCrp && (
                              <span className="text-xs text-sky-800 font-medium">
                                {apt.psychologistCrp}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                apt.status === 'scheduled'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {apt.status === 'scheduled' ? 'Agendada' : 'Realizada'}
                            </span>
                            {apt.isSocial && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded inline-flex items-center gap-1 shadow-2xs">
                                <HeartHandshake className="w-3 h-3 text-emerald-600" />
                                <span>
                                  Atendimento Social{apt.socialRate !== undefined ? ` (R$ ${apt.socialRate})` : ''}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 tabular-nums">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-sky-700" />
                              {apt.date}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-sky-700" />
                              {apt.time} às {apt.endTime}
                            </span>
                          </div>

                          {apt.notesFromPatient && (
                            <p className="text-xs text-slate-500 mt-2">
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
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
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
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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

      {/* Tab 3: Orientações & Apoio */}
      {currentTab === 'patient_records' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Como escolher entre Terapia e Aconselhamento Bíblico */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-bold text-slate-900">
                Qual Modalidade de Cuidado Escolher?
              </h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100">
                <strong className="text-sky-950 font-bold block mb-1">
                  🧠 Terapia Emocional, Comportamental & Psicológica:
                </strong>
                <p>
                  Indicada para tratamento de ansiedade, depressão, estresse, fobias, autoconhecimento e padrões cognitivo-comportamentais com psicólogos (CRP), psicanalistas e terapeutas integrativos.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <strong className="text-amber-950 font-bold block mb-1">
                  📖 Aconselhamento Bíblico & Pastoral:
                </strong>
                <p>
                  Indicado para pessoas e famílias que buscam orientação espiritual, restauração conjugal à luz da fé, dilemas morais e fortalecimento bíblico com pastores ordenados e conselheiros cristãos.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Canais de Apoio Emergencial */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <PhoneCall className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Canais de Apoio Emergencial
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Teleconsultas e aconselhamentos não substituem prontos-socorros em situações de emergência grave, crise aguda ou risco iminente.
            </p>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center justify-between">
                <span>CVV - Centro de Valorização da Vida</span>
                <span className="text-sm font-extrabold text-amber-800">Ligue 188</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Atendimento telefônico gratuito, confidencial e 24 horas por dia em todo o território nacional.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span><strong>SAMU:</strong> Ligue 192 em caso de emergência médica imediata.</span>
            </div>
          </div>
        </div>
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
