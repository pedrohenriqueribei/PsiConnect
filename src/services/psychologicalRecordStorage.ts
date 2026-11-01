import {
  PsychologicalRecord,
  EvolutionSession,
  SessionVersionHistory,
  AuditLogEntry,
  RecordStatus,
  GeneralAttachment,
} from '../types/psychologicalRecord';
import { recordSecurity } from './recordSecurity';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'psiconnect_psychological_records_v1';

// Seed initial realistic psychological records adhering to CFP & LGPD standards
const INITIAL_PSYCHOLOGICAL_RECORDS: PsychologicalRecord[] = [
  {
    id: 'pront_pat_lucas_psy_clara',
    patientId: 'pat_lucas',
    professionalId: 'psy_clara',
    createdAt: '2025-02-05T10:00:00Z',
    updatedAt: '2025-03-01T15:00:00Z',
    status: 'active',
    isMinor: false,
    identification: {
      fullName: 'Lucas Gabriel Ribeiro',
      socialName: '',
      birthDate: '2002-08-14',
      gender: 'Masculino',
      cpf: '412.985.738-20',
      phone: '(11) 98712-4590',
      email: 'lucas.paciente@gmail.com',
      street: 'Rua Augusta',
      number: '1420',
      complement: 'Apto 82',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01304-001',
      profession: 'Analista de Sistemas Júnior',
      education: 'Superior Completo (Ciência da Computação)',
      maritalStatus: 'Solteiro(a)',
    },
    emergencyContact: {
      name: 'Helena Ribeiro',
      relationship: 'Mãe',
      phonePrimary: '(11) 99876-1234',
      phoneSecondary: '(11) 3214-5678',
    },
    professional: {
      id: 'psy_clara',
      name: 'Dra. Clara Vasconcellos',
      type: 'psychologist',
      registration: 'CRP 06/138420',
      email: 'clara.psico@psiconnect.med.br',
    },
    initialDemand: {
      chiefComplaint:
        'Episódios recorrentes de aperto no peito, taquicardia, sudorese fria e pensamentos catastróficos de fracasso vinculados a reuniões corporativas e cobranças de metas.',
      reasonForCare:
        'Busca psicoterapia para aprender a gerenciar crises de ansiedade aguda e insônia inicial que começaram após assumir novos projetos na empresa.',
      treatmentStartDate: '2025-02-05',
      referral: 'Encaminhamento espontâneo via plataforma PsiConnect.',
    },
    history: {
      familyHistory:
        'Pais casados há 28 anos, bom relacionamento familiar. Mãe com histórico de transtorno de ansiedade tratada com psicoterapia. Pai sem antecedentes psiquiátricos relatados.',
      socialHistory:
        'Rede de apoio preservada com amigos de graduação e namorada há 1 ano. Pratica corrida aos finais de semana, porém relata isolamento recente após jornadas excessivas de trabalho.',
      previousMentalHealth:
        'Nenhum acompanhamento psicológico anterior. Relata episódios de nervosismo em época de vestibular aos 17 anos, sem tratamento formal.',
      medications: 'Não faz uso de medicação contínua. Fez uso pontual de fitoterápico (passiflora) sem orientação médica.',
      psychiatricFollowUp: false,
      hospitalizationHistory: 'Nenhum histórico de internação clínica ou psiquiátrica.',
    },
    initialAssessment: {
      diagnosticHypothesis:
        'F41.0 - Transtorno de Pânico com Transtorno de Ansiedade Generalizada (F41.1). Esquema desadaptativo de perfeccionismo e vulnerabilidade ao dano.',
      theoreticalApproach: 'Terapia Cognitivo-Comportamental (TCC) baseada em evidências.',
    },
    therapeuticPlan: {
      goals: [
        'Psicoeducação sobre o ciclo fisiológico e cognitivo da ansiedade e do pânico.',
        'Desenvolver habilidades de regulação fisiológica (respiração diafragmática 4-7-8 e relaxamento muscular progressivo).',
        'Identificar e reestruturar pensamentos automáticos disfuncionais (PADs) através do RPD.',
        'Exposição gradual interoceptiva e treino de assertividade nas comunicações no trabalho.',
      ],
      sessionFrequency: 'weekly',
      strategiesAndTechniques: [
        'Registro de Pensamentos Disfuncionais (RPD)',
        'Técnica do Questionamento Socrático',
        'Exposição Interoceptiva Controlada',
        'Treino de Comunicação Assertiva',
      ],
      reassessmentMilestone: 'Reavaliação clínica a cada 8 sessões.',
    },
    consents: {
      tcleAccepted: true,
      tcleAcceptedAt: '2025-02-05T09:45:00Z',
      lgpdAuthorized: true,
      lgpdAuthorizedAt: '2025-02-05T09:45:00Z',
      signatureType: 'digital',
      signedBy: 'Lucas Gabriel Ribeiro (IP: 189.122.45.10)',
    },
    sessions: [
      {
        id: 'sess_lucas_1',
        sessionNumber: 1,
        date: '2025-02-05',
        startTime: '14:00',
        endTime: '14:50',
        modality: 'online',
        emotionalState: 'Muito ansioso, fala acelerada, inquietação motora e tensão muscular.',
        summaryContent:
          'Primeira sessão clínica e anamnese. Paciente descreveu as crises de ansiedade recentes ocorridas no trabalho, com medo iminente de perder o controle ou desmaiar durante reuniões com a diretoria.',
        interventions:
          'Acolhimento clínico, escuta ativa e validação empática. Psicoeducação inicial sobre o mecanismo de luta e fuga do sistema nervoso simpático. Estabelecimento do contrato terapêutico e sigilo profissional.',
        evolutionTrend: 'piora',
        evolutionScore: 2,
        evolutionNotes:
          'Quadro de ansiedade aguda com sofrimento psíquico significativo. Paciente colaborativo e muito reflexivo.',
        risks: {
          suicideRisk: 'passive',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: true,
          riskObservations:
            'Ideação passiva pontual relatada ("às vezes dá vontade de sumir de tanta pressão"), porém sem plano, intenção ou desesperança severa. Rede de apoio acionada e contrato de segurança firmado.',
          safetyPlanActive: true,
        },
        nextSessionTasks:
          'Observar momentos de pico de ansiedade anotando gatilhos e sensações corporais sentidas sem julgamento.',
        nextSessionDate: '2025-02-12 às 14:00',
        createdAt: '2025-02-05T14:55:00Z',
        updatedAt: '2025-02-05T14:55:00Z',
        versions: [],
      },
      {
        id: 'sess_lucas_2',
        sessionNumber: 2,
        date: '2025-02-12',
        startTime: '14:00',
        endTime: '14:50',
        modality: 'online',
        emotionalState: 'Ansioso, porém mais calmo e focado que na sessão inaugural.',
        summaryContent:
          'Paciente relatou que teve uma crise durante a semana, mas conseguiu se lembrar da explicação sobre a adrenalina e não precisou ir ao pronto-socorro.',
        interventions:
          'Ensino e treino prático da respiração diafragmática com contagem 4-7-8 em tela. Introdução da tríade cognitiva (situação -> pensamento -> emoção/fisiologia -> comportamento).',
        evolutionTrend: 'estavel',
        evolutionScore: 3,
        evolutionNotes:
          'Estabilização dos sintomas mais agudos. Houve adesão excelente à psicoeducação ministrada.',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
          riskObservations: 'Ideação passiva completamente cessada. Boa perspectiva de futuro e engajamento terapêutico.',
        },
        nextSessionTasks:
          'Praticar respiração diafragmática 5 minutos pela manhã e antes de deitar diariamente.',
        nextSessionDate: '2025-02-19 às 14:00',
        createdAt: '2025-02-12T14:52:00Z',
        updatedAt: '2025-02-12T14:52:00Z',
        versions: [],
      },
      {
        id: 'sess_lucas_3',
        sessionNumber: 3,
        date: '2025-02-19',
        startTime: '14:00',
        endTime: '14:50',
        modality: 'online',
        emotionalState: 'Eutímico, receptivo, demonstrando orgulho das tarefas cumpridas.',
        summaryContent:
          'Discussão de um episódio em que o chefe pediu uma tarefa de última hora. O paciente percebeu o pensamento automático "Se eu errar serei demitido e ninguém vai me querer" e aplicou o questionamento de evidências.',
        interventions:
          'Treinamento formal do preenchimento das 5 colunas do RPD (Registro de Pensamentos Disfuncionais). Descatastrofização através da técnica do "Pior Cenário Realista".',
        evolutionTrend: 'melhora',
        evolutionScore: 4,
        evolutionNotes:
          'Melhora progressiva nítida na capacidade de auto-observação e interrupção da espiral de pensamentos catastróficos.',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
        },
        nextSessionTasks:
          'Preencher ao menos 2 registros no RPD sempre que identificar ansiedade acima do nível 5.',
        nextSessionDate: '2025-02-26 às 14:00',
        createdAt: '2025-02-19T14:55:00Z',
        updatedAt: '2025-02-20T09:15:00Z',
        versions: [
          {
            versionNumber: 1,
            editedAt: '2025-02-20T09:15:00Z',
            editedBy: 'Dra. Clara Vasconcellos (CRP 06/138420)',
            authorId: 'psy_clara',
            changesSummary: 'Acréscimo do detalhamento da técnica de Descatastrofização aplicada na sessão.',
            previousContent: {
              summaryContent: 'Discussão de um episódio em que o chefe pediu uma tarefa de última hora.',
              interventions: 'Treinamento formal do preenchimento das 5 colunas do RPD.',
              evolutionScore: 4,
              evolutionTrend: 'melhora',
              evolutionNotes: 'Melhora progressiva na auto-observação.',
              emotionalState: 'Eutímico, receptivo.',
              nextSessionTasks: 'Preencher RPD.',
            },
          },
        ],
      },
      {
        id: 'sess_lucas_4',
        sessionNumber: 4,
        date: '2025-02-26',
        startTime: '14:00',
        endTime: '14:50',
        modality: 'online',
        emotionalState: 'Tranquilo, confiante, postura corporal relaxada.',
        summaryContent:
          'Revisão do RPD trazido pelo paciente. Relatou que conseguiu fazer uma apresentação técnica para a equipe de 12 pessoas sem taquicardia paralisante, sentindo apenas nervosismo adaptativo inicial.',
        interventions:
          'Reforço positivo das conquistas. Treino de assertividade (falar de forma clara e pausada sem se justificar excessivamente). Consolidação das metas alcançadas no primeiro mês.',
        evolutionTrend: 'melhora',
        evolutionScore: 4,
        evolutionNotes:
          'Evolução muito favorável. Paciente já reconhece ansiedade como sinal fisiológico manejável e não como ameaça fatal.',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
        },
        nextSessionTasks:
          'Manter monitoramento de pensamentos automáticos e reservar pausas de 10 min entre reuniões.',
        nextSessionDate: '2025-03-05 às 14:00',
        createdAt: '2025-02-26T14:53:00Z',
        updatedAt: '2025-02-26T14:53:00Z',
        versions: [],
      },
    ],
    attachments: [
      {
        id: 'att_lucas_tcle',
        name: 'Termo_TCLE_Assinado_Lucas_Ribeiro.pdf',
        category: 'tcle',
        fileType: 'application/pdf',
        size: '184 KB',
        uploadedAt: '2025-02-05T09:46:00Z',
        notes: 'Termo de consentimento e esclarecimento sobre telepsicologia assinado digitalmente.',
      },
      {
        id: 'att_lucas_gad7',
        name: 'Escala_GAD7_Ansiedade_Geral_Inicial.pdf',
        category: 'scale_inventory',
        fileType: 'application/pdf',
        size: '120 KB',
        uploadedAt: '2025-02-05T10:10:00Z',
        notes: 'Score inicial: 14 pontos (Ansiedade Moderadamente Grave na triagem inicial).',
      },
    ],
    auditLogs: [
      {
        id: 'log_init_lucas',
        timestamp: '2025-02-05T10:00:00Z',
        action: 'criacao_prontuario',
        actorId: 'psy_clara',
        actorName: 'Dra. Clara Vasconcellos',
        actorRole: 'psychologist',
        ipOrDevice: 'Ambiente Web Seguro (PsiConnect-Node-BR)',
        details: 'Abertura do prontuário eletrônico no primeiro atendimento.',
        legalBasis: 'Resolução CFP nº 01/2009 & LGPD Art. 11 (Dados Sensíveis de Saúde)',
      },
      {
        id: 'log_sess_4_lucas',
        timestamp: '2025-02-26T14:53:00Z',
        action: 'registro_sessao',
        actorId: 'psy_clara',
        actorName: 'Dra. Clara Vasconcellos',
        actorRole: 'psychologist',
        ipOrDevice: 'Ambiente Web Seguro (PsiConnect-Node-BR)',
        details: 'Registro da Sessão nº 4 de evolução clínica.',
        legalBasis: 'Resolução CFP nº 01/2009 & LGPD Art. 11 (Dados Sensíveis de Saúde)',
      },
    ],
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM',
    retentionUntil: '2030-02-26', // 5 anos após a última sessão
  },

  {
    id: 'pront_pat_luciana_psy_clara',
    patientId: 'pat_luciana',
    professionalId: 'psy_clara',
    createdAt: '2025-02-10T14:00:00Z',
    updatedAt: '2025-02-24T16:00:00Z',
    status: 'active',
    isMinor: false,
    identification: {
      fullName: 'Luciana Ramos Silva',
      birthDate: '1981-11-04',
      gender: 'Feminino',
      cpf: '298.411.902-88',
      phone: '(11) 98341-2299',
      email: 'luciana.ramos@gmail.com',
      street: 'Alameda Santos',
      number: '800',
      complement: 'Conjunto 12',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01418-002',
      profession: 'Gerente Comercial',
      education: 'Pós-graduação Completa',
      maritalStatus: 'Casado(a)',
    },
    emergencyContact: {
      name: 'Carlos Silva',
      relationship: 'Cônjuge',
      phonePrimary: '(11) 98122-3344',
    },
    professional: {
      id: 'psy_clara',
      name: 'Dra. Clara Vasconcellos',
      type: 'psychologist',
      registration: 'CRP 06/138420',
      email: 'clara.psico@psiconnect.med.br',
    },
    initialDemand: {
      chiefComplaint:
        'Sobrecarga psíquica crônica decorrente da dupla jornada (trabalho corporativo e cuidados familiares). Sensação de esgotamento e crise existencial na meia-idade.',
      reasonForCare:
        'Relata perda de motivação profissional, distanciamento afetivo no casamento e sensação de que "a vida passou e esqueci de mim mesma".',
      treatmentStartDate: '2025-02-10',
    },
    history: {
      familyHistory:
        'Casada há 16 anos, mãe de dois filhos adolescentes (10 e 14 anos). Relações familiares próximas, com cuidadores idosos dependentes.',
      socialHistory: 'Vida social reduzida devido à falta de tempo e foco excessivo em demandas alheias.',
      previousMentalHealth: 'Fez psicoterapia há 8 anos no puerpério com melhora dos sintomas.',
      medications: 'Nenhuma medicação psiquiátrica em uso.',
      psychiatricFollowUp: false,
      hospitalizationHistory: 'Sem histórico de internação.',
    },
    initialAssessment: {
      diagnosticHypothesis:
        'Z73.0 - Estado de Exaustão Vital / Síndrome de Burnout com sintomas de humor distímico reativo à sobrecarga.',
      theoreticalApproach: 'TCC e Mindfulness integrados.',
    },
    therapeuticPlan: {
      goals: [
        'Mapear fontes de estresse e delimitar limites saudáveis no trabalho e na família.',
        'Desenvolver autocompaixão e tempo dedicado ao autocuidado.',
        'Trabalhar comunicação assertiva com o cônjuge sobre divisão de responsabilidades.',
      ],
      sessionFrequency: 'weekly',
      strategiesAndTechniques: [
        'Matriz de Delegação de Tarefas',
        'Treino de Assertividade e Estabelecimento de Limites',
        'Práticas Breves de Mindfulness e Presença',
      ],
      reassessmentMilestone: 'Reavaliação em 3 meses.',
    },
    consents: {
      tcleAccepted: true,
      tcleAcceptedAt: '2025-02-10T13:50:00Z',
      lgpdAuthorized: true,
      lgpdAuthorizedAt: '2025-02-10T13:50:00Z',
      signatureType: 'digital',
      signedBy: 'Luciana Ramos Silva',
    },
    sessions: [
      {
        id: 'sess_luciana_1',
        sessionNumber: 1,
        date: '2025-02-10',
        startTime: '16:00',
        endTime: '16:50',
        modality: 'online',
        emotionalState: 'Cansada, choro fácil ao falar da sobrecarga e da ausência de apoio.',
        summaryContent:
          'Acolhimento da demanda. Paciente relatou que acorda já cansada e que assume todas as demandas domésticas e profissionais sem conseguir pedir ajuda.',
        interventions:
          'Validação emocional sem julgamentos. Mapeamento da rotina semanal e identificação do esquema de auto-sacrifício.',
        evolutionTrend: 'estavel',
        evolutionScore: 3,
        evolutionNotes: 'Sessão com forte catarse e alívio por poder desabafar.',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
        },
        nextSessionTasks: 'Fazer diário simples de energia (atividades que drenam vs atividades que nutrem).',
        nextSessionDate: '2025-02-17 às 16:00',
        createdAt: '2025-02-10T16:55:00Z',
        updatedAt: '2025-02-10T16:55:00Z',
        versions: [],
      },
      {
        id: 'sess_luciana_2',
        sessionNumber: 2,
        date: '2025-02-17',
        startTime: '16:00',
        endTime: '16:50',
        modality: 'online',
        emotionalState: 'Mais disposta, humor reativo preservado.',
        summaryContent:
          'Análise do diário de energia. Paciente observou que 85% do tempo é gasto em tarefas de outros, sem nenhuma hora de lazer próprio na semana.',
        interventions:
          'Treinamento sobre dizer "não" de maneira diplomática no ambiente corporativo e delegação de tarefas aos filhos adolescentes.',
        evolutionTrend: 'estavel',
        evolutionScore: 3,
        evolutionNotes: 'Início de flexibilização das crenças de que "se eu não fizer, ninguém faz".',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
        },
        nextSessionTasks: 'Delegar 2 tarefas da casa aos filhos e reservar 1 hora exclusiva no sábado.',
        nextSessionDate: '2025-02-24 às 16:00',
        createdAt: '2025-02-17T16:55:00Z',
        updatedAt: '2025-02-17T16:55:00Z',
        versions: [],
      },
      {
        id: 'sess_luciana_3',
        sessionNumber: 3,
        date: '2025-02-24',
        startTime: '16:00',
        endTime: '16:50',
        modality: 'online',
        emotionalState: 'Animada e satisfeita com os pequenos avanços.',
        summaryContent:
          'Paciente conseguiu reservar a manhã de sábado para caminhar no parque e conversar com o marido abertamente sobre a sobrecarga.',
        interventions:
          'Reforço da autoeficácia. Continuação do treino de comunicação não-violenta no casamento.',
        evolutionTrend: 'melhora',
        evolutionScore: 4,
        evolutionNotes: 'Melhora progressiva perceptível em humor e nível de disposição.',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
        },
        nextSessionTasks: 'Manter pausas diárias de 15 minutos e praticar a respiração mindful.',
        nextSessionDate: '2025-03-03 às 16:00',
        createdAt: '2025-02-24T16:55:00Z',
        updatedAt: '2025-02-24T16:55:00Z',
        versions: [],
      },
    ],
    attachments: [],
    auditLogs: [
      {
        id: 'log_init_luciana',
        timestamp: '2025-02-10T14:00:00Z',
        action: 'criacao_prontuario',
        actorId: 'psy_clara',
        actorName: 'Dra. Clara Vasconcellos',
        actorRole: 'psychologist',
        ipOrDevice: 'Ambiente Web Seguro (PsiConnect-Node-BR)',
        details: 'Criação do prontuário psicológico no primeiro atendimento.',
        legalBasis: 'Resolução CFP nº 01/2009 & LGPD Art. 11 (Dados Sensíveis de Saúde)',
      },
    ],
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM',
    retentionUntil: '2030-02-24',
  },

  {
    id: 'pront_pat_enzo_psy_clara',
    patientId: 'pat_enzo',
    professionalId: 'psy_clara',
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-02-15T12:00:00Z',
    status: 'active',
    isMinor: true, // Menor de 18 anos!
    identification: {
      fullName: 'Enzo Gabriel Fagundes',
      birthDate: '2009-04-18', // 16 anos
      gender: 'Masculino',
      cpf: '512.339.882-19',
      phone: '(11) 97722-1188',
      email: 'enzo.fagundes.estudos@gmail.com',
      street: 'Rua Domingos de Morais',
      number: '920',
      complement: 'Casa 2',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04010-100',
      profession: 'Estudante (Ensino Médio)',
      education: 'Ensino Médio Incompleto',
      maritalStatus: 'Solteiro(a)',
    },
    legalGuardian: {
      name: 'Fernanda Fagundes',
      relationship: 'Mãe',
      cpf: '312.894.521-00',
      contact: '(11) 98111-2233 / fernanda.fagundes@uol.com.br',
    },
    emergencyContact: {
      name: 'Fernanda Fagundes',
      relationship: 'Mãe',
      phonePrimary: '(11) 98111-2233',
    },
    professional: {
      id: 'psy_clara',
      name: 'Dra. Clara Vasconcellos',
      type: 'psychologist',
      registration: 'CRP 06/138420',
    },
    initialDemand: {
      chiefComplaint:
        'Dificuldades de socialização no colégio, isolamento em redes sociais e queixas escolares de desatenção.',
      reasonForCare:
        'Mãe procurou atendimento devido a queda acentuada no rendimento escolar e desmotivação geral do filho.',
      treatmentStartDate: '2025-01-20',
      referral: 'Encaminhamento da coordenação pedagógica da escola.',
    },
    history: {
      familyHistory: 'Mãe solo, pai ausente desde os 8 anos. Boa convivência com a mãe e avó materna.',
      socialHistory: 'Passa grande parte do dia em jogos online com amigos virtuais, poucos amigos presenciais.',
      previousMentalHealth: 'Acompanhamento fonoaudiológico na infância aos 6 anos.',
      medications: 'Nenhuma medicação.',
      psychiatricFollowUp: false,
      hospitalizationHistory: 'Nenhuma.',
    },
    initialAssessment: {
      diagnosticHypothesis:
        'F93.0 - Ansiedade Social na Adolescência com timidez excessiva. Descartado TDAH preliminarmente.',
      theoreticalApproach: 'TCC para Crianças e Adolescentes.',
    },
    therapeuticPlan: {
      goals: [
        'Fortalecer autoestima e repertório de habilidades sociais.',
        'Gradual exposição a interações sociais fora do ambiente digital.',
        'Orientação parental mensal com a mãe.',
      ],
      sessionFrequency: 'weekly',
      strategiesAndTechniques: [
        'Treino de Habilidades Sociais (THS)',
        'Role-playing em sessão',
        'Contrato de tempo de tela saudável',
      ],
      reassessmentMilestone: 'Reavaliação bimestral com a escola e mãe.',
    },
    consents: {
      tcleAccepted: true,
      tcleAcceptedAt: '2025-01-20T10:30:00Z',
      lgpdAuthorized: true,
      lgpdAuthorizedAt: '2025-01-20T10:30:00Z',
      signatureType: 'digital',
      signedBy: 'Fernanda Fagundes (Mãe e Responsável Legal) - CPF 312.894.521-00',
    },
    sessions: [
      {
        id: 'sess_enzo_1',
        sessionNumber: 1,
        date: '2025-01-20',
        startTime: '10:00',
        endTime: '10:50',
        modality: 'online',
        emotionalState: 'Tímido, monossilábico no início, olhar cabisbaixo.',
        summaryContent:
          'Primeira sessão com o adolescente após a entrevista inicial com a mãe. Explicação sobre o sigilo em relação aos pais e construção de vínculo.',
        interventions:
          'Pacto de confidencialidade (com explicação das exceções de risco). Identificação dos jogos e interesses que ele gosta.',
        evolutionTrend: 'estavel',
        evolutionScore: 3,
        evolutionNotes: 'Vínculo terapêutico em construção. Paciente se sentiu seguro e menos pressionado.',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
        },
        nextSessionTasks: 'Trazer para a próxima conversa um jogo ou assunto que gostaria de ensinar à terapeuta.',
        nextSessionDate: '2025-01-27 às 10:00',
        createdAt: '2025-01-20T11:00:00Z',
        updatedAt: '2025-01-20T11:00:00Z',
        versions: [],
      },
    ],
    attachments: [],
    auditLogs: [
      {
        id: 'log_init_enzo',
        timestamp: '2025-01-20T11:00:00Z',
        action: 'criacao_prontuario',
        actorId: 'psy_clara',
        actorName: 'Dra. Clara Vasconcellos',
        actorRole: 'psychologist',
        ipOrDevice: 'Ambiente Web Seguro (PsiConnect-Node-BR)',
        details: 'Criação de prontuário com validação de Responsável Legal para menor de 18 anos.',
        legalBasis: 'Resolução CFP nº 01/2009 & LGPD Art. 11 (Dados Sensíveis de Saúde)',
      },
    ],
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM',
    retentionUntil: '2030-01-20',
  },

  {
    id: 'pront_pat_eduardo_psy_clara',
    patientId: 'pat_eduardo',
    professionalId: 'psy_clara',
    createdAt: '2024-04-10T10:00:00Z',
    updatedAt: '2024-11-28T16:00:00Z',
    status: 'discharged', // Alta clínica
    closureDate: '2024-11-28',
    closureReason: 'Alta clínica por alcance pleno dos objetivos terapêuticos e remissão completa dos sintomas depressivos.',
    isMinor: false,
    identification: {
      fullName: 'Eduardo Vianna',
      birthDate: '1985-06-22',
      gender: 'Masculino',
      cpf: '331.442.890-11',
      phone: '(11) 99123-4567',
      email: 'eduardo.vianna@outlook.com',
      street: 'Rua Bela Cintra',
      number: '450',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01415-000',
      profession: 'Arquiteto',
      education: 'Superior Completo',
      maritalStatus: 'Casado(a)',
    },
    emergencyContact: {
      name: 'Mariana Vianna',
      relationship: 'Esposa',
      phonePrimary: '(11) 98456-7890',
    },
    professional: {
      id: 'psy_clara',
      name: 'Dra. Clara Vasconcellos',
      type: 'psychologist',
      registration: 'CRP 06/138420',
    },
    initialDemand: {
      chiefComplaint: 'Luto prolongado após perda de ente querido e sintomas depressivos moderados.',
      reasonForCare: 'Elaboração de luto e reestruturação de rotina pessoal.',
      treatmentStartDate: '2024-04-10',
    },
    history: {
      familyHistory: 'Sem histórico psiquiátrico na família.',
      socialHistory: 'Boa rede de suporte e casamento estável.',
      previousMentalHealth: 'Nenhum histórico anterior.',
      medications: 'Não faz uso.',
      psychiatricFollowUp: false,
      hospitalizationHistory: 'Sem internações.',
    },
    initialAssessment: {
      diagnosticHypothesis: 'F43.21 - Transtorno de Adaptação com Reação Depressiva Prolongada.',
      theoreticalApproach: 'TCC e Terapia do Luto.',
    },
    therapeuticPlan: {
      goals: ['Processar tarefas do luto.', 'Retomar atividades prazerosas e vida profissional com significado.'],
      sessionFrequency: 'weekly',
      strategiesAndTechniques: ['Elaboração de luto', 'Ativação Comportamental'],
    },
    consents: {
      tcleAccepted: true,
      lgpdAuthorized: true,
      signatureType: 'digital',
      signedBy: 'Eduardo Vianna',
    },
    sessions: [
      {
        id: 'sess_eduardo_last',
        sessionNumber: 16,
        date: '2024-11-28',
        startTime: '15:00',
        endTime: '15:50',
        modality: 'online',
        emotionalState: 'Eutímico, sereno, grato pelo processo vivenciado.',
        summaryContent:
          'Sessão final de fechamento e alta clínica. Revisão de todos os marcos alcançados desde abril. Paciente conseguiu reintegrar a rotina, homenagear a memória do ente querido e planejar novos projetos com a família.',
        interventions:
          'Consolidação do plano de prevenção de recaídas. Devolutiva positiva e fechamento do ciclo terapêutico formal.',
        evolutionTrend: 'melhora',
        evolutionScore: 5,
        evolutionNotes: 'Alta clínica concedida com sucesso. Paciente orientado sobre a possibilidade de sessões de manutenção se desejar.',
        risks: {
          suicideRisk: 'none',
          selfHarmRisk: 'none',
          violenceRisk: 'none',
          hasActiveRisk: false,
        },
        createdAt: '2024-11-28T16:00:00Z',
        updatedAt: '2024-11-28T16:00:00Z',
        versions: [],
      },
    ],
    attachments: [],
    auditLogs: [
      {
        id: 'log_alta_eduardo',
        timestamp: '2024-11-28T16:00:00Z',
        action: 'alteracao_status',
        actorId: 'psy_clara',
        actorName: 'Dra. Clara Vasconcellos',
        actorRole: 'psychologist',
        ipOrDevice: 'Ambiente Web Seguro (PsiConnect-Node-BR)',
        details: 'Encerramento de tratamento e concessão de alta clínica.',
        legalBasis: 'Resolução CFP nº 01/2009 & LGPD Art. 11 (Dados Sensíveis de Saúde)',
      },
    ],
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM',
    retentionUntil: '2029-11-28', // 5 anos até nov/2029
  },
];

class PsychologicalRecordStorageService {
  private getRecords(): PsychologicalRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PSYCHOLOGICAL_RECORDS));
        return INITIAL_PSYCHOLOGICAL_RECORDS;
      }
      return JSON.parse(stored) as PsychologicalRecord[];
    } catch {
      return INITIAL_PSYCHOLOGICAL_RECORDS;
    }
  }

  private saveRecords(records: PsychologicalRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Erro ao gravar no storage de prontuários:', e);
    }
  }

  // --- Sync to Firestore if authenticated ---
  private async syncRecordToFirestore(record: PsychologicalRecord): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const path = `medicalRecords/${record.id}`;
      await setDoc(doc(db, 'medicalRecords', record.id), {
        id: record.id,
        appointmentId: record.sessions[0]?.id || record.id,
        patientId: record.patientId,
        patientName: record.identification.fullName,
        psychologistId: record.professionalId,
        sessionDate: record.sessions[record.sessions.length - 1]?.date || record.createdAt.split('T')[0],
        chiefComplaint: record.initialDemand.chiefComplaint,
        clinicalEvolution: record.sessions[record.sessions.length - 1]?.summaryContent || '',
        privateNotes: record.sessions[record.sessions.length - 1]?.evolutionNotes || '',
        recommendations: record.sessions[record.sessions.length - 1]?.nextSessionTasks || '',
        updatedAt: record.updatedAt,
      });
    } catch (err) {
      // Non-blocking error handling
      console.warn('Sync to firestore non-fatal:', err);
    }
  }

  getAllRecords(): PsychologicalRecord[] {
    return this.getRecords();
  }

  getRecordsByProfessional(professionalId: string): PsychologicalRecord[] {
    return this.getRecords().filter(r => r.professionalId === professionalId);
  }

  getRecordById(recordId: string): PsychologicalRecord | undefined {
    return this.getRecords().find(r => r.id === recordId);
  }

  getRecordByPatientAndProfessional(patientId: string, professionalId: string): PsychologicalRecord | undefined {
    return this.getRecords().find(
      r => r.patientId === patientId && r.professionalId === professionalId
    );
  }

  /**
   * Creates a new unique psychological record for a patient and professional.
   * Business Rule: Cada paciente tem UM prontuário por profissional, criado no primeiro atendimento.
   */
  createRecord(
    recordData: Omit<PsychologicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'auditLogs' | 'retentionUntil'>,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; record?: PsychologicalRecord; error?: string } {
    const records = this.getRecords();
    const existing = records.find(
      r => r.patientId === recordData.patientId && r.professionalId === recordData.professionalId
    );

    if (existing) {
      return {
        success: false,
        error: 'Este paciente já possui um prontuário cadastrado com você. Abra o prontuário existente.',
        record: existing,
      };
    }

    const now = new Date().toISOString();
    const isMinor = recordSecurity.isMinor(recordData.identification.birthDate);

    const initialAudit = recordSecurity.createAuditEntry(
      'criacao_prontuario',
      actor,
      `Abertura de prontuário psicológico para ${recordData.identification.fullName}. Conforme CFP nº 01/2009.`
    );

    const newRecord: PsychologicalRecord = {
      ...recordData,
      id: `pront_${recordData.patientId}_${recordData.professionalId}_${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
      isMinor,
      auditLogs: [initialAudit],
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      retentionUntil: recordSecurity.calculateRetentionDate(now),
    };

    records.unshift(newRecord);
    this.saveRecords(records);
    this.syncRecordToFirestore(newRecord).catch(() => {});

    return { success: true, record: newRecord };
  }

  /**
   * Updates identification, demand, history or therapeutic plan in the record.
   * Logs an audit entry to guarantee trace and compliance.
   */
  updateRecordData(
    recordId: string,
    updates: Partial<Omit<PsychologicalRecord, 'id' | 'patientId' | 'professionalId' | 'sessions' | 'auditLogs'>>,
    actor: { id: string; name: string; role: string }
  ): PsychologicalRecord | undefined {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return undefined;

    const current = records[index];
    const now = new Date().toISOString();

    const auditEntry = recordSecurity.createAuditEntry(
      'edicao_dados',
      actor,
      'Atualização de dados cadastrais/clínicos do prontuário.'
    );

    const updated: PsychologicalRecord = {
      ...current,
      ...updates,
      updatedAt: now,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    records[index] = updated;
    this.saveRecords(records);
    this.syncRecordToFirestore(updated).catch(() => {});
    return updated;
  }

  /**
   * Registers a new evolution session inside the psychological record.
   * Business rule: Cada sessão gera um novo REGISTRO DE EVOLUÇÃO dentro do prontuário.
   */
  addSessionEvolution(
    recordId: string,
    sessionInput: Omit<EvolutionSession, 'id' | 'sessionNumber' | 'createdAt' | 'updatedAt' | 'versions'>,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; session?: EvolutionSession; record?: PsychologicalRecord; error?: string } {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return { success: false, error: 'Prontuário não encontrado.' };

    const record = records[index];
    const sessionCount = record.sessions.length;
    const sessionNumber = sessionCount + 1;
    const now = new Date().toISOString();

    const newSession: EvolutionSession = {
      ...sessionInput,
      id: `sess_${record.patientId}_${sessionNumber}_${Date.now().toString(36)}`,
      sessionNumber,
      createdAt: now,
      updatedAt: now,
      versions: [],
    };

    const auditEntry = recordSecurity.createAuditEntry(
      'registro_sessao',
      actor,
      `Registro da Sessão de Evolução nº ${sessionNumber} realizada em ${newSession.date}.`
    );

    const updatedRecord: PsychologicalRecord = {
      ...record,
      sessions: [newSession, ...record.sessions], // Latest on top
      updatedAt: now,
      retentionUntil: recordSecurity.calculateRetentionDate(newSession.date),
      auditLogs: [auditEntry, ...record.auditLogs],
    };

    records[index] = updatedRecord;
    this.saveRecords(records);
    this.syncRecordToFirestore(updatedRecord).catch(() => {});

    return { success: true, session: newSession, record: updatedRecord };
  }

  /**
   * Updates an existing evolution session.
   * Business rule: Registros NUNCA são apagados; edições geram histórico de versões (data, hora, autor).
   */
  updateSessionEvolution(
    recordId: string,
    sessionId: string,
    updatedData: Partial<EvolutionSession>,
    changesSummary: string,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; session?: EvolutionSession; record?: PsychologicalRecord; error?: string } {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return { success: false, error: 'Prontuário não encontrado.' };

    const record = records[index];
    const sessionIndex = record.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return { success: false, error: 'Sessão não encontrada no prontuário.' };

    const oldSession = record.sessions[sessionIndex];
    const now = new Date().toISOString();

    // Create immutable version snapshot
    const versionSnapshot: SessionVersionHistory = {
      versionNumber: oldSession.versions.length + 1,
      editedAt: now,
      editedBy: `${actor.name} (${actor.role})`,
      authorId: actor.id,
      changesSummary: changesSummary || 'Edição de anotações da evolução clínica.',
      previousContent: {
        summaryContent: oldSession.summaryContent,
        interventions: oldSession.interventions,
        evolutionScore: oldSession.evolutionScore,
        evolutionTrend: oldSession.evolutionTrend,
        evolutionNotes: oldSession.evolutionNotes,
        emotionalState: oldSession.emotionalState,
        nextSessionTasks: oldSession.nextSessionTasks,
      },
    };

    const newSession: EvolutionSession = {
      ...oldSession,
      ...updatedData,
      updatedAt: now,
      versions: [versionSnapshot, ...oldSession.versions],
    };

    const auditEntry = recordSecurity.createAuditEntry(
      'edicao_sessao',
      actor,
      `Edição da Sessão nº ${oldSession.sessionNumber} gerando Versão nº ${versionSnapshot.versionNumber}. Justificativa: ${changesSummary}`
    );

    const updatedSessions = [...record.sessions];
    updatedSessions[sessionIndex] = newSession;

    const updatedRecord: PsychologicalRecord = {
      ...record,
      sessions: updatedSessions,
      updatedAt: now,
      auditLogs: [auditEntry, ...record.auditLogs],
    };

    records[index] = updatedRecord;
    this.saveRecords(records);
    this.syncRecordToFirestore(updatedRecord).catch(() => {});

    return { success: true, session: newSession, record: updatedRecord };
  }

  /**
   * Updates record status (active, paused, discharged, abandoned, referred).
   */
  updateRecordStatus(
    recordId: string,
    status: RecordStatus,
    closureReason: string | undefined,
    actor: { id: string; name: string; role: string }
  ): PsychologicalRecord | undefined {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return undefined;

    const current = records[index];
    const now = new Date().toISOString();
    const closureDate = status !== 'active' && status !== 'paused' ? now.split('T')[0] : undefined;

    const auditEntry = recordSecurity.createAuditEntry(
      'alteracao_status',
      actor,
      `Alteração de status do prontuário para "${status}". Motivo: ${closureReason || 'Não informado'}`
    );

    const updated: PsychologicalRecord = {
      ...current,
      status,
      closureDate,
      closureReason,
      updatedAt: now,
      retentionUntil: closureDate
        ? recordSecurity.calculateRetentionDate(closureDate)
        : current.retentionUntil,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    records[index] = updated;
    this.saveRecords(records);
    this.syncRecordToFirestore(updated).catch(() => {});
    return updated;
  }

  /**
   * Adds an attachment to the psychological record.
   */
  addAttachment(
    recordId: string,
    attachment: Omit<GeneralAttachment, 'id' | 'uploadedAt'>,
    actor: { id: string; name: string; role: string }
  ): PsychologicalRecord | undefined {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return undefined;

    const current = records[index];
    const now = new Date().toISOString();

    const newAtt: GeneralAttachment = {
      ...attachment,
      id: 'att_' + Date.now().toString(36),
      uploadedAt: now,
    };

    const auditEntry = recordSecurity.createAuditEntry(
      'edicao_dados',
      actor,
      `Anexo de documento inserido no prontuário: "${attachment.name}".`
    );

    const updated: PsychologicalRecord = {
      ...current,
      attachments: [newAtt, ...current.attachments],
      updatedAt: now,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    records[index] = updated;
    this.saveRecords(records);
    return updated;
  }

  /**
   * Logs a view or export event in the immutable audit trail.
   */
  logAuditAction(
    recordId: string,
    action: AuditLogEntry['action'],
    actor: { id: string; name: string; role: string },
    details: string
  ): void {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return;

    const current = records[index];
    const auditEntry = recordSecurity.createAuditEntry(action, actor, details);

    records[index] = {
      ...current,
      auditLogs: [auditEntry, ...current.auditLogs],
    };
    this.saveRecords(records);
  }
}

export const psychologicalRecordStorage = new PsychologicalRecordStorageService();
