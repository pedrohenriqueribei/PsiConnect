import React, { useEffect, useState } from 'react';
import { User, isProfessionalAcceptingPatients } from '../types';
import { ProfessionalSearchCard } from './ProfessionalSearchCard';
import { Eye, X, Edit3, Info, RefreshCw } from 'lucide-react';

interface ProfessionalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: User;
  hasUnsavedChanges?: boolean;
  onToggleAvailability?: () => void;
  onEditProfile?: () => void;
}

export const ProfessionalPreviewModal: React.FC<ProfessionalPreviewModalProps> = ({
  isOpen,
  onClose,
  professional,
  hasUnsavedChanges = false,
  onToggleAvailability,
  onEditProfile,
}) => {
  const [bookingHintVisible, setBookingHintVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setBookingHintVisible(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAccepting = isProfessionalAcceptingPatients(professional);

  const handlePreviewBookingClick = () => {
    setBookingHintVisible(true);
    window.setTimeout(() => setBookingHintVisible(false), 3500);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 flex items-start sm:items-center justify-center"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-profile-modal-title"
      data-testid="preview-profile-modal"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-gradient-to-r from-sky-700 to-indigo-800 text-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Eye className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <h2 id="preview-profile-modal-title" className="text-base font-bold tracking-tight">
                Pré-visualização do Perfil
              </h2>
              <p className="text-xs text-sky-100/90 mt-0.5">
                Visão exata de como seu card aparece aos pacientes nos resultados de busca
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Fechar pré-visualização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain p-5 sm:p-6 space-y-4">
          {/* Context Info Banner */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors duration-300 ${
              isAccepting
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
            }`}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
            <div className="space-y-1">
              <p className="leading-relaxed">
                {isAccepting ? (
                  <>
                    Seu perfil está visível com o selo <strong>Aceitando novos pacientes</strong> e recebe prioridade na listagem da busca.
                  </>
                ) : (
                  <>
                    Seu perfil aparece com o selo <strong>Indisponível no momento</strong>, posicionado após profissionais disponíveis e com o botão de agendamento bloqueado.
                  </>
                )}
              </p>
              {hasUnsavedChanges && (
                <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">
                  Prévia inclui edições atuais do formulário ainda não salvas.
                </p>
              )}
            </div>
          </div>

          {/* Search Result Stage */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
              Resultado na Busca de Pacientes
            </span>
            <ProfessionalSearchCard
              professional={professional}
              isPreview
              onPreviewBookingClick={handlePreviewBookingClick}
            />
          </div>

          {bookingHintVisible && (
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-900 dark:text-sky-200 font-medium text-center">
              Botão ilustrativo: na busca real, o paciente abre a janela de agendamento ao clicar aqui.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {onToggleAvailability ? (
            <button
              type="button"
              onClick={onToggleAvailability}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>
                {isAccepting ? 'Simular como Indisponível' : 'Ativar para Novos Pacientes'}
              </span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onEditProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProfile();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Perfil</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
