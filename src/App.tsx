import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PsychologistDashboard } from './components/PsychologistDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { LandingHero } from './components/LandingHero';
import { VirtualRoom } from './components/VirtualRoom';
import { PatientMatchingModal } from './components/PatientMatchingModal';
import { Appointment } from './types';
import { Shield, Heart, PhoneCall, CheckCircle2 } from 'lucide-react';
import { isProfessionalRole, UserRole } from './types';
import { clinicalFormStorage } from './services/clinicalFormStorage';
import { ClinicalForm, FormDispatch } from './types/clinicalForm';
import { FormFillModal } from './components/clinicalForms/FormFillModal';

const MainApp: React.FC = () => {
  const { user, role } = useAuth();
  const isProf = isProfessionalRole(role);

  // Tab state: defaults to 'home'
  const [activeTab, setActiveTab] = useState<string>('home');

  // Direct share link form modal
  const [sharedFormToFill, setSharedFormToFill] = useState<{
    form: ClinicalForm;
    dispatch?: FormDispatch;
  } | null>(null);

  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#form-')) {
        const token = hash.replace('#form-', '');
        const disp = clinicalFormStorage.getDispatchByToken(token);
        if (disp) {
          const form = clinicalFormStorage.getPublishedFormForPatient(disp.formId);
          if (form) {
            setSharedFormToFill({ form, dispatch: disp });
          }
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Modal Auth state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState<UserRole>('patient');
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  const [patientMatchingModalOpen, setPatientMatchingModalOpen] = useState(false);

  // Active Virtual Room
  const [activeRoomAppointment, setActiveRoomAppointment] = useState<Appointment | null>(null);

  const handleOpenLogin = () => {
    setInitialAuthMode('login');
    setInitialAuthRole('patient');
    setAuthModalOpen(true);
  };

  const handleOpenRegister = (defaultRole: UserRole = 'patient') => {
    setInitialAuthMode('register');
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

  const getUserRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'pastor' || user.professionalType === 'pastor') return 'Pastor / Conselheiro Bíblico';
    if (user.role === 'therapist' || user.professionalType === 'therapist') return 'Terapeuta';
    if (user.role === 'psychoanalyst' || user.professionalType === 'psychoanalyst') return 'Psicanalista';
    if (user.role === 'psychologist' || user.professionalType === 'psychologist') return 'Psicólogo(a)';
    return 'Paciente';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {user ? (
          activeTab === 'home' ? (
            <div className="space-y-6">
              {/* Logged in welcome helper banner */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sky-900">
                    <div className="w-9 h-9 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">
                        Olá, {user.name} ({getUserRoleLabel()})
                      </p>
                      <p className="text-[11px] text-sky-700">
                        Você está autenticado no PsiConnect. Deseja acessar seu painel principal?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab(isProf ? 'agenda' : 'catalog')}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                  >
                    Ir para meu Painel
                  </button>
                </div>
              </div>
              <LandingHero
                onFindPsychologist={() => setActiveTab('catalog')}
                onRegisterPsychologist={() => handleOpenRegister('psychologist')}
                onRegisterPatient={() => handleOpenRegister('patient')}
                onOpenLogin={handleOpenLogin}
              />
            </div>
          ) : isProf ? (
            <PsychologistDashboard
              onJoinRoom={apt => setActiveRoomAppointment(apt)}
              activeSubTab={activeTab}
            />
          ) : (
            <PatientDashboard
              onJoinRoom={apt => setActiveRoomAppointment(apt)}
              onOpenAuth={handleOpenLogin}
              activeSubTab={activeTab}
            />
          )
        ) : (
          <>
            {activeTab === 'catalog' ? (
              <PatientDashboard
                onJoinRoom={apt => setActiveRoomAppointment(apt)}
                onOpenAuth={handleOpenLogin}
                activeSubTab="catalog"
              />
            ) : (
              <LandingHero
                onFindPsychologist={() => setActiveTab('catalog')}
                onRegisterPsychologist={() => handleOpenRegister('psychologist')}
                onRegisterPatient={() => handleOpenRegister('patient')}
                onOpenLogin={handleOpenLogin}
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
        initialMode={initialAuthMode}
        onPatientRegistered={() => {
          setPatientMatchingModalOpen(true);
        }}
        onAuthSuccess={() => {
          setActiveTab(initialAuthRole === 'psychologist' ? 'agenda' : 'catalog');
        }}
      />

      {/* Patient Intake Onboarding Modal after registration */}
      <PatientMatchingModal
        isOpen={patientMatchingModalOpen}
        isInitialOnboarding={true}
        onClose={() => setPatientMatchingModalOpen(false)}
      />

      {/* Direct Link Form Fill Modal */}
      {sharedFormToFill && (
        <FormFillModal
          isOpen={!!sharedFormToFill}
          onClose={() => {
            setSharedFormToFill(null);
            window.location.hash = '';
          }}
          form={sharedFormToFill.form}
          dispatch={sharedFormToFill.dispatch}
          patientId={user?.id || sharedFormToFill.dispatch?.patientId || 'anonimo'}
          patientName={user?.name || sharedFormToFill.dispatch?.patientName || 'Paciente'}
          patientEmail={user?.email || sharedFormToFill.dispatch?.patientEmail}
        />
      )}
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
