import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import {
  PatientMatchingProfile,
  AgeGroup,
  MaritalStatus,
  CareCategory,
} from '../types';
import {
  REASONS_FOR_CARE_LIST,
  AGE_GROUP_LABELS,
  MARITAL_STATUS_LABELS,
} from '../services/matchingEngine';
import {
  X,
  HeartHandshake,
  Check,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

interface PatientMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isInitialOnboarding?: boolean;
}

export const PatientMatchingModal: React.FC<PatientMatchingModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  isInitialOnboarding = false,
}) => {
  const { user, updateProfile } = useAuth();

  const existingProfile = user?.patientProfile;

  const [ageGroup, setAgeGroup] = useState<AgeGroup>(existingProfile?.ageGroup || '36-50');
  const [approximateAge, setApproximateAge] = useState<string>(
    existingProfile?.approximateAge ? String(existingProfile.approximateAge) : ''
  );
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(
    existingProfile?.maritalStatus || 'married'
  );
  const [hasChildren, setHasChildren] = useState<boolean>(existingProfile?.hasChildren ?? true);
  const [childrenDetails, setChildrenDetails] = useState<string>(
    existingProfile?.childrenDetails || ''
  );
  const [selectedReasons, setSelectedReasons] = useState<string[]>(
    existingProfile?.reasonsForCare || []
  );
  const [personalNote, setPersonalNote] = useState<string>(
    existingProfile?.personalNote || ''
  );
  const [preferredCareCategory, setPreferredCareCategory] = useState<CareCategory | 'both'>(
    existingProfile?.preferredCareCategory || 'therapy'
  );
  const [preferredGender, setPreferredGender] = useState<'female' | 'male' | 'no_preference'>(
    existingProfile?.preferredGender || 'no_preference'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleReason = (label: string) => {
    setSelectedReasons(prev =>
      prev.includes(label) ? prev.filter(r => r !== label) : [...prev, label]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const profileData: PatientMatchingProfile = {
      ageGroup,
      approximateAge: approximateAge ? parseInt(approximateAge, 10) : undefined,
      maritalStatus,
      hasChildren,
      childrenDetails: hasChildren ? childrenDetails.trim() : undefined,
      reasonsForCare: selectedReasons,
      personalNote: personalNote.trim(),
      preferredCareCategory,
      preferredGender,
      completedAt: new Date().toISOString(),
    };

    storage.savePatientMatchingProfile(user.id, profileData);
    updateProfile({ patientProfile: profileData });

    setIsSubmitting(false);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      onSaved?.();
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 flex items-start sm:items-center justify-center">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-5 bg-gradient-to-r from-teal-700 to-slate-800 text-white flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <HeartHandshake className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {isInitialOnboarding
                  ? 'Acolhimento & Matching Inteligente'
                  : 'Meu Perfil de Acolhimento'}
              </h2>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Preencha seu contexto para ser conectado a profissionais com vivência e perfil compatíveis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-teal-50/80 border border-teal-100 text-xs text-teal-900">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Privacidade ética garantida: </span>
              Estas informações são utilizadas pelo motor de afinidade para direcionar os profissionais mais assertivos para você. Seus dados de contato não são expostos publicamente.
            </div>
          </div>

          {/* Section 1: Demographics & Life Stage */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                1. Seu Momento de Vida & Vivência
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fundamental para que psicólogos e terapeutas com a mesma faixa etária e maturidade acolham sua história.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Faixa Etária Principal
                </label>
                <select
                  value={ageGroup}
                  onChange={e => setAgeGroup(e.target.value as AgeGroup)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                >
                  {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map(group => (
                    <option key={group} value={group}>
                      {AGE_GROUP_LABELS[group]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Idade Exata (opcional)
                </label>
                <input
                  type="number"
                  min={16}
                  max={100}
                  value={approximateAge}
                  onChange={e => setApproximateAge(e.target.value)}
                  placeholder="Ex: 43"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Estado Civil
                </label>
                <select
                  value={maritalStatus}
                  onChange={e => setMaritalStatus(e.target.value as MaritalStatus)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                >
                  {(Object.keys(MARITAL_STATUS_LABELS) as MaritalStatus[]).map(status => (
                    <option key={status} value={status}>
                      {MARITAL_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Tem Filhos?
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setHasChildren(true)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      hasChildren
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Sim, tenho filhos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasChildren(false);
                      setChildrenDetails('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      !hasChildren
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Não tenho filhos
                  </button>
                </div>
              </div>
            </div>

            {hasChildren && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Detalhes sobre seus filhos (opcional)
                </label>
                <input
                  type="text"
                  value={childrenDetails}
                  onChange={e => setChildrenDetails(e.target.value)}
                  placeholder="Ex: 2 filhos (10 e 14 anos) ou bebê recém-nascido"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                />
              </div>
            )}
          </div>

          {/* Section 2: Motivos de Busca */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                2. O Que Você Está Buscando Tratar ou Superar?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecione as queixas e situações que mais representam seu momento atual.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASONS_FOR_CARE_LIST.map(item => {
                const isSelected = selectedReasons.includes(item.label);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleReason(item.label)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-medium ring-1 ring-teal-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Relato Pessoal */}
          <div className="space-y-2">
            <div className="border-b border-slate-100 pb-1">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                3. Conte um Pouco Sobre Você em Suas Próprias Palavras
              </h3>
            </div>
            <textarea
              rows={3}
              value={personalNote}
              onChange={e => setPersonalNote(e.target.value)}
              placeholder="Ex: Estou passando por um momento de sobrecarga conciliando carreira e filhos, sentindo meu casamento desgastado. Quero uma psicóloga experiente de meia-idade que me ajude a reencontrar meu equilíbrio..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors resize-none"
            />
            <p className="text-[11px] text-slate-500">
              Este resumo ajudará o profissional a preparar o acolhimento antes da primeira sessão.
            </p>
          </div>

          {/* Section 4: Preferências de Atendimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Modalidade de Atendimento Desejada
              </label>
              <select
                value={preferredCareCategory}
                onChange={e => setPreferredCareCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              >
                <option value="therapy">Psicologia & Terapia Científica</option>
                <option value="biblical">Aconselhamento Bíblico & Pastoral</option>
                <option value="both">Aberto a Ambos os Modelos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Preferência de Gênero do Profissional
              </label>
              <select
                value={preferredGender}
                onChange={e => setPreferredGender(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              >
                <option value="no_preference">Sem preferência</option>
                <option value="female">Prefiro profissional mulher</option>
                <option value="male">Prefiro profissional homem</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            {isInitialOnboarding ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Preencher mais tarde
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || saveSuccess}
              className="px-5 py-2.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  Perfil Atualizado!
                </>
              ) : isSubmitting ? (
                'Salvando...'
              ) : (
                'Salvar Perfil de Acolhimento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
