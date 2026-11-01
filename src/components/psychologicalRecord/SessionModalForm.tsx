import React, { useState, useEffect } from 'react';
import {
  EvolutionSession,
  EVOLUTION_SCALE_MAP,
  EvolutionTrend,
  SuicideRiskLevel,
  SelfHarmRiskLevel,
  ViolenceRiskLevel,
  IdentifiedRisks,
} from '../../types/psychologicalRecord';
import {
  X,
  AlertTriangle,
  Save,
  Clock,
  Calendar,
  Sparkles,
  FileText,
  Shield,
  History,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';

interface SessionModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    sessionData: Omit<EvolutionSession, 'id' | 'sessionNumber' | 'createdAt' | 'updatedAt' | 'versions'>,
    changesSummary?: string
  ) => void;
  initialSession?: EvolutionSession | null;
  nextSessionNumber: number;
  patientName: string;
}

export const SessionModalForm: React.FC<SessionModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSession,
  nextSessionNumber,
  patientName,
}) => {
  const isEditing = !!initialSession;

  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [date, setDate] = useState(initialSession?.date || todayStr);
  const [startTime, setStartTime] = useState(initialSession?.startTime || '14:00');
  const [endTime, setEndTime] = useState(initialSession?.endTime || '14:50');
  const [modality, setModality] = useState<'online' | 'presencial'>(initialSession?.modality || 'online');
  const [emotionalState, setEmotionalState] = useState(initialSession?.emotionalState || '');
  const [summaryContent, setSummaryContent] = useState(initialSession?.summaryContent || '');
  const [interventions, setInterventions] = useState(initialSession?.interventions || '');
  const [evolutionScore, setEvolutionScore] = useState<number>(initialSession?.evolutionScore || 3);
  const [evolutionNotes, setEvolutionNotes] = useState(initialSession?.evolutionNotes || '');

  // Risks
  const [suicideRisk, setSuicideRisk] = useState<SuicideRiskLevel>(initialSession?.risks.suicideRisk || 'none');
  const [selfHarmRisk, setSelfHarmRisk] = useState<SelfHarmRiskLevel>(initialSession?.risks.selfHarmRisk || 'none');
  const [violenceRisk, setViolenceRisk] = useState<ViolenceRiskLevel>(initialSession?.risks.violenceRisk || 'none');
  const [riskObservations, setRiskObservations] = useState(initialSession?.risks.riskObservations || '');

  // Tasks & Next session
  const [nextSessionTasks, setNextSessionTasks] = useState(initialSession?.nextSessionTasks || '');
  const [nextSessionDate, setNextSessionDate] = useState(initialSession?.nextSessionDate || '');

  // Editing justification (mandatory when updating)
  const [changesSummary, setChangesSummary] = useState('');
  const [showError, setShowError] = useState('');

  // Re-sync on modal open or session switch
  useEffect(() => {
    if (!isOpen) return;
    if (initialSession) {
      setDate(initialSession.date);
      setStartTime(initialSession.startTime);
      setEndTime(initialSession.endTime);
      setModality(initialSession.modality);
      setEmotionalState(initialSession.emotionalState);
      setSummaryContent(initialSession.summaryContent);
      setInterventions(initialSession.interventions);
      setEvolutionScore(initialSession.evolutionScore);
      setEvolutionNotes(initialSession.evolutionNotes);
      setSuicideRisk(initialSession.risks.suicideRisk);
      setSelfHarmRisk(initialSession.risks.selfHarmRisk);
      setViolenceRisk(initialSession.risks.violenceRisk);
      setRiskObservations(initialSession.risks.riskObservations || '');
      setNextSessionTasks(initialSession.nextSessionTasks || '');
      setNextSessionDate(initialSession.nextSessionDate || '');
      setChangesSummary('');
    } else {
      setDate(todayStr);
      setStartTime('14:00');
      setEndTime('14:50');
      setModality('online');
      setEmotionalState('');
      setSummaryContent('');
      setInterventions('');
      setEvolutionScore(3);
      setEvolutionNotes('');
      setSuicideRisk('none');
      setSelfHarmRisk('none');
      setViolenceRisk('none');
      setRiskObservations('');
      setNextSessionTasks('');
      setNextSessionDate('');
      setChangesSummary('');
    }
    setShowError('');
  }, [isOpen, initialSession]);

  if (!isOpen) return null;

  // Has active risk flag
  const hasActiveRisk = suicideRisk !== 'none' || selfHarmRisk !== 'none' || violenceRisk !== 'none';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!summaryContent.trim()) {
      setShowError('Por favor, preencha o resumo do conteúdo da sessão.');
      return;
    }
    if (!interventions.trim()) {
      setShowError('Por favor, informe as intervenções e técnicas realizadas.');
      return;
    }
    if (isEditing && !changesSummary.trim()) {
      setShowError('Em conformidade com as regras do CFP, informe o motivo/resumo da alteração para o histórico de versões.');
      return;
    }

    const trend: EvolutionTrend = EVOLUTION_SCALE_MAP[evolutionScore]?.trend || 'estavel';

    const risks: IdentifiedRisks = {
      suicideRisk,
      selfHarmRisk,
      violenceRisk,
      hasActiveRisk,
      riskObservations: riskObservations.trim() || undefined,
      safetyPlanActive: hasActiveRisk,
    };

    onSave(
      {
        date,
        startTime,
        endTime,
        modality,
        emotionalState: emotionalState.trim() || 'Eutímico / Adequado à demanda relatada',
        summaryContent: summaryContent.trim(),
        interventions: interventions.trim(),
        evolutionScore,
        evolutionTrend: trend,
        evolutionNotes: evolutionNotes.trim(),
        risks,
        nextSessionTasks: nextSessionTasks.trim() || undefined,
        nextSessionDate: nextSessionDate.trim() || undefined,
      },
      isEditing ? changesSummary.trim() : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                {isEditing ? `Editar Sessão nº ${initialSession?.sessionNumber}` : `Registrar Nova Sessão nº ${nextSessionNumber}`}
                <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  Paciente: {patientName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Edições geram uma nova versão com data, hora e autor no histórico auditável.'
                  : 'Registro de evolução clínica confidencial arquivado no prontuário.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {showError && (
            <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{showError}</span>
            </div>
          )}

          {/* Quick Session Metadata Row */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data do Atendimento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Horário de Início *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Horário de Fim *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Modalidade *
              </label>
              <select
                value={modality}
                onChange={e => setModality(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              >
                <option value="online">Online (Telepsicologia)</option>
                <option value="presencial">Presencial (Consultório)</option>
              </select>
            </div>
          </div>

          {/* Estado Emocional Observado */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Estado Emocional do Paciente (Observado) *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Eutímico',
                'Ansioso / Agitado',
                'Depressivo / Embotado',
                'Choro fácil / Lábil',
                'Esperançoso / Engajado',
                'Hostil / Defensivo',
                'Ambivalente',
              ].map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    setEmotionalState(prev => (prev ? `${prev}, ${tag}` : tag));
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 rounded-lg transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={emotionalState}
              onChange={e => setEmotionalState(e.target.value)}
              placeholder="Ex: Lúcido, orientado no tempo e espaço, ansioso ao relatar o trabalho..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Resumo do Conteúdo da Sessão */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Resumo do Conteúdo da Sessão *</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Dado sensível criptografado (LGPD Art. 11)
              </span>
            </label>
            <textarea
              rows={4}
              required
              value={summaryContent}
              onChange={e => setSummaryContent(e.target.value)}
              placeholder="Descreva as principais temáticas trazidas pelo paciente, relatos factuais, dinâmicas relacionais e afetivas expressadas no atendimento..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 leading-relaxed font-sans"
            />
          </div>

          {/* Intervenções Realizadas */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Intervenções e Técnicas Realizadas *
            </label>
            <textarea
              rows={3}
              required
              value={interventions}
              onChange={e => setInterventions(e.target.value)}
              placeholder="Descreva as técnicas aplicadas (ex: questionamento socrático, psicoeducação, respiração diafragmática, validação emocional, formulação de hipóteses)..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 leading-relaxed font-sans"
            />
          </div>

          {/* Avaliação de Evolução (Escala 1 a 5) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Evolução do Paciente: Escala de 1 a 5 *
              </label>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                  evolutionScore >= 4
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : evolutionScore === 3
                    ? 'bg-sky-100 text-sky-800 border-sky-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {EVOLUTION_SCALE_MAP[evolutionScore]?.label}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(score => {
                const info = EVOLUTION_SCALE_MAP[score];
                const isSelected = evolutionScore === score;
                return (
                  <button
                    type="button"
                    key={score}
                    onClick={() => setEvolutionScore(score)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? score >= 4
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold ring-2 ring-emerald-300'
                          : score === 3
                          ? 'bg-sky-700 text-white border-sky-800 shadow-sm font-bold ring-2 ring-sky-300'
                          : 'bg-rose-600 text-white border-rose-700 shadow-sm font-bold ring-2 ring-rose-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="block text-base font-bold">{score}</span>
                    <span className="block text-[10px] mt-0.5 leading-tight">
                      {info.trend === 'melhora' ? 'Melhora' : info.trend === 'estavel' ? 'Estável' : 'Piora'}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-600 italic">
              {EVOLUTION_SCALE_MAP[evolutionScore]?.description}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Observações Detalhadas da Evolução:
              </label>
              <input
                type="text"
                value={evolutionNotes}
                onChange={e => setEvolutionNotes(e.target.value)}
                placeholder="Ex: Paciente relatou melhora do sono e menor reatividade a cobranças..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* Riscos Identificados com ALERTA VISUAL DESTACADO */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hasActiveRisk
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-300/70'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 ${hasActiveRisk ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`}
                />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Avaliação de Riscos (Segurança & Protocolo)
                </span>
              </div>

              {hasActiveRisk ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                  ALERTA VISUAL: Risco Identificado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-800 bg-emerald-100">
                  Nenhum risco ativo detectado
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ideação Suicida:
                </label>
                <select
                  value={suicideRisk}
                  onChange={e => setSuicideRisk(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    suicideRisk !== 'none'
                      ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="none">Nenhum risco</option>
                  <option value="passive">Passiva (pensamento sem plano)</option>
                  <option value="active">Ativa (com intenção ou plano)</option>
                  <option value="imminent">Iminente (risco grave imediato)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Comportamento Autolesivo:
                </label>
                <select
                  value={selfHarmRisk}
                  onChange={e => setSelfHarmRisk(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    selfHarmRisk !== 'none'
                      ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="none">Não identificado</option>
                  <option value="historical">Histórico remoto</option>
                  <option value="recent">Recente</option>
                  <option value="active">Ativo / Frequente</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Violência / Agressividade:
                </label>
                <select
                  value={violenceRisk}
                  onChange={e => setViolenceRisk(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    violenceRisk !== 'none'
                      ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="none">Nenhum risco</option>
                  <option value="domestic">Violência doméstica / Relacional</option>
                  <option value="third_party">Risco a terceiros</option>
                  <option value="other">Outro risco</option>
                </select>
              </div>
            </div>

            {hasActiveRisk && (
              <div className="mt-3 pt-3 border-t border-rose-200 space-y-2">
                <div className="p-2.5 rounded-lg bg-rose-100 text-rose-900 text-[11px] leading-snug">
                  <strong>Protocolo de Contingência Ativado:</strong> Acionar rede de apoio familiar, fornecer contato CVV 188 e orientar acompanhamento médico/psiquiátrico urgente caso haja agravamento.
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-900 mb-1">
                    Conduta Clínica Adotada / Plano de Segurança:
                  </label>
                  <input
                    type="text"
                    value={riskObservations}
                    onChange={e => setRiskObservations(e.target.value)}
                    placeholder="Ex: Contrato de não-autolesão firmado, familiar comunicado com consentimento, contato de emergência checado..."
                    className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-rose-950 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tarefas e Próxima Sessão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Tarefas ou Orientações Intersessão
              </label>
              <textarea
                rows={2}
                value={nextSessionTasks}
                onChange={e => setNextSessionTasks(e.target.value)}
                placeholder="Ex: Preencher RPD, realizar 10 min de respiração 4-7-8, ler capítulo indicado..."
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Próxima Sessão (Agendada / Vinculada)
              </label>
              <input
                type="text"
                value={nextSessionDate}
                onChange={e => setNextSessionDate(e.target.value)}
                placeholder="Ex: 12/03/2025 às 14:00 (ou horário a confirmar)"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 mb-2"
              />
              <span className="text-[10px] text-slate-500 block">
                Permite acompanhar a regularidade das sessões conforme o plano terapêutico.
              </span>
            </div>
          </div>

          {/* Versioning Explanation if Editing */}
          {isEditing && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <History className="w-4 h-4 text-amber-700" />
                <span>Auditoria & Histórico de Versões Obrigatório</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Os registros anteriores nunca são excluídos. Esta modificação criará a <strong>Versão nº {(initialSession?.versions.length || 0) + 1}</strong> no histórico imutável com data, hora e autor.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1">
                  Justificativa / Resumo da Edição Realizada *
                </label>
                <input
                  type="text"
                  required
                  value={changesSummary}
                  onChange={e => setChangesSummary(e.target.value)}
                  placeholder="Ex: Correção de apontamento técnico sobre intervenção realizada..."
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Nova Versão da Sessão' : 'Salvar Registro de Sessão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
