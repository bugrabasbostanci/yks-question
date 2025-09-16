export type Subject =
  | "math"
  | "geometry"
  | "physics"
  | "chemistry"
  | "biology"
  | "turkish"
  | "history"
  | "geography"
  | "philosophy"
  | "religion"
  | "english";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  title?: string;
  image_path: string;
  thumbnail_path?: string;
  subject: Subject;
  difficulty_level?: DifficultyLevel;
  tags: string[];
  is_favorite: boolean;
  is_solved: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionFormData {
  title?: string;
  subject: Subject;
  difficulty_level?: DifficultyLevel;
  tags: string[];
  notes?: string;
}

export interface FilterOptions {
  subjects?: Subject[];
  difficulty_levels?: DifficultyLevel[];
  tags?: string[];
  is_favorite?: boolean;
  is_solved?: boolean;
  search?: string;
}

// UI Labels için mapping
export const SUBJECT_LABELS: Record<Subject, string> = {
  math: "Matematik",
  geometry: "Geometri",
  physics: "Fizik",
  chemistry: "Kimya",
  biology: "Biyoloji",
  turkish: "Türkçe",
  history: "Tarih",
  geography: "Coğrafya",
  philosophy: "Felsefe",
  religion: "Din",
  english: "İngilizce",
};

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}