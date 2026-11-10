import React, { useState } from 'react';
import {
  PsychologicalRecord,
  EvolutionSession,
  RecordStatus,
  RECORD_STATUS_LABELS,
  EVOLUTION_SCALE_MAP,
  GeneralAttachment,
} from '../../types/psychologicalRecord';
import { EvolutionChart } from './EvolutionChart';
import { PatientJourneyD3Chart } from './PatientJourneyD3Chart';
import { SessionModalForm } from './SessionModalForm';
import { ReportPdfExporter } from './ReportPdfExporter';
import { EncryptionInspectorModal } from './EncryptionInspectorModal';
import { psychologicalRecordStorage } from '../../services/psychologicalRecordStorage';
import { recordSecurity } from '../../services/recordSecurity';
import { maskPhone, maskCPF, maskCEP } from '../../utils/maskUtils';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  FileText,
  TrendingUp,
  AlertTriangle,
  History,
  CheckCircle2,
  Printer,
  Plus,
  Lock,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Building,
  Target,
  Sparkles,
  Paperclip,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Download,
  Info,
  X,
} from 'lucide-react';

interface RecordDetailViewProps {
  record: PsychologicalRecord;
  onBack: () => void;
  onRecordUpdated: (updatedRecord: PsychologicalRecord) => void;
  currentProfessional: { id: string; name: string; role: string; registration?: string };
}

export const RecordDetailView: React.FC<RecordDetailViewProps> = ({
  record,
  onBack,
  onRecordUpdated,
  currentProfessional,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'dados' | 'plano' | 'timeline' | 'grafico' | 'anexos' | 'auditoria'
  >('timeline');

  // Modals
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EvolutionSession | null>(null);
  const [pdfExporterOpen, setPdfExporterOpen] = useState(false);
  const [encryptionModalOpen, setEncryptionModalOpen] = useState(false);

  // Status transition modal / quick toggle
  const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);
  const [closureReasonInput, setClosureReasonInput] = useState('');
  const [showStatusModal, setShowStatusModal] = useState<RecordStatus | null>(null);

  // Expanded version histories
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});

  // New general attachment
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [newAttName, setNewAttName] = useState('');
  const [newAttCategory, setNewAttCategory] = useState<GeneralAttachment['category']>('scale_inventory');
  const [newAttNotes, setNewAttNotes] = useState('');

  // Toggle version history expansion
  const toggleVersionExpansion = (sessionId: string) => {
    setExpandedVersions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  // Log view on entry if not already logged recently
  React.useEffect(() => {
    psychologicalRecordStorage.logAuditAction(
      record.id,
      'visualizacao',
      currentProfessional,
      `Acesso e visualização do prontuário clínico pelo profissional responsável.`
    );
  }, [record.id]);

  const handleSaveSession = (
    sessionData: Omit<EvolutionSession, 'id' | 'sessionNumber' | 'createdAt' | 'updatedAt' | 'versions'>,
    changesSummary?: string
  ) => {
    if (editingSession) {
      const res = psychologicalRecordStorage.updateSessionEvolution(
        record.id,
        editingSession.id,
        sessionData,
        changesSummary || 'Edição de anotações da evolução clínica.',
        currentProfessional
      );
      if (res.success && res.record) {
        onRecordUpdated(res.record);
      }
      setEditingSession(null);
    } else {
      const res = psychologicalRecordStorage.addSessionEvolution(
        record.id,
        sessionData,
        currentProfessional
      );
      if (res.success && res.record) {
        onRecordUpdated(res.record);
      }
    }
  };

  const handleStatusChange = (newStatus: RecordStatus) => {
    if (newStatus === 'discharged' || newStatus === 'abandoned' || newStatus === 'referred') {
      setShowStatusModal(newStatus);
    } else {
      const updated = psychologicalRecordStorage.updateRecordStatus(
        record.id,
        newStatus,
        undefined,
        currentProfessional
      );
      if (updated) onRecordUpdated(updated);
      setStatusSelectorOpen(false);
    }
  };

  const handleConfirmStatusChange = () => {
    if (!showStatusModal) return;
    const updated = psychologicalRecordStorage.updateRecordStatus(
      record.id,
      showStatusModal,
      closureReasonInput.trim() || undefined,
      currentProfessional
    );
    if (updated) onRecordUpdated(updated);
    setShowStatusModal(null);
    setClosureReasonInput('');
    setStatusSelectorOpen(false);
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttName.trim()) return;

    const updated = psychologicalRecordStorage.addAttachment(
      record.id,
      {
        name: newAttName.trim(),
        category: newAttCategory,
        fileType: 'application/pdf',
        size: '240 KB',
        notes: newAttNotes.trim() || undefined,
      },
      currentProfessional
    );

    if (updated) onRecordUpdated(updated);
    setNewAttName('');
    setNewAttNotes('');
    setShowAttachmentModal(false);
  };

  const statusConfig = RECORD_STATUS_LABELS[record.status] || RECORD_STATUS_LABELS.active;
  const hasActiveRisks = record.sessions.some(s => s.risks.hasActiveRisk);
  const patientAge = recordSecurity.calculateAge(record.identification.birthDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-slate-600"
            title="Voltar à lista de pacientes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {record.identification.fullName}
              </h1>
              {record.identification.socialName && (
                <span className="text-xs text-slate-500 font-medium">
                  ({record.identification.socialName})
                </span>
              )}

              {/* Status Badge & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusSelectorOpen(!statusSelectorOpen)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 transition-colors ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}
                >
                  <span>{statusConfig.label}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {statusSelectorOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in slide-in-from-top-1">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Alterar Status do Tratamento
                    </p>
                    {(Object.keys(RECORD_STATUS_LABELS) as RecordStatus[]).map(st => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                          record.status === st ? 'font-bold text-sky-800 bg-sky-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>{RECORD_STATUS_LABELS[st].label}</span>
                        {record.status === st && <Check className="w-3.5 h-3.5 text-sky-700" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {hasActiveRisks && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  Alerta de Risco
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span>CPF: {record.identification.cpf}</span>
              <span aria-hidden="true">·</span>
              <span>
                {patientAge} anos ({record.identification.birthDate})
              </span>
              <span aria-hidden="true">·</span>
              <span>{record.identification.city || 'São Paulo'} - {record.identification.state || 'SP'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700">
                {record.sessions.length} {record.sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <button
            onClick={() => setEncryptionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
            title="Verificar Criptografia LGPD"
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Criptografia LGPD</span>
          </button>

          <button
            onClick={() => setPdfExporterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-sky-700" />
            <span>Exportar Relatório PDF</span>
          </button>

          <button
            onClick={() => {
              setEditingSession(null);
              setSessionModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nova Sessão</span>
          </button>
        </div>
      </div>

      {/* Closure Banner if Discharged/Abandoned */}
      {record.closureDate && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              Tratamento Encerrado em {record.closureDate} ({statusConfig.label})
            </span>
            <p className="text-slate-600 mt-0.5">
              Motivo do encerramento: {record.closureReason || 'Alta clínica ou encerramento formal.'}
            </p>
            <span className="text-[11px] text-slate-500 block mt-1">
              Prazo obrigatório de guarda do prontuário até <strong>{record.retentionUntil}</strong> (Resolução CFP nº 01/2009 art. 4º).
            </span>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-3 flex items-center gap-2 overflow-x-auto shadow-2xs">
        {[
          { id: 'timeline', label: `Linha do Tempo de Sessões (${record.sessions.length})`, icon: Clock },
          { id: 'grafico', label: 'Jornada do Paciente & Evolução (D3)', icon: TrendingUp },
          { id: 'dados', label: 'Dados & Histórico Clínico', icon: UserIcon },
          { id: 'plano', label: 'Plano Terapêutico', icon: Target },
          { id: 'anexos', label: `Anexos & Documentos (${record.attachments.length})`, icon: Paperclip },
          { id: 'auditoria', label: `Auditoria & Segurança (${record.auditLogs.length})`, icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-sky-700 text-sky-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LINHA DO TEMPO DE SESSÕES (EVOLUÇÕES) */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {record.sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Nenhum registro de sessão realizado ainda
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Registre a primeira sessão clínica para iniciar o histórico de evolução, notas de 1 a 5 e avaliações de risco.
              </p>
              <button
                onClick={() => {
                  setEditingSession(null);
                  setSessionModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-xs"
              >
                Registrar 1ª Sessão de Evolução
              </button>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 my-2">
              {record.sessions.map(session => {
                const isRisk = session.risks.hasActiveRisk;
                const scaleInfo = EVOLUTION_SCALE_MAP[session.evolutionScore];
                const hasVersions = session.versions && session.versions.length > 0;
                const isVersionsExpanded = !!expandedVersions[session.id];

                return (
                  <div key={session.id} className="relative group">
                    {/* Timeline Node Bullet */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-4 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs ${
                        isRisk
                          ? 'bg-rose-600 text-white animate-pulse'
                          : session.evolutionScore >= 4
                          ? 'bg-emerald-600 text-white'
                          : session.evolutionScore === 3
                          ? 'bg-sky-700 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {session.sessionNumber}
                    </div>

                    {/* Session Card */}
                    <div
                      className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 space-y-4 shadow-xs hover:shadow-md ${
                        isRisk ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                      }`}
                    >
                      {/* Session Top Meta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            Sessão nº {session.sessionNumber}
                          </h3>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-sky-700" />
                            {session.date}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {session.startTime} às {session.endTime}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                            {session.modality}
                          </span>

                          {hasVersions && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md flex items-center gap-1">
                              <History className="w-3 h-3 text-amber-700" />
                              {session.versions.length} {session.versions.length === 1 ? 'edição registrada' : 'edições registradas'}
                            </span>
                          )}
                        </div>

                        {/* Right: Evolution Badge & Edit Button */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              session.evolutionScore >= 4
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : session.evolutionScore === 3
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {scaleInfo?.label}
                          </span>

                          <button
                            onClick={() => {
                              setEditingSession(session);
                              setSessionModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-200"
                          >
                            Editar Sessão
                          </button>
                        </div>
                      </div>

                      {/* Visual Risk Alert Banner if Present */}
                      {isRisk && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-2 text-xs text-rose-950">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              ALERTA DE RISCO IDENTIFICADO NESTA SESSÃO
                            </span>
                            <span className="text-[10px] uppercase font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                              Protocolo Ativo
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                            <div>
                              <strong>Ideação Suicida:</strong> {session.risks.suicideRisk}
                            </div>
                            <div>
                              <strong>Autolesão:</strong> {session.risks.selfHarmRisk}
                            </div>
                            <div>
                              <strong>Violência:</strong> {session.risks.violenceRisk}
                            </div>
                          </div>
                          {session.risks.riskObservations && (
                            <p className="text-[11px] text-rose-800 pt-1 border-t border-rose-200">
                              <strong>Conduta Adotada:</strong> {session.risks.riskObservations}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Estado Emocional */}
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px] mb-0.5">
                          Estado Emocional Observado:
                        </span>
                        <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                          {session.emotionalState}
                        </p>
                      </div>

                      {/* Resumo do Conteúdo */}
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                          Resumo do Conteúdo da Sessão:
                        </span>
                        <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">
                          {session.summaryContent}
                        </p>
                      </div>

                      {/* Intervenções Realizadas */}
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                          Intervenções e Técnicas Clínicas:
                        </span>
                        <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">
                          {session.interventions}
                        </p>
                      </div>

                      {/* Observações da Evolução */}
                      {session.evolutionNotes && (
                        <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 text-xs">
                          <strong className="text-sky-950 block text-[11px] mb-0.5">
                            Apontamentos de Evolução:
                          </strong>
                          <p className="text-slate-700">{session.evolutionNotes}</p>
                        </div>
                      )}

                      {/* Tarefas & Próxima Sessão Footer */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                        <div>
                          {session.nextSessionTasks && (
                            <span>
                              <strong>Tarefas Intersessão:</strong> {session.nextSessionTasks}
                            </span>
                          )}
                        </div>

                        {session.nextSessionDate && (
                          <div className="text-slate-700 font-semibold flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-sky-700" />
                            <span>Próxima Sessão: {session.nextSessionDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Version History Expander */}
                      {hasVersions && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => toggleVersionExpansion(session.id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 hover:text-amber-950 transition-colors"
                          >
                            <History className="w-3.5 h-3.5 text-amber-700" />
                            <span>
                              {isVersionsExpanded ? 'Ocultar Histórico de Versões' : `Ver Histórico de Versões (${session.versions.length})`}
                            </span>
                            {isVersionsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isVersionsExpanded && (
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-amber-300 text-xs">
                              {session.versions.map(v => (
                                <div key={v.versionNumber} className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                                  <div className="flex items-center justify-between font-semibold text-amber-950 mb-1">
                                    <span>Versão nº {v.versionNumber}</span>
                                    <span className="text-[10px] text-amber-800">
                                      {new Date(v.editedAt).toLocaleString('pt-BR')} · {v.editedBy}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 text-[11px]">
                                    <strong>Justificativa da alteração:</strong> {v.changesSummary}
                                  </p>
                                  <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">
                                    <strong>Conteúdo anterior:</strong> {v.previousContent.summaryContent}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JORNADA DO PACIENTE & GRÁFICO DE EVOLUÇÃO (D3) */}
      {activeTab === 'grafico' && (
        <PatientJourneyD3Chart
          record={record}
          onAddMilestone={(milestone) => {
            const updated = psychologicalRecordStorage.addMilestoneToRecord(
              record.id,
              milestone,
              currentProfessional
            );
            if (updated) {
              onRecordUpdated(updated);
            }
          }}
        />
      )}

      {/* TAB 3: DADOS CADASTRAIS & HISTÓRICO CLÍNICO */}
      {activeTab === 'dados' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-8 shadow-xs text-xs">
          {/* 1. Identificação */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>1. Identificação Completa do Paciente</span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Cadastro Único
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Nome Completo</span>
                <span className="font-bold text-slate-900">{record.identification.fullName}</span>
              </div>
              {record.identification.socialName && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Nome Social</span>
                  <span className="font-semibold">{record.identification.socialName}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[11px]">Data de Nascimento / Idade</span>
                <span className="font-semibold">
                  {record.identification.birthDate} ({patientAge} anos)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sexo / Gênero</span>
                <span className="font-semibold">{record.identification.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">CPF</span>
                <span className="font-semibold font-mono">{maskCPF(record.identification.cpf)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Telefone</span>
                <span className="font-semibold font-mono">{maskPhone(record.identification.phone)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">E-mail</span>
                <span className="font-semibold">{record.identification.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Estado Civil</span>
                <span className="font-semibold">{record.identification.maritalStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Profissão</span>
                <span className="font-semibold">{record.identification.profession || 'Não informada'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Escolaridade</span>
                <span className="font-semibold">{record.identification.education}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Endereço Residencial</span>
                <span className="font-semibold">
                  {record.identification.street}, {record.identification.number}
                  {record.identification.complement ? ` - ${record.identification.complement}` : ''} -{' '}
                  {record.identification.neighborhood}, {record.identification.city} - {record.identification.state} (CEP: {maskCEP(record.identification.zipCode)})
                </span>
              </div>
            </div>
          </div>

          {/* 2. Responsável Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>2. Responsável Legal {record.isMinor && '(Obrigatório: Menor de 18 anos)'}</span>
              {record.isMinor ? (
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Paciente Menor de Idade
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Paciente Maior de Idade</span>
              )}
            </h3>

            {record.legalGuardian ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-800 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nome do Responsável</span>
                  <span className="font-bold text-slate-900">{record.legalGuardian.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Parentesco / Vínculo</span>
                  <span className="font-semibold">{record.legalGuardian.relationship}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">CPF do Responsável</span>
                  <span className="font-semibold font-mono">{maskCPF(record.legalGuardian.cpf)}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-400 block text-[11px]">Contato do Responsável</span>
                  <span className="font-semibold">{record.legalGuardian.contact}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Paciente maior de 18 anos civilmente capaz. Não se aplica responsável legal.</p>
            )}
          </div>

          {/* 3. Contato de Emergência */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              3. Contato de Emergência
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-800 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Nome do Contato</span>
                <span className="font-bold">{record.emergencyContact.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Parentesco / Vínculo</span>
                <span className="font-semibold">{record.emergencyContact.relationship}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Telefone</span>
                <span className="font-semibold font-mono">{maskPhone(record.emergencyContact.phonePrimary)}</span>
              </div>
            </div>
          </div>

          {/* 4. Profissional Responsável */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              4. Profissional Responsável
            </h3>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-sky-700 block text-[11px] font-medium">Nome</span>
                <span className="font-bold">{record.professional.name}</span>
              </div>
              <div>
                <span className="text-sky-700 block text-[11px] font-medium">Especialidade</span>
                <span className="font-semibold capitalize">{record.professional.type}</span>
              </div>
              <div>
                <span className="text-sky-700 block text-[11px] font-medium">Registro Profissional</span>
                <span className="font-bold">{record.professional.registration}</span>
              </div>
            </div>
          </div>

          {/* 5. Demanda Inicial */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              5. Demanda Inicial & Queixa Principal
            </h3>
            <div className="space-y-3 text-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Queixa Principal Relatada:</span>
                <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1">
                  {record.initialDemand.chiefComplaint}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px]">Motivo da Busca:</span>
                  <span className="font-semibold">{record.initialDemand.reasonForCare}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Início do Tratamento:</span>
                  <span className="font-semibold">{record.initialDemand.treatmentStartDate}</span>
                </div>
                {record.initialDemand.referral && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Encaminhamento:</span>
                    <span className="font-semibold">{record.initialDemand.referral}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 6. Histórico */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              6. Histórico Clínico, Social e Familiar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Histórico Familiar:</span>
                <p className="mt-0.5 leading-relaxed">{record.history.familyHistory}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Histórico Social & Apoio:</span>
                <p className="mt-0.5 leading-relaxed">{record.history.socialHistory}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Saúde Mental Anterior:</span>
                <p className="mt-0.5 leading-relaxed">{record.history.previousMentalHealth}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Uso de Medicações Atuais:</span>
                <p className="mt-0.5 leading-relaxed font-semibold">{record.history.medications}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Acompanhamento Psiquiátrico:</span>
                <p className="mt-0.5">
                  {record.history.psychiatricFollowUp ? `Sim (Dr(a). ${record.history.psychiatristName})` : 'Não'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Histórico de Internações:</span>
                <p className="mt-0.5">{record.history.hospitalizationHistory}</p>
              </div>
            </div>
          </div>

          {/* 7. Avaliação Inicial */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              7. Avaliação Inicial & Abordagem
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Hipótese Diagnóstica / Impressão:</span>
                <p className="font-bold text-slate-900 mt-0.5">{record.initialAssessment.diagnosticHypothesis}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Abordagem Teórica Utilizada:</span>
                <p className="font-semibold text-sky-900 mt-0.5">{record.initialAssessment.theoreticalApproach}</p>
              </div>
            </div>
          </div>

          {/* 9 & 10. Consentimentos & Guarda */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 block text-[11px]">Termo de Consentimento (TCLE)</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Aceito ({record.consents.signatureType})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Autorização LGPD</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Concedida expressamente
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Guarda Mínima Legal (CFP 01/2009)</span>
              <span className="font-bold text-sky-900 block mt-0.5">
                Até {record.retentionUntil} (5 anos)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PLANO TERAPÊUTICO */}
      {activeTab === 'plano' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-700" />
              Plano Terapêutico & Objetivos de Cuidado
            </h3>
            <p className="text-slate-500 mt-1">
              Diretrizes de intervenção, frequência e técnicas pactuadas entre o profissional e o paciente
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <span className="text-sky-700 font-bold uppercase tracking-wider text-[11px] block mb-1">
                Frequência Prevista das Sessões
              </span>
              <span className="text-base font-bold text-sky-950">
                {record.therapeuticPlan.sessionFrequency === 'weekly'
                  ? 'Semanal (1 vez por semana)'
                  : record.therapeuticPlan.sessionFrequency === 'biweekly'
                  ? 'Quinzenal (a cada 15 dias)'
                  : record.therapeuticPlan.sessionFrequency === 'twice_weekly'
                  ? 'Duas vezes por semana'
                  : 'Mensal'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] block mb-1">
                Marco de Reavaliação
              </span>
              <span className="text-base font-bold text-slate-800">
                {record.therapeuticPlan.reassessmentMilestone || 'A cada 8 a 12 sessões'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Objetivos Terapêuticos Pactuados
            </h4>
            <div className="space-y-2">
              {record.therapeuticPlan.goals.map((goal, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{goal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Estratégias e Técnicas Clínicas Utilizadas
            </h4>
            <div className="flex flex-wrap gap-2">
              {record.therapeuticPlan.strategiesAndTechniques.map((strat, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 font-medium text-sky-900 text-xs shadow-2xs"
                >
                  {strat}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANEXOS & DOCUMENTOS */}
      {activeTab === 'anexos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-sky-700" />
                Anexos & Documentos do Prontuário
              </h3>
              <p className="text-slate-500 mt-1">
                Inventários aplicados (BDI, GAD-7), laudos de médicos assistentes, TCLE assinado e tarefas
              </p>
            </div>

            <button
              onClick={() => setShowAttachmentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Anexar Novo Documento</span>
            </button>
          </div>

          {record.attachments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Paperclip className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Nenhum anexo arquivado ainda</p>
              <p className="text-xs text-slate-400 mt-1">
                Adicione escalas psicológicas, laudos externos ou relatórios clicando no botão acima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.attachments.map(att => (
                <div
                  key={att.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">{att.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="uppercase font-semibold text-sky-800">{att.category}</span>
                      <span>·</span>
                      <span>{att.size}</span>
                      <span>·</span>
                      <span>{new Date(att.uploadedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {att.notes && <p className="text-slate-600 text-[11px] pt-1">{att.notes}</p>}
                  </div>

                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600">
                    PDF Seguro
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDITORIA, SEGURANÇA & LGPD */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              Trilha de Auditoria Imutável & Conformidade Legal
            </h3>
            <p className="text-slate-500 mt-1">
              Registro obrigatório de quem visualizou, editou ou exportou o prontuário e quando
            </p>
          </div>

          {/* Compliance Info Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Guarda Mínima Obrigatória</span>
              <span className="text-sm font-bold text-slate-900">5 Anos (Res. CFP 01/2009)</span>
              <span className="text-[11px] text-slate-500 block">Válido até: {record.retentionUntil}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Proteção Criptográfica</span>
              <span className="text-sm font-bold text-emerald-700">AES-256-GCM Ativa</span>
              <span className="text-[11px] text-slate-500 block">Dado Sensível de Saúde (Art. 11 LGPD)</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Acesso & Sigilo</span>
              <span className="text-sm font-bold text-sky-900">Privativo do Profissional</span>
              <span className="text-[11px] text-slate-500 block">Art. 9º Código de Ética do Psicólogo</span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              Histórico de Acessos e Operações ({record.auditLogs.length})
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {record.auditLogs.map(log => (
                <div key={log.id} className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 capitalize">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 font-medium">{log.actorName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-50 text-sky-800 font-semibold border border-sky-200 capitalize">
                        {log.actorRole}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                  </div>

                  <div className="text-right shrink-0 text-slate-400 text-[11px] tabular-nums font-mono">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR SESSÃO */}
      <SessionModalForm
        isOpen={sessionModalOpen}
        onClose={() => {
          setSessionModalOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSaveSession}
        initialSession={editingSession}
        nextSessionNumber={record.sessions.length + 1}
        patientName={record.identification.fullName}
      />

      {/* MODAL: EXPORTAR RELATÓRIO PDF */}
      <ReportPdfExporter
        isOpen={pdfExporterOpen}
        onClose={() => setPdfExporterOpen(false)}
        record={record}
        currentProfessional={currentProfessional}
      />

      {/* MODAL: INSPETOR DE CRIPTOGRAFIA */}
      <EncryptionInspectorModal
        isOpen={encryptionModalOpen}
        onClose={() => setEncryptionModalOpen(false)}
        record={record}
      />

      {/* MODAL: NOVO ANEXO */}
      {showAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Anexar Documento ao Prontuário</h3>
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAttachment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Arquivo *</label>
                <input
                  type="text"
                  required
                  value={newAttName}
                  onChange={e => setNewAttName(e.target.value)}
                  placeholder="Ex: Escala_BDI_Depressao_Inicial.pdf"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoria do Documento</label>
                <select
                  value={newAttCategory}
                  onChange={e => setNewAttCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="scale_inventory">Escala / Inventário Psicológico</option>
                  <option value="psychiatric_report">Laudo / Relatório Médico Psiquiátrico</option>
                  <option value="tcle">Termo TCLE Digitalizado</option>
                  <option value="school_report">Relatório Escolar / Acadêmico</option>
                  <option value="other">Outro Documento</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Observações Clínicas</label>
                <input
                  type="text"
                  value={newAttNotes}
                  onChange={e => setNewAttNotes(e.target.value)}
                  placeholder="Ex: Pontuação inicial: 12 pontos (Depressão leve)..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAttachmentModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
                >
                  Salvar Anexo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ENCERRAMENTO DE STATUS (ALTA / ABANDONO / ENCAMINHAMENTO) */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">
              Confirmar Alteração de Status para &quot;{RECORD_STATUS_LABELS[showStatusModal]?.label}&quot;
            </h3>
            <p className="text-slate-600 leading-relaxed">
              O encerramento do prontuário ativará a contagem obrigatória da guarda mínima de 5 anos (Resolução CFP nº 01/2009 art. 4º).
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Motivo / Justificativa do Encerramento:
              </label>
              <textarea
                rows={3}
                value={closureReasonInput}
                onChange={e => setClosureReasonInput(e.target.value)}
                placeholder="Ex: Alta clínica por alcance pleno dos objetivos terapêuticos e remissão dos sintomas..."
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-4 py-1.5 font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
