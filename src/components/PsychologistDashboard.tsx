import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Appointment, MedicalRecord } from '../types';
import { AvailabilityManager } from './AvailabilityManager';
import { MedicalRecordModal } from './MedicalRecordModal';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter
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
  const [currentTab, setCurrentTab] = useState<'agenda' | 'availability' | 'records' | 'profile'>(
    (activeSubTab as any) || 'agenda'
  );

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    user ? storage.getAppointments(user.id, 'psychologist') : []
  );

  // Selected appointment for Medical Record Modal
  const [recordAppointment, setRecordAppointment] = useState<Appointment | null>(null);

  // Filter state for appointments
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  // Profile edit states
  const [bio, setBio] = useState(user?.bio || '');
  const [crp, setCrp] = useState(user?.crp || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate || 180);
  const [phone, setPhone] = useState(user?.phone || '');
  const [approachesText, setApproachesText] = useState(
    user?.approaches?.join(', ') || 'TCC, Ansiedade, Mindfulness'
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const appArray = approachesText.split(',').map(s => s.trim()).filter(Boolean);
    updateProfile({
      bio,
      crp,
      hourlyRate: Number(hourlyRate),
      phone,
      approaches: appArray,
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === todayStr && a.status === 'scheduled');
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  const uniquePatients = new Set(appointments.map(a => a.patientId)).size;
  const activeSlots = user ? storage.getAvailabilitySlots(user.id).filter(s => s.isActive).length : 0;

  // Filtered appointments
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  // All medical records for psychologist
  const allRecords: MedicalRecord[] = user ? storage.getMedicalRecords(user.id) : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xl">
              {user?.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {user?.name}
              </h1>
              <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                {user?.crp || 'CRP Ativo'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Portal do Psicólogo Clínico · Atendimento ético, teleconsultas e gestão de prontuários em conformidade com o CFP.
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
            onClick={() => setCurrentTab('availability')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'availability' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disponibilidade ({activeSlots})
          </button>
          <button
            onClick={() => setCurrentTab('records')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'records' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prontuários ({allRecords.length})
          </button>
          <button
            onClick={() => setCurrentTab('profile')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'profile' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Editar Perfil
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sessões Hoje</span>
            <Calendar className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{todayApts.length}</span>
          <span className="block text-[11px] text-slate-400 mt-1">
            {todayApts.length > 0 ? 'Consultas marcadas para hoje' : 'Nenhuma consulta pendente hoje'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pacientes Ativos</span>
            <Users className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{uniquePatients}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Pacientes cadastrados na sua base</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Vagas na Grade</span>
            <Clock className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{activeSlots}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Horários semanais abertos</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Honorário / Sessão</span>
            <DollarSign className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            R$ {user?.hourlyRate || 180}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">Duração média de 50 minutos</span>
        </div>
      </div>

      {/* Tab 1: Agenda de Consultas */}
      {currentTab === 'agenda' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Agenda de Atendimentos
              </h2>
              <p className="text-xs text-slate-500">
                Gerencie suas teleconsultas, acesse as salas virtuais e anote evoluções nos prontuários.
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
                Quando os pacientes agendarem horários livres na sua grade semanal, as consultas aparecerão aqui.
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
                            <strong className="text-slate-700">Demanda do paciente:</strong> {apt.notesFromPatient}
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
                          onClick={() => setRecordAppointment(apt)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-sky-800 border border-slate-200 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-700" />
                          Prontuário (PEP)
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

      {/* Tab 3: Prontuário Geral do Paciente (PEP) */}
      {currentTab === 'records' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Prontuários Eletrônicos de Pacientes
              </h2>
              <p className="text-xs text-slate-500">
                Registros protegidos, anotações de evolução clínica e histórico confidencial por paciente.
              </p>
            </div>
          </div>

          {allRecords.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum prontuário registrado ainda</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Após realizar as primeiras sessões de teleconsulta, registre as evoluções clínicas diretamente pela agenda ou durante a consulta online.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allRecords.map(rec => (
                <div
                  key={rec.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{rec.patientName}</h3>
                      <span className="text-xs text-slate-500">Sessão em {rec.sessionDate}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Sigilo Ético
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Queixa Principal:
                    </span>
                    <p className="text-xs text-slate-600 line-clamp-2">{rec.chiefComplaint}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Evolução Clínica:
                    </span>
                    <p className="text-xs text-slate-600 line-clamp-3">{rec.clinicalEvolution}</p>
                  </div>

                  {rec.privateNotes && (
                    <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200/80 text-xs text-amber-900">
                      <strong className="block text-[11px] text-amber-950 font-bold mb-0.5">
                        Anotações Confidenciais:
                      </strong>
                      <p className="line-clamp-2">{rec.privateNotes}</p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        const targetApt = appointments.find(a => a.id === rec.appointmentId) || {
                          id: rec.appointmentId,
                          psychologistId: rec.psychologistId,
                          psychologistName: user?.name || '',
                          patientId: rec.patientId,
                          patientName: rec.patientName,
                          patientEmail: '',
                          date: rec.sessionDate,
                          time: '14:00',
                          endTime: '14:50',
                          status: 'completed',
                          meetingType: 'native',
                          createdAt: rec.updatedAt,
                        };
                        setRecordAppointment(targetApt);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-sky-800 bg-white border border-slate-200 rounded-lg hover:bg-sky-50 transition-colors"
                    >
                      Abrir e Editar Ficha Completa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Editar Perfil */}
      {currentTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs max-w-3xl space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Perfil Profissional e Credenciais
            </h2>
            <p className="text-xs text-slate-500">
              Mantenha suas informações cadastrais e registro no CRP atualizados para os pacientes.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Perfil profissional atualizado com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registro Profissional (CRP)
                </label>
                <input
                  type="text"
                  required
                  value={crp}
                  onChange={e => setCrp(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>

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
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor da Sessão (R$)
              </label>
              <input
                type="number"
                min={50}
                max={1000}
                value={hourlyRate}
                onChange={e => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Abordagens e Especialidades (Separadas por vírgula)
              </label>
              <input
                type="text"
                value={approachesText}
                onChange={e => setApproachesText(e.target.value)}
                placeholder="Ex: TCC, Ansiedade, Mindfulness, Psicanálise"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Apresentação Profissional e Biografia
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Escreva sobre sua formação acadêmica, anos de experiência e forma de trabalho..."
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 leading-relaxed font-sans"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Prontuário Médico */}
      {recordAppointment && (
        <MedicalRecordModal
          isOpen={!!recordAppointment}
          onClose={() => {
            setRecordAppointment(null);
            refreshAppointments();
          }}
          appointment={recordAppointment}
        />
      )}
    </div>
  );
};
