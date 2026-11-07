export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodConfig {
  level: MoodLevel;
  label: string;
  sublabel: string;
  emoji: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  darkBgColor: string;
  score: number;
}

export type EnergyLevel = 'low' | 'moderate' | 'high';

export interface MoodEntry {
  id: string;
  patientId: string;
  date: string; // ISO YYYY-MM-DD
  timestamp: string; // ISO string
  mood: MoodLevel;
  energy?: EnergyLevel;
  feelings?: string[]; // tags like 'Ansioso', 'Esperançoso', 'Em Paz'
  factors?: string[]; // tags like 'Trabalho', 'Sono', 'Terapia', 'Família'
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MoodStats {
  totalEntries: number;
  averageScore: number;
  streakDays: number;
  mostFrequentMood: MoodLevel | null;
  topFeelings: { feeling: string; count: number }[];
  distribution: { level: MoodLevel; label: string; count: number; percentage: number; color: string }[];
}
