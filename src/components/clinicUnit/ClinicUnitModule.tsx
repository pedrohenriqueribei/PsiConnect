import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { ClinicUnit } from '../../types/clinicUnit';
import { clinicUnitStorage } from '../../services/clinicUnitStorage';
import { ClinicUnitForm } from './ClinicUnitForm';
import { ClinicUnitDetailView } from './ClinicUnitDetailView';
import { ClinicUnitLinkModal } from './ClinicUnitLinkModal';
import {
  Building2,
  Plus,
  Link2,
  ShieldCheck,
  Accessibility,
  MapPin,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ClinicUnitModuleProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const ClinicUnitModule: React.FC<ClinicUnitModuleProps> = ({
  user,
  onUpdateUser,
}) => {
  const [viewMode, setViewMode] = useState<'empty' | 'form' | 'view'>('empty');
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<ClinicUnit[]>([]);
  const [currentUnit, setCurrentUnit] = useState<ClinicUnit | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Load available units and determine current user's clinic unit
  useEffect(() => {
    const units = clinicUnitStorage.getClinicUnits();
    setAvailableUnits(units);

    // If user has clinicUnit or clinicUnitId
    if (user.clinicUnit) {
      setCurrentUnit(user.clinicUnit);
      setViewMode('view');
    } else if (user.clinicUnitId) {
      const found = units.find(u => u.id === user.clinicUnitId);
      if (found) {
        setCurrentUnit(found);
        setViewMode('view');
      } else {
        setViewMode('empty');
      }
    } else {
      setViewMode('empty');
    }
  }, [user.clinicUnit, user.clinicUnitId]);

  // Handle saving clinic unit from form
  const handleSaveUnit = async (unitData: ClinicUnit) => {
    const saved = await clinicUnitStorage.saveClinicUnit(unitData);
    setAvailableUnits(clinicUnitStorage.getClinicUnits());
    setCurrentUnit(saved);
    setViewMode('view');
    setIsEditingExisting(false);

    // Update user profile
    onUpdateUser({
      clinicUnitId: saved.id,
      clinicUnit: saved,
    });

    setStatusFeedback('Unidade clínica salva e vinculada ao seu perfil com sucesso!');
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  // Handle linking to an existing clinic unit
  const handleSelectUnit = async (unit: ClinicUnit) => {
    setCurrentUnit(unit);
    setViewMode('view');

    // Update user profile
    onUpdateUser({
      clinicUnitId: unit.id,
      clinicUnit: unit,
    });

    setStatusFeedback(`Seu perfil foi vinculado com sucesso à unidade '${unit.tradeName}'!`);
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  // Handle unlinking
  const handleUnlink = async () => {
    setCurrentUnit(null);
    setViewMode('empty');

    onUpdateUser({
      clinicUnitId: undefined,
      clinicUnit: undefined,
    });

    setStatusFeedback('Unidade clínica desvinculada do seu perfil.');
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {statusFeedback && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="font-semibold">{statusFeedback}</p>
        </div>
      )}

      {/* 1. VIEW MODE: SHOW LINKED UNIT DETAILS */}
      {viewMode === 'view' && currentUnit && (
        <ClinicUnitDetailView
          unit={currentUnit}
          onEdit={() => {
            setIsEditingExisting(true);
            setViewMode('form');
          }}
          onUnlink={handleUnlink}
          onChangeUnit={() => setIsLinkModalOpen(true)}
        />
      )}

      {/* 2. FORM MODE: SHOW 4-SECTION CLINIC FORM */}
      {viewMode === 'form' && (
        <ClinicUnitForm
          initialUnit={isEditingExisting ? currentUnit : null}
          currentUser={user}
          onSave={handleSaveUnit}
          onCancel={() => {
            setViewMode(currentUnit ? 'view' : 'empty');
            setIsEditingExisting(false);
          }}
        />
      )}

      {/* 3. EMPTY STATE: NO CLINIC UNIT LINKED */}
      {viewMode === 'empty' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-8 shadow-xs transition-colors">
          {/* Main Empty State Content */}
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-3xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 flex items-center justify-center mx-auto shadow-sm">
                <Building2 className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Atendimento Presencial & Consultórios Físicos
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Nenhuma unidade clínica vinculada ao perfil
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Para oferecer atendimentos presenciais, indicar seu consultório com endereço verificado e cumprir as diretrizes regulatórias do Conselho e CNES, vincule-se a uma unidade ou cadastre seu estabelecimento.
              </p>
            </div>

            {/* The 2 required call-to-action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingExisting(false);
                  setViewMode('form');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar unidade de atendimento</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all"
              >
                <Link2 className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <span>Me vincular a uma unidade existente</span>
              </button>
            </div>
          </div>

          {/* Value props & regulatory badges */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                CNPJ & CNES Regulamentados
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Identificação do Responsável Técnico (RT com CRP ativo) e conformidade sanitária.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-1">
                <Accessibility className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Acessibilidade PCD
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Checklist claro de rampas, elevadores e banheiros adaptados para seus pacientes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-1">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Busca Automática por CEP
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Integração via API dos Correios (ViaCEP) com localização precisa no Google Maps.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-1">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Estrutura & Nichos Clínicos
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Salas para teleconsulta acústica, ludoterapia infantil e acolhimento de atipicidades.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      <ClinicUnitLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        availableUnits={availableUnits}
        currentLinkedUnitId={currentUnit?.id}
        onSelectUnit={handleSelectUnit}
        onCreateNewUnit={() => {
          setIsEditingExisting(false);
          setViewMode('form');
        }}
      />
    </div>
  );
};
