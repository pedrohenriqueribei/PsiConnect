import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PsychologistDashboard } from './components/PsychologistDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { LandingHero } from './components/LandingHero';
import { VirtualRoom } from './components/VirtualRoom';
import { Appointment } from './types';
import { Shield, Heart, PhoneCall, CheckCircle2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, role } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (role === 'psychologist') return 'agenda';
    if (role === 'patient') return 'catalog';
    return 'home';
  });

  // Modal Auth state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState<'patient' | 'psychologist'>('patient');

  // Active Virtual Room
  const [activeRoomAppointment, setActiveRoomAppointment] = useState<Appointment | null>(null);

  const handleOpenAuth = (defaultRole: 'patient' | 'psychologist' = 'patient') => {
    setInitialAuthRole(defaultRole);
    setAuthModalOpen(true);
  };

  // If in an active video consultation
  if (activeRoomAppointment) {
    return (
      <VirtualRoom
        appointment={activeRoomAppointment}
        onLeave={() => setActiveRoomAppointment(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => handleOpenAuth('patient')}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {user ? (
          role === 'psychologist' ? (
            <PsychologistDashboard
              onJoinRoom={apt => setActiveRoomAppointment(apt)}
              activeSubTab={activeTab}
            />
          ) : (
            <PatientDashboard
              onJoinRoom={apt => setActiveRoomAppointment(apt)}
              onOpenAuth={() => handleOpenAuth('patient')}
              activeSubTab={activeTab}
            />
          )
        ) : (
          <>
            {activeTab === 'catalog' ? (
              <PatientDashboard
                onJoinRoom={apt => setActiveRoomAppointment(apt)}
                onOpenAuth={() => handleOpenAuth('patient')}
                activeSubTab="catalog"
              />
            ) : (
              <LandingHero
                onFindPsychologist={() => setActiveTab('catalog')}
                onRegisterPsychologist={() => handleOpenAuth('psychologist')}
                onOpenAuth={() => handleOpenAuth('patient')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-2 md:col-span-2">
            <span className="text-base font-bold text-slate-900 block">
              Psi<span className="text-sky-700">Connect</span>
            </span>
            <p className="max-w-md text-slate-500 leading-relaxed">
              Plataforma de intermediação e telepsicologia que aproxima psicólogos e pacientes com segurança técnica e conformidade rigorosa com as resoluções do Conselho Federal de Psicologia (CFP nº 011/2018).
            </p>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ambiente seguro com criptografia e prontuário sigiloso</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Regulamentação
            </span>
            <ul className="space-y-1.5 text-slate-500">
              <li>Resolução CFP nº 011/2018</li>
              <li>Código de Ética do Psicólogo</li>
              <li>Prontuário (Res. CFP nº 001/2009)</li>
              <li>Proteção de Dados & Sigilo</li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Apoio Emergencial
            </span>
            <p className="text-slate-500 mb-2">
              Em caso de crise grave ou pensamentos suicidas, procure apoio imediato:
            </p>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-medium flex items-center justify-between">
              <span>CVV - Apoio à Vida</span>
              <span className="font-bold">Ligue 188 (Gratuito)</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PsiConnect. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacidade</span>
            <span>·</span>
            <span>Termos de Uso</span>
            <span>·</span>
            <span>Código de Ética CFP</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={initialAuthRole}
        onAuthSuccess={() => {
          setActiveTab(initialAuthRole === 'psychologist' ? 'agenda' : 'catalog');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
