import React, { useState } from 'react';
import { FormDispatch, FormSubmission, ClinicalForm } from '../../types/clinicalForm';
import { clinicalFormStorage } from '../../services/clinicalFormStorage';
import { FormFillModal } from './FormFillModal';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Shield,
  ChevronRight,
  Send,
  Eye,
  Sparkles,
  BarChart2,
  X,
} from 'lucide-react';

interface PatientFormListProps {
  patientId: string;
  patientName: string;
  patientEmail?: string;
}

export const PatientFormList: React.FC<PatientFormListProps> = ({
  patientId,
  patientName,
  patientEmail,
}) => {
  const [dispatches, setDispatches] = useState<FormDispatch[]>(() =>
    clinicalFormStorage.getDispatchesByPatient(patientId)
  );

  const [submissions, setSubmissions] = useState<FormSubmission[]>(() =>
    clinicalFormStorage.getSubmissionsByPatient(patientId)
  );

  React.useEffect(() => {
    const unsub = clinicalFormStorage.subscribe(() => {
      setDispatches(clinicalFormStorage.getDispatchesByPatient(patientId));
      setSubmissions(clinicalFormStorage.getSubmissionsByPatient(patientId));
    });
    return () => unsub();
  }, [patientId]);

  // Modal fill states
  const [fillingForm, setFillingForm] = useState<ClinicalForm | null>(null);
  const [activeDispatch, setActiveDispatch] = useState<FormDispatch | undefined>(undefined);
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);

  const handleOpenFormToFill = (disp: FormDispatch) => {
    const form = clinicalFormStorage.getPublishedFormForPatient(disp.formId);
    if (form) {
      setFillingForm(form);
      setActiveDispatch(disp);
    }
  };

  const pendingDispatches = dispatches.filter(d => d.status === 'pending');
  const completedDispatches = dispatches.filter(d => d.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Pending Questionnaires Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-700" />
              <span>Questionários Pendentes de Preenchimento</span>
              {pendingDispatches.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {pendingDispatches.length} pendente(s)
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulários enviados pelo seu profissional para acompanhar seu progresso clínico entre as sessões.
            </p>
          </div>
        </div>

        {pendingDispatches.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              Você está em dia com seus questionários!
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Quando seu profissional enviar uma nova pesquisa de acompanhamento ou check-in, ela aparecerá aqui em destaque.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDispatches.map(disp => {
              const isExpired =
                disp.deadline && new Date(disp.deadline) < new Date();

              return (
                <div
                  key={disp.id}
                  className="p-5 rounded-xl border border-sky-200 bg-sky-50/40 hover:bg-sky-50/70 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {disp.formTitle}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                        Aguardando Resposta
                      </span>
                      {disp.deadline && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isExpired
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Prazo: até {new Date(disp.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-700" />
                        Enviado em {new Date(disp.sentAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(disp.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenFormToFill(disp)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
                  >
                    <span>Responder Agora</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submissions History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Histórico de Questionários Respondidos ({submissions.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registros protegidos por criptografia de ponta a ponta e sigilo clínico profissional.
            </p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhum questionário respondido anteriormente.
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub, idx) => {
              const subDate = new Date(sub.submittedAt);
              const scoreAnswer = sub.answers.find(a => a.questionType === 'likert_scale');

              return (
                <div
                  key={sub.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {sub.formTitle}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Enviado com Sucesso
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        Criptografado
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>
                        Respondido em {subDate.toLocaleDateString('pt-BR')} às{' '}
                        {subDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>·</span>
                      <span>{sub.answers.length} perguntas</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {scoreAnswer && (
                      <div className="text-right px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[10px] text-slate-400 block leading-none">
                          Sua Pontuação
                        </span>
                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {String(scoreAnswer.scaleValue ?? scoreAnswer.value)}/10
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => setViewingSubmission(sub)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Respostas</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Fill Modal */}
      {fillingForm && (
        <FormFillModal
          isOpen={!!fillingForm}
          onClose={() => {
            setFillingForm(null);
            setActiveDispatch(undefined);
          }}
          form={fillingForm}
          dispatch={activeDispatch}
          patientId={patientId}
          patientName={patientName}
          patientEmail={patientEmail}
          onCompleted={() => {
            setDispatches(clinicalFormStorage.getDispatchesByPatient(patientId));
            setSubmissions(clinicalFormStorage.getSubmissionsByPatient(patientId));
          }}
        />
      )}

      {/* View answers Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cópia de Segurança do Paciente
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {viewingSubmission.formTitle}
                </h3>
              </div>
              <button
                onClick={() => setViewingSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg">
                Timestamp de Envio: {viewingSubmission.submittedAt}
              </div>

              <div className="space-y-3">
                {viewingSubmission.answers.map((ans, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">
                      {idx + 1}. {ans.questionTitle}
                    </span>
                    <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      {ans.questionType === 'likert_scale'
                        ? `${String(ans.scaleValue ?? ans.value)} / 10`
                        : ans.questionType === 'yes_no_justification'
                        ? `${ans.value ? 'Sim' : 'Não'}${ans.justification ? ` - "${ans.justification}"` : ''}`
                        : Array.isArray(ans.value)
                        ? ans.value.join(', ') || 'Nenhuma opção'
                        : String(ans.value || '—')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setViewingSubmission(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
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
