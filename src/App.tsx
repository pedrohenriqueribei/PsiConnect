import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PsychologistDashboard } from './components/PsychologistDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { LandingHero } from './components/LandingHero';
import { VirtualRoom } from './components/VirtualRoom';
import { PatientMatchingModal } from './components/PatientMatchingModal';
import { Appointment, isProfessionalRole, UserRole, User } from './types';
import { Shield, Heart, PhoneCall, CheckCircle2 } from 'lucide-react';
import { clinicalFormStorage } from './services/clinicalFormStorage';
import { ClinicalForm, FormDispatch } from './types/clinicalForm';
import { FormFillModal } from './components/clinicalForms/FormFillModal';
import { ContactUs } from './components/ContactUs';
import { BrandLogo } from './components/BrandLogo';
import { UserProfileView } from './components/UserProfileView';
import { clinicUnitStorage } from './services/clinicUnitStorage';
import { ClinicUnit } from './types/clinicUnit';
import { PublicClinicModal } from './components/clinicUnit/PublicClinicModal';
import { ArticleModal } from './components/ArticleModal';
import { KNOWLEDGE_ARTICLES, KnowledgeArticle } from './data/knowledgeArticles';
import { ProfessionalPreviewModal } from './components/ProfessionalPreviewModal';

const PROF_TABS = new Set([
  'agenda',
  'matching',
  'availability',
  'records',
  'forms',
  'journey',
  'profile',
  'clinic-unit',
  'contact',
]);

const PATIENT_TABS = new Set([
  'catalog',
  'appointments',
  'patient_forms',
  'patient_records',
  'mood_tracker',
  'profile',
  'contact',
]);

const PUBLIC_TABS = new Set(['home', 'catalog', 'contact']);

const getDefaultDashboardTab = (isProf: boolean): string => (isProf ? 'agenda' : 'catalog');

const resolveTabForAuthState = (tab: string, currentUser: User | null): string => {
  if (currentUser) {
    const prof = isProfessionalRole(currentUser.role);
    if (tab === 'home') {
      return getDefaultDashboardTab(prof);
    }
    if (prof && !PROF_TABS.has(tab)) {
      return 'agenda';
    }
    if (!prof && !PATIENT_TABS.has(tab)) {
      return 'catalog';
    }
    return tab;
  }

  return PUBLIC_TABS.has(tab) ? tab : 'home';
};

const resolveTabFromPathname = (pathname: string, currentUser: User | null): string => {
  const clean = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  let mapped = 'home';

  switch (clean) {
    case '/':
    case '/home':
    case '/inicio':
    case '/login':
    case '/cadastro':
    case '/register':
      mapped = 'home';
      break;
    case '/painel':
    case '/dashboard':
      mapped = currentUser ? getDefaultDashboardTab(isProfessionalRole(currentUser.role)) : 'home';
      break;
    case '/especialistas':
    case '/catalog':
    case '/catalogo':
      mapped = 'catalog';
      break;
    case '/agenda':
      mapped = 'agenda';
      break;
    case '/pacientes-sugeridos':
    case '/matching':
      mapped = 'matching';
      break;
    case '/disponibilidade':
    case '/availability':
      mapped = 'availability';
      break;
    case '/prontuarios':
    case '/records':
      mapped = 'records';
      break;
    case '/formularios':
    case '/forms':
      mapped = 'forms';
      break;
    case '/jornada':
    case '/journey':
      mapped = 'journey';
      break;
    case '/consultas':
    case '/appointments':
      mapped = 'appointments';
      break;
    case '/questionarios':
    case '/patient_forms':
      mapped = 'patient_forms';
      break;
    case '/orientacoes':
    case '/patient_records':
      mapped = 'patient_records';
      break;
    case '/diario-de-humor':
    case '/mood_tracker':
      mapped = 'mood_tracker';
      break;
    case '/perfil':
    case '/profile':
      mapped = 'profile';
      break;
    case '/unidade-clinica':
    case '/clinic-unit':
      mapped = 'clinic-unit';
      break;
    case '/contato':
    case '/contact':
    case '/fale-conosco':
      mapped = 'contact';
      break;
    default:
      mapped = 'home';
      break;
  }

  return resolveTabForAuthState(mapped, currentUser);
};

const getPathForTab = (tab: string, currentUser: User | null): string => {
  if (currentUser) {
    const prof = isProfessionalRole(currentUser.role);
    if ((prof && tab === 'agenda') || (!prof && tab === 'catalog')) {
      return '/painel';
    }
  }

  switch (tab) {
    case 'home':
      return '/';
    case 'catalog':
      return '/especialistas';
    case 'agenda':
      return '/painel';
    case 'matching':
      return '/pacientes-sugeridos';
    case 'availability':
      return '/disponibilidade';
    case 'records':
      return '/prontuarios';
    case 'forms':
      return '/formularios';
    case 'journey':
      return '/jornada';
    case 'appointments':
      return '/consultas';
    case 'patient_forms':
      return '/questionarios';
    case 'patient_records':
      return '/orientacoes';
    case 'mood_tracker':
      return '/diario-de-humor';
    case 'profile':
      return '/perfil';
    case 'clinic-unit':
      return '/unidade-clinica';
    case 'contact':
      return '/contato';
    default:
      return currentUser ? '/painel' : '/';
  }
};

const MainApp: React.FC = () => {
  const { user, role } = useAuth();
  const isProf = isProfessionalRole(role);

  // Tab state: redirects to dashboard panel when logged in, or 'home' when logged out
  const [activeTab, setActiveTab] = useState<string>(() =>
    resolveTabFromPathname(window.location.pathname, user)
  );
  const [navNonce, setNavNonce] = useState<number>(0);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [previewProfessional, setPreviewProfessional] = useState<User | null>(null);
  const [externalCatalogSearch, setExternalCatalogSearch] = useState<{
    query: string;
    nonce: number;
  } | null>(null);

  // Direct share link form modal
  const [sharedFormToFill, setSharedFormToFill] = useState<{
    form: ClinicalForm;
    dispatch?: FormDispatch;
  } | null>(null);

  // Direct QR code / check-in modal
  const [publicClinicModal, setPublicClinicModal] = useState<{
    unit: ClinicUnit;
    mode: 'checkin' | 'profile';
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
      } else if (hash.startsWith('#checkin-')) {
        const unitId = hash.replace('#checkin-', '');
        const unit = clinicUnitStorage.getClinicUnitById(unitId);
        if (unit) {
          setPublicClinicModal({ unit, mode: 'checkin' });
        }
      } else if (hash.startsWith('#clinica-')) {
        const unitId = hash.replace('#clinica-', '');
        const unit = clinicUnitStorage.getClinicUnitById(unitId);
        if (unit) {
          setPublicClinicModal({ unit, mode: 'profile' });
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

  // Enforce route guards & redirect logged-in users from '/' or 'home' to their dashboard panel
  React.useEffect(() => {
    const resolvedTab = resolveTabForAuthState(activeTab, user);
    if (resolvedTab !== activeTab) {
      setActiveTab(resolvedTab);
    }
    const targetPath = getPathForTab(resolvedTab, user);
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(
        { tab: resolvedTab },
        '',
        `${targetPath}${window.location.search}${window.location.hash}`
      );
    }
  }, [user, activeTab]);

  // Sync browser Back/Forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      const nextTab = resolveTabFromPathname(window.location.pathname, user);
      setActiveTab(nextTab);
      setNavNonce(n => n + 1);
      const targetPath = getPathForTab(nextTab, user);
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(
          { tab: nextTab },
          '',
          `${targetPath}${window.location.search}${window.location.hash}`
        );
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleNavigateTab = (tab: string, overrideUser?: User | null) => {
    if (tab === 'ethics') {
      const ethicsArticle =
        KNOWLEDGE_ARTICLES.find(a => a.id === 'art-etica-cfp-lgpd') || KNOWLEDGE_ARTICLES[1];
      setSelectedArticle(ethicsArticle);
      return;
    }
    const effectiveUser = overrideUser !== undefined ? overrideUser : user;
    const resolvedTab = resolveTabForAuthState(tab, effectiveUser);
    const targetPath = getPathForTab(resolvedTab, effectiveUser);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(
        { tab: resolvedTab },
        '',
        `${targetPath}${window.location.search}${window.location.hash}`
      );
    }
    setActiveTab(resolvedTab);
    setNavNonce(n => n + 1);
  };

  const handleSelectProfessionalFromSearch = (professional: User) => {
    if (user && isProf) {
      setPreviewProfessional(professional);
      return;
    }
    handleNavigateTab('catalog');
    setExternalCatalogSearch({ query: professional.name, nonce: Date.now() });
  };

  const handleArticleAction = (targetTab: string) => {
    if (targetTab === 'records') {
      if (user && isProf) {
        handleNavigateTab('records');
      } else if (user) {
        handleNavigateTab('patient_records');
      } else {
        handleNavigateTab('catalog');
      }
      return;
    }
    if (targetTab === 'mood_tracker' || targetTab === 'patient_records') {
      if (user && !isProf) {
        handleNavigateTab(targetTab);
      } else if (!user) {
        handleOpenLogin();
      } else {
        handleNavigateTab('agenda');
      }
      return;
    }
    if (targetTab === 'catalog' && user && isProf) {
      handleNavigateTab('matching');
      return;
    }
    handleNavigateTab(targetTab);
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-clip">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onSelectArticle={article => setSelectedArticle(article)}
        onSelectProfessional={handleSelectProfessionalFromSearch}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'contact' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
            <ContactUs
              isStandalonePage={true}
              onNavigateHome={() => handleNavigateTab(user ? getDefaultDashboardTab(isProf) : 'home')}
            />
          </div>
        ) : (activeTab === 'profile' || activeTab === 'clinic-unit') && user ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
            <UserProfileView
              initialTab={activeTab === 'clinic-unit' ? 'clinicUnit' : undefined}
              onBack={() => handleNavigateTab(getDefaultDashboardTab(isProf))}
            />
          </div>
        ) : user ? (
          isProf ? (
            <PsychologistDashboard
              onJoinRoom={apt => setActiveRoomAppointment(apt)}
              activeSubTab={activeTab === 'home' ? 'agenda' : activeTab}
              navNonce={navNonce}
            />
          ) : (
            <PatientDashboard
              onJoinRoom={apt => setActiveRoomAppointment(apt)}
              onOpenAuth={handleOpenLogin}
              activeSubTab={activeTab === 'home' ? 'catalog' : activeTab}
              navNonce={navNonce}
              externalSearch={externalCatalogSearch}
            />
          )
        ) : (
          <>
            {activeTab === 'catalog' ? (
              <PatientDashboard
                onJoinRoom={apt => setActiveRoomAppointment(apt)}
                onOpenAuth={handleOpenLogin}
                activeSubTab="catalog"
                navNonce={navNonce}
                externalSearch={externalCatalogSearch}
              />
            ) : (
              <LandingHero
                onFindPsychologist={() => handleNavigateTab('catalog')}
                onRegisterPsychologist={() => handleOpenRegister('psychologist')}
                onRegisterPatient={() => handleOpenRegister('patient')}
                onOpenLogin={handleOpenLogin}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-16 py-10 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <BrandLogo size="md" subtitle="Tecnologia & Conexão em Saúde Mental e Aconselhamento" animated={true} />
            <p className="max-w-md text-slate-500 dark:text-slate-400 leading-relaxed">
              Plataforma de intermediação e telepsicologia que aproxima especialistas e pacientes com segurança técnica e conformidade rigorosa com as resoluções do Conselho Federal de Psicologia (CFP nº 011/2018).
            </p>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ambiente seguro com criptografia e prontuário sigiloso</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
              Atendimento & Ética
            </span>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li>
                <button 
                  onClick={() => handleNavigateTab('contact')}
                  className="hover:text-sky-700 dark:hover:text-sky-400 font-semibold text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  Fale Conosco (Suporte & Contato)
                </button>
              </li>
              <li>Resolução CFP nº 011/2018</li>
              <li>Código de Ética do Psicólogo</li>
              <li>Prontuário (Res. CFP nº 001/2009)</li>
              <li>Proteção de Dados & Sigilo (LGPD)</li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
              Apoio Emergencial
            </span>
            <p className="text-slate-500 dark:text-slate-400 mb-2">
              Em caso de crise grave ou pensamentos suicidas, procure apoio imediato:
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium flex items-center justify-between">
              <span>CVV - Apoio à Vida</span>
              <span className="font-bold">Ligue 188 (Gratuito)</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PsiConnect. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <button 
              onClick={() => handleNavigateTab('contact')}
              className="hover:text-sky-700 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Fale Conosco
            </button>
            <span>·</span>
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
        onAuthSuccess={(loggedUser) => {
          const targetIsProf = loggedUser
            ? isProfessionalRole(loggedUser.role)
            : initialAuthRole !== 'patient';
          handleNavigateTab(getDefaultDashboardTab(targetIsProf), loggedUser ?? user);
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

      {/* Public Clinic QR Code Check-in / Profile Modal */}
      {publicClinicModal && (
        <PublicClinicModal
          isOpen={!!publicClinicModal}
          onClose={() => {
            setPublicClinicModal(null);
            window.location.hash = '';
          }}
          unit={publicClinicModal.unit}
          initialMode={publicClinicModal.mode}
        />
      )}

      {/* Article Reader Modal (from Global Search / Ethics) */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onNavigateAction={handleArticleAction}
      />

      {/* Professional Preview Modal (when a logged-in professional selects a colleague in Global Search) */}
      {previewProfessional && (
        <ProfessionalPreviewModal
          isOpen={!!previewProfessional}
          onClose={() => setPreviewProfessional(null)}
          professional={previewProfessional}
        />
      )}
    </div>
  );
};


export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
