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

type MoodListener = (entries: MoodEntry[]) => void;

class MoodTrackerStorage {
  private listeners: MoodListener[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        const parsed = JSON.parse(existing) as MoodEntry[];
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            e => !e.id?.startsWith('mood_seed_') && e.patientId !== 'pat_lucas'
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          }
        }
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
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  }

  public getEntriesByPatient(patientId: string): MoodEntry[] {
    if (!patientId) return [];
    const all = this.getAllEntries();
    return all
      .filter(e => e.patientId === patientId)
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
