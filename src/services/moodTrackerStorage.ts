import { MoodEntry, MoodLevel, MoodConfig } from '../types/mood';

const STORAGE_KEY = 'psiconnect_mood_entries_v1';

export const MOOD_LEVELS_CONFIG: Record<MoodLevel, MoodConfig> = {
  5: {
    level: 5,
    label: 'Excelente',
    sublabel: 'Radiante, motivado e em alta energia',
    emoji: '✨',
    iconName: 'Laugh',
    color: '#10b981', // emerald-500
    bgColor: 'bg-emerald-50 text-emerald-800',
    borderColor: 'border-emerald-300',
    darkBgColor: 'dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    score: 5,
  },
  4: {
    level: 4,
    label: 'Bem',
    sublabel: 'Positivo, tranquilo e equilibrado',
    emoji: '😊',
    iconName: 'Smile',
    color: '#0284c7', // sky-600
    bgColor: 'bg-sky-50 text-sky-800',
    borderColor: 'border-sky-300',
    darkBgColor: 'dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    score: 4,
  },
  3: {
    level: 3,
    label: 'Neutro',
    sublabel: 'Estável, dia normal sem grandes oscilações',
    emoji: '😐',
    iconName: 'Meh',
    color: '#6366f1', // indigo-500
    bgColor: 'bg-slate-100 text-slate-800',
    borderColor: 'border-slate-300',
    darkBgColor: 'dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700',
    score: 3,
  },
  2: {
    level: 2,
    label: 'Para Baixo',
    sublabel: 'Cansaço, desânimo ou melancolia',
    emoji: '😔',
    iconName: 'Frown',
    color: '#f59e0b', // amber-500
    bgColor: 'bg-amber-50 text-amber-800',
    borderColor: 'border-amber-300',
    darkBgColor: 'dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    score: 2,
  },
  1: {
    level: 1,
    label: 'Muito Difícil',
    sublabel: 'Ansiedade intensa, angústia ou crise',
    emoji: '🌧️',
    iconName: 'CloudRain',
    color: '#ef4444', // red-500
    bgColor: 'bg-rose-50 text-rose-800',
    borderColor: 'border-rose-300',
    darkBgColor: 'dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    score: 1,
  },
};

export const COMMON_FEELINGS = [
  'Em Paz',
  'Grato',
  'Esperançoso',
  'Confiante',
  'Ansioso',
  'Cansado',
  'Sobrecarregado',
  'Estressado',
  'Focado',
  'Triste',
  'Irritado',
  'Solitário',
  'Aliviado',
  'Acolhido',
];

export const INFLUENCE_FACTORS = [
  'Terapia / Aconselhamento',
  'Sono',
  'Trabalho / Estudos',
  'Família',
  'Relacionamento',
  'Espiritualidade / Oração',
  'Atividade Física',
  'Alimentação',
  'Lazer / Descanso',
  'Finanças',
];

// Helper to generate dates relative to today
const getRelativeDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const getRelativeDateTimeStr = (daysAgo: number, timeStr = '10:30'): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dateStr = d.toISOString().split('T')[0];
  return `${dateStr}T${timeStr}:00.000Z`;
};

// Realistic seed history for demo patient 'pat_lucas' over the past 2 weeks
const INITIAL_MOOD_ENTRIES: MoodEntry[] = [
  {
    id: 'mood_seed_1',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(13),
    timestamp: getRelativeDateTimeStr(13, '09:15'),
    mood: 2,
    energy: 'low',
    feelings: ['Ansioso', 'Cansado', 'Sobrecarregado'],
    factors: ['Trabalho / Estudos', 'Sono'],
    note: 'Semana pesada no trabalho, dormi mal com preocupações na mente.',
    createdAt: getRelativeDateTimeStr(13, '09:15'),
  },
  {
    id: 'mood_seed_2',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(12),
    timestamp: getRelativeDateTimeStr(12, '14:20'),
    mood: 2,
    energy: 'low',
    feelings: ['Cansado', 'Ansioso'],
    factors: ['Sono', 'Trabalho / Estudos'],
    note: 'Sensação de estagnação, mas consegui caminhar um pouco à tarde.',
    createdAt: getRelativeDateTimeStr(12, '14:20'),
  },
  {
    id: 'mood_seed_3',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(11),
    timestamp: getRelativeDateTimeStr(11, '20:00'),
    mood: 3,
    energy: 'moderate',
    feelings: ['Em Paz', 'Aliviado'],
    factors: ['Terapia / Aconselhamento', 'Descanso'],
    note: 'Dia da sessão de acolhimento. Conversar abriu espaço para respirar melhor.',
    createdAt: getRelativeDateTimeStr(11, '20:00'),
  },
  {
    id: 'mood_seed_4',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(10),
    timestamp: getRelativeDateTimeStr(10, '11:00'),
    mood: 3,
    energy: 'moderate',
    feelings: ['Esperançoso', 'Focado'],
    factors: ['Trabalho / Estudos', 'Sono'],
    note: 'Dia produtivo e mais calmo.',
    createdAt: getRelativeDateTimeStr(10, '11:00'),
  },
  {
    id: 'mood_seed_5',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(9),
    timestamp: getRelativeDateTimeStr(9, '18:45'),
    mood: 4,
    energy: 'high',
    feelings: ['Grato', 'Confiante', 'Em Paz'],
    factors: ['Família', 'Atividade Física', 'Espiritualidade / Oração'],
    note: 'Fim de semana com a família. Momento de oração trouxe renovo.',
    createdAt: getRelativeDateTimeStr(9, '18:45'),
  },
  {
    id: 'mood_seed_6',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(8),
    timestamp: getRelativeDateTimeStr(8, '10:10'),
    mood: 4,
    energy: 'moderate',
    feelings: ['Em Paz', 'Grato'],
    factors: ['Lazer / Descanso', 'Sono'],
    note: 'Dormi 8 horas completas pela primeira vez em semanas.',
    createdAt: getRelativeDateTimeStr(8, '10:10'),
  },
  {
    id: 'mood_seed_7',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(7),
    timestamp: getRelativeDateTimeStr(7, '16:30'),
    mood: 3,
    energy: 'moderate',
    feelings: ['Focado', 'Cansado'],
    factors: ['Trabalho / Estudos'],
    note: 'Início de semana acelerado, porém consegui aplicar técnicas de respiração.',
    createdAt: getRelativeDateTimeStr(7, '16:30'),
  },
  {
    id: 'mood_seed_8',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(6),
    timestamp: getRelativeDateTimeStr(6, '21:15'),
    mood: 4,
    energy: 'high',
    feelings: ['Esperançoso', 'Confiante'],
    factors: ['Terapia / Aconselhamento', 'Atividade Física'],
    note: 'Feedback da terapeuta me ajudou a identificar gatilhos.',
    createdAt: getRelativeDateTimeStr(6, '21:15'),
  },
  {
    id: 'mood_seed_9',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(5),
    timestamp: getRelativeDateTimeStr(5, '12:00'),
    mood: 3,
    energy: 'moderate',
    feelings: ['Em Paz'],
    factors: ['Trabalho / Estudos', 'Alimentação'],
    note: 'Ritmo normal, sem crises de ansiedade.',
    createdAt: getRelativeDateTimeStr(5, '12:00'),
  },
  {
    id: 'mood_seed_10',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(4),
    timestamp: getRelativeDateTimeStr(4, '15:40'),
    mood: 4,
    energy: 'high',
    feelings: ['Acolhido', 'Grato', 'Confiante'],
    factors: ['Família', 'Relacionamento'],
    note: 'Boa conversa com pessoas queridas.',
    createdAt: getRelativeDateTimeStr(4, '15:40'),
  },
  {
    id: 'mood_seed_11',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(3),
    timestamp: getRelativeDateTimeStr(3, '09:00'),
    mood: 5,
    energy: 'high',
    feelings: ['Radiante', 'Grato', 'Esperançoso'],
    factors: ['Espiritualidade / Oração', 'Sono', 'Atividade Física'],
    note: 'Acordei com muita clareza mental e entusiasmo.',
    createdAt: getRelativeDateTimeStr(3, '09:00'),
  },
  {
    id: 'mood_seed_12',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(2),
    timestamp: getRelativeDateTimeStr(2, '17:20'),
    mood: 4,
    energy: 'moderate',
    feelings: ['Em Paz', 'Focado'],
    factors: ['Trabalho / Estudos', 'Lazer / Descanso'],
    note: 'Consegui pausar para descansar sem culpa.',
    createdAt: getRelativeDateTimeStr(2, '17:20'),
  },
  {
    id: 'mood_seed_13',
    patientId: 'pat_lucas',
    date: getRelativeDateStr(1),
    timestamp: getRelativeDateTimeStr(1, '20:10'),
    mood: 4,
    energy: 'moderate',
    feelings: ['Grato', 'Aliviado'],
    factors: ['Terapia / Aconselhamento', 'Família'],
    note: 'Excelente progresso nas orientações de cuidado.',
    createdAt: getRelativeDateTimeStr(1, '20:10'),
  },
];

type MoodListener = (entries: MoodEntry[]) => void;

class MoodTrackerStorage {
  private listeners: MoodListener[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOOD_ENTRIES));
      }
    } catch (e) {
      console.warn('LocalStorage not available for mood entries init', e);
    }
  }

  public subscribe(listener: MoodListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const all = this.getAllEntries();
    this.listeners.forEach(l => {
      try {
        l(all);
      } catch (err) {
        console.error('Error notifying mood listener', err);
      }
    });
  }

  public getAllEntries(): MoodEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return INITIAL_MOOD_ENTRIES;
  }

  public getEntriesByPatient(patientId: string): MoodEntry[] {
    const all = this.getAllEntries();
    return all
      .filter(e => e.patientId === patientId || (!e.patientId && patientId === 'pat_lucas'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public getEntryForDate(patientId: string, dateStr: string): MoodEntry | undefined {
    const list = this.getEntriesByPatient(patientId);
    return list.find(e => e.date === dateStr);
  }

  public saveEntry(entry: Omit<MoodEntry, 'id' | 'createdAt'> & { id?: string }): MoodEntry {
    const all = this.getAllEntries();
    const existingIndex = all.findIndex(
      e => (entry.id && e.id === entry.id) || (e.patientId === entry.patientId && e.date === entry.date)
    );

    const now = new Date().toISOString();
    let saved: MoodEntry;

    if (existingIndex >= 0) {
      saved = {
        ...all[existingIndex],
        ...entry,
        updatedAt: now,
      };
      all[existingIndex] = saved;
    } else {
      saved = {
        id: entry.id || `mood_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        ...entry,
      };
      all.push(saved);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to save mood entry in localStorage', err);
    }

    this.notify();
    return saved;
  }

  public deleteEntry(id: string): void {
    const all = this.getAllEntries().filter(e => e.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to delete mood entry', err);
    }
    this.notify();
  }

  public calculateStreak(patientId: string): number {
    const entries = this.getEntriesByPatient(patientId);
    if (!entries.length) return 0;

    const dates = new Set(entries.map(e => e.date));
    let streak = 0;
    const checkDate = new Date();

    // Check if recorded today or yesterday
    const todayStr = checkDate.toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (!dates.has(todayStr) && !dates.has(yesterdayStr)) {
      return 0;
    }

    let current = dates.has(todayStr) ? checkDate : yesterdayDate;

    while (true) {
      const str = current.toISOString().split('T')[0];
      if (dates.has(str)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}

export const moodTrackerStorage = new MoodTrackerStorage();
