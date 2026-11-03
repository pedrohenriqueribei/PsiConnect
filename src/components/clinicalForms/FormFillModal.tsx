import React, { useState } from 'react';
import { ClinicalForm, FormDispatch, QuestionAnswer } from '../../types/clinicalForm';
import { clinicalFormStorage } from '../../services/clinicalFormStorage';
import {
  X,
  CheckCircle2,
  Lock,
  Shield,
  Clock,
  Sparkles,
  AlertCircle,
  Send,
  Heart,
  ChevronRight,
} from 'lucide-react';

interface FormFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ClinicalForm;
  dispatch?: FormDispatch;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  onCompleted?: () => void;
}

export const FormFillModal: React.FC<FormFillModalProps> = ({
  isOpen,
  onClose,
  form,
  dispatch,
  patientId,
  patientName,
  patientEmail,
  onCompleted,
}) => {
  if (!isOpen) return null;

  // Initialize answer states
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    form.questions.forEach(q => {
      if (q.type === 'checkbox') {
        initial[q.id] = [];
      } else if (q.type === 'yes_no_justification') {
        initial[q.id] = { value: null, justification: '' };
      } else {
        initial[q.id] = '';
      }
    });
    return initial;
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    id: string;
    submittedAt: string;
  } | null>(null);

  // Compute progress
  const answeredCount = form.questions.filter(q => {
    const a = answers[q.id];
    if (q.type === 'checkbox') return Array.isArray(a) && a.length > 0;
    if (q.type === 'yes_no_justification') return a && a.value !== null;
    return a !== '' && a !== undefined && a !== null;
  }).length;

  const progressPercent = Math.round((answeredCount / form.questions.length) * 100);

  const handleUpdateAnswer = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
    setValidationError('');
  };

  const handleToggleCheckbox = (qId: string, opt: string) => {
    const current = (answers[qId] as string[]) || [];
    const next = current.includes(opt)
      ? current.filter(x => x !== opt)
      : [...current, opt];
    handleUpdateAnswer(qId, next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate required questions
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (q.required) {
        const a = answers[q.id];
        if (q.type === 'checkbox' && (!Array.isArray(a) || a.length === 0)) {
          setValidationError(`Por favor, responda à pergunta obrigatória #${i + 1}.`);
          return;
        }
        if (q.type === 'yes_no_justification' && (a === undefined || a.value === null)) {
          setValidationError(`Por favor, selecione Sim ou Não na pergunta #${i + 1}.`);
          return;
        }
        if (q.type !== 'checkbox' && q.type !== 'yes_no_justification') {
          if (a === '' || a === undefined || a === null) {
            setValidationError(`Por favor, responda à pergunta obrigatória #${i + 1}.`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers: QuestionAnswer[] = form.questions.map(q => {
        const raw = answers[q.id];
        if (q.type === 'yes_no_justification') {
          return {
            questionId: q.id,
            questionTitle: q.title,
            questionType: q.type,
            value: Boolean(raw?.value),
            justification: raw?.justification || '',
          };
        }
        if (q.type === 'likert_scale') {
          return {
            questionId: q.id,
            questionTitle: q.title,
            questionType: q.type,
            value: Number(raw),
            scaleValue: Number(raw),
          };
        }
        return {
          questionId: q.id,
          questionTitle: q.title,
          questionType: q.type,
          value: raw,
        };
      });

      const submission = await clinicalFormStorage.submitFormResponse({
        formId: form.id,
        dispatchId: dispatch?.id,
        patientId,
        patientName,
        patientEmail,
        answers: formattedAnswers,
      });

      setSubmittedReceipt({
        id: submission.id,
        submittedAt: submission.submittedAt,
      });
      onCompleted?.();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Erro ao enviar respostas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between gap-4 bg-gradient-to-r from-sky-50 to-indigo-50/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                Questionário Clínico
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Ambiente Sigiloso
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              {form.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Solicitado por <strong>{form.professionalName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {!submittedReceipt && (
          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
            <div
              className="bg-sky-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {submittedReceipt ? (
            /* Success confirmation screen */
            <div className="py-8 px-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Respostas Enviadas com Sucesso!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Seu preenchimento foi registrado e notificado a{' '}
                  <strong>{form.professionalName}</strong> para acompanhamento em sua próxima sessão.
                </p>
              </div>

              {/* Receipt card with exact timestamp */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Protocolo:</span>
                  <span className="font-bold text-slate-800">{submittedReceipt.id.slice(0, 16)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Data/Hora Exata:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(submittedReceipt.submittedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 font-sans font-semibold pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Criptografia AES-256
                  </span>
                  <span>Protegido</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-xs"
                >
                  Concluir e Voltar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {validationError && (
                <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Instructions banner */}
              {form.description && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <p>{form.description}</p>
                </div>
              )}

              {/* Questions list */}
              <div className="space-y-6">
                {form.questions.map((q, idx) => {
                  const qValue = answers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                    >
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-bold text-slate-900 block leading-snug">
                          {idx + 1}. {q.title}
                          {q.required && <span className="text-rose-600 ml-1">*</span>}
                        </label>
                        {q.description && (
                          <p className="text-[11px] text-slate-500">{q.description}</p>
                        )}
                      </div>

                      {/* 1. Free Short Text */}
                      {q.type === 'text' && (
                        <input
                          type="text"
                          value={qValue || ''}
                          onChange={e => handleUpdateAnswer(q.id, e.target.value)}
                          placeholder="Digite sua resposta..."
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
                          required={q.required}
                        />
                      )}

                      {/* 2. Free Long Text */}
                      {q.type === 'textarea' && (
                        <textarea
                          rows={3}
                          value={qValue || ''}
                          onChange={e => handleUpdateAnswer(q.id, e.target.value)}
                          placeholder="Descreva detalhadamente o que você sentiu ou observou..."
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                          required={q.required}
                        />
                      )}

                      {/* 3. Radio (Single selection) */}
                      {q.type === 'radio' && (
                        <div className="space-y-2 pt-1">
                          {q.options?.map((opt, i) => {
                            const isSelected = qValue === opt;
                            return (
                              <label
                                key={i}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold ring-1 ring-sky-300 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q_${q.id}`}
                                  value={opt}
                                  checked={isSelected}
                                  onChange={() => handleUpdateAnswer(q.id, opt)}
                                  className="w-4 h-4 accent-sky-700"
                                />
                                <span className="text-xs">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. Checkbox (Multiple selections) */}
                      {q.type === 'checkbox' && (
                        <div className="space-y-2 pt-1">
                          {q.options?.map((opt, i) => {
                            const isChecked = Array.isArray(qValue) && qValue.includes(opt);
                            return (
                              <label
                                key={i}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold ring-1 ring-sky-300 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleCheckbox(q.id, opt)}
                                  className="w-4 h-4 accent-sky-700 rounded-sm"
                                />
                                <span className="text-xs">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* 5. Likert / Numeric Scale (0 to 10) */}
                      {q.type === 'likert_scale' && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                            <span>{q.scaleConfig?.minLabel || 'Mínimo'}</span>
                            <span>{q.scaleConfig?.maxLabel || 'Máximo'}</span>
                          </div>

                          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                            {Array.from({
                              length: (q.scaleConfig?.max ?? 10) - (q.scaleConfig?.min ?? 0) + 1,
                            }).map((_, n) => {
                              const numVal = (q.scaleConfig?.min ?? 0) + n;
                              const isSelected = qValue === numVal;

                              return (
                                <button
                                  type="button"
                                  key={numVal}
                                  onClick={() => handleUpdateAnswer(q.id, numVal)}
                                  className={`py-3 rounded-xl font-black text-xs sm:text-sm tabular-nums transition-all ${
                                    isSelected
                                      ? 'bg-sky-700 text-white shadow-md scale-105 ring-2 ring-sky-400'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {numVal}
                                </button>
                              );
                            })}
                          </div>

                          {qValue !== '' && qValue !== undefined && (
                            <div className="text-center pt-1">
                              <span className="text-xs font-bold text-sky-900 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                                Valor selecionado: {qValue} / {q.scaleConfig?.max ?? 10}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 6. Yes/No with justification */}
                      {q.type === 'yes_no_justification' && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAnswer(q.id, {
                                  value: true,
                                  justification: qValue?.justification || '',
                                })
                              }
                              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                                qValue?.value === true
                                  ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-300 font-extrabold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAnswer(q.id, {
                                  value: false,
                                  justification: qValue?.justification || '',
                                })
                              }
                              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                                qValue?.value === false
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-300 font-extrabold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Não
                            </button>
                          </div>

                          {/* Justification input */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-bold text-slate-600 block">
                              {q.justificationPrompt || 'Justifique brevemente:'}
                            </label>
                            <textarea
                              rows={2}
                              value={qValue?.justification || ''}
                              onChange={e =>
                                handleUpdateAnswer(q.id, {
                                  value: qValue?.value,
                                  justification: e.target.value,
                                })
                              }
                              placeholder="Detalhes ou justificativa..."
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Confidentiality and Legal basis footer */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed">
                <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Sigilo Profissional CFP nº 011/2018 & LGPD:</strong> Suas respostas são armazenadas com criptografia restrita e auditada. Somente o(a) profissional responsável tem acesso ao seu histórico.
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 text-xs sm:text-sm font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Criptografando e Enviando...' : 'Finalizar e Enviar Respostas'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
