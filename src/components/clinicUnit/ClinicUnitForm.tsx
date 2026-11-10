import React, { useState, useRef } from 'react';
import {
  ClinicUnit,
  ClinicUnitPhoto,
  ACCESSIBILITY_OPTIONS,
  CARE_TYPE_OPTIONS,
} from '../../types/clinicUnit';
import { User } from '../../types';
import {
  maskCNPJ,
  isValidCNPJ,
  maskPhone,
  maskCEP,
  fetchAddressByCEP,
  BRAZILIAN_STATES,
} from '../../utils/maskUtils';
import { processImageFile } from '../../utils/imageUtils';
import { CameraCaptureModal } from '../CameraCaptureModal';
import { SAMPLE_CLINIC_PHOTOS } from '../../services/clinicUnitStorage';
import {
  Building2,
  FileText,
  Phone,
  MapPin,
  Clock,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Trash2,
  Search,
  Loader2,
  Plus,
  Sparkles,
  ShieldCheck,
  Check,
  HelpCircle,
  X,
  UserCheck
} from 'lucide-react';

interface ClinicUnitFormProps {
  initialUnit?: ClinicUnit | null;
  currentUser: User;
  onSave: (unit: ClinicUnit) => Promise<void>;
  onCancel: () => void;
}

export const ClinicUnitForm: React.FC<ClinicUnitFormProps> = ({
  initialUnit,
  currentUser,
  onSave,
  onCancel,
}) => {
  // 1. Dados Jurídicos e Regulatórios
  const [cnpj, setCnpj] = useState(initialUnit?.cnpj || '');
  const [tradeName, setTradeName] = useState(initialUnit?.tradeName || '');
  const [legalName, setLegalName] = useState(initialUnit?.legalName || '');
  const [cnesNumber, setCnesNumber] = useState(initialUnit?.cnesNumber || '');
  const [technicalLeadName, setTechnicalLeadName] = useState(
    initialUnit?.technicalLeadName || (currentUser.role !== 'patient' ? currentUser.name : '')
  );
  const [technicalLeadCrp, setTechnicalLeadCrp] = useState(
    initialUnit?.technicalLeadCrp || (currentUser.crp || currentUser.registrationNumber || '')
  );

  // 2. Contato e Mídias
  const [landlinePhone, setLandlinePhone] = useState(
    initialUnit?.landlinePhone ? maskPhone(initialUnit.landlinePhone) : ''
  );
  const [receptionWhatsapp, setReceptionWhatsapp] = useState(
    initialUnit?.receptionWhatsapp
      ? maskPhone(initialUnit.receptionWhatsapp)
      : currentUser.phone
      ? maskPhone(currentUser.phone)
      : ''
  );
  const [institutionalEmail, setInstitutionalEmail] = useState(
    initialUnit?.institutionalEmail || currentUser.email || ''
  );
  const [photos, setPhotos] = useState<ClinicUnitPhoto[]>(
    initialUnit?.photos || [SAMPLE_CLINIC_PHOTOS[0], SAMPLE_CLINIC_PHOTOS[1]]
  );
  const [photoCategory, setPhotoCategory] = useState<'fachada' | 'recepcao' | 'consultorio' | 'outro'>('consultorio');

  // Photo helpers
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Endereço Completo
  const [zipCode, setZipCode] = useState(initialUnit?.zipCode || '');
  const [street, setStreet] = useState(initialUnit?.street || '');
  const [number, setNumber] = useState(initialUnit?.number || '');
  const [complement, setComplement] = useState(initialUnit?.complement || '');
  const [neighborhood, setNeighborhood] = useState(initialUnit?.neighborhood || '');
  const [city, setCity] = useState(initialUnit?.city || currentUser.city || '');
  const [state, setState] = useState(initialUnit?.state || currentUser.state || 'SP');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);

  // 4. Estrutura e Operação
  const [operatingHours, setOperatingHours] = useState(
    initialUnit?.operatingHours || 'Segunda a Sexta das 08h às 20h | Sábados das 08h às 13h'
  );
  const [accessibilityItems, setAccessibilityItems] = useState<string[]>(
    initialUnit?.accessibilityItems || ['rampa', 'elevador', 'banheiro_adaptado', 'portas_largas']
  );
  const [serviceTypes, setServiceTypes] = useState<string[]>(
    initialUnit?.serviceTypes || ['presencial', 'teleconsulta', 'infantil_atipicidades']
  );

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSamplePhotoSelector, setShowSamplePhotoSelector] = useState(false);

  // Auto-search CEP when 8 digits are typed
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const masked = maskCEP(rawVal);
    setZipCode(masked);
    setCepError(null);

    const clean = rawVal.replace(/\D/g, '');
    if (clean.length === 8) {
      await searchCep(clean);
    }
  };

  const searchCep = async (cleanCep: string) => {
    setIsSearchingCep(true);
    setCepError(null);
    try {
      const address = await fetchAddressByCEP(cleanCep);
      if (address) {
        setStreet(address.street);
        setNeighborhood(address.neighborhood);
        setCity(address.city);
        if (address.state) {
          setState(address.state.toUpperCase());
        }
        if (address.complement && !complement) {
          setComplement(address.complement);
        }
        // Focus on number input
        setTimeout(() => {
          numberInputRef.current?.focus();
        }, 150);
      } else {
        setCepError('CEP não localizado na base dos Correios. Por favor, confira os números digitados.');
      }
    } catch {
      setCepError('Não foi possível consultar o CEP no momento. Preencha o endereço manualmente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Pre-fill Technical Lead with current user
  const handleUseMyCredentials = () => {
    if (currentUser.name) setTechnicalLeadName(currentUser.name);
    if (currentUser.crp || currentUser.registrationNumber) {
      setTechnicalLeadCrp(currentUser.crp || currentUser.registrationNumber || '');
    }
  };

  // Photo handlers
  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhoto(true);
    setPhotoFeedback(null);
    try {
      const newPhotos: ClinicUnitPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await processImageFile(file, 900, 0.85);
        newPhotos.push({
          id: `photo_${Date.now()}_${i}`,
          url: dataUrl,
          category: photoCategory,
          label: getCategoryLabel(photoCategory),
        });
      }
      setPhotos(prev => [...prev, ...newPhotos]);
      setPhotoFeedback(`${newPhotos.length} foto(s) adicionada(s) à categoria ${getCategoryLabel(photoCategory)}!`);
      setTimeout(() => setPhotoFeedback(null), 3500);
    } catch (err: any) {
      console.error('Erro ao processar foto:', err);
      alert('Erro ao comprimir imagem. Tente uma imagem em formato JPG ou PNG.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleCameraCapture = (dataUrl: string) => {
    const newPhoto: ClinicUnitPhoto = {
      id: `photo_cam_${Date.now()}`,
      url: dataUrl,
      category: photoCategory,
      label: getCategoryLabel(photoCategory),
    };
    setPhotos(prev => [...prev, newPhoto]);
    setPhotoFeedback(`Foto capturada com sucesso para ${getCategoryLabel(photoCategory)}!`);
    setTimeout(() => setPhotoFeedback(null), 3500);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleAddSamplePhoto = (sample: ClinicUnitPhoto) => {
    if (photos.some(p => p.url === sample.url)) {
      setPhotoFeedback('Esta foto já foi adicionada à unidade.');
      setTimeout(() => setPhotoFeedback(null), 2500);
      return;
    }
    const cloned: ClinicUnitPhoto = {
      ...sample,
      id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setPhotos(prev => [...prev, cloned]);
    setPhotoFeedback(`Foto de ${sample.label} adicionada!`);
    setTimeout(() => setPhotoFeedback(null), 2500);
  };

  const getCategoryLabel = (cat: 'fachada' | 'recepcao' | 'consultorio' | 'outro') => {
    switch (cat) {
      case 'fachada': return 'Fachada / Entrada';
      case 'recepcao': return 'Recepção / Sala de Espera';
      case 'consultorio': return 'Consultório / Sala Clínica';
      default: return 'Espaço da Unidade';
    }
  };

  // Toggle Accessibility
  const toggleAccessibility = (id: string) => {
    setAccessibilityItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle Care Types
  const toggleCareType = (id: string) => {
    setServiceTypes(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Validate form
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!cnpj.trim()) {
      errors.cnpj = 'O CNPJ é obrigatório.';
    } else {
      const clean = cnpj.replace(/\D/g, '');
      if (clean.length !== 14) {
        errors.cnpj = 'O CNPJ deve conter 14 dígitos.';
      }
    }

    if (!tradeName.trim()) {
      errors.tradeName = 'O Nome Fantasia é obrigatório.';
    }

    if (!legalName.trim()) {
      errors.legalName = 'A Razão Social é obrigatória.';
    }

    if (!technicalLeadName.trim()) {
      errors.technicalLeadName = 'Nome do Psicólogo Responsável Técnico é obrigatório.';
    }

    if (!technicalLeadCrp.trim()) {
      errors.technicalLeadCrp = 'O CRP/UF do Responsável Técnico é obrigatório.';
    }

    if (!zipCode.trim() || zipCode.replace(/\D/g, '').length !== 8) {
      errors.zipCode = 'Informe um CEP válido com 8 dígitos.';
    }

    if (!street.trim()) {
      errors.street = 'O logradouro é obrigatório.';
    }

    if (!number.trim()) {
      errors.number = 'O número é obrigatório.';
    }

    if (!neighborhood.trim()) {
      errors.neighborhood = 'O bairro é obrigatório.';
    }

    if (!city.trim()) {
      errors.city = 'A cidade é obrigatória.';
    }

    if (!operatingHours.trim()) {
      errors.operatingHours = 'Informe o horário de funcionamento.';
    }

    if (serviceTypes.length === 0) {
      errors.serviceTypes = 'Selecione ao menos um tipo de atendimento oferecido na unidade.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to top error
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const unitData: ClinicUnit = {
        id: initialUnit?.id || `unit_${Date.now()}`,
        cnpj: cnpj.trim(),
        tradeName: tradeName.trim(),
        legalName: legalName.trim(),
        cnesNumber: cnesNumber.trim() || undefined,
        technicalLeadName: technicalLeadName.trim(),
        technicalLeadCrp: technicalLeadCrp.trim(),
        landlinePhone: landlinePhone.trim() || undefined,
        receptionWhatsapp: receptionWhatsapp.trim() || undefined,
        institutionalEmail: institutionalEmail.trim() || undefined,
        photos,
        zipCode: zipCode.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        operatingHours: operatingHours.trim(),
        accessibilityItems,
        serviceTypes,
        createdByUserId: initialUnit?.createdByUserId || currentUser.id,
        createdAt: initialUnit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(unitData);
    } catch (err: any) {
      console.error('Erro ao salvar unidade clínica:', err);
      alert('Ocorreu um erro ao salvar a unidade clínica. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>{initialUnit ? 'Editar Unidade Clínica' : 'Cadastro de Unidade Clínica'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {initialUnit ? initialUnit.tradeName : 'Cadastrar Unidade de Atendimento'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre os dados cadastrais, sanitários e operacionais do seu consultório ou clínica física para atendimento presencial.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ============================================================== */}
        {/* SEÇÃO 1: DADOS JURÍDICOS E REGULATÓRIOS */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Dados Jurídicos e Regulatórios</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identificação fiscal perante a Receita Federal e Conselho Regional de Psicologia (CRP).
                </p>
              </div>
            </div>

            {currentUser.role !== 'patient' && (
              <button
                type="button"
                onClick={handleUseMyCredentials}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
                title="Preencher RT com meus dados cadastrados"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Usar meus dados como RT</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CNPJ */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cnpj}
                  onChange={e => setCnpj(maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl font-mono focus:outline-none focus:ring-2 transition-all ${
                    formErrors.cnpj
                      ? 'border-red-500 focus:ring-red-400'
                      : cnpj.length === 18 && isValidCNPJ(cnpj)
                      ? 'border-emerald-500 focus:ring-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                  }`}
                />
                {cnpj.length === 18 && isValidCNPJ(cnpj) && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-3 pointer-events-none" />
                )}
              </div>
              {formErrors.cnpj ? (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.cnpj}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Máscara: 99.999.999/9999-99</p>
              )}
            </div>

            {/* Nome Fantasia */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Fantasia da Unidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                placeholder="Ex: Clínica Psiconnect Jardins"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.tradeName
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.tradeName && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.tradeName}</p>
              )}
            </div>

            {/* Razão Social */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={legalName}
                onChange={e => setLegalName(e.target.value)}
                placeholder="Ex: Psiconnect Serviços Psicológicos Ltda."
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.legalName
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.legalName && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.legalName}</p>
              )}
            </div>

            {/* Número do CNES */}
            <div className="sm:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Número do CNES
                </label>
                <span className="text-[10px] text-slate-400 font-medium">(Opcional / Regra SUS)</span>
              </div>
              <input
                type="text"
                value={cnesNumber}
                onChange={e => setCnesNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                placeholder="Ex: 9841203 (7 dígitos)"
                maxLength={7}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Cadastro Nacional de Estabelecimentos de Saúde (necessário para convênios e saúde pública).
              </p>
            </div>

            {/* Responsável Técnico: Nome */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Psicólogo Responsável Técnico (Nome) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={technicalLeadName}
                onChange={e => setTechnicalLeadName(e.target.value)}
                placeholder="Ex: Dra. Clara Vasconcellos"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.technicalLeadName
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.technicalLeadName && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.technicalLeadName}</p>
              )}
            </div>

            {/* Responsável Técnico: CRP/UF */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CRP e UF do RT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={technicalLeadCrp}
                onChange={e => setTechnicalLeadCrp(e.target.value.toUpperCase())}
                placeholder="Ex: CRP 06/138420"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.technicalLeadCrp
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.technicalLeadCrp && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.technicalLeadCrp}</p>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 2: CONTATO E MÍDIAS */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Contato e Mídias</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Canais de atendimento ao paciente e acervo fotográfico dos espaços da clínica.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Telefone Fixo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefone Fixo
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={landlinePhone}
                onChange={e => setLandlinePhone(maskPhone(e.target.value))}
                placeholder="(00) 0000-0000"
                maxLength={15}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 font-mono"
              />
            </div>

            {/* WhatsApp da Recepção */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp da Recepção
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={receptionWhatsapp}
                onChange={e => setReceptionWhatsapp(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 font-mono"
              />
            </div>

            {/* E-mail Institucional */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Institucional
              </label>
              <input
                type="email"
                value={institutionalEmail}
                onChange={e => setInstitutionalEmail(e.target.value)}
                placeholder="recepcao@suaclinica.com.br"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* Fotos da Unidade (Upload Múltiplo) */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fotos da Unidade ({photos.length} adicionada{photos.length === 1 ? '' : 's'})
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inclua imagens da fachada externa, recepção, sala de espera e consultórios clínicos.
                </p>
              </div>

              {/* Action buttons for photos */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Select category */}
                <select
                  value={photoCategory}
                  onChange={e => setPhotoCategory(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
                  title="Ambiente para a próxima foto"
                >
                  <option value="fachada">Fachada</option>
                  <option value="recepcao">Recepção</option>
                  <option value="consultorio">Consultório</option>
                  <option value="outro">Outro Espaço</option>
                </select>

                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  disabled={isProcessingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg transition-colors"
                >
                  {isProcessingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Fazer Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Tirar foto com a câmera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Câmera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSamplePhotoSelector(!showSamplePhotoSelector)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fotos Sugeridas</span>
                </button>
              </div>
            </div>

            {/* Hidden multiple file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />

            {/* Feedback message */}
            {photoFeedback && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                {photoFeedback}
              </p>
            )}

            {/* Sample photo drawer */}
            {showSamplePhotoSelector && (
              <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Galeria Demonstrativa de Consultórios & Recepções
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSamplePhotoSelector(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Fechar
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SAMPLE_CLINIC_PHOTOS.map(sample => (
                    <div
                      key={sample.id}
                      onClick={() => handleAddSamplePhoto(sample)}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all relative"
                    >
                      <img src={sample.url} alt={sample.label} className="w-full h-20 object-cover group-hover:scale-105 transition-transform" />
                      <div className="p-1.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
                        {sample.label}
                      </div>
                      <div className="absolute inset-0 bg-sky-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                        + Adicionar
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Preview Grid */}
            {photos.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Nenhuma foto adicionada ainda.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Fotos com boa iluminação da recepção e consultórios aumentam a confiança dos pacientes que buscam atendimento presencial.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-4/3 shadow-2xs"
                  >
                    <img
                      src={photo.url}
                      alt={photo.label || 'Foto da unidade'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Category badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-slate-900/80 backdrop-blur-xs text-white capitalize">
                        {photo.category}
                      </span>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 text-white opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow-sm"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {photo.label && (
                      <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <p className="text-[10px] text-white font-medium truncate">
                          {photo.label}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 3: ENDEREÇO COMPLETO */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Endereço Completo & Localização</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Com busca automática por CEP (integração ViaCEP dos Correios).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* CEP */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CEP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={zipCode}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl font-mono focus:outline-none focus:ring-2 transition-all ${
                    formErrors.zipCode
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => searchCep(zipCode.replace(/\D/g, ''))}
                  disabled={isSearchingCep || zipCode.replace(/\D/g, '').length !== 8}
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/40 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 transition-colors disabled:opacity-40"
                  title="Buscar endereço por CEP"
                >
                  {isSearchingCep ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
              {cepError ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">{cepError}</p>
              ) : formErrors.zipCode ? (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.zipCode}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Busca automática ao digitar 8 dígitos</p>
              )}
            </div>

            {/* Logradouro */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Logradouro (Rua / Av. / Alameda) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="Ex: Alameda Santos"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.street
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.street && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.street}</p>
              )}
            </div>

            {/* Número */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                ref={numberInputRef}
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="Ex: 1820"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.number
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.number && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.number}</p>
              )}
            </div>

            {/* Complemento */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={complement}
                onChange={e => setComplement(e.target.value)}
                placeholder="Ex: Conjunto 142 - 14º Andar"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            {/* Bairro */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="Ex: Cerqueira César"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.neighborhood
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.neighborhood && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.neighborhood}</p>
              )}
            </div>

            {/* Cidade */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formErrors.city
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
                }`}
              />
              {formErrors.city && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.city}</p>
              )}
            </div>

            {/* UF */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                UF (Estado) <span className="text-red-500">*</span>
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                {BRAZILIAN_STATES.map(st => (
                  <option key={st.uf} value={st.uf}>
                    {st.uf} - {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 4: ESTRUTURA E OPERAÇÃO */}
        {/* ============================================================== */}
        <div className="space-y-6">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Accessibility className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Estrutura e Operação</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Horário de funcionamento, acessibilidade para PCD e modalidades de acolhimento.
                </p>
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Horário de Funcionamento da Unidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={operatingHours}
              onChange={e => setOperatingHours(e.target.value)}
              placeholder="Ex: Seg a Sex das 08h às 20h | Sáb das 08h às 14h"
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                formErrors.operatingHours
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
              }`}
            />
            {formErrors.operatingHours && (
              <p className="text-[11px] text-red-500">{formErrors.operatingHours}</p>
            )}

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 self-center">Sugestões rápidas:</span>
              {[
                'Seg a Sex das 08h às 20h',
                'Seg a Sex das 07h às 21h | Sáb das 08h às 14h',
                'Seg a Sex das 08h às 18h',
                'Plantão 24h & Emergências',
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOperatingHours(preset)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Itens de Acessibilidade */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Itens de Acessibilidade (Checklist)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sinalize a infraestrutura física adaptada para pacientes com deficiência ou mobilidade reduzida.
                </p>
              </div>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                {accessibilityItems.length} selecionado{accessibilityItems.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ACCESSIBILITY_OPTIONS.map(opt => {
                const isSelected = accessibilityItems.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleAccessibility(opt.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 dark:border-sky-500/60 ring-1 ring-sky-600/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-sky-700 text-white'
                          : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipos de Atendimento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipos de Atendimento Disponíveis na Unidade <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Indique as modalidades físicas, teleconsulta e nichos clínicos preparados na estrutura.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {serviceTypes.length} modalidade{serviceTypes.length === 1 ? '' : 's'}
              </span>
            </div>

            {formErrors.serviceTypes && (
              <p className="text-xs text-red-500 font-medium">{formErrors.serviceTypes}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CARE_TYPE_OPTIONS.map(care => {
                const isSelected = serviceTypes.includes(care.id);
                return (
                  <button
                    key={care.id}
                    type="button"
                    onClick={() => toggleCareType(care.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-500/60 ring-1 ring-emerald-600/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {care.label}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          {care.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {care.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUBMIT ACTIONS */}
        {/* ============================================================== */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando Unidade...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar e Vincular ao Meu Perfil</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Camera modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
