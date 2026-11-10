import React, { useState } from 'react';
import {
  ClinicUnit,
  ClinicUnitPhoto,
  ACCESSIBILITY_OPTIONS,
  CARE_TYPE_OPTIONS,
} from '../../types/clinicUnit';
import { maskPhone, maskCNPJ, maskCEP } from '../../utils/maskUtils';
import {
  Building2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Accessibility,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Unlink,
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  X
} from 'lucide-react';

interface ClinicUnitDetailViewProps {
  unit: ClinicUnit;
  onEdit: () => void;
  onUnlink: () => void;
  onChangeUnit: () => void;
}

export const ClinicUnitDetailView: React.FC<ClinicUnitDetailViewProps> = ({
  unit,
  onEdit,
  onUnlink,
  onChangeUnit,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ClinicUnitPhoto | null>(null);
  const [photoFilter, setPhotoFilter] = useState<'todos' | 'fachada' | 'recepcao' | 'consultorio'>('todos');
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);

  const filteredPhotos = unit.photos.filter(p => {
    if (photoFilter === 'todos') return true;
    return p.category === photoFilter;
  });

  const fullAddress = `${unit.street}, ${unit.number}${unit.complement ? ` - ${unit.complement}` : ''}, ${unit.neighborhood}, ${unit.city} - ${unit.state}, CEP ${maskCEP(unit.zipCode)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${unit.tradeName}, ${unit.street}, ${unit.number}, ${unit.city} - ${unit.state}`
  )}`;

  const cleanWhatsapp = unit.receptionWhatsapp?.replace(/\D/g, '') || '';
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/55${cleanWhatsapp}` : undefined;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Unidade Ativa & Vinculada
                </span>
                {unit.cnesNumber && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    CNES: {unit.cnesNumber}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  CNPJ: {maskCNPJ(unit.cnpj)}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {unit.tradeName}
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{unit.legalName}</span>
                {' · '}
                RT: <span className="font-semibold text-slate-700 dark:text-slate-300">{unit.technicalLeadName}</span> ({unit.technicalLeadCrp})
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-700 hover:bg-sky-800 text-white shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Unidade</span>
            </button>

            <button
              onClick={onChangeUnit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <span>Alternar Unidade</span>
            </button>

            <button
              onClick={() => setShowConfirmUnlink(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
              title="Desvincular do meu perfil"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Desvincular</span>
            </button>
          </div>
        </div>

        {/* Quick details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {/* Telefone & WhatsApp */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              Canais de Contato
            </div>
            {unit.landlinePhone && (
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                Fixo: {maskPhone(unit.landlinePhone)}
              </p>
            )}
            {unit.receptionWhatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-mono"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {maskPhone(unit.receptionWhatsapp)}</span>
              </a>
            )}
            {unit.institutionalEmail && (
              <a
                href={`mailto:${unit.institutionalEmail}`}
                className="block text-xs text-slate-600 dark:text-slate-400 hover:underline truncate"
              >
                {unit.institutionalEmail}
              </a>
            )}
          </div>

          {/* Endereço */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Endereço Físico
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 dark:text-sky-400"
              >
                <span>Ver no Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {unit.street}, {unit.number} {unit.complement && `(${unit.complement})`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {unit.neighborhood} · {unit.city} - {unit.state} · CEP {maskCEP(unit.zipCode)}
            </p>
          </div>

          {/* Horário */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Funcionamento
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              {unit.operatingHours}
            </p>
          </div>
        </div>
      </div>

      {/* Photos Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <span>Fotos dos Ambientes ({unit.photos.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ambientes preparados para o acolhimento seguro e humanizado do paciente.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            {(['todos', 'fachada', 'recepcao', 'consultorio'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setPhotoFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  photoFilter === cat
                    ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {cat === 'todos' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            Nenhuma foto nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map(photo => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-4/3 relative shadow-2xs hover:shadow-md transition-all"
              >
                <img
                  src={photo.url}
                  alt={photo.label || 'Foto da unidade'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-black/70 backdrop-blur-xs text-white capitalize">
                    {photo.category}
                  </span>
                </div>
                {photo.label && (
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <p className="text-[11px] text-white font-medium truncate">
                      {photo.label}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Structure, Accessibility & Care Modalities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acessibilidade */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <span>Itens de Acessibilidade PCD</span>
            </h3>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
              {unit.accessibilityItems.length} itens certificados
            </span>
          </div>

          <div className="space-y-2">
            {ACCESSIBILITY_OPTIONS.map(opt => {
              const hasItem = unit.accessibilityItems.includes(opt.id);
              if (!hasItem) return null;
              return (
                <div
                  key={opt.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {opt.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tipos de Atendimento */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tipos de Atendimento na Unidade</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {unit.serviceTypes.length} modalidades
            </span>
          </div>

          <div className="space-y-2">
            {CARE_TYPE_OPTIONS.map(care => {
              const hasCare = unit.serviceTypes.includes(care.id);
              if (!hasCare) return null;
              return (
                <div
                  key={care.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {care.label}
                      </p>
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {care.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {care.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox photo modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.label || 'Foto da unidade'}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  {selectedPhoto.category}
                </p>
                <p className="text-sm font-semibold">{selectedPhoto.label || unit.tradeName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Unlink Dialog */}
      {showConfirmUnlink && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Unlink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Desvincular Unidade Clínica?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ao desvincular, a unidade '{unit.tradeName}' deixará de ser exibida em seu perfil profissional como seu consultório presencial.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmUnlink(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmUnlink(false);
                  onUnlink();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                Confirmar Desvinculação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
