import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Appointment, MedicalRecord } from '../types';
import { X, Shield, Save, FileText, Clock, User as UserIcon, CheckCircle2, Printer } from 'lucide-react';

interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

export const MedicalRecordModal: React.FC<MedicalRecordModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalEvolution, setClinicalEvolution] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load existing records or past records for this patient
  const [pastRecords, setPastRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const existing = storage.getRecordByAppointment(appointment.id);
    if (existing) {
      setRecord(existing);
      setChiefComplaint(existing.chiefComplaint);
      setClinicalEvolution(existing.clinicalEvolution);
      setPrivateNotes(existing.privateNotes);
      setRecommendations(existing.recommendations || '');
    } else {
      setChiefComplaint(appointment.notesFromPatient || '');
      setClinicalEvolution('');
      setPrivateNotes('');
      setRecommendations('');
    }

    // Load past patient records
    const allRecords = storage.getMedicalRecords(appointment.psychologistId, appointment.patientId);
    setPastRecords(allRecords.filter(r => r.appointmentId !== appointment.id));
    setSavedSuccess(false);
  }, [isOpen, appointment]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const saved = storage.saveMedicalRecord({
      id: record?.id,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      psychologistId: appointment.psychologistId,
      sessionDate: appointment.date,
      chiefComplaint,
      clinicalEvolution,
      privateNotes,
      recommendations,
    });

    setRecord(saved);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Prontuário Eletrônico do Paciente (PEP)
                <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                  Sigilo CFP Res. 001/2009
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Acesso restrito e criptografado exclusivo ao psicólogo responsável.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient & Appointment Quick Meta */}
        <div className="px-6 py-3 bg-sky-50/40 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-900">{appointment.patientName}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">{appointment.patientEmail}</span>
            {appointment.patientPhone && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{appointment.patientPhone}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-600 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Sessão: {appointment.date} às {appointment.time}</span>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {savedSuccess && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Registro de prontuário e evolução clínica salvos com sucesso!</span>
            </div>
          )}

          {/* Queixa Principal */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              1. Queixa Principal e Demandas Apresentadas
            </label>
            <textarea
              rows={2}
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              placeholder="Descreva a queixa que motivou a sessão ou relatos do paciente..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Evolução Clínica */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              2. Registro de Evolução Clínica e Hipóteses Diagnósticas
            </label>
            <textarea
              rows={4}
              value={clinicalEvolution}
              onChange={e => setClinicalEvolution(e.target.value)}
              placeholder="Descreva as intervenções realizadas, respostas cognitivo-emocionais, insights e postura clínica..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 font-sans leading-relaxed"
            />
          </div>

          {/* Anotações Confidenciais */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>3. Anotações Confidenciais do Terapeuta</span>
              <span className="text-[10px] text-amber-700 font-normal">
                Visível apenas para você (nunca compartilhado)
              </span>
            </label>
            <textarea
              rows={3}
              value={privateNotes}
              onChange={e => setPrivateNotes(e.target.value)}
              placeholder="Observações de transferência, contratransferência, riscos ou pontos para a supervisão clínica..."
              className="w-full p-3 text-xs border border-amber-200 bg-amber-50/30 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
            />
          </div>

          {/* Recomendações e Tarefas Intersessão */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              4. Orientações, Leituras ou Tarefas Intersessão
            </label>
            <textarea
              rows={2}
              value={recommendations}
              onChange={e => setRecommendations(e.target.value)}
              placeholder="Exercícios de respiração, registros comportamentais ou orientações combinadas..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Histórico Anterior deste Paciente */}
          {pastRecords.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Histórico de Sessões Anteriores ({pastRecords.length})
              </h4>
              <div className="space-y-2">
                {pastRecords.map(pr => (
                  <div key={pr.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                      <span>Sessão em {pr.sessionDate}</span>
                      <span className="text-[10px] text-slate-400">
                        Atualizado em {new Date(pr.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{pr.clinicalEvolution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Ficha
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Prontuário
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
