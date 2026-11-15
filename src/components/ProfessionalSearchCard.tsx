import React from 'react';
import { User, ProfessionalType, isProfessionalAcceptingPatients } from '../types';
import { storage } from '../services/storage';
import { calculateMatchScore } from '../services/matchingEngine';
import {
  BookOpen,
  Brain,
  Leaf,
  Compass,
  Building2,
  HeartHandshake,
  Sparkles,
  PauseCircle,
} from 'lucide-react';

interface ProfessionalSearchCardProps {
  professional: User;
  patientUser?: User | null;
  onBook?: (professional: User) => void;
  isPreview?: boolean;
  onPreviewBookingClick?: () => void;
}

export const getProfessionalBadgeInfo = (prof: User) => {
  const pType: ProfessionalType = (prof.professionalType ||
    (prof.role === 'pastor'
      ? 'pastor'
      : prof.role === 'therapist'
      ? 'therapist'
      : prof.role === 'psychoanalyst'
      ? 'psychoanalyst'
      : 'psychologist')) as ProfessionalType;

  switch (pType) {
    case 'pastor':
      return {
        label: 'Pastor · Aconselhamento Bíblico',
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-900 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        icon: <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />,
      };
    case 'therapist':
      return {
        label: 'Terapeuta · Emocional & Integrativa',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-900 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: <Leaf className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />,
      };
    case 'psychoanalyst':
      return {
        label: 'Psicanalista · Análise Clínica',
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-900 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        icon: <Compass className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />,
      };
    case 'psychologist':
    default:
      return {
        label: 'Psicólogo(a) · Saúde Mental & CRP',
        bg: 'bg-sky-50 dark:bg-sky-950/60',
        text: 'text-sky-900 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800',
        icon: <Brain className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />,
      };
  }
};

export const ProfessionalSearchCard: React.FC<ProfessionalSearchCardProps> = ({
  professional,
  patientUser,
  onBook,
  isPreview = false,
  onPreviewBookingClick,
}) => {
  const badge = getProfessionalBadgeInfo(professional);
  const isAccepting = isProfessionalAcceptingPatients(professional);
  const pType: ProfessionalType = (professional.professionalType ||
    (professional.role === 'pastor'
      ? 'pastor'
      : professional.role === 'therapist'
      ? 'therapist'
      : professional.role === 'psychoanalyst'
      ? 'psychoanalyst'
      : 'psychologist')) as ProfessionalType;

  const hasSocialSlots = storage
    .getAvailabilitySlots(professional.id)
    .some(s => s.isSocial && s.isActive);

  return (
    <div
      data-testid={isPreview ? 'preview-profile-card' : `professional-card-${professional.id}`}
      className={`rounded-2xl border overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
        isAccepting
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
          : 'bg-slate-50/60 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800/80 opacity-90'
      }`}
    >
      <div className="p-6 space-y-4">
        {/* Header with avatar & name */}
        <div className="flex items-start gap-4">
          {professional.avatar ? (
            <img
              src={professional.avatar}
              alt={professional.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center text-xl shrink-0">
              {professional.name.charAt(0)}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {professional.name}
              </h3>
            </div>

            {/* Professional Type Badge, Availability Status & Matching Score */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </div>

              <div
                data-testid={
                  isPreview
                    ? 'preview-availability-badge'
                    : `availability-badge-${professional.id}`
                }
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors duration-300 ${
                  isAccepting
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {isAccepting ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Aceitando novos pacientes</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Indisponível no momento</span>
                  </>
                )}
              </div>

              {!isPreview && patientUser && patientUser.patientProfile && (() => {
                const match = calculateMatchScore(professional, patientUser);
                return (
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      match.score >= 85
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                    }`}
                    title={match.highlights.join(' · ')}
                  >
                    <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    <span>{match.score}% Compatível</span>
                  </div>
                );
              })()}

              {hasSocialSlots && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
                  <HeartHandshake className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Atendimento Social</span>
                </div>
              )}
            </div>

            {/* Credential or Church: CRP only for psychologists */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {pType === 'psychologist' && (professional.crp || professional.registrationNumber) && (
                <span className="text-sky-900 dark:text-sky-300 font-semibold">
                  {professional.crp || professional.registrationNumber}
                </span>
              )}
              {pType === 'pastor' && professional.ministryOrChurch && (
                <span className="flex items-center gap-1 text-amber-900 dark:text-amber-300">
                  <Building2 className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                  {professional.ministryOrChurch}
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              {professional.city ? `${professional.city}, ${professional.state}` : 'Atendimento Online no Brasil'}
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {professional.bio || 'Profissional dedicado ao acolhimento e desenvolvimento humano.'}
        </p>

        {/* Tags de Experiência Clínica (ex: Ansiedade, Luto, Relacionamentos) */}
        {professional.clinicalTags && professional.clinicalTags.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Foco Clínico & Temas:
            </span>
            <div className="flex flex-wrap gap-1">
              {professional.clinicalTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Approaches / Abordagens */}
        {professional.approaches && professional.approaches.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {professional.approaches
              .filter(a => !professional.clinicalTags?.includes(a))
              .map((app, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                    pType === 'pastor'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-100 dark:border-amber-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {app}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Card Footer: Price & Booking Action */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
            Sessão de 50 min
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            R$ {professional.hourlyRate || 180},00
          </span>
        </div>

        <button
          type="button"
          disabled={!isAccepting}
          onClick={() => {
            if (!isAccepting) return;
            if (isPreview) {
              onPreviewBookingClick?.();
              return;
            }
            onBook?.(professional);
          }}
          title={
            !isAccepting
              ? 'Este profissional está temporariamente indisponível para novos pacientes'
              : isPreview
              ? 'Botão ilustrativo de agendamento exibido ao paciente'
              : undefined
          }
          className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
            !isAccepting
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
              : pType === 'pastor'
              ? 'text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500'
              : 'text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500'
          }`}
        >
          {!isAccepting
            ? 'Agenda Indisponível'
            : pType === 'pastor'
            ? 'Agendar Aconselhamento'
            : 'Agendar Consulta'}
        </button>
      </div>
    </div>
  );
};
