import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  X,
  User as UserIcon,
  Calendar,
  Clock,
  FileText,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Smile,
  Building2,
  Activity,
  MessageSquare,
  LogIn,
  UserPlus,
  Home,
  ArrowUpRight,
  Compass,
  Video,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import {
  User,
  Appointment,
  isProfessionalRole,
  isProfessionalAcceptingPatients,
  PROFESSIONAL_TYPES_CONFIG,
  ProfessionalType,
} from '../types';
import { KNOWLEDGE_ARTICLES, KnowledgeArticle } from '../data/knowledgeArticles';
import { formatDateBR } from '../utils/dateUtils';

interface PanelSearchItem {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  action:
    | { type: 'tab'; tab: string }
    | { type: 'login' }
    | { type: 'register'; role: 'patient' | 'psychologist' };
}

type FlatSearchResult =
  | { kind: 'professional'; id: string; item: User }
  | { kind: 'panel'; id: string; item: PanelSearchItem }
  | { kind: 'appointment'; id: string; item: Appointment }
  | { kind: 'article'; id: string; item: KnowledgeArticle };

interface GlobalSearchBarProps {
  onNavigateTab: (tab: string) => void;
  onSelectArticle: (article: KnowledgeArticle) => void;
  onSelectProfessional: (professional: User) => void;
  onOpenLogin: () => void;
  onOpenRegister: (role: 'patient' | 'psychologist') => void;
}

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onNavigateTab,
  onSelectArticle,
  onSelectProfessional,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { user, role } = useAuth();
  const isProf = isProfessionalRole(role);

  const [query, setQuery] = useState('');
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const [professionals, setProfessionals] = useState<User[]>(() => storage.getProfessionals());
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    user ? storage.getAppointments(user.id, isProf ? 'psychologist' : 'patient') : []
  );

  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => {
      setProfessionals(storage.getProfessionals());
      if (user) {
        setAppointments(storage.getAppointments(user.id, isProf ? 'psychologist' : 'patient'));
      } else {
        setAppointments([]);
      }
    };
    refresh();
    const unsub = storage.subscribe(refresh);
    return () => unsub();
  }, [user, isProf]);

  // Close desktop popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopContainerRef.current && !desktopContainerRef.current.contains(e.target as Node)) {
        setIsDesktopOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setIsMobileOpen(true);
        } else {
          setIsDesktopOpen(true);
          desktopInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      const timer = window.setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
  }, [isMobileOpen]);

  const panelItems: PanelSearchItem[] = useMemo(() => {
    if (user && isProf) {
      return [
        {
          id: 'panel-agenda',
          title: 'Minha Agenda de Atendimentos',
          description: 'Teleconsultas agendadas, horários de hoje e salas virtuais de vídeo.',
          keywords: ['agenda', 'consultas', 'teleconsulta', 'sessões', 'vídeo', 'atendimentos', 'hoje'],
          badge: 'Painel',
          icon: Calendar,
          action: { type: 'tab', tab: 'agenda' },
        },
        {
          id: 'panel-matching',
          title: 'Pacientes Sugeridos (Matching)',
          description: 'Recomendações de pacientes por compatibilidade, queixas e score ponderado.',
          keywords: ['pacientes', 'matching', 'sugeridos', 'afinidade', 'compatibilidade', 'convite'],
          badge: 'Painel',
          icon: Sparkles,
          action: { type: 'tab', tab: 'matching' },
        },
        {
          id: 'panel-availability',
          title: 'Grade de Disponibilidade & Vagas Sociais',
          description: 'Configure horários semanais de atendimento e vagas de valor social.',
          keywords: ['disponibilidade', 'grade', 'horários', 'vagas sociais', 'agenda semanal'],
          badge: 'Painel',
          icon: Clock,
          action: { type: 'tab', tab: 'availability' },
        },
        {
          id: 'panel-records',
          title: user.role === 'pastor' ? 'Fichas Pastorais & Registros' : 'Prontuários (PEP)',
          description: 'Evoluções de sessões, anamnese, relatórios PDF e criptografia sigilosa.',
          keywords: ['prontuário', 'pep', 'fichas', 'evolução', 'relatório', 'sigilo', 'criptografia'],
          badge: 'Painel',
          icon: ShieldCheck,
          action: { type: 'tab', tab: 'records' },
        },
        {
          id: 'panel-forms',
          title: 'Formulários Clínicos & Escalas',
          description: 'Crie, envie e acompanhe questionários (PHQ-9, GAD-7, anamnese).',
          keywords: ['formulários', 'questionários', 'escalas', 'phq-9', 'gad-7', 'envios'],
          badge: 'Painel',
          icon: FileText,
          action: { type: 'tab', tab: 'forms' },
        },
        {
          id: 'panel-journey',
          title: 'Jornada do Paciente (Gráfico D3)',
          description: 'Linha temporal visual de evolução clínica e marcos terapêuticos.',
          keywords: ['jornada', 'd3', 'gráfico', 'marcos', 'evolução visual', 'linha do tempo'],
          badge: 'Painel',
          icon: Activity,
          action: { type: 'tab', tab: 'journey' },
        },
        {
          id: 'panel-clinic-unit',
          title: 'Unidade Clínica & Check-in QR Code',
          description: 'Endereço do consultório, galeria de fotos, mapa e QR Code de check-in.',
          keywords: ['unidade clínica', 'consultório', 'endereço', 'mapa', 'qr code', 'presencial'],
          badge: 'Painel',
          icon: Building2,
          action: { type: 'tab', tab: 'clinic-unit' },
        },
        {
          id: 'panel-profile',
          title: 'Meu Perfil, Dados & Segurança',
          description: 'Atualize dados pessoais, foto, credenciais, honorários e preferências.',
          keywords: ['perfil', 'dados', 'foto', 'crp', 'honorário', 'formação', 'especialização', 'tags'],
          badge: 'Conta',
          icon: UserIcon,
          action: { type: 'tab', tab: 'profile' },
        },
        {
          id: 'panel-contact',
          title: 'Fale Conosco & Suporte',
          description: 'Canal direto para suporte técnico, dúvidas éticas ou sugestões.',
          keywords: ['contato', 'fale conosco', 'suporte', 'ajuda', 'dúvidas'],
          badge: 'Suporte',
          icon: MessageSquare,
          action: { type: 'tab', tab: 'contact' },
        },
      ];
    }

    if (user) {
      return [
        {
          id: 'panel-catalog',
          title: 'Encontrar Especialista',
          description: 'Busque psicólogos, terapeutas, psicanalistas e pastores por abordagem ou preço.',
          keywords: ['especialistas', 'psicólogo', 'terapeuta', 'psicanalista', 'pastor', 'agendar', 'catálogo'],
          badge: 'Painel',
          icon: Search,
          action: { type: 'tab', tab: 'catalog' },
        },
        {
          id: 'panel-appointments',
          title: 'Minhas Consultas Agendadas',
          description: 'Veja seus horários marcados, links de atendimento e entre na sala virtual.',
          keywords: ['consultas', 'agendamentos', 'teleatendimento', 'sala virtual', 'meet', 'horários'],
          badge: 'Painel',
          icon: Calendar,
          action: { type: 'tab', tab: 'appointments' },
        },
        {
          id: 'panel-mood',
          title: 'Diário de Humor & Bem-Estar',
          description: 'Registre emoções diárias, energia, sono e acompanhe gráficos de tendência.',
          keywords: ['humor', 'diário', 'emoções', 'sono', 'energia', 'bem-estar'],
          badge: 'Painel',
          icon: Smile,
          action: { type: 'tab', tab: 'mood_tracker' },
        },
        {
          id: 'panel-patient-forms',
          title: 'Meus Questionários Clínicos',
          description: 'Preencha questionários e escalas enviados pelo seu especialista.',
          keywords: ['questionários', 'formulários', 'escalas', 'responder', 'avaliação'],
          badge: 'Painel',
          icon: FileText,
          action: { type: 'tab', tab: 'patient_forms' },
        },
        {
          id: 'panel-care-guide',
          title: 'Orientações de Cuidado & Emergência',
          description: 'Diferenças entre modalidades de cuidado e telefones de apoio (CVV 188).',
          keywords: ['orientações', 'cuidado', 'emergência', 'cvv', '188', 'samu', 'modalidade'],
          badge: 'Painel',
          icon: ShieldCheck,
          action: { type: 'tab', tab: 'patient_records' },
        },
        {
          id: 'panel-profile',
          title: 'Meu Perfil & Preferências',
          description: 'Edite seus dados pessoais, foto e perfil de acolhimento.',
          keywords: ['perfil', 'conta', 'dados pessoais', 'acolhimento', 'matching'],
          badge: 'Conta',
          icon: UserIcon,
          action: { type: 'tab', tab: 'profile' },
        },
        {
          id: 'panel-contact',
          title: 'Fale Conosco & Suporte',
          description: 'Envie dúvidas, solicitações ou fale com a equipe PsiConnect.',
          keywords: ['contato', 'fale conosco', 'suporte', 'ajuda'],
          badge: 'Suporte',
          icon: MessageSquare,
          action: { type: 'tab', tab: 'contact' },
        },
      ];
    }

    return [
      {
        id: 'visitor-catalog',
        title: 'Especialistas Disponíveis',
        description: 'Explore psicólogos, terapeutas, psicanalistas e pastores para atendimento online.',
        keywords: ['especialistas', 'psicólogos', 'terapeutas', 'psicanalistas', 'pastores', 'catálogo', 'buscar'],
        badge: 'Plataforma',
        icon: Compass,
        action: { type: 'tab', tab: 'catalog' },
      },
      {
        id: 'visitor-home',
        title: 'Início — Conheça o PsiConnect',
        description: 'Visão geral das modalidades de terapia emocional e aconselhamento bíblico.',
        keywords: ['início', 'home', 'plataforma', 'como funciona', 'acolhimento'],
        badge: 'Plataforma',
        icon: Home,
        action: { type: 'tab', tab: 'home' },
      },
      {
        id: 'visitor-contact',
        title: 'Fale Conosco',
        description: 'Canal de contato para dúvidas éticas, suporte técnico ou parcerias.',
        keywords: ['fale conosco', 'contato', 'suporte', 'ajuda', 'ética'],
        badge: 'Suporte',
        icon: MessageSquare,
        action: { type: 'tab', tab: 'contact' },
      },
      {
        id: 'visitor-login',
        title: 'Fazer Login (Acessar Conta)',
        description: 'Entre na sua conta ou teste os perfis de demonstração da plataforma.',
        keywords: ['login', 'entrar', 'acessar', 'conta', 'teste'],
        badge: 'Acesso',
        icon: LogIn,
        action: { type: 'login' },
      },
      {
        id: 'visitor-reg-patient',
        title: 'Cadastrar como Paciente',
        description: 'Crie seu cadastro para agendar consultas e acompanhar seu diário de humor.',
        keywords: ['cadastrar', 'cadastro', 'paciente', 'agendar', 'criar conta'],
        badge: 'Acesso',
        icon: UserPlus,
        action: { type: 'register', role: 'patient' },
      },
      {
        id: 'visitor-reg-prof',
        title: 'Cadastrar como Profissional',
        description: 'Cadastre seu consultório ou ministério para atender pacientes online.',
        keywords: ['cadastrar', 'profissional', 'psicólogo', 'terapeuta', 'psicanalista', 'pastor', 'crp'],
        badge: 'Acesso',
        icon: UserPlus,
        action: { type: 'register', role: 'psychologist' },
      },
    ];
  }, [user, isProf]);

  const normalizedQuery = normalizeText(query);

  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return {
        professionals: professionals.slice(0, 3),
        panel: panelItems.slice(0, 4),
        appointments: [] as Appointment[],
        articles: KNOWLEDGE_ARTICLES.slice(0, 3),
        isSuggestionMode: true,
      };
    }

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    const matchesAllTerms = (haystack: string) => {
      const normalizedHaystack = normalizeText(haystack);
      return terms.every(t => normalizedHaystack.includes(t));
    };

    const matchedProfessionals = professionals.filter(p => {
      const pType = (p.professionalType || p.role) as ProfessionalType;
      const typeLabel = PROFESSIONAL_TYPES_CONFIG[pType]?.label || '';
      const categoryLabel = PROFESSIONAL_TYPES_CONFIG[pType]?.categoryLabel || '';
      const searchable = [
        p.name,
        typeLabel,
        categoryLabel,
        p.bio || '',
        p.ministryOrChurch || '',
        p.registrationNumber || '',
        p.crp || '',
        ...(p.approaches || []),
        ...(p.clinicalTags || []),
        ...(p.professionalProfile?.specializations || []),
        ...(p.professionalProfile?.formations || []),
        ...(p.professionalProfile?.affinityTags || []),
      ].join(' ');
      return matchesAllTerms(searchable);
    });

    const matchedPanel = panelItems.filter(item => {
      const searchable = [item.title, item.description, item.badge, ...item.keywords].join(' ');
      return matchesAllTerms(searchable);
    });

    const matchedAppointments = user
      ? appointments.filter(apt => {
          const searchable = [
            apt.psychologistName,
            apt.patientName,
            formatDateBR(apt.date),
            apt.date,
            apt.time,
            apt.status === 'scheduled' ? 'agendada' : apt.status === 'completed' ? 'concluida realizada' : 'cancelada',
            apt.notesFromPatient || '',
          ].join(' ');
          return matchesAllTerms(searchable);
        })
      : [];

    const matchedArticles = KNOWLEDGE_ARTICLES.filter(art => {
      const searchable = [
        art.title,
        art.category,
        art.summary,
        ...art.tags,
        ...art.sections.map(s => `${s.heading} ${s.body}`),
      ].join(' ');
      return matchesAllTerms(searchable);
    });

    return {
      professionals: matchedProfessionals.slice(0, 5),
      panel: matchedPanel.slice(0, 5),
      appointments: matchedAppointments.slice(0, 3),
      articles: matchedArticles.slice(0, 5),
      isSuggestionMode: false,
    };
  }, [normalizedQuery, professionals, panelItems, appointments, user]);

  const flatResults: FlatSearchResult[] = useMemo(() => {
    const list: FlatSearchResult[] = [];
    searchResults.professionals.forEach(item =>
      list.push({ kind: 'professional', id: `prof-${item.id}`, item })
    );
    searchResults.panel.forEach(item =>
      list.push({ kind: 'panel', id: item.id, item })
    );
    searchResults.appointments.forEach(item =>
      list.push({ kind: 'appointment', id: `apt-${item.id}`, item })
    );
    searchResults.articles.forEach(item =>
      list.push({ kind: 'article', id: item.id, item })
    );
    return list;
  }, [searchResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery, isDesktopOpen, isMobileOpen]);

  const closeSearch = useCallback(() => {
    setIsDesktopOpen(false);
    setIsMobileOpen(false);
  }, []);

  const handleSelectFlatResult = useCallback(
    (result: FlatSearchResult) => {
      closeSearch();
      setQuery('');

      if (result.kind === 'professional') {
        onSelectProfessional(result.item);
        return;
      }
      if (result.kind === 'article') {
        onSelectArticle(result.item);
        return;
      }
      if (result.kind === 'appointment') {
        onNavigateTab(isProf ? 'agenda' : 'appointments');
        return;
      }
      if (result.kind === 'panel') {
        const act = result.item.action;
        if (act.type === 'tab') {
          onNavigateTab(act.tab);
        } else if (act.type === 'login') {
          onOpenLogin();
        } else if (act.type === 'register') {
          onOpenRegister(act.role);
        }
      }
    },
    [closeSearch, isProf, onNavigateTab, onOpenLogin, onOpenRegister, onSelectArticle, onSelectProfessional]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      desktopInputRef.current?.blur();
      return;
    }
    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatResults[activeIndex] || flatResults[0];
      if (target) {
        handleSelectFlatResult(target);
      }
    }
  };

  const totalMatches =
    searchResults.professionals.length +
    searchResults.panel.length +
    searchResults.appointments.length +
    searchResults.articles.length;

  const getIndexForId = (id: string) => flatResults.findIndex(r => r.id === id);

  const renderResultsContent = () => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {/* Header banner inside dropdown */}
      <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-semibold">
          {searchResults.isSuggestionMode
            ? 'Sugestões rápidas — Profissionais, Painel & Artigos'
            : `${totalMatches} ${totalMatches === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
        </span>
        <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500">
          ↑↓ navegar · ↵ abrir
        </span>
      </div>

      {totalMatches === 0 ? (
        <div className="px-5 py-8 text-center space-y-2">
          <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Nenhum resultado encontrado para "{query}"
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
            Tente buscar por nome de especialista, abordagem (TCC, Psicanálise, Bíblico), seções do painel ou temas como ansiedade, sigilo e prontuário.
          </p>
        </div>
      ) : (
        <div className="max-h-[65dvh] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {/* 1. Profissionais */}
          {searchResults.professionals.length > 0 && (
            <div className="p-2">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Profissionais</span>
                <span>{searchResults.professionals.length}</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {searchResults.professionals.map(prof => {
                  const idx = getIndexForId(`prof-${prof.id}`);
                  const isHighlighted = idx === activeIndex;
                  const pType = (prof.professionalType || prof.role) as ProfessionalType;
                  const typeMeta = PROFESSIONAL_TYPES_CONFIG[pType] || PROFESSIONAL_TYPES_CONFIG.psychologist;
                  const accepting = isProfessionalAcceptingPatients(prof);

                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() =>
                        handleSelectFlatResult({ kind: 'professional', id: `prof-${prof.id}`, item: prof })
                      }
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {prof.avatar ? (
                          <img
                            src={prof.avatar}
                            alt={prof.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {prof.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {prof.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                                accepting
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  accepting ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {accepting ? 'Disponível' : 'Indisponível'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {typeMeta.label}
                            {prof.approaches?.length ? ` · ${prof.approaches[0]}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {prof.hourlyRate && (
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            R$ {prof.hourlyRate}
                          </span>
                        )}
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Informações do Painel */}
          {searchResults.panel.length > 0 && (
            <div className="p-2">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Informações do Painel & Acesso</span>
                <span>{searchResults.panel.length}</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {searchResults.panel.map(item => {
                  const idx = getIndexForId(item.id);
                  const isHighlighted = idx === activeIndex;
                  const IconComp = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectFlatResult({ kind: 'panel', id: item.id, item })}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Consultas do Usuário (when searching while logged in) */}
          {searchResults.appointments.length > 0 && (
            <div className="p-2">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Suas Consultas</span>
                <span>{searchResults.appointments.length}</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {searchResults.appointments.map(apt => {
                  const idx = getIndexForId(`apt-${apt.id}`);
                  const isHighlighted = idx === activeIndex;

                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() =>
                        handleSelectFlatResult({
                          kind: 'appointment',
                          id: `apt-${apt.id}`,
                          item: apt,
                        })
                      }
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {isProf ? apt.patientName : apt.psychologistName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate tabular-nums">
                            {formatDateBR(apt.date)} às {apt.time}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                        {apt.status === 'scheduled' ? 'Agendada' : 'Concluída'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Artigos & Guias */}
          {searchResults.articles.length > 0 && (
            <div className="p-2">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Artigos & Guias Informativos</span>
                <span>{searchResults.articles.length}</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {searchResults.articles.map(art => {
                  const idx = getIndexForId(art.id);
                  const isHighlighted = idx === activeIndex;

                  return (
                    <button
                      key={art.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() =>
                        handleSelectFlatResult({ kind: 'article', id: art.id, item: art })
                      }
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {art.title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {art.category} · {art.readTime}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Global Search Input (sm and up) */}
      <div
        ref={desktopContainerRef}
        className="hidden sm:block relative flex-1 max-w-xs md:max-w-sm xl:max-w-[230px] 2xl:max-w-xs min-w-0"
      >
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            isDesktopOpen
              ? 'bg-white dark:bg-slate-900 border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={desktopInputRef}
            type="text"
            value={query}
            onFocus={() => setIsDesktopOpen(true)}
            onChange={e => {
              setQuery(e.target.value);
              if (!isDesktopOpen) setIsDesktopOpen(true);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar profissionais, artigos..."
            aria-label="Busca global na plataforma"
            data-testid="global-search-input"
            className="w-full min-w-0 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                desktopInputRef.current?.focus();
              }}
              aria-label="Limpar busca"
              className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shrink-0">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Floating Dropdown Results */}
        {isDesktopOpen && (
          <div
            data-testid="global-search-results"
            className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 xl:left-0 xl:translate-x-0 mt-2 w-[min(92vw,500px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {renderResultsContent()}
          </div>
        )}
      </div>

      {/* Mobile Search Trigger Button (< sm) */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Abrir busca global"
        data-testid="mobile-global-search-button"
        className="sm:hidden ml-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 transition-colors shrink-0"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Mobile Full-Width Global Search Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs sm:hidden flex flex-col"
          onClick={e => {
            if (e.target === e.currentTarget) closeSearch();
          }}
        >
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-sky-500/60 dark:border-sky-400/60">
                <Search className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Profissionais, artigos ou painel..."
                  aria-label="Busca global na plataforma"
                  className="w-full min-w-0 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      mobileInputRef.current?.focus();
                    }}
                    aria-label="Limpar busca"
                    className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={closeSearch}
                className="px-2.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Fechar
              </button>
            </div>

            {renderResultsContent()}
          </div>
        </div>
      )}
    </>
  );
};
