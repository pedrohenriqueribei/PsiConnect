import React, { useState } from 'react';
import {
  ClinicalForm,
  FormQuestion,
  QuestionType,
  FormCategory,
  FormStatus,
  PeriodicityType,
} from '../../types/clinicalForm';
import { clinicalFormStorage } from '../../services/clinicalFormStorage';
import {
  X,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sparkles,
  AlignLeft,
  FileText,
  List,
  CheckSquare,
  Sliders,
  HelpCircle,
  Eye,
  Settings,
  Lock,
} from 'lucide-react';

interface FormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  formToEdit?: ClinicalForm | null;
  professionalId: string;
  professionalName: string;
  onSaved: (form: ClinicalForm) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; icon: React.ReactNode; desc: string }> = {
  text: {
    label: 'Texto Livre Curto',
    icon: <AlignLeft className="w-4 h-4 text-sky-700" />,
    desc: 'Resposta de 1 linha (ex: Nome, horário, palavra-chave)',
  },
  textarea: {
    label: 'Texto Livre Longo',
    icon: <FileText className="w-4 h-4 text-sky-700" />,
    desc: 'Campo para relato extenso, reflexões e anotações livres',
  },
  radio: {
    label: 'Múltipla Escolha (Única)',
    icon: <List className="w-4 h-4 text-indigo-700" />,
    desc: 'Paciente escolhe apenas 1 opção da lista',
  },
  checkbox: {
    label: 'Caixa de Seleção (Múltiplas)',
    icon: <CheckSquare className="w-4 h-4 text-emerald-700" />,
    desc: 'Paciente pode assinalar várias opções simultâneas (ex: sintomas)',
  },
  likert_scale: {
    label: 'Escala Likert / Numérica (0-10)',
    icon: <Sliders className="w-4 h-4 text-amber-700" />,
    desc: 'Mensuração numérica para intensidade de dor, humor ou ansiedade',
  },
  yes_no_justification: {
    label: 'Sim / Não com Justificativa',
    icon: <HelpCircle className="w-4 h-4 text-rose-700" />,
    desc: 'Resposta binária acompanhada de campo opcional explicativo',
  },
};

export const FormBuilderModal: React.FC<FormBuilderModalProps> = ({
  isOpen,
  onClose,
  formToEdit,
  professionalId,
  professionalName,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(formToEdit?.title || '');
  const [description, setDescription] = useState(formToEdit?.description || '');
  const [category, setCategory] = useState<FormCategory>(formToEdit?.category || 'anxiety');
  const [status, setStatus] = useState<FormStatus>(formToEdit?.status || 'published');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(formToEdit?.isAnonymous || false);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState<boolean>(
    formToEdit?.allowMultipleSubmissions ?? true
  );
  const [periodicity, setPeriodicity] = useState<PeriodicityType>(
    formToEdit?.periodicity || 'weekly'
  );

  const [questions, setQuestions] = useState<FormQuestion[]>(() => {
    if (formToEdit && formToEdit.questions.length > 0) {
      return formToEdit.questions;
    }
    return [
      {
        id: 'q_' + Math.random().toString(36).substring(2, 8),
        title: 'Qual foi o seu nível médio de ansiedade percebido nos últimos dias? (Escala 0 a 10)',
        description: '0 = Nenhuma ansiedade perceptível | 10 = Ansiedade extrema / Crise aguda',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Nenhuma ansiedade',
          maxLabel: '10 - Ansiedade extrema',
        },
      },
    ];
  });

  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Question manipulation helpers
  const handleAddQuestion = (type: QuestionType = 'textarea') => {
    const newQ: FormQuestion = {
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      title: '',
      type,
      required: true,
      options: type === 'radio' || type === 'checkbox' ? ['Opção 1', 'Opção 2'] : undefined,
      scaleConfig:
        type === 'likert_scale'
          ? { min: 0, max: 10, minLabel: '0 - Mínimo', maxLabel: '10 - Máximo' }
          : undefined,
      justificationPrompt:
        type === 'yes_no_justification'
          ? 'Se sim, justifique brevemente:'
          : undefined,
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleUpdateQuestion = (index: number, patch: Partial<FormQuestion>) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      setErrorMessage('O formulário deve conter pelo menos 1 pergunta.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index];
    const clone: FormQuestion = {
      ...target,
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      title: `${target.title} (Cópia)`,
    };
    setQuestions(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, clone);
      return copy;
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setQuestions(prev => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = item;
      return copy;
    });
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const current = q.options || [];
    handleUpdateQuestion(qIndex, {
      options: [...current, `Opção ${current.length + 1}`],
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    const q = questions[qIndex];
    const current = [...(q.options || [])];
    current[optIndex] = text;
    handleUpdateQuestion(qIndex, { options: current });
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    const current = (q.options || []).filter((_, i) => i !== optIndex);
    handleUpdateQuestion(qIndex, { options: current });
  };

  const handleSave = async () => {
    setErrorMessage('');
    if (!title.trim()) {
      setErrorMessage('Por favor, informe o título do formulário.');
      return;
    }

    if (questions.length === 0) {
      setErrorMessage('Adicione pelo menos 1 pergunta ao formulário.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].title.trim()) {
        setErrorMessage(`A pergunta #${i + 1} precisa ter um enunciado.`);
        return;
      }
      if (
        (questions[i].type === 'radio' || questions[i].type === 'checkbox') &&
        (!questions[i].options || questions[i].options!.length < 2)
      ) {
        setErrorMessage(`A pergunta #${i + 1} precisa ter no mínimo 2 opções de resposta.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const formPayload: ClinicalForm = {
        id: formToEdit?.id || 'form_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        professionalId, // Rigid isolation
        professionalName,
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        isAnonymous,
        allowMultipleSubmissions,
        periodicity,
        questions,
        createdAt: formToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await clinicalFormStorage.saveForm(formPayload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao salvar formulário.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {formToEdit ? 'Editar Formulário de Pesquisa' : 'Criar Novo Formulário Clínico'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {professionalName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulário rigidamente isolado sob seu ID profissional (CFP & LGPD compliance).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'builder'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Construtor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-sky-700" />
                <span>Pré-visualização</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'builder' ? (
            <div className="space-y-6">
              {/* Form Metadata Section */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Settings className="w-3.5 h-3.5 text-sky-700" />
                  <span>Configurações Gerais do Formulário</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Title */}
                  <div className="md:col-span-8 space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Título do Formulário *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ex: Escala de Ansiedade GAD-7 & Monitoramento Semanal"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
                    />
                  </div>

                  {/* Status: Draft vs Published */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Status de Publicação *
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as FormStatus)}
                      className={`w-full px-3 py-2 text-xs border rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-sky-600 ${
                        status === 'published'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="published">🟢 Publicado (Pronto para envio)</option>
                      <option value="draft">🟡 Rascunho (Em construção)</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Categoria Clínica
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as FormCategory)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="anxiety">Ansiedade & Pânico</option>
                      <option value="mood">Humor & Depressão</option>
                      <option value="followup">Acompanhamento Intersessão</option>
                      <option value="burnout">Burnout & Estresse</option>
                      <option value="anamnesis">Anamnese Inicial</option>
                      <option value="general">Geral / Personalizado</option>
                    </select>
                  </div>

                  {/* Periodicity */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Periodicidade Recomendada
                    </label>
                    <select
                      value={periodicity}
                      onChange={e => setPeriodicity(e.target.value as PeriodicityType)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="weekly">Semanal (Toda semana)</option>
                      <option value="biweekly">Quinzenal</option>
                      <option value="monthly">Mensal</option>
                      <option value="on_demand">Livre Demanda / Pontual</option>
                    </select>
                  </div>

                  {/* Multiple submissions toggle */}
                  <div className="md:col-span-4 flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl self-end">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Múltiplas Respostas
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Evolução ao longo do tempo
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowMultipleSubmissions}
                      onChange={e => setAllowMultipleSubmissions(e.target.checked)}
                      className="w-4 h-4 accent-sky-700 cursor-pointer"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-12 space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Orientações para o Paciente (Descrição)
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Instruções claras sobre como e quando responder este questionário..."
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Perguntas do Formulário</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {questions.length}
                    </span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Adicionar Pergunta:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('textarea')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Pergunta</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qIndex) => {
                    const typeMeta = QUESTION_TYPE_LABELS[q.type];

                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                      >
                        {/* Question Header & Order controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                              {qIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              {typeMeta.icon}
                              <span>{typeMeta.label}</span>
                            </span>
                          </div>

                          {/* Controls bar */}
                          <div className="flex items-center gap-1 self-end sm:self-center">
                            {/* Required toggle */}
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 mr-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={e =>
                                  handleUpdateQuestion(qIndex, { required: e.target.checked })
                                }
                                className="w-3.5 h-3.5 accent-sky-700"
                              />
                              <span className={q.required ? 'font-bold text-sky-900' : 'text-slate-400'}>
                                {q.required ? 'Obrigatória' : 'Opcional'}
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(qIndex, 'up')}
                              disabled={qIndex === 0}
                              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(qIndex, 'down')}
                              disabled={qIndex === questions.length - 1}
                              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateQuestion(qIndex)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Duplicar pergunta"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(qIndex)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Excluir pergunta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title and Type Row */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-8 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Enunciado da Pergunta *
                            </label>
                            <input
                              type="text"
                              value={q.title}
                              onChange={e =>
                                handleUpdateQuestion(qIndex, { title: e.target.value })
                              }
                              placeholder="Ex: Como você avalia seu humor nos últimos dias?"
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
                            />
                          </div>

                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Tipo de Resposta
                            </label>
                            <select
                              value={q.type}
                              onChange={e => {
                                const newType = e.target.value as QuestionType;
                                handleUpdateQuestion(qIndex, {
                                  type: newType,
                                  options:
                                    newType === 'radio' || newType === 'checkbox'
                                      ? q.options || ['Opção 1', 'Opção 2']
                                      : undefined,
                                  scaleConfig:
                                    newType === 'likert_scale'
                                      ? q.scaleConfig || {
                                          min: 0,
                                          max: 10,
                                          minLabel: '0 - Mínimo',
                                          maxLabel: '10 - Máximo',
                                        }
                                      : undefined,
                                  justificationPrompt:
                                    newType === 'yes_no_justification'
                                      ? q.justificationPrompt || 'Se sim, justifique brevemente:'
                                      : undefined,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                            >
                              <option value="text">Texto Livre Curto</option>
                              <option value="textarea">Texto Livre Longo</option>
                              <option value="radio">Múltipla Escolha (Única)</option>
                              <option value="checkbox">Caixas de Seleção (Múltiplas)</option>
                              <option value="likert_scale">Escala Likert / Numérica (0-10)</option>
                              <option value="yes_no_justification">Sim/Não com Justificativa</option>
                            </select>
                          </div>

                          <div className="md:col-span-12 space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 block">
                              Descrição ou Orientação Opcional
                            </label>
                            <input
                              type="text"
                              value={q.description || ''}
                              onChange={e =>
                                handleUpdateQuestion(qIndex, { description: e.target.value })
                              }
                              placeholder="Ex: Leve em consideração os últimos 7 dias da sua rotina."
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                            />
                          </div>
                        </div>

                        {/* Specific Sub-Editors */}
                        {/* 1. Radio / Checkbox options editor */}
                        {(q.type === 'radio' || q.type === 'checkbox') && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">
                                Opções de Seleção ({q.options?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddOption(qIndex)}
                                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Adicionar Opção</span>
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {q.options?.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-mono w-4">
                                    {optIdx + 1}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={e =>
                                      handleUpdateOption(qIndex, optIdx, e.target.value)
                                    }
                                    placeholder={`Opção ${optIdx + 1}`}
                                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(qIndex, optIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. Likert scale config */}
                        {q.type === 'likert_scale' && (
                          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                            <span className="text-xs font-bold text-amber-900 block">
                              Configuração da Escala Numérica
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                  Mínimo
                                </label>
                                <input
                                  type="number"
                                  value={q.scaleConfig?.min ?? 0}
                                  onChange={e =>
                                    handleUpdateQuestion(qIndex, {
                                      scaleConfig: {
                                        min: Number(e.target.value),
                                        max: q.scaleConfig?.max ?? 10,
                                        minLabel: q.scaleConfig?.minLabel || '',
                                        maxLabel: q.scaleConfig?.maxLabel || '',
                                      },
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                  Máximo
                                </label>
                                <input
                                  type="number"
                                  value={q.scaleConfig?.max ?? 10}
                                  onChange={e =>
                                    handleUpdateQuestion(qIndex, {
                                      scaleConfig: {
                                        min: q.scaleConfig?.min ?? 0,
                                        max: Number(e.target.value),
                                        minLabel: q.scaleConfig?.minLabel || '',
                                        maxLabel: q.scaleConfig?.maxLabel || '',
                                      },
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                  Rótulo Mínimo
                                </label>
                                <input
                                  type="text"
                                  value={q.scaleConfig?.minLabel || ''}
                                  onChange={e =>
                                    handleUpdateQuestion(qIndex, {
                                      scaleConfig: {
                                        min: q.scaleConfig?.min ?? 0,
                                        max: q.scaleConfig?.max ?? 10,
                                        minLabel: e.target.value,
                                        maxLabel: q.scaleConfig?.maxLabel || '',
                                      },
                                    })
                                  }
                                  placeholder="0 - Sem sintomas / Tranquilo"
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-4">
                                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                  Rótulo Máximo
                                </label>
                                <input
                                  type="text"
                                  value={q.scaleConfig?.maxLabel || ''}
                                  onChange={e =>
                                    handleUpdateQuestion(qIndex, {
                                      scaleConfig: {
                                        min: q.scaleConfig?.min ?? 0,
                                        max: q.scaleConfig?.max ?? 10,
                                        minLabel: q.scaleConfig?.minLabel || '',
                                        maxLabel: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="10 - Sintoma extremo / Crise aguda"
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. Yes/No with justification prompt */}
                        {q.type === 'yes_no_justification' && (
                          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2">
                            <label className="text-xs font-bold text-rose-950 block">
                              Enunciado do campo de Justificativa opcional:
                            </label>
                            <input
                              type="text"
                              value={q.justificationPrompt || ''}
                              onChange={e =>
                                handleUpdateQuestion(qIndex, {
                                  justificationPrompt: e.target.value,
                                })
                              }
                              placeholder="Ex: Se sim, descreva quando ocorreu e como você se sentiu:"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Live Interactive Preview for the Professional */
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
              <div className="p-4 bg-white rounded-xl border border-sky-200 space-y-1">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">
                  Prévia da Experiência do Paciente
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">{title || 'Título do Formulário'}</h3>
                {description && <p className="text-xs text-slate-600">{description}</p>}
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {idx + 1}. {q.title || 'Pergunta sem enunciado'}
                        {q.required && <span className="text-rose-600 ml-1">*</span>}
                      </span>
                    </div>
                    {q.description && (
                      <p className="text-[11px] text-slate-500">{q.description}</p>
                    )}

                    {/* Mock Controls */}
                    {q.type === 'text' && (
                      <input
                        type="text"
                        disabled
                        placeholder="Resposta curta do paciente..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    )}
                    {q.type === 'textarea' && (
                      <textarea
                        rows={2}
                        disabled
                        placeholder="Resposta longa e detalhada..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    )}
                    {q.type === 'radio' && (
                      <div className="space-y-1 pt-1">
                        {q.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                            <input type="radio" disabled name={`prev_r_${q.id}`} />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'checkbox' && (
                      <div className="space-y-1 pt-1">
                        {q.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                            <input type="checkbox" disabled />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'likert_scale' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Array.from({ length: (q.scaleConfig?.max ?? 10) - (q.scaleConfig?.min ?? 0) + 1 }).map(
                            (_, n) => {
                              const val = (q.scaleConfig?.min ?? 0) + n;
                              return (
                                <div
                                  key={val}
                                  className="w-8 h-8 rounded-lg border border-slate-300 bg-white flex items-center justify-center font-bold text-xs text-slate-700"
                                >
                                  {val}
                                </div>
                              );
                            }
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>{q.scaleConfig?.minLabel}</span>
                          <span>{q.scaleConfig?.maxLabel}</span>
                        </div>
                      </div>
                    )}
                    {q.type === 'yes_no_justification' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled
                            className="px-4 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            disabled
                            className="px-4 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700"
                          >
                            Não
                          </button>
                        </div>
                        <input
                          type="text"
                          disabled
                          placeholder={q.justificationPrompt || 'Justificativa...'}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : formToEdit ? 'Atualizar Formulário' : 'Salvar Formulário'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
