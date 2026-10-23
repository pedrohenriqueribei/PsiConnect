import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { X, Lock, Mail, User as UserIcon, Phone, FileCheck, DollarSign, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'patient',
  onAuthSuccess,
}) => {
  const { login, register, switchDemoUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(initialRole);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [crp, setCrp] = useState('');
  const [approach, setApproach] = useState('TCC - Terapia Cognitivo-Comportamental');
  const [hourlyRate, setHourlyRate] = useState(180);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (mode === 'login') {
      const res = login(email, password);
      setLoading(false);
      if (res.success) {
        onAuthSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.error || 'Erro ao efetuar login.');
      }
    } else {
      if (!name.trim()) {
        setErrorMessage('Por favor, informe seu nome completo.');
        setLoading(false);
        return;
      }
      if (role === 'psychologist' && !crp.trim()) {
        setErrorMessage('Por favor, informe seu número de registro profissional (CRP).');
        setLoading(false);
        return;
      }

      const res = register({
        name,
        email,
        passwordHash: password,
        role,
        phone,
        crp: role === 'psychologist' ? crp : undefined,
        approaches: role === 'psychologist' ? [approach] : undefined,
        hourlyRate: role === 'psychologist' ? Number(hourlyRate) : undefined,
        sessionDuration: 50,
        defaultMeetingType: 'native',
      });

      setLoading(false);
      if (res.success) {
        onAuthSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.error || 'Erro ao realizar cadastro.');
      }
    }
  };

  const handleSelectDemo = (userId: string) => {
    switchDemoUser(userId);
    onAuthSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'login' ? 'Acessar Plataforma' : 'Criar Nova Conta'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'login'
                ? 'Insira seu e-mail e senha cadastrados'
                : 'Cadastre-se com segurança e ética profissional'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Access Bar */}
        <div className="px-6 pt-3 pb-2 bg-sky-50/50 border-b border-sky-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-sky-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Acesso Rápido para Testes:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectDemo('psy_clara')}
              className="py-1 px-2.5 bg-white hover:bg-sky-100 text-sky-900 border border-sky-200 rounded text-left font-medium transition-colors truncate"
            >
              👩‍⚕️ Dra. Clara (Psicóloga)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('pat_lucas')}
              className="py-1 px-2.5 bg-white hover:bg-sky-100 text-sky-900 border border-sky-200 rounded text-left font-medium transition-colors truncate"
            >
              👤 Lucas (Paciente)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Role selector on register */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Perfil
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-left transition-all ${
                    role === 'patient'
                      ? 'border-sky-600 bg-sky-50 text-sky-900 ring-1 ring-sky-600 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold">Sou Paciente</span>
                  <span className="text-[10px] text-slate-500">Agendar sessões online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('psychologist')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-left transition-all ${
                    role === 'psychologist'
                      ? 'border-sky-600 bg-sky-50 text-sky-900 ring-1 ring-sky-600 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold">Sou Psicólogo(a)</span>
                  <span className="text-[10px] text-slate-500">Com CRP ativo</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Fields */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'psychologist' ? 'Dra. Nome Sobrenome' : 'Seu Nome Completo'}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:border-transparent"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {mode === 'register' && role === 'psychologist' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registro Profissional (CRP)
                </label>
                <div className="relative">
                  <FileCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={crp}
                    onChange={e => setCrp(e.target.value)}
                    placeholder="Ex: CRP 06/142980"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Abordagem Principal
                  </label>
                  <select
                    value={approach}
                    onChange={e => setApproach(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="TCC - Terapia Cognitivo-Comportamental">TCC</option>
                    <option value="Psicanálise">Psicanálise</option>
                    <option value="Humanista / Fenomenológica">Humanista</option>
                    <option value="Gestalt-terapia">Gestalt</option>
                    <option value="Terapia Sistêmica / Familiar">Sistêmica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Valor da Sessão (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min={50}
                      max={800}
                      value={hourlyRate}
                      onChange={e => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar com Senha' : 'Concluir Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
};
