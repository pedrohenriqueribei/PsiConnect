import React, { useState, useEffect } from 'react';
import { MoodEntry, MoodLevel } from '../../types/mood';
import {
  moodTrackerStorage,
  MOOD_LEVELS_CONFIG,
} from '../../services/moodTrackerStorage';
import { MoodTrendsChart } from './MoodTrendsChart';
import { DailyMoodQuickCheck } from './DailyMoodQuickCheck';
import { MoodLogModal } from './MoodLogModal';
import { MoodBadge, MoodIcon } from './MoodIcons';
import {
  Plus,
  Calendar,
  Sparkles,
  Zap,
  Tag,
  Trash2,
  Edit2,
  Filter,
  Heart,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface PatientMoodTrackerViewProps {
  patientId: string;
  patientName?: string;
}

export const PatientMoodTrackerView: React.FC<PatientMoodTrackerViewProps> = ({
  patientId,
  patientName,
}) => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedInitialMood, setSelectedInitialMood] = useState<MoodLevel | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);

  // Filter state for history list
  const [filterMood, setFilterMood] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadEntries = () => {
    const list = moodTrackerStorage.getEntriesByPatient(patientId);
    setEntries(list);
  };

  useEffect(() => {
    loadEntries();
    const unsubscribe = moodTrackerStorage.subscribe(() => {
      loadEntries();
    });
    return () => unsubscribe();
  }, [patientId]);

  const handleOpenNewModal = (initialMood?: MoodLevel, date?: string) => {
    setEditingEntry(null);
    setSelectedInitialMood(initialMood || 4);
    setSelectedDate(date || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setSelectedInitialMood(entry.mood);
    setSelectedDate(entry.date);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    moodTrackerStorage.deleteEntry(id);
    setDeleteConfirmId(null);
    loadEntries();
  };

  // Reverse chronological entries
  const sortedHistory = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredHistory = sortedHistory.filter(entry => {
    if (filterMood === 'all') return true;
    return entry.mood.toString() === filterMood;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Diário de Humor & Bem-Estar
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
              Autocuidado
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe suas emoções diárias, identifique gatilhos e compartilhe insights valiosos
            com seu terapeuta.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenNewModal()}
          className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Humor</span>
        </button>
      </div>

      {/* 2. Daily Mood Quick Check-in */}
      <DailyMoodQuickCheck
        patientId={patientId}
        patientName={patientName}
        onOpenLogModal={handleOpenNewModal}
        onEntryUpdated={loadEntries}
      />

      {/* 3. Recharts Trends & Visualizations */}
      <MoodTrendsChart
        entries={entries}
        patientId={patientId}
        onSelectDate={date => {
          const found = entries.find(e => e.date === date);
          if (found) {
            handleEditEntry(found);
          } else {
            handleOpenNewModal(undefined, date);
          }
        }}
      />

      {/* 4. History Log Section */}
      <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Histórico de Registros
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredHistory.length} de {entries.length} registro(s) listados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMood}
              onChange={e => setFilterMood(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Todos os Estados</option>
              <option value="5">Nível 5 - Excelente</option>
              <option value="4">Nível 4 - Bem</option>
              <option value="3">Nível 3 - Neutro</option>
              <option value="2">Nível 2 - Para Baixo</option>
              <option value="1">Nível 1 - Muito Difícil</option>
            </select>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs">
            Nenhum registro corresponde ao filtro selecionado.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredHistory.map(entry => {
              const config = MOOD_LEVELS_CONFIG[entry.mood];
              const dateObj = new Date(entry.date + 'T12:00:00');
              const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });

              return (
                <div
                  key={entry.id}
                  className="py-4 first:pt-2 last:pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-50/60 dark:hover:bg-slate-700/30 -mx-2 px-2 rounded-2xl transition-colors"
                >
                  {/* Left: Badge & Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <MoodBadge level={entry.mood} />

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="capitalize">{formattedDate}</span>
                      </div>

                      {entry.energy && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {entry.energy === 'high'
                            ? 'Alta energia'
                            : entry.energy === 'low'
                            ? 'Baixa energia'
                            : 'Energia moderada'}
                        </span>
                      )}
                    </div>

                    {/* Feelings & Factors chips */}
                    {((entry.feelings && entry.feelings.length > 0) ||
                      (entry.factors && entry.factors.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {entry.feelings?.map((feeling, idx) => (
                          <span
                            key={`f-${idx}`}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900"
                          >
                            {feeling}
                          </span>
                        ))}
                        {entry.factors?.map((factor, idx) => (
                          <span
                            key={`fac-${idx}`}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            #{factor}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Note */}
                    {entry.note && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                        <span className="italic leading-relaxed">{entry.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditEntry(entry)}
                      className="p-2 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      title="Editar registro"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === entry.id ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(entry.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        title="Excluir registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy note */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
        <span>
          <strong>Privacidade e Sigilo:</strong> Os seus registros de humor são privados e protegidos
          sob sigilo terapêutico. O seu profissional de referência pode visualizar suas tendências
          para personalizar as orientações de cuidado.
        </span>
      </div>

      {/* Mood Log Modal */}
      <MoodLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientId={patientId}
        initialMood={selectedInitialMood}
        initialDate={selectedDate}
        existingEntry={editingEntry}
        onSaved={() => {
          loadEntries();
        }}
      />
    </div>
  );
};
