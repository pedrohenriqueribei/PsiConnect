import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  PsychologicalRecord,
  RecordStatus,
  RECORD_STATUS_LABELS,
  EVOLUTION_SCALE_MAP,
  ResponsibleProfessional,
} from '../../types/psychologicalRecord';
import { psychologicalRecordStorage } from '../../services/psychologicalRecordStorage';
import { recordSecurity } from '../../services/recordSecurity';
import { RecordDetailView } from './RecordDetailView';
import { NewRecordModal } from './NewRecordModal';
import { SessionModalForm } from './SessionModalForm';
import {
  Search,
  Filter,
  Plus,
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  User as UserIcon,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Lock,
  Award,
  ChevronRight,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

interface PsychologicalRecordModuleProps {
  initialPatientId?: string;
  onOpenSessionForAppointment?: string;
}

export const PsychologicalRecordModule: React.FC<PsychologicalRecordModuleProps> = ({
  initialPatientId,
}) => {
  const { user } = useAuth();

  // Current Professional meta
  const currentProfessional: ResponsibleProfessional & { role: string } = {
    id: user?.id || 'psy_clara',
    name: user?.name || 'Dra. Clara Vasconcellos',
    type: (user?.professionalType as any) || (user?.role as any) || 'psychologist',
    role: (user?.role as string) || (user?.professionalType as string) || 'psychologist',
    registration: user?.registrationNumber || user?.crp || 'CRP 06/138420',
    email: user?.email,
  };

  // Records state with real-time Firestore subscription
  const [records, setRecords] = useState<PsychologicalRecord[]>(() =>
    psychologicalRecordStorage.getRecordsByProfessional(currentProfessional.id)
  );

  React.useEffect(() => {
    const unsubscribe = psychologicalRecordStorage.subscribe((allRecords) => {
      const filtered = allRecords.filter(r => r.professionalId === currentProfessional.id);
      setRecords(filtered);
    });
    return () => unsubscribe();
  }, [currentProfessional.id]);

  // Selected Record for full Detail View
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(() => {
    if (initialPatientId) {
      const rec = psychologicalRecordStorage.getRecordByPatientAndProfessional(
        initialPatientId,
        currentProfessional.id
      );
      return rec ? rec.id : null;
    }
    return null;
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RecordStatus>('all');
  const [riskOnlyFilter, setRiskOnlyFilter] = useState(false);

  // Modals
  const [newRecordModalOpen, setNewRecordModalOpen] = useState(false);
  const [quickSessionTargetRecord, setQuickSessionTargetRecord] = useState<PsychologicalRecord | null>(null);

  const refreshRecords = () => {
    setRecords(psychologicalRecordStorage.getRecordsByProfessional(currentProfessional.id));
  };

  // If a record is currently open in detail view
  if (selectedRecordId) {
    const activeRecord = records.find(r => r.id === selectedRecordId);
    if (activeRecord) {
      return (
        <RecordDetailView
          record={activeRecord}
          onBack={() => {
            setSelectedRecordId(null);
            refreshRecords();
          }}
          onRecordUpdated={updated => {
            setRecords(prev => prev.map(r => (r.id === updated.id ? updated : r)));
          }}
          currentProfessional={currentProfessional}
        />
      );
    }
  }

  // Filtered records list
  const filteredRecords = records.filter(record => {
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = record.identification.fullName.toLowerCase().includes(term);
      const matchSocial = record.identification.socialName?.toLowerCase().includes(term);
      const matchCpf = record.identification.cpf.includes(term);
      const matchEmail = record.identification.email.toLowerCase().includes(term);
      if (!matchName && !matchSocial && !matchCpf && !matchEmail) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && record.status !== statusFilter) {
      return false;
    }

    // Risk only filter
    if (riskOnlyFilter) {
      const hasRisk = record.sessions.some(s => s.risks.hasActiveRisk);
      if (!hasRisk) return false;
    }

    return true;
  });

  // KPIs
  const totalRecords = records.length;
  const activeRecords = records.filter(r => r.status === 'active').length;
  const dischargedRecords = records.filter(r => r.status === 'discharged').length;
  const totalSessionsCount = records.reduce((acc, r) => acc + r.sessions.length, 0);
  const recordsWithActiveRisk = records.filter(r => r.sessions.some(s => s.risks.hasActiveRisk)).length;

  const handleCreateRecord = (
    newRecordData: Omit<PsychologicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'auditLogs' | 'retentionUntil'>
  ) => {
    const res = psychologicalRecordStorage.createRecord(newRecordData, currentProfessional);
    if (res.success && res.record) {
      refreshRecords();
      setSelectedRecordId(res.record.id);
    }
  };

  const handleSaveQuickSession = (
    sessionData: any
  ) => {
    if (!quickSessionTargetRecord) return;
    const res = psychologicalRecordStorage.addSessionEvolution(
      quickSessionTargetRecord.id,
      sessionData,
      currentProfessional
    );
    if (res.success) {
      refreshRecords();
    }
    setQuickSessionTargetRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Identification */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Módulo de Prontuário Psicológico (PEP)
              </h2>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-600" />
                <span>CFP nº 01/2009 & LGPD Art. 11</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Prontuário único por paciente com histórico de evoluções, versionamento auditável, guarda mínima de 5 anos e relatórios nos padrões da Resolução CFP nº 06/2019.
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewRecordModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Prontuário</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Pacientes Cadastrados</span>
            <UserIcon className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalRecords}</span>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            {activeRecords} em atendimento ativo
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Sessões Arquivadas</span>
            <Clock className="w-4 h-4 text-sky-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalSessionsCount}</span>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            Registros de evolução com notas de 1 a 5
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Casos com Alerta de Risco</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-bold text-rose-700 tabular-nums">{recordsWithActiveRisk}</span>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            {recordsWithActiveRisk > 0 ? 'Atenção a protocolo de contingência' : 'Nenhum paciente em risco ativo'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Guarda Legal Obrigatória</span>
            <Shield className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">5 Anos</span>
          <span className="block text-[11px] text-emerald-700 font-semibold mt-0.5">
            {dischargedRecords} altas preservadas em arquivo
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar paciente por nome completo, nome social, CPF ou e-mail..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-600 text-slate-800"
            />
          </div>

          {/* Risk Toggle */}
          <button
            onClick={() => setRiskOnlyFilter(!riskOnlyFilter)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
              riskOnlyFilter
                ? 'bg-rose-50 text-rose-900 border-rose-300 ring-1 ring-rose-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${riskOnlyFilter ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Apenas com Alerta de Risco ({recordsWithActiveRisk})</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium pt-1">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({records.length})
          </button>

          {(Object.keys(RECORD_STATUS_LABELS) as RecordStatus[]).map(st => {
            const count = records.filter(r => r.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-sky-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {RECORD_STATUS_LABELS[st].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient Records Cards / List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum prontuário encontrado com estes filtros
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente buscar com outro termo ou clique no botão abaixo para abrir o primeiro prontuário deste paciente.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setRiskOnlyFilter(false);
            }}
            className="px-4 py-2 text-xs font-semibold text-sky-800 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map(record => {
            const statusMeta = RECORD_STATUS_LABELS[record.status] || RECORD_STATUS_LABELS.active;
            const lastSession = record.sessions[0];
            const hasActiveRisk = record.sessions.some(s => s.risks.hasActiveRisk);
            const patientAge = recordSecurity.calculateAge(record.identification.birthDate);
            const isMinor = record.isMinor;

            return (
              <div
                key={record.id}
                className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-xs hover:shadow-md ${
                  hasActiveRisk ? 'border-rose-300 ring-1 ring-rose-200/80' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Patient Identity & Medical Badges */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center font-bold text-lg border border-slate-200/80 shrink-0">
                        {record.identification.fullName.charAt(0)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            {record.identification.fullName}
                          </h3>
                          {record.identification.socialName && (
                            <span className="text-xs text-slate-500 font-medium">
                              ({record.identification.socialName})
                            </span>
                          )}

                          {/* Status Badge */}
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}
                          >
                            {statusMeta.label}
                          </span>

                          {/* Minor Badge if < 18 */}
                          {isMinor && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                              Menor de 18 anos (Responsável: {record.legalGuardian?.name})
                            </span>
                          )}

                          {/* Risk Badge */}
                          {hasActiveRisk && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1 shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Alerta de Risco Ativo
                            </span>
                          )}
                        </div>

                        {/* Patient Meta Strip */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span>CPF: {record.identification.cpf}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {patientAge} anos ({record.identification.birthDate})
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{record.identification.phone}</span>
                          <span aria-hidden="true">·</span>
                          <span>{record.identification.city || 'São Paulo'} - {record.identification.state || 'SP'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Queixa Principal Snippet */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                        <span>Queixa Principal & Demanda Inicial:</span>
                        <span className="text-sky-700 font-medium lowercase">
                          iniciado em {record.initialDemand.treatmentStartDate || record.createdAt.split('T')[0]}
                        </span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed text-slate-600">
                        {record.initialDemand.chiefComplaint}
                      </p>
                    </div>

                    {/* Latest Session & Progress Info */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-700" />
                        <span>
                          <strong>{record.sessions.length}</strong>{' '}
                          {record.sessions.length === 1 ? 'sessão realizada' : 'sessões realizadas'}
                        </span>
                      </div>

                      {lastSession && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">·</span>
                          <span>
                            Última sessão em <strong>{lastSession.date}</strong>:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lastSession.evolutionScore >= 4
                                ? 'bg-emerald-100 text-emerald-800'
                                : lastSession.evolutionScore === 3
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            Nota {lastSession.evolutionScore}/5 (
                            {EVOLUTION_SCALE_MAP[lastSession.evolutionScore]?.label.split('-')[1]?.trim()})
                          </span>
                        </div>
                      )}

                      {lastSession?.nextSessionDate && (
                        <div className="flex items-center gap-1 text-slate-700 font-semibold">
                          <span className="text-slate-400">·</span>
                          <Calendar className="w-3.5 h-3.5 text-sky-700" />
                          <span>Próxima: {lastSession.nextSessionDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 self-stretch sm:self-auto lg:w-44">
                    <button
                      onClick={() => setSelectedRecordId(record.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors"
                    >
                      <span>Abrir Prontuário</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setQuickSessionTargetRecord(record)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Sessão</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVO PRONTUÁRIO */}
      <NewRecordModal
        isOpen={newRecordModalOpen}
        onClose={() => setNewRecordModalOpen(false)}
        onSave={handleCreateRecord}
        currentProfessional={currentProfessional}
      />

      {/* MODAL: NOVA SESSÃO RÁPIDA A PARTIR DA LISTA */}
      {quickSessionTargetRecord && (
        <SessionModalForm
          isOpen={true}
          onClose={() => setQuickSessionTargetRecord(null)}
          onSave={handleSaveQuickSession}
          nextSessionNumber={quickSessionTargetRecord.sessions.length + 1}
          patientName={quickSessionTargetRecord.identification.fullName}
        />
      )}
    </div>
  );
};
