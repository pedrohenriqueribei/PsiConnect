import React, { useState } from 'react';
import {
  PsychologicalRecord,
  RecordStatus,
  ResponsibleProfessional,
} from '../../types/psychologicalRecord';
import { recordSecurity } from '../../services/recordSecurity';
import { storage } from '../../services/storage';
import { User } from '../../types';
import { maskPhone, maskCPF } from '../../utils/maskUtils';
import {
  X,
  Shield,
  Save,
  User as UserIcon,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordData: Omit<PsychologicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'auditLogs' | 'retentionUntil'>) => void;
  currentProfessional: ResponsibleProfessional;
}

export const NewRecordModal: React.FC<NewRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProfessional,
}) => {
  const [selectedExistingPatientId, setSelectedExistingPatientId] = useState<string>('manual');
  const allPatients = storage.getAllPatients();

  // 1. Identificação
  const [fullName, setFullName] = useState('');
  const [socialName, setSocialName] = useState('');
  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [gender, setGender] = useState('Feminino');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('');
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('Superior Completo');
  const [maritalStatus, setMaritalStatus] = useState('Solteiro(a)');

  // 2. Responsável Legal (obrigatório se menor de 18)
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Mãe');
  const [guardianCpf, setGuardianCpf] = useState('');
  const [guardianContact, setGuardianContact] = useState('');

  // 3. Contato de Emergência
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Familiar');
  const [emergencyPhonePrimary, setEmergencyPhonePrimary] = useState('');
  const [emergencyPhoneSecondary, setEmergencyPhoneSecondary] = useState('');

  // 5. Demanda Inicial
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [reasonForCare, setReasonForCare] = useState('');
  const [treatmentStartDate, setTreatmentStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [referral, setReferral] = useState('');

  // 6. Histórico
  const [familyHistory, setFamilyHistory] = useState('');
  const [socialHistory, setSocialHistory] = useState('');
  const [previousMentalHealth, setPreviousMentalHealth] = useState('');
  const [medications, setMedications] = useState('Não faz uso de medicação contínua.');
  const [psychiatricFollowUp, setPsychiatricFollowUp] = useState(false);
  const [psychiatristName, setPsychiatristName] = useState('');
  const [hospitalizationHistory, setHospitalizationHistory] = useState('Sem histórico de internações.');

  // 7. Avaliação Inicial
  const [diagnosticHypothesis, setDiagnosticHypothesis] = useState('');
  const [theoreticalApproach, setTheoreticalApproach] = useState('Terapia Cognitivo-Comportamental (TCC)');

  // 8. Plano Terapêutico
  const [goalsText, setGoalsText] = useState('Psicoeducação sobre queixa principal\nDesenvolver regulação emocional e autoconhecimento');
  const [sessionFrequency, setSessionFrequency] = useState<'weekly' | 'biweekly' | 'twice_weekly' | 'monthly'>('weekly');
  const [strategiesText, setStrategiesText] = useState('Entrevista clínica, questionamento socrático, psicoeducação');

  // 9. Consentimentos
  const [tcleAccepted, setTcleAccepted] = useState(true);
  const [lgpdAuthorized, setLgpdAuthorized] = useState(true);

  // 10. Status
  const [status, setStatus] = useState<RecordStatus>('active');

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Auto age calculation
  const calculatedAge = recordSecurity.calculateAge(birthDate);
  const isMinor = calculatedAge < 18;

  const handleSelectExistingPatient = (patientId: string) => {
    setSelectedExistingPatientId(patientId);
    if (patientId === 'manual') return;

    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;

    setFullName(patient.name);
    setEmail(patient.email);
    setPhone(patient.phone ? maskPhone(patient.phone) : '');
    if (patient.patientProfile) {
      if (patient.patientProfile.approximateAge) {
        const estYear = new Date().getFullYear() - patient.patientProfile.approximateAge;
        setBirthDate(`${estYear}-01-15`);
      }
      setChiefComplaint(patient.patientProfile.personalNote || patient.patientProfile.reasonsForCare.join(', '));
      setReasonForCare(patient.patientProfile.reasonsForCare.join(', '));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage('O Nome Completo do paciente é obrigatório.');
      return;
    }
    if (!birthDate) {
      setErrorMessage('A data de nascimento é obrigatória.');
      return;
    }
    if (isMinor && (!guardianName.trim() || !guardianCpf.trim())) {
      setErrorMessage('Para pacientes menores de 18 anos, os dados do Responsável Legal (Nome e CPF) são obrigatórios por lei.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setErrorMessage('Informe a Queixa Principal / Demanda Inicial do atendimento.');
      return;
    }
    if (!tcleAccepted || !lgpdAuthorized) {
      setErrorMessage('É obrigatório registrar o aceite do TCLE e a autorização LGPD para tratamento dos dados sensíveis.');
      return;
    }

    const patientId = selectedExistingPatientId !== 'manual' ? selectedExistingPatientId : 'pat_' + Date.now().toString(36);

    const goalsArray = goalsText.split('\n').map(s => s.trim()).filter(Boolean);
    const strategiesArray = strategiesText.split(',').map(s => s.trim()).filter(Boolean);

    onSave({
      patientId,
      professionalId: currentProfessional.id,
      status,
      isMinor,
      identification: {
        fullName: fullName.trim(),
        socialName: socialName.trim() || undefined,
        birthDate,
        gender,
        cpf: cpf.trim() || 'Não informado',
        phone: phone.trim(),
        email: email.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        profession: profession.trim(),
        education,
        maritalStatus,
      },
      legalGuardian: isMinor
        ? {
            name: guardianName.trim(),
            relationship: guardianRelationship.trim(),
            cpf: guardianCpf.trim(),
            contact: guardianContact.trim(),
          }
        : undefined,
      emergencyContact: {
        name: emergencyName.trim() || 'Não informado',
        relationship: emergencyRelationship.trim() || 'Familiar',
        phonePrimary: emergencyPhonePrimary.trim() || phone.trim(),
        phoneSecondary: emergencyPhoneSecondary.trim() || undefined,
      },
      professional: currentProfessional,
      initialDemand: {
        chiefComplaint: chiefComplaint.trim(),
        reasonForCare: reasonForCare.trim() || chiefComplaint.trim(),
        treatmentStartDate,
        referral: referral.trim() || undefined,
      },
      history: {
        familyHistory: familyHistory.trim() || 'Dinâmica familiar não relatada na primeira entrevista.',
        socialHistory: socialHistory.trim() || 'Rede de apoio preservada.',
        previousMentalHealth: previousMentalHealth.trim() || 'Nenhum histórico anterior relatado.',
        medications: medications.trim(),
        psychiatricFollowUp,
        psychiatristName: psychiatricFollowUp ? psychiatristName.trim() : undefined,
        hospitalizationHistory: hospitalizationHistory.trim(),
      },
      initialAssessment: {
        diagnosticHypothesis: diagnosticHypothesis.trim() || 'Em investigação / Avaliação clínica inicial.',
        theoreticalApproach,
      },
      therapeuticPlan: {
        goals: goalsArray.length > 0 ? goalsArray : ['Acolhimento clínico e psicodiagnóstico funcional.'],
        sessionFrequency,
        strategiesAndTechniques: strategiesArray.length > 0 ? strategiesArray : ['Escuta clínica ativa', 'Psicoeducação'],
      },
      consents: {
        tcleAccepted,
        tcleAcceptedAt: new Date().toISOString(),
        lgpdAuthorized,
        lgpdAuthorizedAt: new Date().toISOString(),
        signatureType: 'digital',
        signedBy: `${fullName.trim()} (Aceite Registrado)`,
      },
      sessions: [],
      attachments: [],
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Abertura de Prontuário Psicológico Único
                <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  1º Atendimento
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cadastro normatizado pelas resoluções do CFP (Conselho Federal de Psicologia) e LGPD
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

        {/* Existing Patient Quick Pick */}
        <div className="px-6 py-3 bg-sky-50/60 border-b border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-sky-950 font-semibold">
            <Users className="w-4 h-4 text-sky-700" />
            <span>Vincular Paciente Cadastrado na Plataforma:</span>
          </div>
          <select
            value={selectedExistingPatientId}
            onChange={e => handleSelectExistingPatient(e.target.value)}
            className="px-3 py-1.5 bg-white border border-sky-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-sky-600 max-w-xs"
          >
            <option value="manual">Digitar Novo Paciente Manualmente</option>
            {allPatients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identificação */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[11px]">1</span>
              <span>Identificação Completa do Paciente</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nome civil completo do paciente"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Social</label>
                <input
                  type="text"
                  value={socialName}
                  onChange={e => setSocialName(e.target.value)}
                  placeholder="Se houver"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Data de Nascimento * ({calculatedAge} anos)
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Sexo / Gênero</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Não-binário">Não-binário</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">CPF *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={cpf}
                  onChange={e => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefone Principal *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={e => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 90000-0000"
                  maxLength={15}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="paciente@exemplo.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Estado Civil</label>
                <select
                  value={maritalStatus}
                  onChange={e => setMaritalStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                >
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="União Estável">União Estável</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Profissão / Ocupação</label>
                <input
                  type="text"
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  placeholder="Ex: Engenheiro, Estudante..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Escolaridade</label>
                <select
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                >
                  <option value="Ensino Fundamental">Ensino Fundamental</option>
                  <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                  <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                  <option value="Superior Incompleto">Superior Incompleto</option>
                  <option value="Superior Completo">Superior Completo</option>
                  <option value="Pós-graduação Completa">Pós-graduação Completa</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cidade / UF</label>
                <input
                  type="text"
                  value={`${city} - ${state}`}
                  onChange={e => {
                    const parts = e.target.value.split('-');
                    setCity(parts[0]?.trim() || '');
                    setState(parts[1]?.trim() || 'SP');
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Responsável Legal (Obrigatório se Menor) */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isMinor
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/60'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[11px]">2</span>
                <span>Responsável Legal {isMinor && '(Obrigatório por Lei: Menor de 18 Anos)'}</span>
              </h4>
              {isMinor && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  Paciente Menor de Idade ({calculatedAge} anos)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nome do Responsável {isMinor && '*'}
                </label>
                <input
                  type="text"
                  required={isMinor}
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value)}
                  placeholder="Nome completo do pai, mãe ou tutor"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Parentesco</label>
                <input
                  type="text"
                  value={guardianRelationship}
                  onChange={e => setGuardianRelationship(e.target.value)}
                  placeholder="Ex: Mãe, Pai, Tutor Legal"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  CPF do Responsável {isMinor && '*'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required={isMinor}
                  value={guardianCpf}
                  onChange={e => setGuardianCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contato do Responsável</label>
                <input
                  type="text"
                  value={guardianContact}
                  onChange={e => setGuardianContact(e.target.value)}
                  placeholder="Telefone e e-mail de contato do responsável legal"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contato de Emergência */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[11px]">3</span>
              <span>Contato de Emergência</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nome do Contato</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={e => setEmergencyName(e.target.value)}
                  placeholder="Nome do contato de confiança"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vínculo / Parentesco</label>
                <input
                  type="text"
                  value={emergencyRelationship}
                  onChange={e => setEmergencyRelationship(e.target.value)}
                  placeholder="Ex: Cônjuge, Irmão, Amigo..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Telefone de Emergência</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={emergencyPhonePrimary}
                  onChange={e => setEmergencyPhonePrimary(maskPhone(e.target.value))}
                  placeholder="(11) 90000-0000"
                  maxLength={15}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Profissional Responsável (Automático) */}
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between text-xs text-sky-900">
            <div>
              <span className="font-bold block">Profissional Responsável:</span>
              <span>
                {currentProfessional.name} · {currentProfessional.registration} ({currentProfessional.type})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold border border-sky-300">
              Acesso Exclusivo & Sigiloso
            </span>
          </div>

          {/* Section 5: Demanda Inicial */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[11px]">5</span>
              <span>Demanda Inicial & Queixa Principal</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Queixa Principal Apresentada *
              </label>
              <textarea
                rows={2}
                required
                value={chiefComplaint}
                onChange={e => setChiefComplaint(e.target.value)}
                placeholder="Descreva a queixa que motivou a procura do atendimento..."
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Motivo da Busca</label>
                <input
                  type="text"
                  value={reasonForCare}
                  onChange={e => setReasonForCare(e.target.value)}
                  placeholder="Ex: Sofrimento psíquico, recomendação médica..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Encaminhamento (se houver)</label>
                <input
                  type="text"
                  value={referral}
                  onChange={e => setReferral(e.target.value)}
                  placeholder="Ex: Dr. Marcelo (Psiquiatra), Escola, Busca espontânea..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Histórico */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[11px]">6</span>
              <span>Histórico Clínico e Social</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Histórico Familiar</label>
                <textarea
                  rows={2}
                  value={familyHistory}
                  onChange={e => setFamilyHistory(e.target.value)}
                  placeholder="Dinâmica familiar, antecedentes de saúde mental..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Histórico Social</label>
                <textarea
                  rows={2}
                  value={socialHistory}
                  onChange={e => setSocialHistory(e.target.value)}
                  placeholder="Trabalho, lazer, rede de apoio e vínculos sociais..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Saúde Mental Anterior</label>
                <input
                  type="text"
                  value={previousMentalHealth}
                  onChange={e => setPreviousMentalHealth(e.target.value)}
                  placeholder="Tratamentos prévios, psicoterapias passadas..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Uso de Medicações</label>
                <input
                  type="text"
                  value={medications}
                  onChange={e => setMedications(e.target.value)}
                  placeholder="Fármacos contínuos e dosagens..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Avaliação Inicial & 8: Plano */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[11px]">7 & 8</span>
              <span>Avaliação Inicial & Plano Terapêutico</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hipótese Diagnóstica / Impressão Clínica
                </label>
                <input
                  type="text"
                  value={diagnosticHypothesis}
                  onChange={e => setDiagnosticHypothesis(e.target.value)}
                  placeholder="Ex: F41.1 - Ansiedade Generalizada ou formulação inicial"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Abordagem Teórica</label>
                <input
                  type="text"
                  value={theoreticalApproach}
                  onChange={e => setTheoreticalApproach(e.target.value)}
                  placeholder="Ex: TCC, Psicanálise, Gestalt-terapia..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Objetivos do Plano Terapêutico (um por linha)
                </label>
                <textarea
                  rows={2}
                  value={goalsText}
                  onChange={e => setGoalsText(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 9: Consentimentos & LGPD */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[11px]">9 & 10</span>
              <span>Consentimento Livre (TCLE), LGPD e Status Inicial</span>
            </h4>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={tcleAccepted}
                  onChange={e => setTcleAccepted(e.target.checked)}
                  className="rounded text-sky-700 focus:ring-sky-600"
                />
                <span>Termo de Consentimento Livre e Esclarecido (TCLE) aceito e arquivado.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={lgpdAuthorized}
                  onChange={e => setLgpdAuthorized(e.target.checked)}
                  className="rounded text-sky-700 focus:ring-sky-600"
                />
                <span>Autorização LGPD expressa para tratamento e guarda segura de dados de saúde mental.</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar e Iniciar Prontuário</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
