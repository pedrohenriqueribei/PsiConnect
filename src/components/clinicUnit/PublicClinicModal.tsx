import React, { useState } from 'react';
import { ClinicUnit } from '../../types/clinicUnit';
import { maskCNPJ, maskPhone, maskCEP } from '../../utils/maskUtils';
import { ClinicMapView } from './ClinicMapView';
import {
  Building2,
  CheckCircle2,
  Smartphone,
  Wifi,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Accessibility,
  HeartHandshake
} from 'lucide-react';

interface PublicClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ClinicUnit;
  initialMode?: 'checkin' | 'profile';
}

export const PublicClinicModal: React.FC<PublicClinicModalProps> = ({
  isOpen,
  onClose,
  unit,
  initialMode = 'checkin',
}) => {
  const [mode, setMode] = useState<'checkin' | 'profile'>(initialMode);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState(unit.technicalLeadName);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!isOpen) return null;

  const handleConfirmCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    setCheckinSuccess(true);
  };

  const cleanWhatsapp = unit.receptionWhatsapp?.replace(/\D/g, '') || '';
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/55${cleanWhatsapp}` : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                  RECEPÇÃO DIGITAL
                </span>
                {unit.cnesNumber && (
                  <span className="text-[10px] text-slate-400">CNES {unit.cnesNumber}</span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                {unit.tradeName}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('checkin');
                setCheckinSuccess(false);
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'checkin'
                  ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Check-in na Chegada</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('profile')}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dados da Clínica</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {mode === 'checkin' ? (
            !checkinSuccess ? (
              <form onSubmit={handleConfirmCheckin} className="space-y-4">
                <div className="text-center space-y-1 py-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Seja bem-vindo(a) à nossa recepção!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Confirme sua chegada para que a equipe e seu profissional saibam que você já está na sala de espera.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Beatriz Lima Ramos"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp (opcional)
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="(11) 99999-9999"
                      value={patientPhone}
                      onChange={e => setPatientPhone(maskPhone(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Com quem é o seu atendimento hoje?
                    </label>
                    <select
                      value={selectedProfessional}
                      onChange={e => setSelectedProfessional(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                    >
                      <option value={unit.technicalLeadName}>
                        {unit.technicalLeadName} ({unit.technicalLeadCrp}) - Responsável Técnico
                      </option>
                      <option value="Outro Profissional / Recepção Geral">Outro Profissional / Recepção Geral</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!patientName.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Chegada na Recepção</span>
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    CHEGADA REGISTRADA COM SUCESSO
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    Olá, {patientName}!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    A recepção e o profissional <strong>{selectedProfessional}</strong> já foram informados da sua presença. Fique à vontade na sala de espera.
                  </p>
                </div>

                {/* Amenity cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Wifi className="w-3.5 h-3.5 text-sky-600" />
                      <span>Wi-Fi dos Pacientes</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Rede: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Psiconnect_Recepcao</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Senha: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">acolher2026</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Horário & Apoio</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Água, café e chá disponíveis na bancada de atendimento.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('profile')}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Ver Dados da Clínica
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-sky-700 hover:bg-sky-800 text-white"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Clinic Profile Information */
            <div className="space-y-4 text-xs">
              {/* Primary Photo Carousel & Thumbnails */}
              {unit.photos.length > 0 && (
                <div className="space-y-2">
                  <div className="rounded-2xl overflow-hidden aspect-16/9 bg-slate-900 relative group">
                    <img
                      src={unit.photos[activePhotoIdx]?.url || unit.photos[0]?.url}
                      alt={unit.photos[activePhotoIdx]?.label || unit.tradeName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white capitalize">
                        {unit.photos[activePhotoIdx]?.category || 'Ambiente'}
                      </span>
                      {unit.photos[activePhotoIdx]?.isCover && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center gap-1">
                          Capa
                        </span>
                      )}
                      {unit.photos[activePhotoIdx]?.highlightTag && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-600/90 text-[10px] font-medium text-white backdrop-blur-xs">
                          {unit.photos[activePhotoIdx]?.highlightTag}
                        </span>
                      )}
                    </div>

                    {unit.photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActivePhotoIdx((activePhotoIdx - 1 + unit.photos.length) % unit.photos.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs"
                          title="Anterior"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePhotoIdx((activePhotoIdx + 1) % unit.photos.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs"
                          title="Próxima"
                        >
                          ›
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-xs text-[11px] text-white">
                      <span className="truncate font-medium">
                        {unit.photos[activePhotoIdx]?.label || `${unit.tradeName} - Ambiente`}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-slate-300 ml-2">
                        {activePhotoIdx + 1}/{unit.photos.length}
                      </span>
                    </div>
                  </div>

                  {unit.photos.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {unit.photos.map((p, pIdx) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActivePhotoIdx(pIdx)}
                          className={`relative w-12 h-9 rounded-lg overflow-hidden shrink-0 border transition-all ${
                            activePhotoIdx === pIdx
                              ? 'border-sky-500 ring-1 ring-sky-500 scale-105'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Legal & Technical Lead */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Dados Regulatórios & RT</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Razão Social: <span className="font-semibold text-slate-800 dark:text-slate-200">{unit.legalName}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-mono">
                  CNPJ: {maskCNPJ(unit.cnpj)} {unit.cnesNumber && `· CNES: ${unit.cnesNumber}`}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Responsável Técnico: <span className="font-semibold text-slate-800 dark:text-slate-200">{unit.technicalLeadName}</span> ({unit.technicalLeadCrp})
                </p>
              </div>

              {/* Lightweight Static Map & Address */}
              <ClinicMapView unit={unit} compact />

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {unit.receptionWhatsapp && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp: {maskPhone(unit.receptionWhatsapp)}</span>
                  </a>
                )}
                {unit.landlinePhone && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-sky-600" />
                    <span>Fixo: {maskPhone(unit.landlinePhone)}</span>
                  </div>
                )}
              </div>

              {/* Operating Hours */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Horário: <strong>{unit.operatingHours}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setMode('checkin')}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Fazer Check-in nesta Unidade</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
