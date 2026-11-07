import React, { useState, useEffect } from 'react';
import { MoodEntry, MoodLevel, EnergyLevel } from '../../types/mood';
import {
  MOOD_LEVELS_CONFIG,
  COMMON_FEELINGS,
  INFLUENCE_FACTORS,
  moodTrackerStorage,
} from '../../services/moodTrackerStorage';
import { MoodIcon } from './MoodIcons';
import {
  X,
  Check,
  Zap,
  Calendar,
  Sparkles,
  MessageSquare,
  Plus,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface MoodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  initialMood?: MoodLevel;
  initialDate?: string;
  existingEntry?: MoodEntry | null;
  onSaved?: (entry: MoodEntry) => void;
}

export const MoodLogModal: React.FC<MoodLogModalProps> = ({
  isOpen,
  onClose,
  patientId,
  initialMood,
  initialDate,
  existingEntry,
  onSaved,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedMood, setSelectedMood] = useState<MoodLevel>(initialMood || 4);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>('moderate');
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [customFeeling, setCustomFeeling] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Sync state whenever modal opens or date/entry changes
  useEffect(() => {
    if (isOpen) {
      const targetDate = initialDate || todayStr;
      setSelectedDate(targetDate);

      const found = existingEntry || moodTrackerStorage.getEntryForDate(patientId, targetDate);
      if (found) {
        setSelectedMood(found.mood);
        setSelectedEnergy(found.energy || 'moderate');
        setSelectedFeelings(found.feelings || []);
        setSelectedFactors(found.factors || []);
        setNote(found.note || '');
      } else {
        setSelectedMood(initialMood || 4);
        setSelectedEnergy('moderate');
        setSelectedFeelings([]);
        setSelectedFactors([]);
        setNote('');
      }
      setSuccessMessage('');
    }
  }, [isOpen, initialDate, initialMood, existingEntry, patientId]);

  if (!isOpen) return null;

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const found = moodTrackerStorage.getEntryForDate(patientId, newDate);
    if (found) {
      setSelectedMood(found.mood);
      setSelectedEnergy(found.energy || 'moderate');
      setSelectedFeelings(found.feelings || []);
      setSelectedFactors(found.factors || []);
      setNote(found.note || '');
    }
  };

  const toggleFeeling = (feeling: string) => {
    setSelectedFeelings(prev =>
      prev.includes(feeling) ? prev.filter(f => f !== feeling) : [...prev, feeling]
    );
  };

  const handleAddCustomFeeling = () => {
    const trimmed = customFeeling.trim();
    if (trimmed && !selectedFeelings.includes(trimmed)) {
      setSelectedFeelings(prev => [...prev, trimmed]);
      setCustomFeeling('');
    }
  };

  const toggleFactor = (factor: string) => {
    setSelectedFactors(prev =>
      prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const entry = moodTrackerStorage.saveEntry({
      patientId,
      date: selectedDate,
      timestamp: new Date().toISOString(),
      mood: selectedMood,
      energy: selectedEnergy,
      feelings: selectedFeelings,
      factors: selectedFactors,
      note: note.trim() || undefined,
    });

    setSuccessMessage('Check-in emocional registrado com sucesso!');
    onSaved?.(entry);

    setTimeout(() => {
      onClose();
    }, 700);
  };

  const moodLevelsList: MoodLevel[] = [5, 4, 3, 2, 1];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex items-start sm:items-center justify-center">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col transition-colors duration-200">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Diário de Humor & Bem-Estar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Como você está se sentindo hoje?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-6">
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Date Picker Row */}
          <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Data do registro:</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={e => handleDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* 1. Mood Level Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                1. Estado Emocional <span className="text-sky-600">*</span>
              </label>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                {MOOD_LEVELS_CONFIG[selectedMood].label}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {moodLevelsList.map(level => {
                const config = MOOD_LEVELS_CONFIG[level];
                const isSelected = selectedMood === level;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedMood(level)}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-center group ${
                      isSelected
                        ? `ring-2 ring-offset-2 ${config.borderColor} ring-offset-white dark:ring-offset-slate-900 shadow-md scale-105 ${config.bgColor} ${config.darkBgColor}`
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform duration-200 group-hover:scale-110 ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800/80'
                      }`}
                      style={{ color: config.color }}
                    >
                      <MoodIcon level={level} size={24} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight block truncate w-full">
                      {config.label}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
                      {level}/5
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-center">
              "{MOOD_LEVELS_CONFIG[selectedMood].sublabel}"
            </p>
          </div>

          {/* 2. Energy Level */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              2. Nível de Energia
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'low', label: 'Baixa Energia', desc: 'Lento / Esgotado', color: 'text-amber-500' },
                  { key: 'moderate', label: 'Moderada', desc: 'Equilibrado', color: 'text-sky-500' },
                  { key: 'high', label: 'Alta Energia', desc: 'Vigoroso / Disposto', color: 'text-emerald-500' },
                ] as const
              ).map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedEnergy(item.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedEnergy === item.key
                      ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 ring-1 ring-sky-600 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sentimentos & Emoções */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                3. O que melhor descreve seu sentimento?
              </label>
              <span className="text-[10px] text-slate-400">
                {selectedFeelings.length} selecionado(s)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {COMMON_FEELINGS.map(feeling => {
                const isSelected = selectedFeelings.includes(feeling);
                return (
                  <button
                    key={feeling}
                    type="button"
                    onClick={() => toggleFeeling(feeling)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white font-semibold shadow-xs scale-102'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {feeling}
                  </button>
                );
              })}
            </div>

            {/* Custom feeling tag write-in */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Outro sentimento..."
                value={customFeeling}
                onChange={e => setCustomFeeling(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeeling();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleAddCustomFeeling}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 rounded-xl hover:bg-sky-100 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* 4. Fatores de Influência */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              4. O que mais influenciou seu dia?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INFLUENCE_FACTORS.map(factor => {
                const isSelected = selectedFactors.includes(factor);
                return (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => toggleFactor(factor)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {factor}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Nota / Diário Breve */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label
                htmlFor="mood-note"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>5. Diário & Reflexão (Opcional)</span>
              </label>
              <span className="text-[10px] text-slate-400">{note.length}/300</span>
            </div>
            <textarea
              id="mood-note"
              rows={3}
              maxLength={300}
              placeholder="O que aconteceu hoje? Algum aprendizado ou sensação que você gostaria de lembrar na próxima consulta?"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Check-in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
