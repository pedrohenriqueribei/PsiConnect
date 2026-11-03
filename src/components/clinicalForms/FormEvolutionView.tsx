import React, { useState } from 'react';
import { FormSubmission, ClinicalForm, QuestionAnswer } from '../../types/clinicalForm';
import { clinicalFormStorage } from '../../services/clinicalFormStorage';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Clock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';

interface FormEvolutionViewProps {
  submissions: FormSubmission[];
  form: ClinicalForm;
  patientName: string;
  professionalId: string;
  onRefresh?: () => void;
}

export const FormEvolutionView: React.FC<FormEvolutionViewProps> = ({
  submissions,
  form,
  patientName,
  professionalId,
  onRefresh,
}) => {
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(
    submissions.length > 0 ? submissions[submissions.length - 1].id : null
  );

  // Filter numeric scale answers to plot evolution
  const scaleQuestions = form.questions.filter(q => q.type === 'likert_scale');
  const [selectedScaleQId, setSelectedScaleQId] = useState<string>(
    scaleQuestions[0]?.id || ''
  );

  // Extract temporal data points for the selected scale question
  const dataPoints = submissions
    .map(sub => {
      const ans = sub.answers.find(a => a.questionId === selectedScaleQId);
      const score =
        typeof ans?.scaleValue === 'number'
          ? ans.scaleValue
          : typeof ans?.value === 'number'
          ? ans.value
          : null;
      return {
        submissionId: sub.id,
        date: new Date(sub.submittedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        fullDate: new Date(sub.submittedAt).toLocaleString('pt-BR'),
        score,
        notes: sub.answers.find(a => a.questionType === 'textarea')?.value as string,
        isRead: sub.isReadByProfessional,
      };
    })
    .filter(pt => pt.score !== null) as {
    submissionId: string;
    date: string;
    fullDate: string;
    score: number;
    notes?: string;
    isRead: boolean;
  }[];

  // Calculate stats
  const initialScore = dataPoints.length > 0 ? dataPoints[0].score : 0;
  const latestScore = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].score : 0;
  const difference = latestScore - initialScore;
  const isImprovement = form.category === 'anxiety' || form.category === 'burnout'
    ? difference < 0 // for anxiety/burnout, lower score is an improvement
    : difference > 0; // for mood/wellbeing, higher score is an improvement

  const handleMarkAsRead = async (submissionId: string) => {
    await clinicalFormStorage.markSubmissionAsRead(submissionId, professionalId);
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* KPI Evolution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Submissões
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {submissions.length}
            </span>
            <span className="text-xs text-slate-500">preenchimentos</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Desde {new Date(submissions[0]?.submittedAt || Date.now()).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Score Inicial
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-700 tabular-nums">
              {dataPoints.length > 0 ? `${initialScore}/10` : '—'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {dataPoints[0]?.date || '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Score Atual
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-extrabold tabular-nums ${
                isImprovement ? 'text-emerald-700' : 'text-slate-900'
              }`}
            >
              {dataPoints.length > 0 ? `${latestScore}/10` : '—'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {dataPoints[dataPoints.length - 1]?.date || '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Evolução Clínica
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {difference === 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
                <Minus className="w-4 h-4" />
                Estável
              </span>
            ) : isImprovement ? (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <TrendingDown className="w-4 h-4" />
                {Math.abs(difference)} pts de alívio
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <TrendingUp className="w-4 h-4" />
                {Math.abs(difference)} pts de variação
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Comparativo longitudinal
          </span>
        </div>
      </div>

      {/* Evolution Chart (SVG-based D3-style interactive graph) */}
      {dataPoints.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-700" />
                <span>Gráfico de Evolução Temporal</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhamento da intensidade de respostas ao longo das submissões de {patientName}.
              </p>
            </div>

            {scaleQuestions.length > 1 && (
              <select
                value={selectedScaleQId}
                onChange={e => setSelectedScaleQId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-600 focus:outline-hidden"
              >
                {scaleQuestions.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* SVG Chart Canvas */}
          <div className="relative pt-6 pb-2">
            <svg
              viewBox="0 0 600 220"
              className="w-full h-52 overflow-visible select-none"
            >
              {/* Reference Grid Bands */}
              <rect x="50" y="20" width="520" height="60" fill="#fef2f2" opacity="0.6" />
              <text x="565" y="45" fill="#dc2626" fontSize="9" textAnchor="end" fontWeight="600">
                Severo (8-10)
              </text>

              <rect x="50" y="80" width="520" height="60" fill="#fffbeb" opacity="0.6" />
              <text x="565" y="110" fill="#d97706" fontSize="9" textAnchor="end" fontWeight="600">
                Moderado (4-7)
              </text>

              <rect x="50" y="140" width="520" height="50" fill="#f0fdf4" opacity="0.6" />
              <text x="565" y="165" fill="#16a34a" fontSize="9" textAnchor="end" fontWeight="600">
                Leve / Remissão (0-3)
              </text>

              {/* Y Axis Grid lines */}
              {[10, 8, 6, 4, 2, 0].map(val => {
                const y = 20 + (10 - val) * 17;
                return (
                  <g key={val}>
                    <line
                      x1="50"
                      y1={y}
                      x2="570"
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="40"
                      y={y + 3}
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Connecting Line between points */}
              {dataPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={dataPoints
                    .map((pt, idx) => {
                      const x =
                        dataPoints.length === 1
                          ? 310
                          : 80 + (idx * (460 / (dataPoints.length - 1)));
                      const y = 20 + (10 - pt.score) * 17;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Data Point Circles and Badges */}
              {dataPoints.map((pt, idx) => {
                const x =
                  dataPoints.length === 1
                    ? 310
                    : 80 + (idx * (460 / (dataPoints.length - 1)));
                const y = 20 + (10 - pt.score) * 17;
                const isLatest = idx === dataPoints.length - 1;

                return (
                  <g key={pt.submissionId} className="cursor-pointer group">
                    {/* Shadow halo */}
                    <circle
                      cx={x}
                      y={y}
                      r={isLatest ? 10 : 8}
                      fill={isLatest ? '#38bdf8' : '#e0f2fe'}
                      opacity="0.8"
                    />
                    {/* Main point circle */}
                    <circle
                      cx={x}
                      y={y}
                      r={isLatest ? 6 : 5}
                      fill={pt.score >= 8 ? '#ef4444' : pt.score >= 4 ? '#f59e0b' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* Score value label on top */}
                    <rect
                      x={x - 14}
                      y={y - 24}
                      width="28"
                      height="16"
                      rx="4"
                      fill="#0f172a"
                      opacity="0.9"
                    />
                    <text
                      x={x}
                      y={y - 13}
                      fill="#ffffff"
                      fontSize="10"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {pt.score}
                    </text>

                    {/* Date label at bottom */}
                    <text
                      x={x}
                      y="205"
                      fill="#475569"
                      fontSize="10"
                      textAnchor="middle"
                      fontWeight={isLatest ? 'bold' : 'normal'}
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>0-3: Alívio / Sintomas leves</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>4-7: Nível moderado</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>8-10: Nível severo / Crise</span>
            </span>
          </div>
        </div>
      )}

      {/* Submissions Timeline / Chronological List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-700" />
            <span>Histórico Detalhado de Submissões ({submissions.length})</span>
          </span>
          <span className="text-[11px] font-normal text-slate-500">
            Armazenamento com criptografia AES-256 e timestamps certificados
          </span>
        </h3>

        {submissions.map((sub, idx) => {
          const isExpanded = expandedSubmissionId === sub.id;
          const subDate = new Date(sub.submittedAt);
          const scoreAnswer = sub.answers.find(a => a.questionType === 'likert_scale');
          const isUnread = !sub.isReadByProfessional;

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border transition-all ${
                isUnread
                  ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header card row */}
              <div
                onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isUnread
                        ? 'bg-sky-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    #{submissions.length - idx}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        Submissão em {subDate.toLocaleDateString('pt-BR')} às{' '}
                        {subDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 animate-pulse">
                          Nova Resposta
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        AES-256-GCM
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sub.answers.length} perguntas respondidas por {sub.patientName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {scoreAnswer && (
                    <div className="px-3 py-1 bg-slate-100 rounded-lg text-right">
                      <span className="text-[10px] text-slate-500 block leading-none">
                        Escala Geral
                      </span>
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {String(scoreAnswer.scaleValue ?? scoreAnswer.value)}/10
                      </span>
                    </div>
                  )}

                  {isUnread && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleMarkAsRead(sub.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-sky-800 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg transition-colors"
                    >
                      Marcar como lida
                    </button>
                  )}

                  <div className="text-slate-400 p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details with all answers */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Timestamp Exato de Envio:{' '}
                        <strong className="text-slate-800 font-mono">
                          {sub.submittedAt}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Sigilo CFP nº 01/2009 & LGPD
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sub.answers.map((ans, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {qIdx + 1}. {ans.questionTitle}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                            {ans.questionType.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Rendering by response type */}
                        {ans.questionType === 'likert_scale' ? (
                          <div className="flex items-center gap-3 pt-1">
                            <span className="px-3 py-1 bg-sky-50 border border-sky-200 text-sky-900 rounded-lg font-bold text-sm tabular-nums">
                              {String(ans.scaleValue ?? ans.value)} / 10
                            </span>
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  Number(ans.scaleValue ?? ans.value) >= 8
                                    ? 'bg-rose-500'
                                    : Number(ans.scaleValue ?? ans.value) >= 4
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${(Number(ans.scaleValue ?? ans.value) / 10) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : ans.questionType === 'checkbox' && Array.isArray(ans.value) ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {ans.value.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">
                                Nenhum sintoma assinalado.
                              </span>
                            ) : (
                              ans.value.map((v, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {v}
                                </span>
                              ))
                            )}
                          </div>
                        ) : ans.questionType === 'yes_no_justification' ? (
                          <div className="space-y-1.5 pt-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                ans.value === true
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {ans.value === true ? 'Sim' : 'Não'}
                            </span>
                            {ans.justification && (
                              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed">
                                <strong className="text-slate-800 not-italic">Justificativa do paciente: </strong>
                                "{ans.justification}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                            {String(ans.value || '—')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
