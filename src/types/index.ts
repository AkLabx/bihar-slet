export type Language = 'bilingual' | 'hindi' | 'english';
export type QuizMode = 'practice' | 'exam';
export type Category = 'UR' | 'BC' | 'EBC' | 'SC' | 'ST' | 'PwD' | 'WOMEN';

export interface QuestionOption {
  hi: string;
  en: string;
}

export interface Question {
  globalId: string;
  id: number;
  num: number;
  unitId: string;
  unitNum: number;
  subUnitNum: string;
  unitTitle_hi: string;
  unitTitle_en: string;
  subUnitTitle_hi: string;
  subUnitTitle_en: string;
  q_hi: string;
  q_en: string;
  options_hi: string[];
  options_en: string[];
  options: QuestionOption[];
  correct: number;
  exp_hi: string;
  exp_en: string;
}

export interface SubUnitMeta {
  subUnitNum: string;
  title_hi: string;
  title_en: string;
  questionsCount: number;
  jsonFile: string;
  noteFile: string;
}

export interface UnitMeta {
  id: string;
  num: number;
  dir: string;
  title_hi: string;
  title_en: string;
  part: 1 | 2;
  subUnits: SubUnitMeta[];
}

export interface QuizAttemptRecord {
  score: number;
  total: number;
  percentage: number;
  mode: QuizMode;
  date: string;
  answers: Record<string, number>; // questionId -> selectedIndex
}
