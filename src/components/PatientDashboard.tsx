import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User, Appointment } from '../types';
import { BookingModal } from './BookingModal';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Video,
  DollarSign,
  Shield,
  HeartHandshake,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  UserCheck
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

  // Psychologists
  const [psychologists, setPsychologists] = useState<User[]>(() =>
    storage.getPsychologists()
  );

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApproach, setSelectedApproach] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(300);

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    user ? storage.getAppointments(user.id, 'patient') : []
  );

  // Booking Modal
  const [selectedPsychologistForBooking, setSelectedPsychologistForBooking] = useState<User | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

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

  // Filter psychologists
  const filteredPsychologists = psychologists.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.approaches?.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesApproach =
      selectedApproach === 'all' ||
      p.approaches?.some(a => a.toLowerCase().includes(selectedApproach.toLowerCase()));

    const matchesPrice = !p.hourlyRate || p.hourlyRate <= maxPrice;

    return matchesSearch && matchesApproach && matchesPrice;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
            Espaço de Cuidado & Bem-Estar
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Olá, {user ? user.name.split(' ')[0] : 'Visitante'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Conecte-se a psicólogos clínicos certificados pelo CRP para atendimentos online seguros, com sigilo ético absoluto.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-stretch md:self-auto">
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-4 py-2 rounded-lg transition-all ${
              currentTab === 'catalog' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Encontrar Psicólogo
          </button>
          <button
            onClick={() => setCurrentTab('appointments')}
            className={`px-4 py-2 rounded-lg transition-all ${
              currentTab === 'appointments' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Minhas Consultas ({appointments.length})
          </button>
          <button
            onClick={() => setCurrentTab('patient_records')}
            className={`px-4 py-2 rounded-lg transition-all ${
              currentTab === 'patient_records' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orientações & Apoio
          </button>
        </div>
      </div>

      {bookingSuccessMsg && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{bookingSuccessMsg}</span>
        </div>
      )}

      {/* Tab 1: Catálogo de Psicólogos */}
      {currentTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search input */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, abordagem ou queixa (ex: TCC, ansiedade)..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>

              {/* Approach Filter */}
              <div>
                <select
                  value={selectedApproach}
                  onChange={e => setSelectedApproach(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                >
                  <option value="all">Todas as Abordagens</option>
                  <option value="Terapia Cognitivo-Comportamental">TCC</option>
                  <option value="Psicanálise">Psicanálise</option>
                  <option value="Gestalt">Gestalt-terapia</option>
                  <option value="Fenomenologia">Fenomenológica / Existencial</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Até R$ {maxPrice},00</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={350}
                  step={10}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-sky-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* List of Psychologist Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPsychologists.map(psy => {
              const slotsCount = storage.getAvailabilitySlots(psy.id).filter(s => s.isActive).length;

              return (
                <div
                  key={psy.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    {/* Header with avatar & name */}
                    <div className="flex items-start gap-4">
                      {psy.avatar ? (
                        <img
                          src={psy.avatar}
                          alt={psy.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xl shrink-0">
                          {psy.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {psy.name}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-sky-800 block mt-0.5">
                          {psy.crp}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {psy.city ? `${psy.city}, ${psy.state}` : 'Atendimento Online no Brasil'}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {psy.bio || 'Psicólogo clínico com atendimento focado no bem-estar e desenvolvimento.'}
                    </p>

                    {/* Approaches */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {psy.approaches?.map((app, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Price & Booking Action */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Sessão de 50 min
                      </span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        R$ {psy.hourlyRate || 180},00
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          onOpenAuth();
                        } else {
                          setSelectedPsychologistForBooking(psy);
                        }
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
                    >
                      Agendar Consulta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPsychologists.length === 0 && (
            <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum profissional encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar seus termos de busca ou filtros de valor.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Minhas Consultas */}
      {currentTab === 'appointments' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Minhas Consultas Agendadas
              </h2>
              <p className="text-xs text-slate-500">
                Acesse suas teleconsultas online e visualize o histórico de atendimentos.
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
                Encontre o psicólogo ideal para a sua necessidade e agende seu horário com segurança.
              </p>
              <button
                onClick={() => setCurrentTab('catalog')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
              >
                Ver Psicólogos Disponíveis
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
                            <span className="text-xs text-sky-800 font-medium">{apt.psychologistCrp}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                apt.status === 'scheduled'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {apt.status === 'scheduled' ? 'Agendada' : 'Realizada'}
                            </span>
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
                              Sua anotação inicial: "{apt.notesFromPatient}"
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
                            Entrar na Teleconsulta
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-bold text-slate-900">
                Como Funciona a Teleconsulta com Sigilo
              </h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Ambiente Privativo:</strong> Escolha um local calmo, isolado e confortável onde você possa se expressar livremente sem interrupções.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Uso de Fones de Ouvido:</strong> Recomendamos o uso de fones com microfone para maior privacidade sonora e clareza de áudio.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Sigilo Profissional:</strong> Todos os psicólogos cadastrados seguem estritamente o Código de Ética Profissional do Psicólogo (CFP). Suas sessões não são gravadas.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <PhoneCall className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Canais de Apoio Emergencial
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              A telepsicologia não substitui pronto-atendimento em situações de emergência grave ou risco imediato.
            </p>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center justify-between">
                <span>CVV - Centro de Valorização da Vida</span>
                <span className="text-sm font-extrabold text-amber-800">Ligue 188</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Atendimento telefônico gratuito, confidencial e 24 horas por dia em todo o território nacional.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      {selectedPsychologistForBooking && (
        <BookingModal
          isOpen={!!selectedPsychologistForBooking}
          onClose={() => setSelectedPsychologistForBooking(null)}
          psychologist={selectedPsychologistForBooking}
          onBookingSuccess={handleBookingSuccess}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
};
