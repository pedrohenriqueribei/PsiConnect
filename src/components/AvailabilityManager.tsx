import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { AvailabilitySlot, MeetingType } from '../types';
import { Clock, Plus, Trash2, CheckCircle2, Video, ExternalLink, Calendar, Info } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const AvailabilityManager: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() =>
    user ? storage.getAvailabilitySlots(user.id) : []
  );

  // New slot form state
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Teleconsultation settings
  const [defaultMeetingType, setDefaultMeetingType] = useState<MeetingType>(
    user?.defaultMeetingType || 'native'
  );
  const [externalMeetingUrl, setExternalMeetingUrl] = useState<string>(
    user?.externalMeetingUrl || ''
  );

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (startTime >= endTime) {
      setFeedbackMsg('O horário inicial deve ser anterior ao horário final.');
      return;
    }

    // Check duplicate
    const exists = slots.some(
      s => s.dayOfWeek === selectedDay && s.startTime === startTime
    );
    if (exists) {
      setFeedbackMsg('Este horário já está cadastrado para este dia da semana.');
      return;
    }

    const created = storage.addAvailabilitySlot({
      psychologistId: user.id,
      dayOfWeek: selectedDay,
      startTime,
      endTime,
      isActive: true,
    });

    setSlots(storage.getAvailabilitySlots(user.id));
    setFeedbackMsg('Horário adicionado à sua grade de atendimento com sucesso!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleRemoveSlot = (slotId: string) => {
    storage.removeAvailabilitySlot(slotId);
    if (user) {
      setSlots(storage.getAvailabilitySlots(user.id));
    }
  };

  const handleToggleSlot = (slotId: string) => {
    storage.toggleAvailabilitySlot(slotId);
    if (user) {
      setSlots(storage.getAvailabilitySlots(user.id));
    }
  };

  const handleSaveTeleconsultationSettings = () => {
    updateProfile({
      defaultMeetingType,
      externalMeetingUrl,
    });
    setFeedbackMsg('Configurações de teleatendimento salvas com sucesso!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Group slots by day
  const slotsByDay: Record<number, AvailabilitySlot[]> = {};
  for (let i = 0; i < 7; i++) {
    slotsByDay[i] = slots
      .filter(s => s.dayOfWeek === i)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Gestão de Disponibilidade e Horários
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Defina sua grade semanal de atendimentos e a modalidade de teleconsulta para os pacientes.
        </p>
      </div>

      {feedbackMsg && (
        <div className="flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid: Configurações de Teleconsulta & Novo Horário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Adicionar Horário */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Clock className="w-5 h-5 text-sky-700" />
            <h3 className="text-base font-semibold text-slate-900">
              Lançar Novo Horário na Grade
            </h3>
          </div>

          <form onSubmit={handleAddSlot} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dia da Semana
                </label>
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Início da Sessão
                </label>
                <select
                  value={startTime}
                  onChange={e => {
                    const st = e.target.value;
                    setStartTime(st);
                    const [h, m] = st.split(':').map(Number);
                    const endH = (h + 1).toString().padStart(2, '0');
                    setEndTime(`${endH}:${m.toString().padStart(2, '0')}`);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 tabular-nums"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => {
                    const hStr = hour.toString().padStart(2, '0');
                    return (
                      <React.Fragment key={hour}>
                        <option value={`${hStr}:00`}>{hStr}:00</option>
                        <option value={`${hStr}:30`}>{hStr}:30</option>
                      </React.Fragment>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Término da Sessão
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Padrão recomendado pelo CFP: 50 minutos de consulta + 10 min de anotações.
              </span>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Adicionar Horário
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Modalidade de Atendimento Online */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <Video className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-semibold text-slate-900">
                Modalidade de Vídeo
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Escolha como seus atendimentos virtuais serão realizados com os pacientes.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="meetingType"
                  value="native"
                  checked={defaultMeetingType === 'native'}
                  onChange={() => setDefaultMeetingType('native')}
                  className="mt-0.5 text-sky-700 focus:ring-sky-600"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Sala Virtual Integrada PsiConnect
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Vídeo, áudio, chat privativo e bloco de notas dentro da plataforma.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="meetingType"
                  value="external"
                  checked={defaultMeetingType === 'external'}
                  onChange={() => setDefaultMeetingType('external')}
                  className="mt-0.5 text-sky-700 focus:ring-sky-600"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Link Externo (Google Meet / Zoom)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Direciona o paciente para uma sala externa de sua preferência.
                  </span>
                </div>
              </label>

              {defaultMeetingType === 'external' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Link Permanente da Reunião
                  </label>
                  <div className="relative">
                    <ExternalLink className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="url"
                      value={externalMeetingUrl}
                      onChange={e => setExternalMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/sua-sala"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveTeleconsultationSettings}
            className="w-full mt-4 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Salvar Preferência de Teleconsulta
          </button>
        </div>
      </div>

      {/* Grade Semanal de Horários Disponíveis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-700" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Grade Semanal de Horários ({slots.length} ativos)
              </h3>
              <p className="text-xs text-slate-500">
                Horários visíveis para os pacientes agendarem em tempo real.
              </p>
            </div>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Nenhum horário cadastrado ainda</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Utilize o formulário acima para lançar seus dias e horários livres de atendimento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
              const daySlots = slotsByDay[dayIndex];
              if (!daySlots || daySlots.length === 0) return null;

              return (
                <div
                  key={dayIndex}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900">{dayName}</span>
                    <span className="text-[11px] font-semibold text-sky-800">
                      {daySlots.length} {daySlots.length === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {daySlots.map(slot => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-2 rounded-md border text-xs transition-colors ${
                          slot.isActive
                            ? 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                            : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                        }`}
                      >
                        <span className="font-semibold tabular-nums">
                          {slot.startTime} às {slot.endTime}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSlot(slot.id)}
                            title={slot.isActive ? 'Pausar este horário' : 'Reativar este horário'}
                            className={`p-1 rounded hover:bg-slate-100 ${
                              slot.isActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            title="Remover horário"
                            className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
