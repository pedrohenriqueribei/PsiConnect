import React, { useState } from 'react';
import { X, Printer, Download, Shield, FileText, CheckCircle2, Copy } from 'lucide-react';
import { PsychologicalRecord } from '../../types/psychologicalRecord';
import { psychologicalRecordStorage } from '../../services/psychologicalRecordStorage';

interface ReportPdfExporterProps {
  isOpen: boolean;
  onClose: () => void;
  record: PsychologicalRecord;
  currentProfessional: { id: string; name: string; role: string };
}

export const ReportPdfExporter: React.FC<ReportPdfExporterProps> = ({
  isOpen,
  onClose,
  record,
  currentProfessional,
}) => {
  const [reportType, setReportType] = useState<
    'relatorio_acompanhamento' | 'laudo_psicologico' | 'encaminhamento_psiquiatrico'
  >('relatorio_acompanhamento');

  const [destinationPurpose, setDestinationPurpose] = useState(
    'Fins de comprovação de acompanhamento psicoterápico e avaliação do estado clínico.'
  );

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalSessions = record.sessions.length;
  const firstSession = record.sessions[record.sessions.length - 1];
  const lastSession = record.sessions[0];
  const todayStr = new Date().toLocaleDateString('pt-BR');

  // Evolution score average
  const avgScore =
    totalSessions > 0
      ? (record.sessions.reduce((acc, s) => acc + s.evolutionScore, 0) / totalSessions).toFixed(1)
      : '3.0';

  const handlePrint = () => {
    // Log audit action
    psychologicalRecordStorage.logAuditAction(
      record.id,
      'exportacao_pdf',
      currentProfessional,
      `Exportação de documento psicológico formato PDF: "${reportType}".`
    );
    window.print();
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'laudo_psicologico':
        return 'LAUDO PSICOLÓGICO CLÍNICO';
      case 'encaminhamento_psiquiatrico':
        return 'RELATÓRIO PSICOLÓGICO DE ENCAMINHAMENTO PSIQUIÁTRICO';
      case 'relatorio_acompanhamento':
      default:
        return 'RELATÓRIO PSICOLÓGICO';
    }
  };

  const handleCopyText = () => {
    const reportText = `
${getReportTitle()}
Resolução CFP nº 06/2019

1. IDENTIFICAÇÃO
Paciente: ${record.identification.fullName}
Data de Nascimento: ${record.identification.birthDate}
CPF: ${record.identification.cpf}
Profissional Responsável: ${record.professional.name} - ${record.professional.registration}
Finalidade: ${destinationPurpose}

2. DESCRIÇÃO DA DEMANDA
${record.initialDemand.chiefComplaint}
Motivo da busca: ${record.initialDemand.reasonForCare}

3. PROCEDIMENTO
Foram realizadas ${totalSessions} sessões de psicoterapia clínica entre ${firstSession?.date || record.createdAt.split('T')[0]} e ${lastSession?.date || todayStr}.
Abordagem: ${record.initialAssessment.theoreticalApproach}.
Técnicas: ${record.therapeuticPlan.strategiesAndTechniques.join(', ')}.

4. ANÁLISE
Hipótese Diagnóstica: ${record.initialAssessment.diagnosticHypothesis}.
O paciente demonstrou engajamento nas sessões com evolução clínica média de ${avgScore}/5.0.

5. CONCLUSÃO
${record.status === 'discharged' ? 'Tratamento concluído com alta clínica.' : 'Tratamento em andamento com resposta satisfatória.'}

${record.identification.city || 'São Paulo'} - ${record.identification.state || 'SP'}, ${todayStr}.
${record.professional.name}
${record.professional.registration}
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none print:my-0">
        {/* Controls Header (Hidden during print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Exportar Relatório / Laudo em PDF
                <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  Resolução CFP nº 06/2019
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Documento psicológico padronizado com 5 seções obrigatórias e declaração de sigilo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Copiar texto do relatório"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Toolbar (Hidden during print) */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs print:hidden">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tipo de Documento Regulamentado:
            </label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
            >
              <option value="relatorio_acompanhamento">Relatório Psicológico de Acompanhamento</option>
              <option value="laudo_psicologico">Laudo Psicológico Clínico Completo</option>
              <option value="encaminhamento_psiquiatrico">Relatório para Encaminhamento Psiquiátrico</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Finalidade / Destinação Declarada:
            </label>
            <input
              type="text"
              value={destinationPurpose}
              onChange={e => setDestinationPurpose(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600"
              placeholder="Ex: Para fins de perícia, encaminhamento médico, etc."
            />
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 md:p-12 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-8 font-serif text-slate-900 leading-relaxed text-sm">
          {/* Header & Logo */}
          <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 uppercase font-sans">
              {getReportTitle()}
            </h1>
            <p className="text-xs text-slate-600 font-sans">
              Elaborado em estrita conformidade com a <strong>Resolução CFP nº 06/2019</strong> do Conselho Federal de Psicologia
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-rose-800">
              <Shield className="w-3.5 h-3.5 text-rose-700" />
              <span>Documento Sigiloso e Confidencial · Vedada a Reprodução Sem Autorização (Art. 9º CEPP)</span>
            </div>
          </div>

          {/* Section 1: IDENTIFICAÇÃO */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 font-sans">
              1. Identificação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
              <div>
                <strong>Paciente:</strong> {record.identification.fullName}
                {record.identification.socialName && ` (Nome Social: ${record.identification.socialName})`}
              </div>
              <div>
                <strong>CPF:</strong> {record.identification.cpf}
              </div>
              <div>
                <strong>Data de Nascimento:</strong> {record.identification.birthDate} (
                {new Date().getFullYear() - parseInt(record.identification.birthDate.split('-')[0], 10)} anos)
              </div>
              <div>
                <strong>Profissão:</strong> {record.identification.profession || 'Não declarada'}
              </div>
              {record.isMinor && record.legalGuardian && (
                <div className="md:col-span-2 text-sky-950 bg-sky-50 p-2 rounded border border-sky-200">
                  <strong>Responsável Legal (Menor de 18 anos):</strong> {record.legalGuardian.name} (
                  {record.legalGuardian.relationship}) · CPF: {record.legalGuardian.cpf}
                </div>
              )}
              <div className="md:col-span-2">
                <strong>Autor(a) / Profissional Responsável:</strong> {record.professional.name} ·{' '}
                <span className="font-semibold text-sky-900">{record.professional.registration}</span>
              </div>
              <div className="md:col-span-2">
                <strong>Finalidade do Documento:</strong> {destinationPurpose}
              </div>
            </div>
          </div>

          {/* Section 2: DESCRIÇÃO DA DEMANDA */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 font-sans">
              2. Descrição da Demanda
            </h2>
            <p className="text-xs leading-relaxed text-slate-800 text-justify">
              O paciente buscou atendimento psicoterapêutico clínico em {record.initialDemand.treatmentStartDate || record.createdAt.split('T')[0]}, apresentando como queixa e demanda principal: &ldquo;{record.initialDemand.chiefComplaint}&rdquo;. {record.initialDemand.reasonForCare}
            </p>
            {record.history.previousMentalHealth && (
              <p className="text-xs leading-relaxed text-slate-700 text-justify">
                <strong>Histórico Pregresso Relevante:</strong> {record.history.previousMentalHealth} {record.history.medications && `Uso medicamentoso relatado: ${record.history.medications}.`}
              </p>
            )}
          </div>

          {/* Section 3: PROCEDIMENTO */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 font-sans">
              3. Procedimento
            </h2>
            <p className="text-xs leading-relaxed text-slate-800 text-justify">
              Foram realizadas <strong>{totalSessions} sessões de atendimento psicoterapêutico</strong> no período compreendido entre {firstSession?.date || record.createdAt.split('T')[0]} e {lastSession?.date || todayStr}, com frequência {record.therapeuticPlan.sessionFrequency === 'weekly' ? 'semanal' : 'programada'} e duração média de 50 minutos por atendimento.
            </p>
            <p className="text-xs leading-relaxed text-slate-800 text-justify">
              O processo clínico foi orientado pelos preceitos científicos da <strong>{record.initialAssessment.theoreticalApproach}</strong>. Utilizaram-se como recursos técnicos e instrumentos privativos: entrevistas clínicas semiestruturadas, psicoeducação, {record.therapeuticPlan.strategiesAndTechniques.join(', ')} e monitoramento sistemático de indicadores emocionais.
            </p>
          </div>

          {/* Section 4: ANÁLISE */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 font-sans">
              4. Análise
            </h2>
            <div className="text-xs leading-relaxed text-slate-800 space-y-2 text-justify">
              <p>
                <strong>Hipótese Diagnóstica / Formulação Clínica:</strong> {record.initialAssessment.diagnosticHypothesis}
              </p>
              <p>
                Durante o transcorrer dos encontros clínicos, o paciente demonstrou adesão ativa ao plano terapêutico formulado. Os registros sistemáticos de evolução clínica registraram uma média de <strong>{avgScore} na escala de 1 a 5</strong>, indicando trajetória de estabilização e redução progressiva do sofrimento psicológico inicial.
              </p>
              {lastSession && (
                <p>
                  Na sessão mais recente ({lastSession.date}), o paciente apresentou estado emocional {lastSession.emotionalState.toLowerCase()}, demonstrando maior repertório de enfrentamento, regulação afetiva e capacidade reflexiva sobre as variáveis desencadeadoras de suas queixas.
                </p>
              )}
            </div>
          </div>

          {/* Section 5: CONCLUSÃO */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 font-sans">
              5. Conclusão
            </h2>
            <p className="text-xs leading-relaxed text-slate-800 text-justify">
              Com base nos elementos técnicos e clínicos observados, conclui-se que o paciente{' '}
              {record.status === 'discharged'
                ? 'alcançou os objetivos estipulados no plano terapêutico inicial, recebendo alta clínica por remissão de sintomas.'
                : 'encontra-se em processo contínuo de psicoterapia, com indicação de continuidade das sessões para consolidação dos ganhos terapêuticos e prevenção de recaídas.'}
            </p>
            <p className="text-xs leading-relaxed text-slate-700">
              Este relatório tem caráter confidencial e restrito à finalidade a que se destina, sendo vedado o seu uso para outros fins sem prévia autorização expressa do paciente ou de seu responsável legal, sob as penas do Código de Ética Profissional do Psicólogo e da LGPD.
            </p>
          </div>

          {/* Signatures & Footer */}
          <div className="pt-8 border-t border-slate-300 flex flex-col items-center justify-center text-center space-y-2 font-sans">
            <p className="text-xs text-slate-600">
              {record.identification.city || 'São Paulo'} - {record.identification.state || 'SP'}, {todayStr}.
            </p>

            <div className="pt-6 w-72 border-b border-slate-800" />
            <p className="text-xs font-bold text-slate-900">{record.professional.name}</p>
            <p className="text-[11px] text-slate-600">{record.professional.registration}</p>
            <p className="text-[10px] text-slate-400 font-mono pt-1">
              Código de Autenticação Digital: {record.id.slice(0, 18).toUpperCase()}-{Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden during print) */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Dica: Ao imprimir, selecione &quot;Salvar como PDF&quot; nas opções da impressora.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Fechar Visualização
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
