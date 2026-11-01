import React, { useState } from 'react';
import { EvolutionSession, EVOLUTION_SCALE_MAP } from '../../types/psychologicalRecord';
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Activity } from 'lucide-react';

interface EvolutionChartProps {
  sessions: EvolutionSession[];
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ sessions }) => {
  // Sort sessions chronologically (Session 1, 2, 3...)
  const chronologicalSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const [hoveredSession, setHoveredSession] = useState<EvolutionSession | null>(null);

  if (chronologicalSessions.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Nenhuma sessão registrada para traçar o gráfico</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          À medida que você registrar as evoluções clínicas das sessões, a curva de evolução e métricas de melhora aparecerão automaticamente aqui.
        </p>
      </div>
    );
  }

  // Metrics
  const total = chronologicalSessions.length;
  const scores = chronologicalSessions.map(s => s.evolutionScore);
  const avgScore = (scores.reduce((a, b) => a + b, 0) / total).toFixed(1);
  const improvementCount = chronologicalSessions.filter(s => s.evolutionScore >= 4).length;
  const improvementRate = Math.round((improvementCount / total) * 100);
  const latestSession = chronologicalSessions[total - 1];
  const firstSession = chronologicalSessions[0];
  const scoreDiff = latestSession.evolutionScore - firstSession.evolutionScore;

  // SVG Chart Geometry
  const width = 640;
  const height = 240;
  const paddingX = 45;
  const paddingY = 35;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  // Calculate coordinates
  const points = chronologicalSessions.map((session, index) => {
    const x = total === 1 ? width / 2 : paddingX + (index / (total - 1)) * innerWidth;
    // Score is 1 to 5: 5 is at top (paddingY), 1 is at bottom (height - paddingY)
    const normalizedScore = (session.evolutionScore - 1) / 4; // 0 to 1
    const y = height - paddingY - normalizedScore * innerHeight;
    return { x, y, session };
  });

  // SVG Path line
  const linePath =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points.reduce((path, pt, idx) => `${path} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  // SVG Area path
  const areaPath =
    points.length === 1
      ? ''
      : `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
      {/* Top Header & KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-700" />
            Curva de Evolução Clínica do Paciente
          </h3>
          <p className="text-xs text-slate-500">
            Acompanhamento longitudinal das notas na escala de 1 a 5 ao longo de {total} sessões realizadas
          </p>
        </div>

        {/* Quick KPI badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-center">
            <span className="text-[10px] uppercase font-bold text-sky-700 block">Média Geral</span>
            <span className="text-lg font-bold tabular-nums">{avgScore} / 5.0</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Índice de Melhora</span>
            <span className="text-lg font-bold tabular-nums">{improvementRate}%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Variação Total</span>
            <span className={`text-lg font-bold tabular-nums ${scoreDiff > 0 ? 'text-emerald-700' : scoreDiff < 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} pts
            </span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 sm:h-72 select-none"
        >
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines for Scores 1 to 5 */}
          {[1, 2, 3, 4, 5].map(scoreVal => {
            const normalized = (scoreVal - 1) / 4;
            const y = height - paddingY - normalized * innerHeight;
            const isBaseline = scoreVal === 3;
            return (
              <g key={scoreVal}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke={isBaseline ? '#cbd5e1' : '#f1f5f9'}
                  strokeWidth={isBaseline ? 1.5 : 1}
                  strokeDasharray={isBaseline ? '4 4' : undefined}
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-medium font-sans"
                >
                  {scoreVal}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#gradientArea)" />}

          {/* Connecting Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Session Data Points */}
          {points.map((pt, i) => {
            const isSelected = hoveredSession?.id === pt.session.id;
            const isRisk = pt.session.risks.hasActiveRisk;
            const scoreColor =
              pt.session.evolutionScore >= 4
                ? '#10b981' // green
                : pt.session.evolutionScore === 3
                ? '#0284c7' // blue
                : '#f43f5e'; // rose

            return (
              <g
                key={pt.session.id}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredSession(pt.session)}
                onClick={() => setHoveredSession(pt.session)}
              >
                {/* Risk halo if suicide/self-harm risk present */}
                {isRisk && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 14 : 11}
                    fill="#fee2e2"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 7 : 5}
                  fill={scoreColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-sm"
                />

                {/* Label under point */}
                <text
                  x={pt.x}
                  y={height - paddingY + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-medium font-sans"
                >
                  Sessão {pt.session.sessionNumber}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Session Inspector Banner */}
      {hoveredSession ? (
        <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-950 text-sm">
                Sessão nº {hoveredSession.sessionNumber}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">Data: {hoveredSession.date}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">
                {hoveredSession.startTime} às {hoveredSession.endTime} ({hoveredSession.modality})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  hoveredSession.evolutionScore >= 4
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : hoveredSession.evolutionScore === 3
                    ? 'bg-sky-100 text-sky-800 border-sky-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {EVOLUTION_SCALE_MAP[hoveredSession.evolutionScore]?.label}
              </span>

              {hoveredSession.risks.hasActiveRisk && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white flex items-center gap-1 shadow-2xs">
                  <AlertTriangle className="w-3 h-3" />
                  Risco Ativo
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-slate-700">
            <div>
              <strong className="block text-[11px] text-slate-900 font-semibold mb-0.5">
                Estado Emocional Observado:
              </strong>
              <p className="line-clamp-2 text-slate-600">{hoveredSession.emotionalState}</p>
            </div>
            <div>
              <strong className="block text-[11px] text-slate-900 font-semibold mb-0.5">
                Observações Clínicas da Evolução:
              </strong>
              <p className="line-clamp-2 text-slate-600">{hoveredSession.evolutionNotes}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400 py-1">
          Passe o mouse ou toque nos pontos do gráfico para inspecionar os detalhes de cada sessão.
        </p>
      )}

      {/* Scale Legend */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
        {Object.entries(EVOLUTION_SCALE_MAP).map(([key, item]) => (
          <div key={key} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="font-bold block text-slate-800">{item.label}</span>
            <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
              {item.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
