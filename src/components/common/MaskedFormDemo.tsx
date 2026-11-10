import React, { useState } from 'react';
import {
  maskPhone,
  maskCPF,
  maskCNPJ,
  maskCEP,
  isValidCPF,
  isValidCNPJ,
  cleanNumeric,
  fetchAddressByCEP
} from '../../utils/maskUtils';
import {
  Phone,
  CreditCard,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

export const MaskedFormDemo: React.FC = () => {
  // State for all 4 inputs
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');

  // Address feedback from CEP
  const [cepLoading, setCepLoading] = useState(false);
  const [cepAddress, setCepAddress] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Real-time handlers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = maskPhone(e.target.value);
    setPhone(formatted);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = maskCPF(e.target.value);
    setCpf(formatted);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = maskCNPJ(e.target.value);
    setCnpj(formatted);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = maskCEP(e.target.value);
    setCep(formatted);

    const clean = cleanNumeric(formatted);
    if (clean.length === 8) {
      setCepLoading(true);
      try {
        const addr = await fetchAddressByCEP(clean);
        if (addr) {
          setCepAddress(`${addr.street}, ${addr.neighborhood} - ${addr.city}/${addr.state}`);
        } else {
          setCepAddress('CEP não encontrado nos Correios.');
        }
      } catch {
        setCepAddress('Erro ao consultar ViaCEP.');
      } finally {
        setCepLoading(false);
      }
    } else {
      setCepAddress(null);
    }
  };

  const handleCopy = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReset = () => {
    setPhone('');
    setCpf('');
    setCnpj('');
    setCep('');
    setCepAddress(null);
  };

  // Status helpers
  const phoneClean = cleanNumeric(phone);
  const isPhoneComplete = phoneClean.length === 10 || phoneClean.length === 11;
  const isPhoneCell = phoneClean.length === 11;

  const cpfClean = cleanNumeric(cpf);
  const isCpfLengthValid = cpfClean.length === 11;
  const isCpfValid = isCpfLengthValid && isValidCPF(cpfClean);

  const cnpjClean = cleanNumeric(cnpj);
  const isCnpjLengthValid = cnpjClean.length === 14;
  const isCnpjValid = isCnpjLengthValid && isValidCNPJ(cnpjClean);

  const cepClean = cleanNumeric(cep);
  const isCepComplete = cepClean.length === 8;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formatação Automática em Tempo Real (UX/UI)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Formulário com Máscaras Dinâmicas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Adaptação instantânea de caracteres, teclados numéricos para mobile e sanitização de dados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Limpar Campos</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. TELEFONE DINÂMICO */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-sky-600" />
              <span>1. Telefone (Fixo 8 dígitos ou Celular 9 dígitos)</span>
            </label>
            {phoneClean.length > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPhoneComplete
                  ? isPhoneCell
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}>
                {phoneClean.length === 11
                  ? 'Celular (9 dígitos)'
                  : phoneClean.length === 10
                  ? 'Fixo (8 dígitos)'
                  : `${phoneClean.length}/11 dígitos`}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999 ou (11) 3333-4444"
              maxLength={15}
              className={`w-full px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-slate-800/60 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                isPhoneComplete
                  ? 'border-emerald-500 focus:ring-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
              }`}
            />
            {isPhoneComplete && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-3.5 pointer-events-none" />
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Formato: <code className="text-slate-600 dark:text-slate-300">(99) 9999-9999</code> ou <code className="text-slate-600 dark:text-slate-300">(99) 99999-9999</code>
          </p>
        </div>

        {/* 2. CPF */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>2. CPF (Cadastro de Pessoas Físicas)</span>
            </label>
            {isCpfLengthValid && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isCpfValid
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
              }`}>
                {isCpfValid ? 'Dígitos Válidos' : 'Dígitos Inválidos'}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className={`w-full px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-slate-800/60 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                isCpfLengthValid
                  ? isCpfValid
                    ? 'border-emerald-500 focus:ring-emerald-400'
                    : 'border-red-500 focus:ring-red-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
              }`}
            />
            {isCpfLengthValid && isCpfValid && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-3.5 pointer-events-none" />
            )}
            {isCpfLengthValid && !isCpfValid && (
              <AlertCircle className="w-5 h-5 text-red-500 absolute right-3.5 top-3.5 pointer-events-none" />
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Formato: <code className="text-slate-600 dark:text-slate-300">999.999.999-99</code>
          </p>
        </div>

        {/* 3. CNPJ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>3. CNPJ (Cadastro Nacional da Pessoa Jurídica)</span>
            </label>
            {isCnpjLengthValid && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isCnpjValid
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
              }`}>
                {isCnpjValid ? 'CNPJ Válido' : 'CNPJ Inválido'}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className={`w-full px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-slate-800/60 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                isCnpjLengthValid
                  ? isCnpjValid
                    ? 'border-emerald-500 focus:ring-emerald-400'
                    : 'border-red-500 focus:ring-red-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
              }`}
            />
            {isCnpjLengthValid && isCnpjValid && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-3.5 pointer-events-none" />
            )}
            {isCnpjLengthValid && !isCnpjValid && (
              <AlertCircle className="w-5 h-5 text-red-500 absolute right-3.5 top-3.5 pointer-events-none" />
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Formato: <code className="text-slate-600 dark:text-slate-300">99.999.999/9999-99</code>
          </p>
        </div>

        {/* 4. CEP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>4. CEP (Código de Endereçamento Postal)</span>
            </label>
            {isCepComplete && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                8 dígitos
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              maxLength={9}
              className={`w-full px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-slate-800/60 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                isCepComplete
                  ? 'border-emerald-500 focus:ring-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-sky-600'
              }`}
            />
            {isCepComplete && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-3.5 pointer-events-none" />
            )}
          </div>
          {cepLoading && (
            <p className="text-[11px] text-sky-600 animate-pulse">Buscando endereço via ViaCEP...</p>
          )}
          {cepAddress && !cepLoading && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              📍 {cepAddress}
            </p>
          )}
          <p className="text-[11px] text-slate-400">
            Formato: <code className="text-slate-600 dark:text-slate-300">99999-999</code>
          </p>
        </div>
      </div>

      {/* Real-time State Inspector (Dev / UX debug) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-600" />
            Inspetor de Estado (Valores Formatados vs. Valores Limpos para API/Banco)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">Telefone:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate ml-2">
              {phone || '—'}
            </span>
            <button
              onClick={() => handleCopy('phone', cleanNumeric(phone))}
              className="ml-2 text-slate-400 hover:text-slate-600"
              title="Copiar numérico limpo"
            >
              {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">CPF:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate ml-2">
              {cpf || '—'}
            </span>
            <button
              onClick={() => handleCopy('cpf', cleanNumeric(cpf))}
              className="ml-2 text-slate-400 hover:text-slate-600"
              title="Copiar numérico limpo"
            >
              {copiedKey === 'cpf' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">CNPJ:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate ml-2">
              {cnpj || '—'}
            </span>
            <button
              onClick={() => handleCopy('cnpj', cleanNumeric(cnpj))}
              className="ml-2 text-slate-400 hover:text-slate-600"
              title="Copiar numérico limpo"
            >
              {copiedKey === 'cnpj' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">CEP:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate ml-2">
              {cep || '—'}
            </span>
            <button
              onClick={() => handleCopy('cep', cleanNumeric(cep))}
              className="ml-2 text-slate-400 hover:text-slate-600"
              title="Copiar numérico limpo"
            >
              {copiedKey === 'cep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
