import React, { useState } from 'react';
import { ClinicUnit } from '../../types/clinicUnit';
import { generateQrCodeSvg } from '../../utils/qrCodeGenerator';
import { maskCNPJ, maskPhone } from '../../utils/maskUtils';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Smartphone,
  Sparkles,
  Building2,
  Wifi,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface ClinicQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ClinicUnit;
}

export const ClinicQrCodeModal: React.FC<ClinicQrCodeModalProps> = ({
  isOpen,
  onClose,
  unit,
}) => {
  const [qrType, setQrType] = useState<'checkin' | 'profile'>('checkin');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSimulatedPatientView, setShowSimulatedPatientView] = useState(false);
  const [simulatedPatientName, setSimulatedPatientName] = useState('Ana Beatriz Ferreira');
  const [checkinConfirmed, setCheckinConfirmed] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const targetUrl =
    qrType === 'checkin'
      ? `${baseUrl}/#checkin-${unit.id}`
      : `${baseUrl}/#clinica-${unit.id}`;

  const qrSvg = generateQrCodeSvg(targetUrl, {
    size: 280,
    margin: 3,
    darkColor: '#0369a1',
    lightColor: '#ffffff',
    includeClinicBadge: true,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qrcode-${unit.id}-${qrType}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintDeskCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                QR Code da Unidade Clínica
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check-in presencial rápido e acesso ao perfil digital no smartphone
              </p>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setQrType('checkin')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                qrType === 'checkin'
                  ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Check-in na Recepção</span>
            </button>
            <button
              type="button"
              onClick={() => setQrType('profile')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                qrType === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Perfil Digital da Clínica</span>
            </button>
          </div>

          {/* QR Code Graphic Frame (Printable Display) */}
          <div className="p-6 bg-gradient-to-b from-sky-50 to-white dark:from-slate-800/60 dark:to-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {qrType === 'checkin' ? 'RECEPCAO INTELIGENTE' : 'ACESSO AO PERFIL DIGITAL'}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {unit.tradeName}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {qrType === 'checkin'
                  ? 'Aponte a câmera do seu celular para avisar na sala de espera que você chegou para o atendimento.'
                  : 'Acesse horário de funcionamento, canais de acolhimento e especialidades no seu celular.'}
              </p>
            </div>

            {/* QR Code SVG Display */}
            <div className="inline-block p-4 bg-white rounded-2xl shadow-md border border-slate-200/80">
              <div
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto cursor-pointer"
                title="Clique para testar a experiência do paciente"
                onClick={() => setShowSimulatedPatientView(true)}
              />
              <p className="text-[10px] font-mono text-slate-400 mt-2">
                Código Único: {unit.id.toUpperCase().slice(0, 16)}
              </p>
            </div>

            {/* Quick Helper Tips */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Compatível com iPhone & Android
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Sem necessidade de app extra
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={handlePrintDeskCard}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-center"
            >
              <Printer className="w-4 h-4 text-sky-600 mb-1" />
              <span className="text-[11px] font-bold">Imprimir Display</span>
              <span className="text-[9px] text-slate-400">Placa A4/Mesa</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-center"
            >
              <Download className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[11px] font-bold">Baixar SVG</span>
              <span className="text-[9px] text-slate-400">Alta Resolução</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-center"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-600 mb-1" />
              ) : (
                <Copy className="w-4 h-4 text-indigo-600 mb-1" />
              )}
              <span className="text-[11px] font-bold">
                {copiedLink ? 'Copiado!' : 'Copiar Link'}
              </span>
              <span className="text-[9px] text-slate-400">Link direto</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSimulatedPatientView(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-300 transition-colors text-center"
            >
              <Smartphone className="w-4 h-4 text-sky-700 dark:text-sky-400 mb-1" />
              <span className="text-[11px] font-bold">Simular Celular</span>
              <span className="text-[9px] text-sky-600 dark:text-sky-400">Visão do Paciente</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {targetUrl}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Simulated Patient Phone View Modal */}
      {showSimulatedPatientView && (
        <div
          onClick={() => setShowSimulatedPatientView(false)}
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 rounded-[36px] p-3.5 shadow-2xl border-4 border-slate-700 relative text-white"
          >
            {/* Phone notch */}
            <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-black rounded-full" />
            </div>

            {/* Phone Screen Container */}
            <div className="bg-white text-slate-900 rounded-[28px] overflow-hidden p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold leading-tight">{unit.tradeName}</h5>
                    <p className="text-[10px] text-slate-400">Recepção Digital</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSimulatedPatientView(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!checkinConfirmed ? (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                    <Smartphone className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Você está na clínica?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Faça seu check-in para que a recepção e o profissional saibam que você já está na sala de espera.
                    </p>
                  </div>

                  <div className="text-left space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Seu Nome Completo:</label>
                    <input
                      type="text"
                      value={simulatedPatientName}
                      onChange={e => setSimulatedPatientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckinConfirmed(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Confirmar Check-in na Recepção
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-3 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      CHECK-IN CONFIRMADO
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                      Bem-vinda(o), {simulatedPatientName}!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      A recepção e o profissional <strong>{unit.technicalLeadName}</strong> foram avisados da sua chegada.
                    </p>
                  </div>

                  {/* Clinic Wifi Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Wifi className="w-3.5 h-3.5 text-sky-600" />
                      <span>Wi-Fi da Sala de Espera</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Rede: <code className="font-mono font-bold text-slate-700">Psiconnect_Recepcao</code>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Senha: <code className="font-mono font-bold text-slate-700">acolher2026</code>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckinConfirmed(false);
                      setShowSimulatedPatientView(false);
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Fechar Demonstração
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
