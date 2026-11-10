import React, { useState } from 'react';
import { ClinicUnit } from '../../types/clinicUnit';
import { maskCNPJ } from '../../utils/maskUtils';
import {
  Building2,
  Search,
  MapPin,
  Check,
  X,
  Plus,
  ShieldCheck,
  Phone,
  Accessibility
} from 'lucide-react';

interface ClinicUnitLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUnits: ClinicUnit[];
  currentLinkedUnitId?: string;
  onSelectUnit: (unit: ClinicUnit) => Promise<void>;
  onCreateNewUnit: () => void;
}

export const ClinicUnitLinkModal: React.FC<ClinicUnitLinkModalProps> = ({
  isOpen,
  onClose,
  availableUnits,
  currentLinkedUnitId,
  onSelectUnit,
  onCreateNewUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  if (!isOpen) return null;

  const filteredUnits = availableUnits.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.tradeName.toLowerCase().includes(q) ||
      u.legalName.toLowerCase().includes(q) ||
      u.cnpj.includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.technicalLeadName.toLowerCase().includes(q)
    );
  });

  const handleConfirmLink = async (unit: ClinicUnit) => {
    setIsLinking(true);
    try {
      await onSelectUnit(unit);
      onClose();
    } catch (err) {
      console.error('Erro ao vincular unidade:', err);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Vincular a uma Unidade Existente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione um consultório ou clínica já cadastrada na plataforma Psiconnect.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome da clínica, CNPJ, cidade ou responsável técnico..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
        </div>

        {/* Units List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredUnits.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Nenhuma unidade clínica encontrada para esta busca.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateNewUnit();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-700 text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar nova unidade agora</span>
              </button>
            </div>
          ) : (
            filteredUnits.map(unit => {
              const isCurrent = unit.id === currentLinkedUnitId;
              const firstPhoto = unit.photos[0]?.url;

              return (
                <div
                  key={unit.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {firstPhoto ? (
                      <img
                        src={firstPhoto}
                        alt={unit.tradeName}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {unit.tradeName}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            Vinculada
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        CNPJ: {maskCNPJ(unit.cnpj)} · RT: {unit.technicalLeadName} ({unit.technicalLeadCrp})
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">
                          {unit.neighborhood}, {unit.city} - {unit.state}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-auto shrink-0">
                    {isCurrent ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60">
                        <Check className="w-3.5 h-3.5" />
                        <span>Vinculada</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isLinking}
                        onClick={() => handleConfirmLink(unit)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 transition-colors shadow-xs"
                      >
                        <span>Vincular a esta Unidade</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewUnit();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Não encontrou sua clínica? Cadastrar nova</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
