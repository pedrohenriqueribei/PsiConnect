import React, { useState } from 'react';
import { Shield, Lock, Eye, KeyRound, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { recordSecurity } from '../../services/recordSecurity';
import { PsychologicalRecord } from '../../types/psychologicalRecord';

interface EncryptionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PsychologicalRecord;
}

export const EncryptionInspectorModal: React.FC<EncryptionInspectorModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [activeField, setActiveField] = useState<'chiefComplaint' | 'diagnosis' | 'sessionSummary'>('chiefComplaint');

  if (!isOpen) return null;

  const latestSession = record.sessions[0];

  const getFieldValues = () => {
    switch (activeField) {
      case 'diagnosis':
        return {
          title: 'Hipótese Diagnóstica / Impressão Clínica',
          plain: record.initialAssessment.diagnosticHypothesis,
          cipher: recordSecurity.encryptClinicalText(record.initialAssessment.diagnosticHypothesis),
          section: '7. Avaliação Inicial',
        };
      case 'sessionSummary':
        return {
          title: 'Conteúdo da Última Sessão Registrada',
          plain: latestSession ? latestSession.summaryContent : 'Nenhuma sessão registrada ainda.',
          cipher: latestSession ? recordSecurity.encryptClinicalText(latestSession.summaryContent) : 'N/A',
          section: 'Registro de Evolução Clínica',
        };
      case 'chiefComplaint':
      default:
        return {
          title: 'Queixa Principal & Demanda Inicial',
          plain: record.initialDemand.chiefComplaint,
          cipher: recordSecurity.encryptClinicalText(record.initialDemand.chiefComplaint),
          section: '5. Demanda Inicial',
        };
    }
  };

  const fieldData = getFieldValues();
  const algInfo = recordSecurity.getAlgorithmDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Inspetor de Criptografia & LGPD
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tratamento de dados sensíveis de saúde mental conforme Art. 11 da LGPD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Algorithm spec pills */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Algoritmo</span>
            <span className="font-bold text-slate-800 font-mono">{algInfo.algorithm}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Chave Privada</span>
            <span className="font-bold text-slate-800 font-mono text-[11px]">256 bits (GCM)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Base Legal</span>
            <span className="font-bold text-slate-800 text-[11px]">Art. 11, II, "f" LGPD</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Guarda Mínima</span>
            <span className="font-bold text-sky-700 text-[11px]">5 Anos (CFP 01/2009)</span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {/* Field Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveField('chiefComplaint')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                activeField === 'chiefComplaint'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Queixa Principal
            </button>
            <button
              onClick={() => setActiveField('diagnosis')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                activeField === 'diagnosis'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hipótese Diagnóstica
            </button>
            <button
              onClick={() => setActiveField('sessionSummary')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                activeField === 'sessionSummary'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Evolução da Sessão
            </button>
          </div>

          {/* Cipher Comparison */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Representação Cifrada no Banco de Dados (Repouso):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Payload Criptografado</span>
              </div>
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl break-all border border-slate-800 leading-relaxed shadow-inner">
                {fieldData.cipher}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Mesmo em caso de interceptação, o texto permanece indecifrável sem a chave assimétrica do profissional.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-700" />
                  Texto Descriptografado em Memória (Apenas para {record.professional.name}):
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Descriptografado
                </span>
              </div>
              <div className="p-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 leading-relaxed">
                {fieldData.plain}
              </div>
            </div>
          </div>

          {/* Compliance Box */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
            <h4 className="font-bold text-sky-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />
              Conformidade Regulatória CFP & LGPD
            </h4>
            <ul className="space-y-1 text-sky-800 text-[11px]">
              <li>
                <strong>• Resolução CFP nº 01/2009:</strong> Sigilo profissional absoluto, guarda obrigatória de 5 anos a contar do encerramento (limite atual: {record.retentionUntil}).
              </li>
              <li>
                <strong>• LGPD (Lei 13.709/2018):</strong> Tratamento de dados sensíveis de saúde (Art. 5º, II e Art. 11) com consentimento expresso e controle restrito de acesso.
              </li>
              <li>
                <strong>• Isolamento de Acesso:</strong> Pacientes e terceiros têm acesso bloqueado às anotações clínicas de evolução.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            Certificado digital com integridade garantida
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Fechar Inspetor
          </button>
        </div>
      </div>
    </div>
  );
};
