import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MessageSquare, 
  ShieldCheck, 
  Copy, 
  Check, 
  PhoneCall,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CONTACT_SUBJECT_OPTIONS, ContactFormData, ContactFormErrors, ContactSubject } from '../types/contact';
import { contactService } from '../services/contactService';

interface ContactUsProps {
  id?: string;
  onNavigateHome?: () => void;
  isStandalonePage?: boolean;
}

const MAX_MESSAGE_LENGTH = 1000;

export const ContactUs: React.FC<ContactUsProps> = ({ 
  id = 'fale-conosco',
  onNavigateHome,
  isStandalonePage = false
}) => {
  // Form State
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    protocol: string;
    createdAt: string;
  } | null>(null);

  // Quick feedback for copying email to clipboard
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Phone masking function (Brazilian standard: (11) 98765-4321 or (11) 3456-7890)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'message' && value.length > MAX_MESSAGE_LENGTH) {
      return; // Respect character limit
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for field upon typing
    if (errors[name as keyof ContactFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    // Validate Name
    if (!formData.name.trim()) {
      newErrors.name = 'Por favor, informe seu nome completo.';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'O nome deve ter no mínimo 3 caracteres.';
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório para retornarmos o contato.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Insira um endereço de e-mail válido (ex: seuemail@exemplo.com).';
    }

    // Validate Phone (optional, but if filled, validate minimum length)
    const rawPhoneDigits = formData.phone.replace(/\D/g, '');
    if (rawPhoneDigits.length > 0 && rawPhoneDigits.length < 10) {
      newErrors.phone = 'Informe um telefone completo com DDD válido.';
    }

    // Validate Subject
    if (!formData.subject) {
      newErrors.subject = 'Por favor, selecione um assunto ou categoria.';
    }

    // Validate Message
    if (!formData.message.trim()) {
      newErrors.message = 'Por favor, descreva sua mensagem ou dúvida.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'A mensagem deve conter pelo menos 10 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await contactService.submitInquiry(formData);
      if (result.success) {
        setSubmissionSuccess({
          protocol: result.protocol,
          createdAt: result.createdAt
        });
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setErrors({
        message: 'Houve uma falha ao enviar sua mensagem. Por favor, tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    setErrors({});
    setSubmissionSuccess(null);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('suporte@psiconnect.com.br');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const charsRemaining = MAX_MESSAGE_LENGTH - formData.message.length;
  const isNearLimit = charsRemaining <= 100;

  return (
    <section 
      id={id} 
      className={`relative w-full ${isStandalonePage ? 'py-10 sm:py-16' : 'py-12 sm:py-20'} bg-slate-50 border-t border-slate-200/80 transition-colors`}
      aria-labelledby="contact-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200/80 rounded-full text-xs font-semibold text-sky-800 mb-3 shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
            <span>Fale Conosco</span>
            <span aria-hidden="true" className="text-sky-300">·</span>
            <span className="text-slate-600 font-normal">Canal Oficial de Atendimento</span>
          </div>

          <h2 id="contact-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Estamos prontos para acolher você e esclarecer suas dúvidas
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Dúvidas sobre consultas, credenciamento profissional, sigilo ético ou suporte técnico? Nossa equipe está à disposição para ajudar.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ========================================================== */}
          {/* COLUNA ESQUERDA: Informações de Contato & Canais           */}
          {/* ========================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="space-y-2 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  Canais de Atendimento
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Fale com nossa equipe
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Escolha o canal mais conveniente para você. Prezamos pela agilidade, discrição e respeito em todas as interações.
                </p>
              </div>

              {/* Informational Blocks */}
              <div className="space-y-4">
                
                {/* 1. E-mail de Suporte */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-200 hover:bg-sky-50/40 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 group-hover:bg-sky-700 group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                      E-mail de Suporte
                    </span>
                    <a 
                      href="mailto:suporte@psiconnect.com.br"
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-sky-700 transition-colors block truncate"
                    >
                      suporte@psiconnect.com.br
                    </a>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Resposta média em até 24h úteis
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-2 text-slate-400 hover:text-sky-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    title="Copiar e-mail"
                    aria-label="Copiar endereço de e-mail"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* 2. Telefone / WhatsApp */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                        Telefone & WhatsApp
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Online
                      </span>
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      <a 
                        href="https://wa.me/5511987654321?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20a%20plataforma%20PsiConnect"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors block truncate"
                      >
                        (11) 98765-4321 <span className="font-normal text-slate-500">(WhatsApp)</span>
                      </a>
                      <a 
                        href="tel:+551140028922"
                        className="text-xs text-slate-600 hover:text-slate-900 block"
                      >
                        (11) 4002-8922 <span className="text-[11px] text-slate-400">(Central Telefônica)</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3. Horário de Atendimento */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                      Horário de Atendimento
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                      Segunda a Sexta: 08h às 20h
                    </p>
                    <p className="text-xs text-slate-600">
                      Sábados: 08h às 14h <span className="text-[10px] text-slate-400">(Horário de Brasília)</span>
                    </p>
                  </div>
                </div>

                {/* 4. Endereço / Localização */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                      Localização & Abrangência
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                      Sede Operacional: São Paulo - SP
                    </p>
                    <p className="text-xs text-slate-500">
                      Atendimento 100% digital em todo o Brasil e para brasileiros no exterior
                    </p>
                  </div>
                </div>
              </div>

              {/* Ethical & Security Commitment Banner */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sigilo Absoluto & Proteção de Dados</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Suas mensagens e dados pessoais são tratados sob estrita confidencialidade, em total conformidade com a LGPD e o Código de Ética Profissional (Res. CFP nº 011/2018).
                </p>
              </div>
            </div>

            {/* Emergency Support Card (Ethical Duty in Psychological Health) */}
            <div className="bg-amber-50/90 rounded-2xl border border-amber-200/90 p-4 sm:p-5 text-amber-950 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  188
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Apoio Emocional de Emergência
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Se você ou alguém próximo estiver vivenciando uma crise aguda de saúde mental ou pensamentos autodestrutivos, ligue para o <strong>CVV (Centro de Valorização da Vida)</strong> pelo número <strong>188</strong> (ligação gratuita, sigilosa e 24 horas por dia).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* COLUNA DIREITA: Formulário Funcional & Validações          */}
          {/* ========================================================== */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden">
              
              {/* Decorative subtle ambient accent */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-sky-100/50 via-sky-50/20 to-transparent rounded-bl-full pointer-events-none -mr-6 -mt-6" />

              {submissionSuccess ? (
                /* ========================================================== */
                /* Feedback Visual de Sucesso Após Envio                      */
                /* ========================================================== */
                <div className="py-8 sm:py-12 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2 max-w-md">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Envio Confirmado
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Mensagem enviada com sucesso!
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Recebemos sua solicitação. Entraremos em contato em breve através do e-mail ou telefone informados.
                    </p>
                  </div>

                  {/* Protocol Card */}
                  <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Protocolo de Atendimento</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(submissionSuccess.createdAt).toLocaleDateString('pt-BR')} às {new Date(submissionSuccess.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-mono font-bold text-sky-800">
                        {submissionSuccess.protocol}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Registrado no Sistema
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      Guarde este número para acompanhar seu chamado com nosso suporte.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full max-w-md">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="w-full sm:w-auto flex-1 px-5 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Enviar Outra Mensagem
                    </button>
                    {onNavigateHome && (
                      <button
                        type="button"
                        onClick={onNavigateHome}
                        className="w-full sm:w-auto flex-1 px-5 py-3 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-xs"
                      >
                        Voltar ao Início
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ========================================================== */
                /* Formulário Direto e Funcional                              */
                /* ========================================================== */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Envie uma mensagem direta
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Preencha os campos abaixo com seus dados para receber um retorno ágil da nossa equipe.
                    </p>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label 
                      htmlFor="contact-name" 
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Nome Completo <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Mariana Silva Santos"
                      disabled={isSubmitting}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'contact-name-error' : undefined}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-3 ${
                        errors.name
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                          : 'border-slate-300 focus:border-sky-600 focus:ring-sky-100'
                      }`}
                    />
                    {errors.name && (
                      <p id="contact-name-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Grid de E-mail e Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* E-mail */}
                    <div>
                      <label 
                        htmlFor="contact-email" 
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        E-mail de Contato <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="seuemail@exemplo.com"
                        disabled={isSubmitting}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-3 ${
                          errors.email
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                            : 'border-slate-300 focus:border-sky-600 focus:ring-sky-100'
                        }`}
                      />
                      {errors.email && (
                        <p id="contact-email-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Telefone / WhatsApp */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label 
                          htmlFor="contact-phone" 
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Telefone / WhatsApp
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">Opcional</span>
                      </div>
                      <input
                        id="contact-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="(11) 98765-4321"
                        disabled={isSubmitting}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-3 ${
                          errors.phone
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                            : 'border-slate-300 focus:border-sky-600 focus:ring-sky-100'
                        }`}
                      />
                      {errors.phone && (
                        <p id="contact-phone-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assunto / Categoria */}
                  <div>
                    <label 
                      htmlFor="contact-subject" 
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Assunto / Categoria <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="contact-subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 transition-all outline-none focus:ring-3 appearance-none cursor-pointer ${
                          !formData.subject ? 'text-slate-400' : 'text-slate-900'
                        } ${
                          errors.subject
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                            : 'border-slate-300 focus:border-sky-600 focus:ring-sky-100'
                        }`}
                      >
                        <option value="" disabled>Selecione o assunto da sua mensagem...</option>
                        {CONTACT_SUBJECT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                    {errors.subject && (
                      <p id="contact-subject-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.subject}</span>
                      </p>
                    )}
                  </div>

                  {/* Mensagem */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label 
                        htmlFor="contact-message" 
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Mensagem <span className="text-red-500 font-bold">*</span>
                      </label>
                      <span 
                        className={`text-[11px] font-mono font-medium ${
                          isNearLimit ? 'text-amber-600 font-bold' : 'text-slate-400'
                        }`}
                        title="Limite visual de caracteres"
                      >
                        {formData.message.length} / {MAX_MESSAGE_LENGTH} caracteres
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Descreva detalhadamente como podemos ajudar você..."
                      disabled={isSubmitting}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-3 resize-y min-h-[120px] ${
                        errors.message
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                          : 'border-slate-300 focus:border-sky-600 focus:ring-sky-100'
                      }`}
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Botão de Envio */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl text-white transition-all shadow-xs cursor-pointer ${
                        isSubmitting
                          ? 'bg-sky-400 cursor-not-allowed opacity-80'
                          : 'bg-sky-700 hover:bg-sky-800 active:scale-[0.99] focus:ring-4 focus:ring-sky-200 focus:outline-none'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando mensagem...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Mensagem</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-2">
                      Ao enviar, você concorda com o contato da nossa equipe para atendimento ao seu chamado.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
