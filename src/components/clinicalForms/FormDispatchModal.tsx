import React, { useState } from 'react';
import { ClinicalForm, FormDispatch } from '../../types/clinicalForm';
import { User } from '../../types';
import { storage } from '../../services/storage';
import { clinicalFormStorage } from '../../services/clinicalFormStorage';
import {
  X,
  Send,
  Calendar,
  Clock,
  User as UserIcon,
  Shield,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface FormDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ClinicalForm;
  professionalId: string;
  initialPatientId?: string;
  onDispatched?: (dispatch: FormDispatch) => void;
}

export const FormDispatchModal: React.FC<FormDispatchModalProps> = ({
  isOpen,
  onClose,
  form,
  professionalId,
  initialPatientId,
  onDispatched,
}) => {
  if (!isOpen) return null;

  const allPatients: User[] = storage.getAllPatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || (allPatients.length > 0 ? allPatients[0].id : '')
  );

  const selectedPatient = allPatients.find(p => p.id === selectedPatientId);

  // Optional deadline (default +5 days)
  const defaultDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [hasDeadline, setHasDeadline] = useState(true);
  const [deadline, setDeadline] = useState(defaultDeadline);

  const [isSending, setIsSending] = useState(false);
  const [createdDispatch, setCreatedDispatch] = useState<FormDispatch | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMsg('Selecione um paciente para o envio.');
      return;
    }

    setIsSending(true);
    setErrorMsg('');
    try {
      const disp = await clinicalFormStorage.dispatchForm({
        formId: form.id,
        professionalId,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientEmail: selectedPatient.email,
        deadline: hasDeadline ? deadline : undefined,
      });

      setCreatedDispatch(disp);
      onDispatched?.(disp);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao disparar formulário.');
    } finally {
      setIsSending(false);
    }
  };

  const getShareableUrl = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/#form-${token}`;
  };

  const handleCopyLink = () => {
    if (!createdDispatch) return;
    const url = getShareableUrl(createdDispatch.shareToken);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/70">
          <div>
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
              Disparo Clínico Individual
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Enviar Formulário ao Paciente
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Banner Summary */}
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">{form.title}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {form.questions.length} perguntas · Status: {form.status === 'published' ? 'Publicado' : 'Rascunho'}
              </p>
            </div>
          </div>

          {!createdDispatch ? (
            <form onSubmit={handleDispatch} className="space-y-4">
              {/* Select Patient */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Selecione o Paciente Destinatário *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-medium"
                    required
                  >
                    {allPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deadline Setting */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Prazo de Validade / Expiração
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Data limite opcional para envio da resposta
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasDeadline}
                    onChange={e => setHasDeadline(e.target.checked)}
                    className="w-4 h-4 accent-sky-700 cursor-pointer"
                  />
                </div>

                {hasDeadline && (
                  <div className="flex items-center gap-2 pt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={deadline}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setDeadline(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium"
                      required
                    />
                    <span className="text-[11px] text-slate-500">
                      (Paciente verá este prazo em destaque)
                    </span>
                  </div>
                )}
              </div>

              {/* LGPD and Audit notice */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2 leading-relaxed">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Auditoria & Sigilo Obrigatórios:</strong> O sistema registrará a data e hora exata do envio (timestamp ISO) e vinculará as futuras respostas exclusivamente ao seu prontuário com criptografia de ponta.
                </div>
              </div>

              {/* Submit Dispatch Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Registrando Envio...' : 'Confirmar e Disparar Formulário'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Success confirmation with direct shareable link */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">
                  Formulário Disparado com Sucesso!
                </h4>
                <p className="text-xs text-emerald-800">
                  Registrado no painel de {createdDispatch.patientName} em{' '}
                  {new Date(createdDispatch.sentAt).toLocaleString('pt-BR')}.
                </p>
              </div>

              {/* Link copy box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Link Direto de Preenchimento:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableUrl(createdDispatch.shareToken)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Você pode enviar este link via WhatsApp, e-mail ou aguardar o paciente abrir em seu painel pessoal do PsiConnect.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
