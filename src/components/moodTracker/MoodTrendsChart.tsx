import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { MoodEntry, MoodLevel } from '../../types/mood';
import { MOOD_LEVELS_CONFIG, moodTrackerStorage } from '../../services/moodTrackerStorage';
import { MoodIcon, MoodBadge } from './MoodIcons';
import {
  Flame,
  TrendingUp,
  Calendar,
  Sparkles,
  BarChart3,
  HeartHandshake,
  Activity,
  Smile,
} from 'lucide-react';

interface MoodTrendsChartProps {
  entries: MoodEntry[];
  patientId: string;
  onSelectDate?: (date: string) => void;
}

type TimeRange = '7d' | '14d' | '30d' | 'all';

export const MoodTrendsChart: React.FC<MoodTrendsChartProps> = ({
  entries,
  patientId,
  onSelectDate,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [chartView, setChartView] = useState<'trend' | 'distribution'>('trend');

  // Filter entries based on selected time range
  const filteredEntries = useMemo(() => {
    if (!entries.length) return [];

    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (timeRange === 'all') return sorted;

    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    return sorted.filter(e => new Date(e.date) >= cutoff);
  }, [entries, timeRange]);

  // Compute summary stats
  const stats = useMemo(() => {
    if (!filteredEntries.length) {
      return {
        averageScore: 0,
        totalEntries: 0,
        streakDays: moodTrackerStorage.calculateStreak(patientId),
        topFeeling: 'N/A',
        dominantMood: null as MoodLevel | null,
      };
    }

    const total = filteredEntries.length;
    const sumScore = filteredEntries.reduce((acc, curr) => acc + curr.mood, 0);
    const avg = Number((sumScore / total).toFixed(1));

    // Calculate top feeling
    const feelingCounts: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entry.feelings?.forEach(f => {
        feelingCounts[f] = (feelingCounts[f] || 0) + 1;
      });
    });

    let topFeeling = 'Em Paz';
    let maxCount = 0;
    Object.entries(feelingCounts).forEach(([f, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topFeeling = f;
      }
    });

    // Dominant mood
    const moodCounts: Record<MoodLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredEntries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    let dominantMood: MoodLevel = 3;
    let maxMoodCount = -1;
    ([5, 4, 3, 2, 1] as MoodLevel[]).forEach(lvl => {
      if (moodCounts[lvl] > maxMoodCount) {
        maxMoodCount = moodCounts[lvl];
        dominantMood = lvl;
      }
    });

    return {
      averageScore: avg,
      totalEntries: total,
      streakDays: moodTrackerStorage.calculateStreak(patientId),
      topFeeling: maxCount > 0 ? topFeeling : 'Equilíbrio',
      dominantMood,
    };
  }, [filteredEntries, patientId]);

  // Prepare data for Recharts AreaChart
  const chartData = useMemo(() => {
    return filteredEntries.map(e => {
      const dateObj = new Date(e.date + 'T12:00:00');
      const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });

      return {
        rawDate: e.date,
        date: formattedDate,
        mood: e.mood,
        label: MOOD_LEVELS_CONFIG[e.mood]?.label || '',
        color: MOOD_LEVELS_CONFIG[e.mood]?.color || '#0284c7',
        feelings: e.feelings || [],
        factors: e.factors || [],
        note: e.note || '',
        energy: e.energy,
      };
    });
  }, [filteredEntries]);

  // Prepare data for Recharts BarChart (distribution)
  const distributionData = useMemo(() => {
    const counts: Record<MoodLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredEntries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });

    const total = filteredEntries.length || 1;

    return ([5, 4, 3, 2, 1] as MoodLevel[]).map(lvl => ({
      level: lvl,
      name: MOOD_LEVELS_CONFIG[lvl].label,
      count: counts[lvl],
      percentage: Math.round((counts[lvl] / total) * 100),
      color: MOOD_LEVELS_CONFIG[lvl].color,
    }));
  }, [filteredEntries]);

  // Custom Recharts Tooltip for Trend Line
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const moodConfig = MOOD_LEVELS_CONFIG[data.mood as MoodLevel];

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 max-w-xs text-xs space-y-2 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              {data.rawDate.split('-').reverse().join('/')}
            </span>
            <MoodBadge level={data.mood as MoodLevel} />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">Nível:</span>
            <span className="font-bold" style={{ color: moodConfig?.color }}>
              {data.mood}/5 - {moodConfig?.label}
            </span>
          </div>

          {data.feelings && data.feelings.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Sentimentos:</span>
              <div className="flex flex-wrap gap-1">
                {data.feelings.map((f: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px] font-medium"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.note && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-slate-600 dark:text-slate-300 italic text-[11px] line-clamp-3">
              "{data.note}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Streak */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sequência
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.streakDays}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {stats.streakDays === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {stats.streakDays > 0 ? 'Constância admirável! 🔥' : 'Faça seu check-in hoje'}
          </p>
        </div>

        {/* Average Mood */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Humor Médio
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.averageScore > 0 ? stats.averageScore : '—'}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {stats.averageScore >= 4
              ? 'Predominantemente positivo'
              : stats.averageScore >= 3
              ? 'Estável e equilibrado'
              : 'Período desafiador'}
          </p>
        </div>

        {/* Total Check-ins */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Check-ins
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalEntries}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              no período
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Histórico emocional ativo
          </p>
        </div>

        {/* Top Feeling */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sentimento Top
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="truncate text-base font-black text-slate-900 dark:text-white">
            {stats.topFeeling}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            Frequente em seus registros
          </p>
        </div>
      </div>

      {/* 2. Main Chart Card with controls */}
      <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {chartView === 'trend'
                  ? 'Evolução do Estado Emocional'
                  : 'Distribuição dos Estados de Humor'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                recharts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize oscilações, constância e padrões ao longo do acompanhamento
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* View mode toggle */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700/70 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartView('trend')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  chartView === 'trend'
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Linha Temporal</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView('distribution')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  chartView === 'distribution'
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Distribuição</span>
              </button>
            </div>

            {/* Time range pills */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700/70 rounded-xl text-xs font-medium">
              {(
                [
                  { key: '7d', label: '7 dias' },
                  { key: '14d', label: '14 dias' },
                  { key: '30d', label: '30 dias' },
                  { key: 'all', label: 'Todos' },
                ] as const
              ).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTimeRange(t.key)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    timeRange === t.key
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Body */}
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum registro encontrado no período selecionado
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Utilize o botão de Check-in para registrar o seu humor de hoje e acompanhar sua
              jornada emocional.
            </p>
          </div>
        ) : chartView === 'trend' ? (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length && onSelectDate) {
                    onSelectDate(e.activePayload[0].payload.rawDate);
                  }
                }}
              >
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-700/60"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => {
                    const map: Record<number, string> = {
                      5: 'Excelente',
                      4: 'Bem',
                      3: 'Neutro',
                      2: 'Baixo',
                      1: 'Difícil',
                    };
                    return map[val] || `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#moodGradient)"
                  dot={props => {
                    const { cx, cy, payload } = props;
                    const config = MOOD_LEVELS_CONFIG[payload.mood as MoodLevel];
                    return (
                      <circle
                        key={`dot-${payload.rawDate}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={config?.color || '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="cursor-pointer hover:r-7 transition-all"
                      />
                    );
                  }}
                  activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Distribution Bar Chart */
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionData}
                margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-700/60"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(100, 116, 139, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2.5 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-1">
                            {item.count} {item.count === 1 ? 'registro' : 'registros'} (
                            {item.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend / Quick Mood Level Reference */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Legenda de Níveis:</span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {([5, 4, 3, 2, 1] as MoodLevel[]).map(lvl => {
              const cfg = MOOD_LEVELS_CONFIG[lvl];
              return (
                <div key={lvl} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span>
                    {lvl} - {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
