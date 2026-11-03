import { ClinicalForm, FormQuestion } from '../types/clinicalForm';

export interface FormTemplatePreset {
  id: string;
  title: string;
  description: string;
  category: ClinicalForm['category'];
  periodicity: ClinicalForm['periodicity'];
  recommendedFor: string;
  questions: FormQuestion[];
}

export const CLINICAL_FORM_TEMPLATES: FormTemplatePreset[] = [
  {
    id: 'tmpl_gad7_anxiety',
    title: 'Escala de Ansiedade GAD-7 & Monitoramento Contínuo',
    description: 'Protocolo de rastreamento e mensuração da severidade dos sintomas de ansiedade, com escala numérica para avaliação longitudinal intersessões.',
    category: 'anxiety',
    periodicity: 'weekly',
    recommendedFor: 'Pacientes com queixas de ansiedade, pânico, insônia ou inquietação.',
    questions: [
      {
        id: 'q_gad_1',
        title: 'Nas últimas 2 semanas, com que frequência você se sentiu nervoso(a), ansioso(a) ou muito tenso(a)?',
        type: 'radio',
        required: true,
        options: [
          'Nenhum dia (0 pontos)',
          'Vários dias (1 ponto)',
          'Mais da metade dos dias (2 pontos)',
          'Quase todos os dias (3 pontos)',
        ],
      },
      {
        id: 'q_gad_2',
        title: 'Com que frequência você não conseguiu parar ou controlar as preocupações?',
        type: 'radio',
        required: true,
        options: [
          'Nenhum dia (0 pontos)',
          'Vários dias (1 ponto)',
          'Mais da metade dos dias (2 pontos)',
          'Quase todos os dias (3 pontos)',
        ],
      },
      {
        id: 'q_gad_3',
        title: 'Com que frequência você se preocupou excessivamente com diversas coisas ao mesmo tempo?',
        type: 'radio',
        required: true,
        options: [
          'Nenhum dia (0 pontos)',
          'Vários dias (1 ponto)',
          'Mais da metade dos dias (2 pontos)',
          'Quase todos os dias (3 pontos)',
        ],
      },
      {
        id: 'q_gad_4',
        title: 'Qual foi o nível médio de intensidade da ansiedade percebida ao longo dos últimos dias? (Escala 0 a 10)',
        description: '0 = Nenhuma ansiedade perceptível | 10 = Ansiedade paralisante ou crise aguda',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Nenhuma ansiedade (Tranquilidade total)',
          maxLabel: '10 - Ansiedade extrema / Crise aguda',
        },
      },
      {
        id: 'q_gad_5',
        title: 'Quais sintomas corporais ou cognitivos você mais experimentou recentemente?',
        type: 'checkbox',
        required: false,
        options: [
          'Aperto no peito ou taquicardia',
          'Sudorese ou tremores',
          'Tensão muscular na nuca/ombros',
          'Dificuldade para adormecer / acordar à noite',
          'Medo de perder o controle',
          'Dificuldade de concentração',
        ],
      },
      {
        id: 'q_gad_6',
        title: 'Teve alguma crise aguda ou ataque de pânico nesta última semana?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Se sim, em qual contexto ocorreu e quanto tempo durou?',
      },
      {
        id: 'q_gad_7',
        title: 'Observações pessoais ou situações que gostaria de levar para a próxima sessão:',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'tmpl_weekly_mood',
    title: 'Monitoramento Semanal de Humor & Bem-Estar Geral',
    description: 'Acompanhamento do estado emocional subjetivo, vitalidade, energia e satisfação semanal.',
    category: 'mood',
    periodicity: 'weekly',
    recommendedFor: 'Acompanhamento longitudinal de pacientes com oscilação de humor, distimia ou depressão.',
    questions: [
      {
        id: 'q_mood_1',
        title: 'Como você avalia o seu nível geral de humor e bem-estar nesta semana? (Escala 0 a 10)',
        description: '0 = Muito deprimido(a) / Sem esperança | 10 = Muito radiante / Pleno bem-estar',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Muito deprimido / Sem energia',
          maxLabel: '10 - Excelente humor e vitalidade',
        },
      },
      {
        id: 'q_mood_2',
        title: 'Como foi a qualidade do seu sono nos últimos 7 dias?',
        type: 'radio',
        required: true,
        options: [
          'Excelente (Dormi de 7 a 9 horas restauradoras)',
          'Boa (Acordei poucas vezes, sono aceitável)',
          'Irregular (Demorei a dormir ou acordei cansado)',
          'Muito ruim (Insônia grave ou sono fragmentado)',
        ],
      },
      {
        id: 'q_mood_3',
        title: 'Você conseguiu realizar momentos de lazer, atividade física ou autocuidado?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Quais atividades você conseguiu praticar ou o que impediu?',
      },
      {
        id: 'q_mood_4',
        title: 'Quais emoções predominaram durante a semana?',
        type: 'checkbox',
        required: false,
        options: [
          'Serenidade / Calma',
          'Alegria / Entusiasmo',
          'Tristeza / Vazio',
          'Irritabilidade / Frustração',
          'Ansiedade / Inquietação',
          'Gratidão',
        ],
      },
      {
        id: 'q_mood_5',
        title: 'Relato livre da semana: acontecimentos marcantes, conflitos ou vitórias pessoais:',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'tmpl_session_checkin',
    title: 'Check-in Pós-Sessão & Aliança Terapêutica',
    description: 'Avaliação de utilidade do encontro clínico e acompanhamento das tarefas intersessão (TCC e reflexões).',
    category: 'followup',
    periodicity: 'weekly',
    recommendedFor: 'Pacientes em processo ativo para calibrar ritmo e aliança de trabalho.',
    questions: [
      {
        id: 'q_chk_1',
        title: 'Em uma escala de 0 a 10, quão acolhido(a) e compreendido(a) você se sentiu no último encontro?',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Pouco compreendido(a)',
          maxLabel: '10 - Totalmente acolhido(a) e ouvido(a)',
        },
      },
      {
        id: 'q_chk_2',
        title: 'Conseguiu colocar em prática as tarefas ou reflexões combinadas para intersessão (ex: RPD, respiração, leitura)?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Conte brevemente como foi a experiência ou quais barreiras encontrou:',
      },
      {
        id: 'q_chk_3',
        title: 'Qual foi o principal insight ou aprendizado que você levou da última sessão?',
        type: 'textarea',
        required: true,
      },
      {
        id: 'q_chk_4',
        title: 'Há algum tema prioritário ou urgente que você quer trazer para a próxima sessão?',
        type: 'text',
        required: false,
      },
    ],
  },
  {
    id: 'tmpl_burnout_occupational',
    title: 'Rastreamento de Burnout & Sobrecarga de Trabalho',
    description: 'Monitoramento de exaustão emocional, despersonalização e eficácia profissional.',
    category: 'burnout',
    periodicity: 'biweekly',
    recommendedFor: 'Profissionais corporativos, profissionais da saúde e estudantes sob alta pressão.',
    questions: [
      {
        id: 'q_burn_1',
        title: 'Qual o seu nível de exaustão física e mental em relação ao seu trabalho atualmente? (0 a 10)',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Energia plena / Sem cansaço atípico',
          maxLabel: '10 - Exaustão extrema / Sensação de esgotamento total',
        },
      },
      {
        id: 'q_burn_2',
        title: 'Você tem sentido distanciamento emocional ou cinismo em relação às suas atividades?',
        type: 'radio',
        required: true,
        options: [
          'Raramente ou nunca',
          'Algumas vezes por semana',
          'Quase diariamente',
          'O tempo todo',
        ],
      },
      {
        id: 'q_burn_3',
        title: 'Teve sintomas somáticos durante ou após a jornada de trabalho?',
        type: 'checkbox',
        required: false,
        options: [
          'Dores de cabeça ou enxaqueca',
          'Problemas gastrointestinais',
          'Sensação de que o fim de semana não é suficiente para descansar',
          'Irritabilidade com colegas ou familiares',
          'Dificuldade para se desligar do celular corporativo',
        ],
      },
      {
        id: 'q_burn_4',
        title: 'Conseguiu estabelecer algum limite saudável de horário nesta quinzena?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Qual limite você tentou aplicar ou qual dificuldade enfrentou?',
      },
    ],
  },
  {
    id: 'tmpl_initial_intake',
    title: 'Anamnese & Levantamento Inicial de Sintomas',
    description: 'Questionário preliminar de acolhimento para mapear queixa principal, rede de apoio e expectativas.',
    category: 'anamnesis',
    periodicity: 'on_demand',
    recommendedFor: 'Novos pacientes antes da primeira sessão ou no início do acompanhamento.',
    questions: [
      {
        id: 'q_int_1',
        title: 'Em suas próprias palavras, descreva o principal motivo que o(a) motivou a buscar ajuda psicológica neste momento:',
        type: 'textarea',
        required: true,
      },
      {
        id: 'q_int_2',
        title: 'Em uma escala de 0 a 10, qual o nível de incômodo ou sofrimento emocional que esse motivo está gerando em sua vida?',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Suportável / Baixo impacto',
          maxLabel: '10 - Sofrimento agudo / Alto impacto',
        },
      },
      {
        id: 'q_int_3',
        title: 'Já realizou psicoterapia, terapia integrativa ou acompanhamento psiquiátrico antes?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Se sim, por quanto tempo e qual foi a experiência?',
      },
      {
        id: 'q_int_4',
        title: 'Como você descreveria sua atual rede de apoio (família, amigos, parceiro(a), comunidade)?',
        type: 'radio',
        required: true,
        options: [
          'Forte e presente (Tenho várias pessoas de confiança)',
          'Razoável (Tenho 1 ou 2 pessoas com quem posso desabafar)',
          'Frágil (Pouco contato ou dificuldade em pedir ajuda)',
          'Inexistente (Sinto-me isolado(a) e sem apoio)',
        ],
      },
      {
        id: 'q_int_5',
        title: 'O que você mais espera alcançar com este acompanhamento terapêutico?',
        type: 'textarea',
        required: true,
      },
    ],
  },
];
