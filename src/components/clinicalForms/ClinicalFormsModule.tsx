import React, { useState } from 'react';
import { ClinicalForm, FormDispatch, FormSubmission, FormCategory } from '../../types/clinicalForm';
import { clinicalFormStorage } from '../../services/clinicalFormStorage';
import { CLINICAL_FORM_TEMPLATES, FormTemplatePreset } from '../../services/clinicalFormTemplates';
import { FormBuilderModal } from './FormBuilderModal';
import { FormDispatchModal } from './FormDispatchModal';
import { FormEvolutionView } from './FormEvolutionView';
import { storage } from '../../services/storage';
import { User } from '../../types';
import {
  FileText,
  Plus,
  Send,
  Copy,
  Check,
  Edit3,
  Trash2,
  Eye,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Calendar,
  Lock,
  Shield,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
  BarChart3,
  ExternalLink,
  ChevronRight,
  BookOpen,
  X,
} from 'lucide-react';

interface ClinicalFormsModuleProps {
  initialFormId?: string;
  initialPatientId?: string;
  professionalId: string;
  professionalName: string;
}

export const ClinicalFormsModule: React.FC<ClinicalFormsModuleProps> = ({
  initialFormId,
  initialPatientId,
  professionalId,
  professionalName,
}) => {
  // Tabs: 'catalog' | 'dispatches' | 'evolution'
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'dispatches' | 'evolution'>('catalog');

  // Subscribed states
  const [forms, setForms] = useState<ClinicalForm[]>(() =>
    clinicalFormStorage.getFormsByProfessional(professionalId)
  );
  const [dispatches, setDispatches] = useState<FormDispatch[]>(() =>
    clinicalFormStorage.getDispatchesByProfessional(professionalId)
  );
  const [submissions, setSubmissions] = useState<FormSubmission[]>(() =>
    clinicalFormStorage.getSubmissionsByProfessional(professionalId)
  );

  React.useEffect(() => {
    const unsub = clinicalFormStorage.subscribe(() => {
      setForms(clinicalFormStorage.getFormsByProfessional(professionalId));
      setDispatches(clinicalFormStorage.getDispatchesByProfessional(professionalId));
      setSubmissions(clinicalFormStorage.getSubmissionsByProfessional(professionalId));
    });
    return () => unsub();
  }, [professionalId]);

  // Filters for Catalog tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FormCategory>('all');

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [formToEdit, setFormToEdit] = useState<ClinicalForm | null>(null);

  const [dispatchFormTarget, setDispatchFormTarget] = useState<ClinicalForm | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // For Evolution Tab
  const allPatients: User[] = storage.getAllPatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || (allPatients.length > 0 ? allPatients[0].id : 'pat_lucas')
  );
  const [selectedFormId, setSelectedFormId] = useState<string>(
    initialFormId || (forms.length > 0 ? forms[0].id : '')
  );

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const unreadCount = clinicalFormStorage.getUnreadSubmissionsCount(professionalId);

  // Duplicating a form
  const handleDuplicate = async (formId: string) => {
    try {
      const cloned = await clinicalFormStorage.duplicateForm(
        formId,
        professionalId,
        professionalName
      );
      setFeedbackMsg(`Formulário "${cloned.title}" duplicado como Rascunho com sucesso!`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao duplicar.');
    }
  };

  // Deleting a form
  const handleDelete = async (form: ClinicalForm) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o formulário "${form.title}"? Esta ação não pode ser desfeita.`
      )
    ) {
      try {
        await clinicalFormStorage.deleteForm(form.id, professionalId);
        setFeedbackMsg(`Formulário "${form.title}" excluído.`);
        setTimeout(() => setFeedbackMsg(''), 3000);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao excluir.');
      }
    }
  };

  // Instantiate template
  const handleInstantiateTemplate = async (tmpl: FormTemplatePreset) => {
    try {
      const newForm: ClinicalForm = {
        id: 'form_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        professionalId,
        professionalName,
        title: tmpl.title,
        description: tmpl.description,
        category: tmpl.category,
        status: 'published',
        isAnonymous: false,
        allowMultipleSubmissions: true,
        periodicity: tmpl.periodicity,
        questions: tmpl.questions.map(q => ({
          ...q,
          id: 'q_' + Math.random().toString(36).substring(2, 8),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await clinicalFormStorage.saveForm(newForm);
      setIsTemplatesModalOpen(false);
      setFeedbackMsg(`Modelo "${newForm.title}" adicionado aos seus formulários!`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao carregar modelo.');
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/#form-${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Filter forms
  const filteredForms = forms.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesTitle = f.title.toLowerCase().includes(term);
      const matchesDesc = f.description?.toLowerCase().includes(term);
      if (!matchesTitle && !matchesDesc) return false;
    }
    return true;
  });

  // Selected patient submissions for evolution
  const patientEvolutionSubmissions = clinicalFormStorage.getSubmissionsByPatientAndForm(
    selectedPatientId,
    selectedFormId,
    professionalId
  );

  const selectedPatientObj = allPatients.find(p => p.id === selectedPatientId);
  const activeEvolutionForm = forms.find(f => f.id === selectedFormId) || forms[0];

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Formulários de Pesquisa & Acompanhamento Clínico
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Isolamento Total por Profissional
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Crie questionários com escalas Likert (0-10), múltipla escolha e respostas dissertativas. Dispare individualmente para seus pacientes com registro rigoroso de timestamps e acompanhe a evolução temporal das respostas com sigilo.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Modelos Prontos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormToEdit(null);
              setIsBuilderOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Formulário</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'catalog'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Meus Formulários ({forms.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dispatches')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'dispatches'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Envios & Disparos ({dispatches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('evolution')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'evolution'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Respostas & Evolução Temporal</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
              {unreadCount} nova(s)
            </span>
          )}
        </button>
      </div>

      {/* Sub-Tab 1: Formulários (Catálogo) */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por título ou descrição de formulário..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="md:col-span-4">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
              >
                <option value="all">Todas as Categorias</option>
                <option value="anxiety">Ansiedade & Pânico</option>
                <option value="mood">Humor & Depressão</option>
                <option value="followup">Acompanhamento Intersessão</option>
                <option value="burnout">Burnout & Estresse</option>
                <option value="anamnesis">Anamnese Inicial</option>
                <option value="general">Geral / Personalizado</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
              >
                <option value="all">Todos os Status</option>
                <option value="published">Apenas Publicados</option>
                <option value="draft">Apenas Rascunhos</option>
              </select>
            </div>
          </div>

          {/* Forms Cards Grid */}
          {filteredForms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                Nenhum formulário encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crie um novo formulário personalizado ou utilize um dos modelos validados disponíveis na biblioteca.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTemplatesModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100"
                >
                  Ver Modelos Prontos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormToEdit(null);
                    setIsBuilderOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-700 rounded-xl hover:bg-sky-800"
                >
                  Criar do Zero
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredForms.map(form => {
                const totalSubmissions = submissions.filter(s => s.formId === form.id).length;
                const isPublished = form.status === 'published';

                return (
                  <div
                    key={form.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPublished ? 'Publicado' : 'Rascunho'}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          Privado
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {form.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {form.description || 'Sem orientações adicionais informadas.'}
                        </p>
                      </div>

                      {/* Questions & Periodicity details */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Perguntas</span>
                          <span className="font-bold text-slate-800">
                            {form.questions.length} dinâmicas
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Respostas</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {totalSubmissions} recebidas
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFormToEdit(form);
                            setIsBuilderOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
                          title="Editar formulário"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(form.id)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
                          title="Duplicar formulário (Clonar)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(form)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir formulário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {totalSubmissions > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFormId(form.id);
                              setActiveSubTab('evolution');
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
                            title="Ver histórico e gráfico de evolução"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Evolução</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={!isPublished}
                          onClick={() => setDispatchFormTarget(form)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-40 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                          title={isPublished ? 'Disparar ao paciente' : 'Publique o formulário antes de enviar'}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Disparos & Envios Pendentes */}
      {activeSubTab === 'dispatches' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Disparos & Registro de Envios Realizados ({dispatches.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rastreamento com timestamp oficial de envio (sentAt) e prazos de validade estabelecidos.
              </p>
            </div>
          </div>

          {dispatches.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhum disparo registrado até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {dispatches.map(disp => {
                const isCompleted = disp.status === 'completed';
                const isExpired = disp.deadline && new Date(disp.deadline) < new Date();

                return (
                  <div
                    key={disp.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {disp.patientName}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-sky-800">
                          {disp.formTitle}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isExpired
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCompleted ? 'Respondido' : isExpired ? 'Prazo Expirado' : 'Aguardando Resposta'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Enviado: {new Date(disp.sentAt).toLocaleString('pt-BR')}
                        </span>
                        {disp.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Prazo limite: {new Date(disp.deadline).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {disp.lastSubmittedAt && (
                          <span className="text-emerald-700 font-semibold font-mono">
                            Última resposta: {new Date(disp.lastSubmittedAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(disp.shareToken)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copiedToken === disp.shareToken ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Link Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(disp.patientId);
                            setSelectedFormId(disp.formId);
                            setActiveSubTab('evolution');
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Ver Respostas</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Respostas & Evolução Temporal */}
      {activeSubTab === 'evolution' && (
        <div className="space-y-6">
          {/* Patient and Form Selectors Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Paciente:
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-sky-600 focus:outline-hidden"
                >
                  {allPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Formulário:
                </label>
                <select
                  value={selectedFormId}
                  onChange={e => setSelectedFormId(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-sky-600 focus:outline-hidden"
                >
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">
                Total de submissões para este paciente:
              </span>
              <span className="text-base font-extrabold text-slate-900 tabular-nums">
                {patientEvolutionSubmissions.length} registro(s) temporal(is)
              </span>
            </div>
          </div>

          {/* Evolution view component */}
          {patientEvolutionSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Nenhuma resposta enviada por {selectedPatientObj?.name || 'este paciente'} para o formulário selecionado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Assim que o paciente responder ao link ou formulário enviado, o histórico longitudinal e o gráfico de evolução temporal aparecerão aqui automaticamente.
              </p>
              {activeEvolutionForm && (
                <button
                  type="button"
                  onClick={() => setDispatchFormTarget(activeEvolutionForm)}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors"
                >
                  Disparar Formulário Agora
                </button>
              )}
            </div>
          ) : (
            <FormEvolutionView
              submissions={patientEvolutionSubmissions}
              form={activeEvolutionForm}
              patientName={selectedPatientObj?.name || 'Paciente'}
              professionalId={professionalId}
              onRefresh={() => {
                setSubmissions(clinicalFormStorage.getSubmissionsByProfessional(professionalId));
              }}
            />
          )}
        </div>
      )}

      {/* Form Builder Modal */}
      {isBuilderOpen && (
        <FormBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          formToEdit={formToEdit}
          professionalId={professionalId}
          professionalName={professionalName}
          onSaved={saved => {
            setForms(clinicalFormStorage.getFormsByProfessional(professionalId));
            setFeedbackMsg(`Formulário "${saved.title}" salvo com sucesso!`);
            setTimeout(() => setFeedbackMsg(''), 4000);
          }}
        />
      )}

      {/* Form Dispatch Modal */}
      {dispatchFormTarget && (
        <FormDispatchModal
          isOpen={!!dispatchFormTarget}
          onClose={() => setDispatchFormTarget(null)}
          form={dispatchFormTarget}
          professionalId={professionalId}
          initialPatientId={selectedPatientId}
          onDispatched={() => {
            setDispatches(clinicalFormStorage.getDispatchesByProfessional(professionalId));
          }}
        />
      )}

      {/* Templates Library Modal */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                  Modelos Clínicos Validados
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Biblioteca de Protocolos Clínicos Prontos
                </h3>
              </div>
              <button
                onClick={() => setIsTemplatesModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500">
                Instancie com 1 clique modelos consagrados para seu consultório. Ao adicionar, uma cópia personalizada será criada sob sua autoria.
              </p>

              <div className="grid grid-cols-1 gap-4">
                {CLINICAL_FORM_TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {tmpl.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                          {tmpl.questions.length} perguntas
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {tmpl.description}
                      </p>
                      <span className="text-[11px] text-slate-400 block pt-1">
                        <strong>Recomendação:</strong> {tmpl.recommendedFor}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInstantiateTemplate(tmpl)}
                      className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Usar este Modelo</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
