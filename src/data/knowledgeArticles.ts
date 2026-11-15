export interface KnowledgeArticleSection {
  heading: string;
  body: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'Saúde Mental' | 'Ética & Sigilo' | 'Espiritualidade & Fé' | 'Guia da Plataforma' | 'Emergência';
  readTime: string;
  summary: string;
  tags: string[];
  sections: KnowledgeArticleSection[];
  relatedTab?: string;
  relatedActionLabel?: string;
}

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'art-modalidades-cuidado',
    title: 'Como escolher entre Psicoterapia e Aconselhamento Bíblico?',
    category: 'Saúde Mental',
    readTime: '4 min de leitura',
    summary:
      'Entenda as diferenças e complementaridades entre atendimento com psicólogos (CRP), terapeutas, psicanalistas e pastores conselheiros.',
    tags: ['psicologia', 'terapia', 'psicanálise', 'aconselhamento bíblico', 'pastor', 'como escolher'],
    relatedTab: 'catalog',
    relatedActionLabel: 'Explorar Especialistas',
    sections: [
      {
        heading: 'Terapia Emocional, Comportamental e Psicológica',
        body: 'Indicada para quem busca apoio baseado em metodologias clínicas e científicas — como Terapia Cognitivo-Comportamental (TCC), Psicanálise ou Terapia Integrativa — no tratamento de ansiedade, depressão, burnout, luto, fobias e autoconhecimento.',
      },
      {
        heading: 'Aconselhamento Bíblico & Pastoral',
        body: 'Voltado a pessoas, casais e famílias que desejam acolhimento espiritual, sabedoria fundamentada nas Sagradas Escrituras, restauração conjugal à luz da fé cristã e fortalecimento em crises existenciais com pastores ordenados.',
      },
      {
        heading: 'Cuidado complementar',
        body: 'Sempre que houver sofrimento psíquico intenso ou necessidade clínica, o acompanhamento psicológico profissional é recomendado e pode caminhar em harmonia com o suporte espiritual.',
      },
    ],
  },
  {
    id: 'art-etica-cfp-lgpd',
    title: 'Telepsicologia, Ética e Sigilo: Resolução CFP nº 011/2018 e LGPD',
    category: 'Ética & Sigilo',
    readTime: '5 min de leitura',
    summary:
      'Saiba como a plataforma protege a confidencialidade das sessões por vídeo e cumpre as diretrizes éticas e de proteção de dados.',
    tags: ['ética', 'cfp', '011/2018', 'sigilo', 'lgpd', 'privacidade', 'teleatendimento', 'criptografia'],
    relatedTab: 'contact',
    relatedActionLabel: 'Dúvidas sobre Ética? Fale Conosco',
    sections: [
      {
        heading: 'Conformidade com a Resolução CFP nº 011/2018',
        body: 'A prestação de serviços psicológicos por meios tecnológicos da informação e comunicação exige que o profissional mantenha registro ativo no Conselho Regional de Psicologia (CRP) e garanta ambiente reservado e livre de interferências.',
      },
      {
        heading: 'Sigilo e Proteção de Dados (LGPD)',
        body: 'Dados sensíveis de saúde, anotações clínicas e histórico de atendimentos são tratados sob sigilo estrito, com acesso restrito ao profissional responsável e proteção criptográfica dos registros.',
      },
      {
        heading: 'Boas práticas para o paciente na teleconsulta',
        body: 'Utilize fones de ouvido, escolha um local silencioso e privado e evite redes Wi-Fi públicas durante o atendimento online.',
      },
    ],
  },
  {
    id: 'art-prontuario-pep',
    title: 'Prontuário Eletrônico do Paciente (PEP) e Guarda Segura (CFP nº 001/2009)',
    category: 'Ética & Sigilo',
    readTime: '4 min de leitura',
    summary:
      'Como funcionam os registros de evolução clínica, anamnese inicial, criptografia e o acesso exclusivo do profissional.',
    tags: ['prontuário', 'pep', 'cfp 001/2009', 'evolução', 'anamnese', 'sigilo profissional'],
    relatedTab: 'records',
    relatedActionLabel: 'Acessar Prontuários / Orientações',
    sections: [
      {
        heading: 'O que compõe o Prontuário Psicológico',
        body: 'De acordo com a Resolução CFP nº 001/2009, o prontuário reúne identificação, demanda inicial, registros objetivos de evolução de cada sessão, hipóteses diagnósticas ou encaminhamentos.',
      },
      {
        heading: 'Acesso restrito e criptografia',
        body: 'No PsiConnect, os registros clínicos são vinculados exclusivamente ao profissional responsável pelo acompanhamento, com camada de proteção e auditoria de integridade.',
      },
      {
        heading: 'Fichas Pastorais Reservadas',
        body: 'Para pastores e conselheiros bíblicos, a plataforma oferece fichas de acompanhamento pastoral específicas, preservando igualmente a confidencialidade do acolhimento.',
      },
    ],
  },
  {
    id: 'art-ansiedade-burnout',
    title: 'Ansiedade, Burnout e Insônia: Sinais de Alerta e Quando Buscar Ajuda',
    category: 'Saúde Mental',
    readTime: '4 min de leitura',
    summary:
      'Reconheça sintomas físicos e emocionais do esgotamento e conheça técnicas terapêuticas utilizadas no tratamento.',
    tags: ['ansiedade', 'pânico', 'burnout', 'estresse', 'insônia', 'esgotamento', 'tcc'],
    relatedTab: 'catalog',
    relatedActionLabel: 'Buscar Especialista em Ansiedade',
    sections: [
      {
        heading: 'Principais sinais de sobrecarga',
        body: 'Dificuldade persistente para dormir, preocupação excessiva, taquicardia sem causa clínica, irritabilidade, cansaço extremo ao acordar e sensação de incapacidade frente às demandas do trabalho ou família.',
      },
      {
        heading: 'Como a terapia ajuda',
        body: 'Abordagens como a Terapia Cognitivo-Comportamental (TCC), regulação emocional e Mindfulness auxiliam na reestruturação de pensamentos catastróficos, no estabelecimento de limites saudáveis e na recuperação do sono.',
      },
    ],
  },
  {
    id: 'art-diario-humor',
    title: 'Diário de Humor e Questionários Clínicos: Potencializando Sua Evolução',
    category: 'Guia da Plataforma',
    readTime: '3 min de leitura',
    summary:
      'Descubra como registrar humor, energia e sono diariamente gera gráficos de tendência úteis para você e seu especialista.',
    tags: ['diário de humor', 'questionários', 'escalas', 'gad-7', 'phq-9', 'sono', 'energia'],
    relatedTab: 'mood_tracker',
    relatedActionLabel: 'Abrir Diário de Humor',
    sections: [
      {
        heading: 'Monitoramento diário em menos de 1 minuto',
        body: 'Registrar seu estado emocional, nível de energia, qualidade do sono e gatilhos do dia ajuda a identificar padrões que muitas vezes passam despercebidos entre uma sessão e outra.',
      },
      {
        heading: 'Escalas e formulários clínicos',
        body: 'Quando seu profissional envia questionários padronizados ou personalizados, suas respostas contribuem para acompanhar objetivamente sua evolução ao longo das semanas.',
      },
    ],
  },
  {
    id: 'art-atendimento-social',
    title: 'Atendimento Social: Como Funcionam as Vagas Acessíveis no PsiConnect',
    category: 'Guia da Plataforma',
    readTime: '3 min de leitura',
    summary:
      'Entenda como encontrar horários com valores sociais reduzidos disponibilizados por profissionais comprometidos com o acolhimento acessível.',
    tags: ['atendimento social', 'vagas sociais', 'valor acessível', 'vulnerabilidade', 'agendamento'],
    relatedTab: 'catalog',
    relatedActionLabel: 'Filtrar Vagas Sociais',
    sections: [
      {
        heading: 'Compromisso com o acesso ao cuidado',
        body: 'Profissionais parceiros podem marcar horários específicos em sua grade semanal como Atendimento Social, oferecendo valores reduzidos para pessoas em momento de vulnerabilidade financeira.',
      },
      {
        heading: 'Como localizar vagas sociais',
        body: 'Na tela "Encontrar Especialista", ative o filtro "Filtrar vagas de Atendimento Social" para visualizar imediatamente os profissionais com horários sociais disponíveis.',
      },
    ],
  },
  {
    id: 'art-apoio-crise-cvv',
    title: 'Apoio em Crise Emocional: CVV (188) e Canais de Emergência 24h',
    category: 'Emergência',
    readTime: '2 min de leitura',
    summary:
      'Informações essenciais para momentos de crise aguda ou sofrimento intenso. Teleconsultas não substituem atendimento de urgência.',
    tags: ['emergência', 'crise', 'cvv', '188', 'samu', '192', 'apoio à vida', 'urgência'],
    relatedTab: 'patient_records',
    relatedActionLabel: 'Ver Orientações de Cuidado',
    sections: [
      {
        heading: 'CVV — Centro de Valorização da Vida (Ligue 188)',
        body: 'Atendimento voluntário, gratuito, sigiloso e disponível 24 horas por dia em todo o Brasil pelo telefone 188 ou via chat no site oficial do CVV.',
      },
      {
        heading: 'Emergência Médica Imediata (SAMU 192 / CAPS / Pronto-Socorro)',
        body: 'Em situações de risco iminente à vida ou crise psiquiátrica aguda, procure imediatamente o pronto-socorro mais próximo, um CAPS (Centro de Atenção Psicossocial) ou ligue 192.',
      },
    ],
  },
];
