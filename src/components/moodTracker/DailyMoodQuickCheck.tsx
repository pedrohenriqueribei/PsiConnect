import React, { useState } from 'react';
import { MoodEntry, MoodLevel } from '../../types/mood';
import { MOOD_LEVELS_CONFIG, moodTrackerStorage } from '../../services/moodTrackerStorage';
import { MoodIcon, MoodBadge } from './MoodIcons';
import { Sparkles, Edit3, CheckCircle2, Flame, ArrowRight, Heart } from 'lucide-react';

interface DailyMoodQuickCheckProps {
  patientId: string;
  patientName?: string;
  onOpenLogModal: (initialMood?: MoodLevel, date?: string) => void;
  onEntryUpdated?: () => void;
}

export const DailyMoodQuickCheck: React.FC<DailyMoodQuickCheckProps> = ({
  patientId,
  patientName,
  onOpenLogModal,
  onEntryUpdated,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = moodTrackerStorage.getEntryForDate(patientId, todayStr);
  const streak = moodTrackerStorage.calculateStreak(patientId);
  const [quickSavedAnim, setQuickSavedAnim] = useState<MoodLevel | null>(null);

  const moodLevelsList: MoodLevel[] = [5, 4, 3, 2, 1];

  const handleQuickSelect = (level: MoodLevel) => {
    // Quick save with default settings or update existing
    moodTrackerStorage.saveEntry({
      patientId,
      date: todayStr,
      timestamp: new Date().toISOString(),
      mood: level,
      energy: todayEntry?.energy || 'moderate',
      feelings: todayEntry?.feelings || [],
      factors: todayEntry?.factors || [],
      note: todayEntry?.note,
    });

    setQuickSavedAnim(level);
    setTimeout(() => setQuickSavedAnim(null), 1200);
    onEntryUpdated?.();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border border-sky-100 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all duration-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Heading & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
              <Sparkles className="w-3.5 h-3.5" />
              Check-in Diário
            </span>

            {streak > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {todayEntry
              ? `Olá${patientName ? `, ${patientName}` : ''}! Seu humor de hoje está registrado:`
              : `Como você está se sentindo hoje${patientName ? `, ${patientName}` : ''}?`}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {todayEntry
              ? 'Você pode atualizar o nível a qualquer momento ou adicionar notas e sentimentos detalhados.'
              : 'Clique em um dos ícones para registrar seu estado emocional em 1 segundo.'}
          </p>
        </div>

        {/* Right: Quick actions / Recorded badge */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {todayEntry && (
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs p-2.5 px-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Registrado:
                </span>
                <MoodBadge level={todayEntry.mood} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenLogModal(todayEntry?.mood, todayStr)}
            className="px-4 py-2 text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/80 border border-sky-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{todayEntry ? 'Detalhar / Adicionar Notas' : 'Diário Completo'}</span>
          </button>
        </div>
      </div>

      {/* Mood Selector Buttons Row */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {moodLevelsList.map(level => {
            const config = MOOD_LEVELS_CONFIG[level];
            const isTodaySelected = todayEntry?.mood === level;
            const isAnimating = quickSavedAnim === level;

            return (
              <button
                key={level}
                type="button"
                onClick={() => handleQuickSelect(level)}
                className={`group flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isTodaySelected
                    ? `ring-2 ring-sky-500 ${config.bgColor} ${config.borderColor} ${config.darkBgColor} shadow-md scale-102`
                    : 'bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs hover:border-slate-300'
                } ${isAnimating ? 'animate-bounce' : ''}`}
                title={`Registrar como: ${config.label}`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-110 ${
                    isTodaySelected
                      ? 'bg-white dark:bg-slate-800 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/50'
                  }`}
                  style={{ color: config.color }}
                >
                  <MoodIcon level={level} size={22} />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 block truncate w-full text-center">
                  {config.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
                  {level}/5
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
