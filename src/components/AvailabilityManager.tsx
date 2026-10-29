import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { AvailabilitySlot, MeetingType } from '../types';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Video,
  ExternalLink,
  Calendar,
  HeartHandshake,
  CalendarDays,
  Sparkles,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { index: 0, name: 'Domingo', short: 'Dom' },
  { index: 1, name: 'Segunda-feira', short: 'Seg' },
  { index: 2, name: 'Terça-feira', short: 'Ter' },
  { index: 3, name: 'Quarta-feira', short: 'Qua' },
  { index: 4, name: 'Quinta-feira', short: 'Qui' },
  { index: 5, name: 'Sexta-feira', short: 'Sex' },
  { index: 6, name: 'Sábado', short: 'Sáb' },
];

export const AvailabilityManager: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() =>
    user ? storage.getAvailabilitySlots(user.id) : []
  );

  // Tab between period launch vs single quick slot
  const [creationMode, setCreationMode] = useState<'period' | 'single'>('period');

  // Filter existing slots
  const [slotTypeFilter, setSlotTypeFilter] = useState<'all' | 'social' | 'regular'>('all');

  // Today formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to add days
  const addDaysToToday = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Helper for end of current month
  const getEndOfCurrentMonth = (): string => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  };

  // --- Period Form State ---
  const [periodStartDate, setPeriodStartDate] = useState<string>(todayStr);
  const [periodEndDate, setPeriodEndDate] = useState<string>(addDaysToToday(30));
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday by default
  const [periodStartTime, setPeriodStartTime] = useState<string>('09:00');
  const [periodEndTime, setPeriodEndTime] = useState<string>('10:00');
  const [periodIsSocial, setPeriodIsSocial] = useState<boolean>(false);
  const [periodSocialRate, setPeriodSocialRate] = useState<number>(40);

  // Multiple time blocks in a period (e.g. 09:00-10:00, 14:00-15:00)
  const [additionalTimeBlocks, setAdditionalTimeBlocks] = useState<Array<{ startTime: string; endTime: string }>>([]);

  // --- Single Slot Form State ---
  const [singleDay, setSingleDay] = useState<number>(1);
  const [singleStartTime, setSingleStartTime] = useState<string>('14:00');
  const [singleEndTime, setSingleEndTime] = useState<string>('15:00');
  const [singleIsSocial, setSingleIsSocial] = useState<boolean>(false);
  const [singleSocialRate, setSingleSocialRate] = useState<number>(40);

  // Feedback states
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Teleconsultation settings
  const [defaultMeetingType, setDefaultMeetingType] = useState<MeetingType>(
    user?.defaultMeetingType || 'native'
  );
  const [externalMeetingUrl, setExternalMeetingUrl] = useState<string>(
    user?.externalMeetingUrl || ''
  );

  const refreshSlots = () => {
    if (user) {
      setSlots(storage.getAvailabilitySlots(user.id));
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Toggle day of week in multi-select
  const handleToggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  // Preset day selections
  const handleSelectWeekdays = () => setSelectedDays([1, 2, 3, 4, 5]);
  const handleSelectAllDays = () => setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  const handleSelectWeekend = () => setSelectedDays([0, 6]);
  const handleClearDays = () => setSelectedDays([]);

  // Add another time block to period
  const handleAddExtraTimeBlock = () => {
    setAdditionalTimeBlocks(prev => [...prev, { startTime: '14:00', endTime: '15:00' }]);
  };

  const handleRemoveExtraTimeBlock = (index: number) => {
    setAdditionalTimeBlocks(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Period Availability
  const handleAddPeriodSlots = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!periodStartDate || !periodEndDate) {
      showFeedback('error', 'Por favor, informe a data inicial e a data final do período.');
      return;
    }

    if (periodStartDate > periodEndDate) {
      showFeedback('error', 'A data inicial não pode ser posterior à data final do período.');
      return;
    }

    if (selectedDays.length === 0) {
      showFeedback('error', 'Selecione ao menos um dia da semana para o período.');
      return;
    }

    // Collect all time blocks
    const timeBlocks = [
      { startTime: periodStartTime, endTime: periodEndTime },
      ...additionalTimeBlocks,
    ];

    // Validate times
    for (const tb of timeBlocks) {
      if (tb.startTime >= tb.endTime) {
        showFeedback('error', `O horário inicial (${tb.startTime}) deve ser anterior ao de término (${tb.endTime}).`);
        return;
      }
    }

    // Construct slot payloads
    const newSlotsToCreate: Omit<AvailabilitySlot, 'id'>[] = [];
    let duplicateCount = 0;

    for (const day of selectedDays) {
      for (const tb of timeBlocks) {
        // Check if an identical slot already exists
        const exists = slots.some(
          s =>
            s.dayOfWeek === day &&
            s.startTime === tb.startTime &&
            s.startDate === periodStartDate &&
            s.endDate === periodEndDate
        );

        if (exists) {
          duplicateCount++;
          continue;
        }

        newSlotsToCreate.push({
          psychologistId: user.id,
          dayOfWeek: day,
          startTime: tb.startTime,
          endTime: tb.endTime,
          isActive: true,
          startDate: periodStartDate,
          endDate: periodEndDate,
          isSocial: periodIsSocial,
          socialRate: periodIsSocial ? Number(periodSocialRate) : undefined,
        });
      }
    }

    if (newSlotsToCreate.length === 0) {
      showFeedback('error', 'Todos os horários selecionados para esse período já estavam cadastrados na sua grade.');
      return;
    }

    storage.addAvailabilitySlotsBatch(newSlotsToCreate);
    refreshSlots();

    const socialNote = periodIsSocial ? ' com atendimento social ativado' : '';
    showFeedback(
      'success',
      `Sucesso! ${newSlotsToCreate.length} horário(s) lançado(s) para o período de ${periodStartDate.split('-').reverse().join('/')} até ${periodEndDate.split('-').reverse().join('/')}${socialNote}.${
        duplicateCount > 0 ? ` (${duplicateCount} já existentes foram ignorados)` : ''
      }`
    );
  };

  // Submit Single Quick Slot
  const handleAddSingleSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (singleStartTime >= singleEndTime) {
      showFeedback('error', 'O horário inicial deve ser anterior ao horário de término.');
      return;
    }

    // Check duplicate
    const exists = slots.some(
      s => s.dayOfWeek === singleDay && s.startTime === singleStartTime && !s.startDate
    );
    if (exists) {
      showFeedback('error', 'Este horário já está cadastrado para este dia da semana.');
      return;
    }

    storage.addAvailabilitySlot({
      psychologistId: user.id,
      dayOfWeek: singleDay,
      startTime: singleStartTime,
      endTime: singleEndTime,
      isActive: true,
      isSocial: singleIsSocial,
      socialRate: singleIsSocial ? Number(singleSocialRate) : undefined,
    });

    refreshSlots();
    showFeedback('success', 'Horário semanal adicionado com sucesso!');
  };

  const handleRemoveSlot = (slotId: string) => {
    storage.removeAvailabilitySlot(slotId);
    refreshSlots();
  };

  const handleToggleSlot = (slotId: string) => {
    storage.toggleAvailabilitySlot(slotId);
    refreshSlots();
  };

  const handleSaveTeleconsultationSettings = () => {
    updateProfile({
      defaultMeetingType,
      externalMeetingUrl,
    });
    showFeedback('success', 'Configurações de teleatendimento salvas com sucesso!');
  };

  // Filter slots
  const filteredSlots = slots.filter(s => {
    if (slotTypeFilter === 'social') return s.isSocial === true;
    if (slotTypeFilter === 'regular') return !s.isSocial;
    return true;
  });

  // Group filtered slots by day
  const slotsByDay: Record<number, AvailabilitySlot[]> = {};
  for (let i = 0; i < 7; i++) {
    slotsByDay[i] = filteredSlots
      .filter(s => s.dayOfWeek === i)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Count social slots
  const socialSlotsCount = slots.filter(s => s.isSocial).length;
  const periodSlotsCount = slots.filter(s => s.startDate && s.endDate).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Gestão de Disponibilidade e Períodos
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Lance sua disponibilidade por períodos com datas de início e fim, selecione os dias da semana e destine vagas para atendimento social.
          </p>
        </div>

        {/* Quick status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Calendar className="w-3.5 h-3.5" />
            <span>{slots.length} vagas totais</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span>{socialSlotsCount} vagas sociais</span>
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-start gap-2.5 p-4 text-sm rounded-xl border transition-all ${
            feedbackMsg.type === 'success'
              ? 'text-emerald-900 bg-emerald-50/90 border-emerald-200'
              : 'text-red-900 bg-red-50/90 border-red-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          )}
          <span className="font-medium leading-relaxed">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Form: Launch Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Form Mode Selector Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
            <button
              type="button"
              onClick={() => setCreationMode('period')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                creationMode === 'period'
                  ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-sky-700" />
              <span>Lançar por Período de Atendimento</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded-md">
                Recomendado
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCreationMode('single')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                creationMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Lançar Horário Semanal Contínuo</span>
            </button>
          </div>

          <div className="p-6">
            {creationMode === 'period' ? (
              /* --- FORM 1: PERIOD AVAILABILITY LAUNCH --- */
              <form onSubmit={handleAddPeriodSlots} className="space-y-6">
                {/* Intro message */}
                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 text-xs text-sky-950 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <p>
                    Configure um período de atendimento definindo a data de início, data de término, os dias recorrentes da semana e os horários das sessões.
                  </p>
                </div>

                {/* 1. Data Inicial e Data Final */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-700" />
                    1. Período de Vigência
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-medium text-slate-700 mb-1">
                        Data Inicial <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="date"
                        required
                        value={periodStartDate}
                        onChange={e => {
                          setPeriodStartDate(e.target.value);
                          if (periodEndDate < e.target.value) {
                            setPeriodEndDate(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-slate-700 mb-1">
                        Data Final <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="date"
                        required
                        min={periodStartDate}
                        value={periodEndDate}
                        onChange={e => setPeriodEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* Date quick shortcut pills */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">Atalhos rápidos:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodStartDate(todayStr);
                        setPeriodEndDate(addDaysToToday(15));
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      +15 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodStartDate(todayStr);
                        setPeriodEndDate(addDaysToToday(30));
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      +30 dias (1 mês)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodStartDate(todayStr);
                        setPeriodEndDate(addDaysToToday(60));
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      +60 dias (2 meses)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodStartDate(todayStr);
                        setPeriodEndDate(getEndOfCurrentMonth());
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      Até o fim deste mês
                    </button>
                  </div>
                </div>

                {/* 2. Selecionar os Dias da Semana */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-sky-700" />
                      2. Selecione os Dias da Semana
                    </label>
                    <span className="text-xs font-semibold text-sky-800">
                      {selectedDays.length} {selectedDays.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                    </span>
                  </div>

                  {/* Multi-select chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = selectedDays.includes(day.index);
                      return (
                        <button
                          key={day.index}
                          type="button"
                          onClick={() => handleToggleDay(day.index)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-sky-600 bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-[11px] uppercase tracking-wider">{day.short}</span>
                          <span className="text-[10px] font-normal opacity-90 mt-0.5">{day.name.split('-')[0]}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 mt-1" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick day buttons */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectWeekdays}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Dias Úteis (Seg a Sex)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllDays}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Todos os Dias
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectWeekend}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Finais de Semana (Sáb/Dom)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDays}
                      className="px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Limpar seleção
                    </button>
                  </div>
                </div>

                {/* 3. Horário de Disponibilidade */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-700" />
                    3. Horário de Disponibilidade
                  </label>

                  <div className="space-y-3">
                    {/* Primary Time Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <span className="block text-xs font-medium text-slate-700 mb-1">
                          Início da Sessão
                        </span>
                        <select
                          value={periodStartTime}
                          onChange={e => {
                            const st = e.target.value;
                            setPeriodStartTime(st);
                            const [h, m] = st.split(':').map(Number);
                            const endH = (h + 1).toString().padStart(2, '0');
                            setPeriodEndTime(`${endH}:${m.toString().padStart(2, '0')}`);
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 tabular-nums font-semibold"
                        >
                          {Array.from({ length: 16 }, (_, i) => i + 7).map(hour => {
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
                        <span className="block text-xs font-medium text-slate-700 mb-1">
                          Término da Sessão
                        </span>
                        <input
                          type="text"
                          value={periodEndTime}
                          onChange={e => setPeriodEndTime(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white tabular-nums focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Additional time blocks if professional wants to launch multiple hours at once */}
                    {additionalTimeBlocks.map((block, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 items-end"
                      >
                        <div className="sm:col-span-2">
                          <span className="block text-xs font-medium text-slate-700 mb-1">
                            Início Adicional #{idx + 2}
                          </span>
                          <select
                            value={block.startTime}
                            onChange={e => {
                              const newTime = e.target.value;
                              const [h, m] = newTime.split(':').map(Number);
                              const endH = (h + 1).toString().padStart(2, '0');
                              const newEnd = `${endH}:${m.toString().padStart(2, '0')}`;
                              setAdditionalTimeBlocks(prev =>
                                prev.map((item, i) => (i === idx ? { startTime: newTime, endTime: newEnd } : item))
                              );
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                          >
                            {Array.from({ length: 16 }, (_, i) => i + 7).map(hour => {
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

                        <div className="sm:col-span-2">
                          <span className="block text-xs font-medium text-slate-700 mb-1">
                            Término
                          </span>
                          <input
                            type="text"
                            value={block.endTime}
                            onChange={e => {
                              const val = e.target.value;
                              setAdditionalTimeBlocks(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, endTime: val } : item))
                              );
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraTimeBlock(idx)}
                            className="w-full py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddExtraTimeBlock}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar outro horário para os mesmos dias (ex: tarde ou noite)
                    </button>
                  </div>
                </div>

                {/* 4. Campo de Atendimento Social */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    periodIsSocial
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={periodIsSocial}
                      onChange={e => setPeriodIsSocial(e.target.checked)}
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <HeartHandshake
                          className={`w-4 h-4 ${periodIsSocial ? 'text-emerald-700' : 'text-slate-500'}`}
                        />
                        <span className="text-xs font-bold text-slate-900">
                          Disponibilidade para Atendimento Social
                        </span>
                        {periodIsSocial && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Ativado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Marque esta opção para destinar os horários deste período ao acolhimento social (com valor diferenciado acessível ou voluntário) para pacientes de baixa renda.
                      </p>

                      {periodIsSocial && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div>
                            <label className="block text-xs font-semibold text-emerald-950 mb-1">
                              Honorário Social por Sessão (R$)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={periodSocialRate}
                              onChange={e => setPeriodSocialRate(Number(e.target.value))}
                              placeholder="0 para gratuito ou valor social"
                              className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-semibold text-emerald-950"
                            />
                            <span className="text-[11px] text-emerald-700 block mt-1">
                              {periodSocialRate === 0
                                ? '✓ Sessão gratuita / voluntária solidária'
                                : `✓ Cobrança social de R$ ${periodSocialRate},00 por sessão`}
                            </span>
                          </div>

                          <div className="text-[11px] text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                            <strong>Visibilidade no perfil:</strong> Os pacientes verão a marcação especial <strong>"Atendimento Social"</strong> ao escolherem este horário.
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Summary Strip */}
                <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>
                      Total no lote: <strong>{selectedDays.length} dia(s)</strong> ×{' '}
                      <strong>{1 + additionalTimeBlocks.length} horário(s)</strong> ={' '}
                      <strong>{selectedDays.length * (1 + additionalTimeBlocks.length)} vagas</strong> por semana no período selecionado.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={selectedDays.length === 0}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Lançar Disponibilidade do Período
                  </button>
                </div>
              </form>
            ) : (
              /* --- FORM 2: SINGLE SLOT LAUNCH --- */
              <form onSubmit={handleAddSingleSlot} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  Lança um horário fixo semanal contínuo na sua grade de atendimentos (sem prazo final estrito).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Dia da Semana
                    </label>
                    <select
                      value={singleDay}
                      onChange={e => setSingleDay(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d.index} value={d.index}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Início da Sessão
                    </label>
                    <select
                      value={singleStartTime}
                      onChange={e => {
                        const st = e.target.value;
                        setSingleStartTime(st);
                        const [h, m] = st.split(':').map(Number);
                        const endH = (h + 1).toString().padStart(2, '0');
                        setSingleEndTime(`${endH}:${m.toString().padStart(2, '0')}`);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 tabular-nums font-semibold"
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
                      value={singleEndTime}
                      onChange={e => setSingleEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white tabular-nums font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                {/* Social care checkbox for single slot */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    singleIsSocial ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={singleIsSocial}
                      onChange={e => setSingleIsSocial(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-emerald-600" />
                        Disponibilidade para Atendimento Social
                      </span>
                      {singleIsSocial && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-800 font-semibold">Valor (R$):</span>
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={singleSocialRate}
                            onChange={e => setSingleSocialRate(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs border border-emerald-300 rounded bg-white font-bold text-emerald-950"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Horário Semanal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Col: Teleconsultation Mode Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <Video className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-semibold text-slate-900">
                Modalidade de Vídeo
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Escolha a ferramenta padrão para realização das sessões com os pacientes.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
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
                    Sala Virtual PsiConnect
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                    Ambiente criptografado com vídeo, áudio, chat privativo e bloco de notas.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
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
                  <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                    Redireciona o paciente para uma sala externa permanente.
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

      {/* Grade de Horários Ativos & Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Grade de Disponibilidade ({filteredSlots.length} vagas ativas)
              </h3>
              <p className="text-xs text-slate-500">
                Horários sincronizados em tempo real para os pacientes agendarem.
              </p>
            </div>
          </div>

          {/* Filter tabs for slots: All / Social Care / Regular */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setSlotTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                slotTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({slots.length})
            </button>
            <button
              onClick={() => setSlotTypeFilter('social')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                slotTypeFilter === 'social'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Atendimento Social ({socialSlotsCount})</span>
            </button>
            <button
              onClick={() => setSlotTypeFilter('regular')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                slotTypeFilter === 'regular'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Regulares ({slots.length - socialSlotsCount})
            </button>
          </div>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Nenhum horário encontrado para este filtro</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Utilize o formulário de período acima para lançar suas datas e horários disponíveis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.map(dayObj => {
              const daySlots = slotsByDay[dayObj.index];
              if (!daySlots || daySlots.length === 0) return null;

              return (
                <div
                  key={dayObj.index}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900">{dayObj.name}</span>
                    <span className="text-[11px] font-semibold text-sky-800">
                      {daySlots.length} {daySlots.length === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div
                        key={slot.id}
                        className={`p-2.5 rounded-lg border text-xs transition-colors space-y-1.5 ${
                          slot.isActive
                            ? slot.isSocial
                              ? 'bg-white border-emerald-200 shadow-2xs ring-1 ring-emerald-100'
                              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                            : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold tabular-nums text-slate-900">
                            {slot.startTime} às {slot.endTime}
                          </span>

                          <div className="flex items-center gap-1">
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

                        {/* Badges for period dates and social care */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {slot.startDate && slot.endDate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>
                                {slot.startDate.split('-').slice(1).reverse().join('/')} até{' '}
                                {slot.endDate.split('-').slice(1).reverse().join('/')}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              Semanal Contínuo
                            </span>
                          )}

                          {slot.isSocial && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <HeartHandshake className="w-2.5 h-2.5 text-emerald-600" />
                              <span>
                                Social{slot.socialRate !== undefined ? ` · R$ ${slot.socialRate}` : ''}
                              </span>
                            </span>
                          )}
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
