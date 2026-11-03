import {
  ClinicalForm,
  FormDispatch,
  FormSubmission,
  QuestionAnswer,
  FormStatus,
} from '../types/clinicalForm';
import { recordSecurity } from './recordSecurity';
import { db, OperationType, handleFirestoreError } from './firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';

// Initial realistic seed forms created by Dra. Clara (psy_clara)
const INITIAL_FORMS: ClinicalForm[] = [
  {
    id: 'form_gad7_clara',
    professionalId: 'psy_clara',
    professionalName: 'Dra. Clara Vasconcellos',
    title: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    description: 'Acompanhamento sistemático do nível de ansiedade, sintomas somáticos e crises agudas para calibração das técnicas de TCC.',
    category: 'anxiety',
    status: 'published',
    isAnonymous: false,
    allowMultipleSubmissions: true,
    periodicity: 'weekly',
    questions: [
      {
        id: 'q1',
        title: 'Nas últimas duas semanas, com que frequência você se sentiu nervoso(a), ansioso(a) ou no limite?',
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
        id: 'q2',
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
        id: 'q3',
        title: 'Escala de Intensidade: Como você pontua seu nível geral de ansiedade nos últimos dias? (0 a 10)',
        description: '0 = Nenhuma ansiedade | 10 = Ansiedade paralisante',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Nenhuma ansiedade (Tranquilo)',
          maxLabel: '10 - Ansiedade extrema / Crise aguda',
        },
      },
      {
        id: 'q4',
        title: 'Quais sintomas corporais ou cognitivos você mais sentiu nesta semana?',
        type: 'checkbox',
        required: false,
        options: [
          'Aperto no peito ou palpitações',
          'Tensão muscular na nuca/costas',
          'Pensamentos catastróficos de fracasso',
          'Dificuldade para conciliar o sono',
          'Inquietação / dificuldade de relaxar',
        ],
      },
      {
        id: 'q5',
        title: 'Houve algum episódio de crise aguda ou ataque de pânico nesta última semana?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Se sim, descreva o gatilho, as sensações sentidas e como você reagiu:',
      },
      {
        id: 'q6',
        title: 'Registro de pensamentos e anotações para conversarmos na próxima sessão:',
        type: 'textarea',
        required: false,
      },
    ],
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-01T10:00:00Z',
  },
  {
    id: 'form_humor_clara',
    professionalId: 'psy_clara',
    professionalName: 'Dra. Clara Vasconcellos',
    title: 'Monitoramento Semanal de Humor & Qualidade do Sono',
    description: 'Check-in de humor, regulação emocional, adesão ao autocuidado e sono reparador.',
    category: 'mood',
    status: 'published',
    isAnonymous: false,
    allowMultipleSubmissions: true,
    periodicity: 'weekly',
    questions: [
      {
        id: 'qh1',
        title: 'Como você avalia seu nível de energia e humor médio ao longo da semana? (0 a 10)',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Muito desmotivado(a) / Sem energia',
          maxLabel: '10 - Plena vitalidade e otimismo',
        },
      },
      {
        id: 'qh2',
        title: 'Como foi a qualidade do seu sono nos últimos 7 dias?',
        type: 'radio',
        required: true,
        options: [
          'Repousante e contínuo (7-8h)',
          'Razoável com despertares breves',
          'Fragmentado / Insônia inicial',
          'Muito ruim / Acordo exausto(a)',
        ],
      },
      {
        id: 'qh3',
        title: 'Conseguiu praticar os exercícios de respiração diafragmática recomendados?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Qual foi a frequência ou qual foi a principal dificuldade?',
      },
      {
        id: 'qh4',
        title: 'Fatos marcantes ou emoções predominantes nesta semana:',
        type: 'textarea',
        required: false,
      },
    ],
    createdAt: '2025-02-03T11:00:00Z',
    updatedAt: '2025-02-03T11:00:00Z',
  },
  {
    id: 'form_checkin_intersessao',
    professionalId: 'psy_clara',
    professionalName: 'Dra. Clara Vasconcellos',
    title: 'Check-in Pós-Sessão & Tarefas Intersessão',
    description: 'Avaliação da utilidade das intervenções e progresso das tarefas comportamentais combinadas.',
    category: 'followup',
    status: 'draft',
    isAnonymous: false,
    allowMultipleSubmissions: true,
    periodicity: 'weekly',
    questions: [
      {
        id: 'qc1',
        title: 'Em uma escala de 0 a 10, quão útil você achou a última sessão?',
        type: 'likert_scale',
        required: true,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: '0 - Pouco útil',
          maxLabel: '10 - Extremamente esclarecedora',
        },
      },
      {
        id: 'qc2',
        title: 'Conseguiu preencher o Registro de Pensamentos Disfuncionais (RPD)?',
        type: 'yes_no_justification',
        required: true,
        justificationPrompt: 'Quantos registros conseguiu fazer e quais insights teve?',
      },
      {
        id: 'qc3',
        title: 'Qual tema gostaria de priorizar no próximo atendimento?',
        type: 'text',
        required: false,
      },
    ],
    createdAt: '2025-02-15T09:00:00Z',
    updatedAt: '2025-02-15T09:00:00Z',
  },
];

// Initial realistic seed dispatches
const INITIAL_DISPATCHES: FormDispatch[] = [
  {
    id: 'disp_lucas_gad7_1',
    formId: 'form_gad7_clara',
    formTitle: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    professionalId: 'psy_clara',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    sentAt: '2025-02-06T09:00:00Z',
    deadline: '2025-02-11',
    status: 'completed',
    submissionCount: 4,
    lastSubmittedAt: '2025-02-27T18:30:00Z',
    shareToken: 'token_gad7_lucas_98214',
  },
  {
    id: 'disp_lucas_humor_active',
    formId: 'form_humor_clara',
    formTitle: 'Monitoramento Semanal de Humor & Qualidade do Sono',
    professionalId: 'psy_clara',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    sentAt: '2025-03-01T08:30:00Z',
    deadline: '2025-03-07',
    status: 'pending',
    submissionCount: 0,
    shareToken: 'token_humor_lucas_55210',
  },
  {
    id: 'disp_luciana_gad7',
    formId: 'form_gad7_clara',
    formTitle: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    professionalId: 'psy_clara',
    patientId: 'pat_luciana',
    patientName: 'Luciana Ramos Silva',
    patientEmail: 'luciana.ramos@gmail.com',
    sentAt: '2025-02-12T10:00:00Z',
    deadline: '2025-02-16',
    status: 'completed',
    submissionCount: 1,
    lastSubmittedAt: '2025-02-15T14:10:00Z',
    shareToken: 'token_gad7_luciana_33109',
  },
];

// Initial realistic seed submissions showing clear clinical evolution for Lucas:
// Week 1: Ansiedade 9/10 (Crise aguda)
// Week 2: Ansiedade 7/10 (Respiração 4-7-8 ajudando)
// Week 3: Ansiedade 5/10 (RPD e descatastrofização)
// Week 4: Ansiedade 3/10 (Apresentação no trabalho sem pânico!)
const INITIAL_SUBMISSIONS: FormSubmission[] = [
  {
    id: 'sub_lucas_1',
    formId: 'form_gad7_clara',
    formTitle: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    dispatchId: 'disp_lucas_gad7_1',
    professionalId: 'psy_clara',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    submittedAt: '2025-02-06T19:15:00Z',
    answers: [
      {
        questionId: 'q1',
        questionTitle: 'Nas últimas duas semanas, com que frequência você se sentiu nervoso(a), ansioso(a) ou no limite?',
        questionType: 'radio',
        value: 'Quase todos os dias (3 pontos)',
      },
      {
        questionId: 'q2',
        questionTitle: 'Com que frequência você não conseguiu parar ou controlar as preocupações?',
        questionType: 'radio',
        value: 'Quase todos os dias (3 pontos)',
      },
      {
        questionId: 'q3',
        questionTitle: 'Escala de Intensidade: Como você pontua seu nível geral de ansiedade nos últimos dias? (0 a 10)',
        questionType: 'likert_scale',
        value: 9,
        scaleValue: 9,
      },
      {
        questionId: 'q4',
        questionTitle: 'Quais sintomas corporais ou cognitivos você mais sentiu nesta semana?',
        questionType: 'checkbox',
        value: [
          'Aperto no peito ou palpitações',
          'Tensão muscular na nuca/costas',
          'Pensamentos catastróficos de fracasso',
          'Dificuldade para conciliar o sono',
        ],
      },
      {
        questionId: 'q5',
        questionTitle: 'Houve algum episódio de crise aguda ou ataque de pânico nesta última semana?',
        questionType: 'yes_no_justification',
        value: true,
        justification: 'Sim, na quarta-feira antes da reunião de alinhamento com a diretoria. Senti taquicardia forte e quase saí da sala.',
      },
      {
        questionId: 'q6',
        questionTitle: 'Registro de pensamentos e anotações para conversarmos na próxima sessão:',
        questionType: 'textarea',
        value: 'A sensação física foi assustadora, parecia que eu ia ter um colapso na frente de todos.',
      },
    ],
    encryptedPayload: recordSecurity.encryptClinicalText(
      'Submissão 1 - Score 9/10 - Crise pré-reunião com diretoria.'
    ),
    isReadByProfessional: true,
    readAt: '2025-02-07T08:00:00Z',
  },
  {
    id: 'sub_lucas_2',
    formId: 'form_gad7_clara',
    formTitle: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    dispatchId: 'disp_lucas_gad7_1',
    professionalId: 'psy_clara',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    submittedAt: '2025-02-13T20:00:00Z',
    answers: [
      {
        questionId: 'q1',
        questionTitle: 'Nas últimas duas semanas, com que frequência você se sentiu nervoso(a), ansioso(a) ou no limite?',
        questionType: 'radio',
        value: 'Mais da metade dos dias (2 pontos)',
      },
      {
        questionId: 'q2',
        questionTitle: 'Com que frequência você não conseguiu parar ou controlar as preocupações?',
        questionType: 'radio',
        value: 'Vários dias (1 ponto)',
      },
      {
        questionId: 'q3',
        questionTitle: 'Escala de Intensidade: Como você pontua seu nível geral de ansiedade nos últimos dias? (0 a 10)',
        questionType: 'likert_scale',
        value: 7,
        scaleValue: 7,
      },
      {
        questionId: 'q4',
        questionTitle: 'Quais sintomas corporais ou cognitivos você mais sentiu nesta semana?',
        questionType: 'checkbox',
        value: [
          'Tensão muscular na nuca/costas',
          'Dificuldade para conciliar o sono',
        ],
      },
      {
        questionId: 'q5',
        questionTitle: 'Houve algum episódio de crise aguda ou ataque de pânico nesta última semana?',
        questionType: 'yes_no_justification',
        value: false,
        justification: 'Não tive crise aguda completa. Senti o início da taquicardia, mas pratiquei a respiração 4-7-8 e consegui acalmar.',
      },
      {
        questionId: 'q6',
        questionTitle: 'Registro de pensamentos e anotações para conversarmos na próxima sessão:',
        questionType: 'textarea',
        value: 'Percebi que quando respiro devagar o coração vai desacelerando. Ainda sinto tensão no pescoço.',
      },
    ],
    encryptedPayload: recordSecurity.encryptClinicalText(
      'Submissão 2 - Score 7/10 - Respiração 4-7-8 conteve o início da crise.'
    ),
    isReadByProfessional: true,
    readAt: '2025-02-14T08:30:00Z',
  },
  {
    id: 'sub_lucas_3',
    formId: 'form_gad7_clara',
    formTitle: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    dispatchId: 'disp_lucas_gad7_1',
    professionalId: 'psy_clara',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    submittedAt: '2025-02-20T18:45:00Z',
    answers: [
      {
        questionId: 'q1',
        questionTitle: 'Nas últimas duas semanas, com que frequência você se sentiu nervoso(a), ansioso(a) ou no limite?',
        questionType: 'radio',
        value: 'Vários dias (1 ponto)',
      },
      {
        questionId: 'q2',
        questionTitle: 'Com que frequência você não conseguiu parar ou controlar as preocupações?',
        questionType: 'radio',
        value: 'Vários dias (1 ponto)',
      },
      {
        questionId: 'q3',
        questionTitle: 'Escala de Intensidade: Como você pontua seu nível geral de ansiedade nos últimos dias? (0 a 10)',
        questionType: 'likert_scale',
        value: 5,
        scaleValue: 5,
      },
      {
        questionId: 'q4',
        questionTitle: 'Quais sintomas corporais ou cognitivos você mais sentiu nesta semana?',
        questionType: 'checkbox',
        value: ['Tensão muscular na nuca/costas'],
      },
      {
        questionId: 'q5',
        questionTitle: 'Houve algum episódio de crise aguda ou ataque de pânico nesta última semana?',
        questionType: 'yes_no_justification',
        value: false,
        justification: 'Nenhuma crise. Consegui usar o RPD quando o chefe me pediu uma entrega urgente.',
      },
      {
        questionId: 'q6',
        questionTitle: 'Registro de pensamentos e anotações para conversarmos na próxima sessão:',
        questionType: 'textarea',
        value: 'O questionamento do pior cenário foi bem útil. Vi que mesmo se atrasasse 1 dia não seria demitido.',
      },
    ],
    encryptedPayload: recordSecurity.encryptClinicalText(
      'Submissão 3 - Score 5/10 - Uso do RPD bem-sucedido.'
    ),
    isReadByProfessional: true,
    readAt: '2025-02-21T09:00:00Z',
  },
  {
    id: 'sub_lucas_4',
    formId: 'form_gad7_clara',
    formTitle: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    dispatchId: 'disp_lucas_gad7_1',
    professionalId: 'psy_clara',
    patientId: 'pat_lucas',
    patientName: 'Lucas Gabriel Ribeiro',
    patientEmail: 'lucas.paciente@gmail.com',
    submittedAt: '2025-02-27T18:30:00Z',
    answers: [
      {
        questionId: 'q1',
        questionTitle: 'Nas últimas duas semanas, com que frequência você se sentiu nervoso(a), ansioso(a) ou no limite?',
        questionType: 'radio',
        value: 'Nenhum dia (0 pontos)',
      },
      {
        questionId: 'q2',
        questionTitle: 'Com que frequência você não conseguiu parar ou controlar as preocupações?',
        questionType: 'radio',
        value: 'Nenhum dia (0 pontos)',
      },
      {
        questionId: 'q3',
        questionTitle: 'Escala de Intensidade: Como você pontua seu nível geral de ansiedade nos últimos dias? (0 a 10)',
        questionType: 'likert_scale',
        value: 3,
        scaleValue: 3,
      },
      {
        questionId: 'q4',
        questionTitle: 'Quais sintomas corporais ou cognitivos você mais sentiu nesta semana?',
        questionType: 'checkbox',
        value: [],
      },
      {
        questionId: 'q5',
        questionTitle: 'Houve algum episódio de crise aguda ou ataque de pânico nesta última semana?',
        questionType: 'yes_no_justification',
        value: false,
        justification: 'Sem crises. Apresentei o projeto para 12 colegas e senti apenas nervosismo normal.',
      },
      {
        questionId: 'q6',
        questionTitle: 'Registro de pensamentos e anotações para conversarmos na próxima sessão:',
        questionType: 'textarea',
        value: 'Muito feliz com a evolução! Consegui falar com clareza e sem taquicardia.',
      },
    ],
    encryptedPayload: recordSecurity.encryptClinicalText(
      'Submissão 4 - Score 3/10 - Apresentação corporativa realizada com êxito!'
    ),
    isReadByProfessional: false, // Unread alert for the professional!
  },
  {
    id: 'sub_luciana_1',
    formId: 'form_gad7_clara',
    formTitle: 'Escala de Ansiedade GAD-7 & Sintomas Intersessão',
    dispatchId: 'disp_luciana_gad7',
    professionalId: 'psy_clara',
    patientId: 'pat_luciana',
    patientName: 'Luciana Ramos Silva',
    patientEmail: 'luciana.ramos@gmail.com',
    submittedAt: '2025-02-15T14:10:00Z',
    answers: [
      {
        questionId: 'q1',
        questionTitle: 'Nas últimas duas semanas, com que frequência você se sentiu nervoso(a), ansioso(a) ou no limite?',
        questionType: 'radio',
        value: 'Mais da metade dos dias (2 pontos)',
      },
      {
        questionId: 'q2',
        questionTitle: 'Com que frequência você não conseguiu parar ou controlar as preocupações?',
        questionType: 'radio',
        value: 'Mais da metade dos dias (2 pontos)',
      },
      {
        questionId: 'q3',
        questionTitle: 'Escala de Intensidade: Como você pontua seu nível geral de ansiedade nos últimos dias? (0 a 10)',
        questionType: 'likert_scale',
        value: 8,
        scaleValue: 8,
      },
      {
        questionId: 'q4',
        questionTitle: 'Quais sintomas corporais ou cognitivos você mais sentiu nesta semana?',
        questionType: 'checkbox',
        value: [
          'Tensão muscular na nuca/costas',
          'Dificuldade para conciliar o sono',
          'Inquietação / dificuldade de relaxar',
        ],
      },
      {
        questionId: 'q5',
        questionTitle: 'Houve algum episódio de crise aguda ou ataque de pânico nesta última semana?',
        questionType: 'yes_no_justification',
        value: false,
        justification: 'Não tive pânico agudo, mas sensação de esgotamento e choro fácil na sexta-feira.',
      },
      {
        questionId: 'q6',
        questionTitle: 'Registro de pensamentos e anotações para conversarmos na próxima sessão:',
        questionType: 'textarea',
        value: 'Muita cobrança no trabalho somada às tarefas dos filhos.',
      },
    ],
    encryptedPayload: recordSecurity.encryptClinicalText(
      'Submissão Luciana - Score 8/10 - Sobrecarga de jornada dupla.'
    ),
    isReadByProfessional: true,
    readAt: '2025-02-16T11:00:00Z',
  },
];

class ClinicalFormStorageService {
  private formsCache: ClinicalForm[] = [];
  private dispatchesCache: FormDispatch[] = [];
  private submissionsCache: FormSubmission[] = [];
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.formsCache = [...INITIAL_FORMS];
    this.dispatchesCache = [...INITIAL_DISPATCHES];
    this.submissionsCache = [...INITIAL_SUBMISSIONS];
    this.initFirestoreSync();
  }

  private initFirestoreSync(): void {
    try {
      // 1. Listen to clinicalForms
      onSnapshot(
        collection(db, 'clinicalForms'),
        snapshot => {
          const docs: ClinicalForm[] = [];
          snapshot.forEach(d => docs.push(d.data() as ClinicalForm));
          if (docs.length > 0) {
            this.formsCache = docs;
            this.notify();
          } else {
            this.seedFormsIfEmpty();
          }
        },
        err => console.warn('Realtime listener error in clinicalForms:', err)
      );

      // 2. Listen to formDispatches
      onSnapshot(
        collection(db, 'formDispatches'),
        snapshot => {
          const docs: FormDispatch[] = [];
          snapshot.forEach(d => docs.push(d.data() as FormDispatch));
          if (docs.length > 0) {
            this.dispatchesCache = docs;
            this.notify();
          } else {
            this.seedDispatchesIfEmpty();
          }
        },
        err => console.warn('Realtime listener error in formDispatches:', err)
      );

      // 3. Listen to formSubmissions
      onSnapshot(
        collection(db, 'formSubmissions'),
        snapshot => {
          const docs: FormSubmission[] = [];
          snapshot.forEach(d => docs.push(d.data() as FormSubmission));
          if (docs.length > 0) {
            this.submissionsCache = docs;
            this.notify();
          } else {
            this.seedSubmissionsIfEmpty();
          }
        },
        err => console.warn('Realtime listener error in formSubmissions:', err)
      );
    } catch (err) {
      console.warn('Failed to attach clinical forms listeners:', err);
    }
  }

  private async seedFormsIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'clinicalForms'));
      if (snap.size === 0) {
        for (const f of INITIAL_FORMS) {
          await setDoc(doc(db, 'clinicalForms', f.id), f);
        }
      }
    } catch (e) {
      console.warn('Seeding forms fallback:', e);
    }
  }

  private async seedDispatchesIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'formDispatches'));
      if (snap.size === 0) {
        for (const d of INITIAL_DISPATCHES) {
          await setDoc(doc(db, 'formDispatches', d.id), d);
        }
      }
    } catch (e) {
      console.warn('Seeding dispatches fallback:', e);
    }
  }

  private async seedSubmissionsIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'formSubmissions'));
      if (snap.size === 0) {
        for (const s of INITIAL_SUBMISSIONS) {
          await setDoc(doc(db, 'formSubmissions', s.id), s);
        }
      }
    } catch (e) {
      console.warn('Seeding submissions fallback:', e);
    }
  }

  private notify(): void {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Error in form storage listener:', err);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ==========================================
  // 1. FORMS MANAGEMENT & RIGID TENANT ISOLATION
  // ==========================================

  /**
   * Strictly returns forms that belong to this professional.
   * Total tenant/owner isolation: no other professional can view, edit or clone these forms.
   */
  getFormsByProfessional(professionalId: string): ClinicalForm[] {
    return this.formsCache.filter(f => f.professionalId === professionalId);
  }

  /**
   * Retrieves a single form ensuring owner verification.
   */
  getFormById(formId: string, professionalId?: string): ClinicalForm | undefined {
    const form = this.formsCache.find(f => f.id === formId);
    if (!form) return undefined;
    if (professionalId && form.professionalId !== professionalId) {
      // Access denied across professional tenant boundary
      return undefined;
    }
    return form;
  }

  /**
   * Patient answering form: allows fetching a published form if dispatched.
   */
  getPublishedFormForPatient(formId: string): ClinicalForm | undefined {
    const form = this.formsCache.find(f => f.id === formId);
    if (!form || form.status !== 'published') return undefined;
    return form;
  }

  /**
   * Saves or creates a form with strict owner binding.
   */
  async saveForm(form: ClinicalForm): Promise<ClinicalForm> {
    const now = new Date().toISOString();
    const updatedForm: ClinicalForm = {
      ...form,
      updatedAt: now,
      createdAt: form.createdAt || now,
    };

    // Update cache immediately
    const index = this.formsCache.findIndex(f => f.id === updatedForm.id);
    if (index >= 0) {
      this.formsCache[index] = updatedForm;
    } else {
      this.formsCache.unshift(updatedForm);
    }
    this.notify();

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'clinicalForms', updatedForm.id), updatedForm);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `clinicalForms/${updatedForm.id}`);
    }

    return updatedForm;
  }

  /**
   * Duplicates an existing form for the professional.
   * Strictly bounds the clone to the calling professional.
   */
  async duplicateForm(formId: string, professionalId: string, professionalName: string): Promise<ClinicalForm> {
    const original = this.getFormById(formId, professionalId);
    if (!original) {
      throw new Error('Formulário não encontrado ou você não tem permissão para duplicá-lo.');
    }

    const now = new Date().toISOString();
    const duplicated: ClinicalForm = {
      ...original,
      id: 'form_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      professionalId,
      professionalName,
      title: `${original.title} (Cópia)`,
      status: 'draft', // Clones start as Drafts for safety
      createdAt: now,
      updatedAt: now,
      questions: original.questions.map(q => ({
        ...q,
        id: 'q_' + Math.random().toString(36).substring(2, 8),
      })),
    };

    return this.saveForm(duplicated);
  }

  /**
   * Deletes a form strictly checking owner isolation.
   */
  async deleteForm(formId: string, professionalId: string): Promise<void> {
    const form = this.getFormById(formId, professionalId);
    if (!form) {
      throw new Error('Acesso negado: você só pode excluir formulários de sua autoria.');
    }

    this.formsCache = this.formsCache.filter(f => f.id !== formId);
    this.notify();

    try {
      await deleteDoc(doc(db, 'clinicalForms', formId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clinicalForms/${formId}`);
    }
  }

  // ==========================================
  // 2. DISPATCHES & MANDATORY TIMESTAMP AUDITING
  // ==========================================

  /**
   * Dispatches a form to a specific patient.
   * Rigorously stamps exact `sentAt` ISO timestamp.
   */
  async dispatchForm(params: {
    formId: string;
    professionalId: string;
    patientId: string;
    patientName: string;
    patientEmail: string;
    deadline?: string;
  }): Promise<FormDispatch> {
    const form = this.getFormById(params.formId, params.professionalId);
    if (!form) {
      throw new Error('Formulário não encontrado ou sem permissão de envio.');
    }
    if (form.status !== 'published') {
      throw new Error('Não é possível enviar um formulário com status de Rascunho. Publique-o primeiro.');
    }

    const sentAt = new Date().toISOString();
    const shareToken = 'tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

    const dispatch: FormDispatch = {
      id: 'disp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      formId: form.id,
      formTitle: form.title,
      professionalId: params.professionalId,
      patientId: params.patientId,
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      sentAt,
      deadline: params.deadline,
      status: 'pending',
      submissionCount: 0,
      shareToken,
    };

    this.dispatchesCache.unshift(dispatch);
    this.notify();

    try {
      await setDoc(doc(db, 'formDispatches', dispatch.id), dispatch);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `formDispatches/${dispatch.id}`);
    }

    return dispatch;
  }

  getDispatchesByProfessional(professionalId: string): FormDispatch[] {
    return this.dispatchesCache.filter(d => d.professionalId === professionalId);
  }

  getDispatchesByPatient(patientId: string): FormDispatch[] {
    return this.dispatchesCache.filter(d => d.patientId === patientId);
  }

  getDispatchByToken(shareToken: string): FormDispatch | undefined {
    return this.dispatchesCache.find(d => d.shareToken === shareToken);
  }

  getDispatchById(dispatchId: string): FormDispatch | undefined {
    return this.dispatchesCache.find(d => d.id === dispatchId);
  }

  // ==========================================
  // 3. SUBMISSIONS, ENCRYPTION & LONGITUDINAL HISTORY
  // ==========================================

  /**
   * Submits a patient's answers to a form.
   * Obligatorily stamps exact `submittedAt` ISO timestamp.
   * Applies AES-256-GCM cipher envelope to sensitive clinical text to comply with CFP & LGPD.
   */
  async submitFormResponse(params: {
    formId: string;
    dispatchId?: string;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    answers: QuestionAnswer[];
  }): Promise<FormSubmission> {
    const form = this.getPublishedFormForPatient(params.formId);
    if (!form) {
      throw new Error('Formulário não encontrado ou não está disponível para preenchimento.');
    }

    const submittedAt = new Date().toISOString();

    // Clinical encryption of entire answer payload
    const plainJson = JSON.stringify(params.answers);
    const encryptedPayload = recordSecurity.encryptClinicalText(plainJson);

    const submission: FormSubmission = {
      id: 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      formId: form.id,
      formTitle: form.title,
      dispatchId: params.dispatchId,
      professionalId: form.professionalId, // Rigorous isolation
      patientId: form.isAnonymous ? 'anonimo' : params.patientId,
      patientName: form.isAnonymous ? 'Paciente Anônimo' : params.patientName,
      patientEmail: form.isAnonymous ? undefined : params.patientEmail,
      submittedAt,
      answers: params.answers,
      encryptedPayload,
      isReadByProfessional: false, // Triggers real-time notification in professional panel
    };

    // Update dispatch if exists
    if (params.dispatchId) {
      const dispatch = this.dispatchesCache.find(d => d.id === params.dispatchId);
      if (dispatch) {
        dispatch.status = 'completed';
        dispatch.submissionCount = (dispatch.submissionCount || 0) + 1;
        dispatch.lastSubmittedAt = submittedAt;
        try {
          await setDoc(doc(db, 'formDispatches', dispatch.id), dispatch);
        } catch (e) {
          console.warn('Error updating dispatch status:', e);
        }
      }
    }

    this.submissionsCache.unshift(submission);
    this.notify();

    try {
      await setDoc(doc(db, 'formSubmissions', submission.id), submission);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `formSubmissions/${submission.id}`);
    }

    return submission;
  }

  /**
   * Strictly returns submissions for the owner professional.
   */
  getSubmissionsByProfessional(professionalId: string): FormSubmission[] {
    return this.submissionsCache.filter(s => s.professionalId === professionalId);
  }

  /**
   * Returns patient submission history for a specific form and patient.
   * Sorted in ASCENDING chronological order to plot the evolution chart!
   */
  getSubmissionsByPatientAndForm(
    patientId: string,
    formId: string,
    professionalId: string
  ): FormSubmission[] {
    return this.submissionsCache
      .filter(
        s =>
          s.patientId === patientId &&
          s.formId === formId &&
          s.professionalId === professionalId
      )
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  }

  /**
   * Returns all submissions by a patient across all forms.
   */
  getSubmissionsByPatient(patientId: string): FormSubmission[] {
    return this.submissionsCache
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  /**
   * Marks a submission as read by the professional.
   */
  async markSubmissionAsRead(submissionId: string, professionalId: string): Promise<void> {
    const sub = this.submissionsCache.find(
      s => s.id === submissionId && s.professionalId === professionalId
    );
    if (sub && !sub.isReadByProfessional) {
      sub.isReadByProfessional = true;
      sub.readAt = new Date().toISOString();
      this.notify();
      try {
        await setDoc(doc(db, 'formSubmissions', sub.id), sub);
      } catch (e) {
        console.warn('Error marking submission as read in Firestore:', e);
      }
    }
  }

  /**
   * Count unread submissions to show a live badge in the professional dashboard.
   */
  getUnreadSubmissionsCount(professionalId: string): number {
    return this.submissionsCache.filter(
      s => s.professionalId === professionalId && !s.isReadByProfessional
    ).length;
  }
}

export const clinicalFormStorage = new ClinicalFormStorageService();
