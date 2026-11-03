import React, { useState } from 'react';
import { User, PatientMatchResult } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Send,
  Sparkles,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  HeartHandshake,
  Award,
  GraduationCap,
} from 'lucide-react';

interface PatientInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchResult: PatientMatchResult | null;
}

export const PatientInviteModal: React.FC<PatientInviteModalProps> = ({
  isOpen,
  onClose,
  matchResult,
}) => {
  const { user } = useAuth();
  const [customMessage, setCustomMessage] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('14:00');
  const [isSent, setIsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (matchResult && user) {
      const patient = matchResult.patient;
      const firstName = patient.name.split(' ')[0];
      setCustomMessage(
        `Olá, ${firstName}! Sou ${user.name}. Analisei com muito carinho seu perfil de acolhimento e queixas relatadas. Como profissional de vivência e abordagem afins, coloco-me à disposição para acompanhá-la(o) com toda escuta e acolhimento.`
      );
      setIsSent(false);
      setCopied(false);
    }
  }, [matchResult, user]);

  if (!isOpen || !matchResult || !user) return null;

  const patient = matchResult.patient;
  const patientProfile = patient.patientProfile;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `https://psiconnect.applet/agendamento?prof=${user.id}&patient=${patient.id}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 flex items-start sm:items-center justify-center">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-5 bg-gradient-to-r from-sky-700 to-indigo-800 text-white flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <HeartHandshake className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Acolher & Convidar Paciente
              </h2>
              <p className="text-xs text-sky-100/90 mt-0.5">
                {patient.name} · {matchResult.score}% de Afinidade de Perfil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain p-6 space-y-5">
          {/* Match summary badge */}
          <div className="p-3.5 bg-sky-50/80 rounded-xl border border-sky-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-950">
              <span>Score de Compatibilidade Ponderado:</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-700 text-white text-[11px] font-bold">
                {matchResult.score}% ({matchResult.scoreBreakdown?.totalScore ?? matchResult.score}/100 pts)
              </span>
            </div>

            {matchResult.scoreBreakdown && (
              <div className="grid grid-cols-4 gap-1.5 text-center pt-0.5">
                <div className="p-1.5 rounded-lg bg-white border border-sky-100 shadow-2xs">
                  <span className="text-[9px] text-slate-500 block font-medium">Faixa (30%)</span>
                  <span className="text-xs font-bold text-indigo-900">{matchResult.scoreBreakdown.ageGroupScore} pts</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-sky-100 shadow-2xs">
                  <span className="text-[9px] text-slate-500 block font-medium">Motivos (30%)</span>
                  <span className="text-xs font-bold text-sky-900">{matchResult.scoreBreakdown.reasonsScore} pts</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-sky-100 shadow-2xs">
                  <span className="text-[9px] text-slate-500 block font-medium">Civil (20%)</span>
                  <span className="text-xs font-bold text-amber-900">{matchResult.scoreBreakdown.maritalScore} pts</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-sky-100 shadow-2xs">
                  <span className="text-[9px] text-slate-500 block font-medium">Filhos (20%)</span>
                  <span className="text-xs font-bold text-emerald-900">{matchResult.scoreBreakdown.childrenScore} pts</span>
                </div>
              </div>
            )}

            <ul className="text-xs text-sky-900/90 space-y-1 pt-1 border-t border-sky-200/50">
              {matchResult.matchHighlights.slice(0, 3).map((h, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            {((matchResult.matchedSpecializations && matchResult.matchedSpecializations.length > 0) ||
              (matchResult.matchedFormations && matchResult.matchedFormations.length > 0)) && (
              <div className="pt-1.5 border-t border-sky-200/50 flex flex-wrap gap-1">
                {matchResult.matchedSpecializations?.map(spec => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                  >
                    <Award className="w-3 h-3 text-emerald-600" />
                    <span>{spec}</span>
                  </span>
                ))}
                {matchResult.matchedFormations?.map(form => (
                  <span
                    key={form}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300"
                  >
                    <GraduationCap className="w-3 h-3 text-indigo-600" />
                    <span>{form}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {isSent ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Convite de Acolhimento Enviado!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                A mensagem personalizada e o link de acesso aos seus horários foram direcionados para {patient.name}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mensagem de Acolhimento
                </label>
                <textarea
                  rows={4}
                  required
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-600 leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sugerir Data (opcional)
                  </label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={e => setProposedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sugerir Horário (opcional)
                  </label>
                  <input
                    type="time"
                    value={proposedTime}
                    onChange={e => setProposedTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copiado!' : 'Copiar Link Direto'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Convite</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
