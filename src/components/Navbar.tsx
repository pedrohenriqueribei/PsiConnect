import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, User as UserIcon, LogOut, Calendar, Clock, FileText, Search, Shield, ChevronDown } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, role, logout, switchDemoUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => setActiveTab(role === 'psychologist' ? 'agenda' : role === 'patient' ? 'catalog' : 'home')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-700 flex items-center justify-center text-white shadow-xs group-hover:bg-sky-800 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-none">
              Psi<span className="text-sky-700">Connect</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Assistência Psicológica
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {user ? (
            role === 'psychologist' ? (
              <>
                <button
                  onClick={() => setActiveTab('agenda')}
                  className={`flex items-center gap-2 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'agenda' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Minha Agenda
                </button>
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`flex items-center gap-2 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'availability' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Disponibilidade
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex items-center gap-2 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'records' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Prontuários (PEP)
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'profile' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Meu Perfil
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`flex items-center gap-2 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'catalog' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Encontrar Psicólogos
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`flex items-center gap-2 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'appointments' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Minhas Consultas
                </button>
                <button
                  onClick={() => setActiveTab('patient_records')}
                  className={`flex items-center gap-2 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeTab === 'patient_records' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Orientações Terapêuticas
                </button>
              </>
            )
          ) : (
            <>
              <button
                onClick={() => setActiveTab('home')}
                className={`hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === 'home' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                }`}
              >
                Início
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === 'catalog' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                }`}
              >
                Psicólogos Credenciados
              </button>
              <button
                onClick={() => setActiveTab('ethics')}
                className={`hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === 'ethics' ? 'border-sky-700 text-sky-800 font-semibold' : 'border-transparent'
                }`}
              >
                Sigilo & Ética CFP
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action / User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-semibold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.name.split(' ')[0]} {user.name.split(' ')[1] || ''}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {user.role === 'psychologist' ? (user.crp || 'Psicólogo(a)') : 'Paciente'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-sky-700">
                      {user.role === 'psychologist' ? 'Psicólogo Clínico' : 'Paciente Cadastrado'}
                    </span>
                  </div>

                  {/* Switch rápido de contas demonstrativas */}
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Trocar Conta de Teste:
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          switchDemoUser('psy_clara');
                          setActiveTab('agenda');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                          user.id === 'psy_clara' ? 'bg-sky-50 text-sky-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Dra. Clara (Psicóloga - TCC)
                      </button>
                      <button
                        onClick={() => {
                          switchDemoUser('psy_marcos');
                          setActiveTab('agenda');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                          user.id === 'psy_marcos' ? 'bg-sky-50 text-sky-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Dr. Marcos (Psicólogo - Gestalt)
                      </button>
                      <button
                        onClick={() => {
                          switchDemoUser('pat_lucas');
                          setActiveTab('catalog');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                          user.id === 'pat_lucas' ? 'bg-sky-50 text-sky-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Lucas Ribeiro (Paciente)
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setActiveTab('home');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Encerrar Sessão
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Acessar com Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
