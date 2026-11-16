import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, QuizMode, Category, QuizAttemptRecord } from '../types';

export const CATEGORY_CUTOFFS: Record<Category, { minPercent: number; minMarks: number; label_hi: string; label_en: string }> = {
  UR: { minPercent: 50.0, minMarks: 75.0, label_hi: 'सामान्य वर्ग (UR)', label_en: 'General (UR)' },
  BC: { minPercent: 45.5, minMarks: 68.25, label_hi: 'पिछड़ा वर्ग (BC)', label_en: 'Backward Class (BC)' },
  EBC: { minPercent: 42.5, minMarks: 63.75, label_hi: 'अत्यंत पिछड़ा वर्ग (EBC)', label_en: 'Extremely Backward Class (EBC)' },
  SC: { minPercent: 40.0, minMarks: 60.0, label_hi: 'अनुसूचित जाति (SC)', label_en: 'Scheduled Caste (SC)' },
  ST: { minPercent: 40.0, minMarks: 60.0, label_hi: 'अनुसूचित जनजाति (ST)', label_en: 'Scheduled Tribe (ST)' },
  PwD: { minPercent: 40.0, minMarks: 60.0, label_hi: 'दिव्यांग (PwD)', label_en: 'Persons with Disabilities' },
  WOMEN: { minPercent: 40.0, minMarks: 60.0, label_hi: 'महिला अभ्यर्थी (सभी वर्ग)', label_en: 'Women (All Categories)' },
};

interface QuizStoreState {
  language: Language;
  theme: 'light' | 'dark';
  category: Category;
  bookmarks: string[]; // array of globalId
  quizHistory: Record<string, QuizAttemptRecord>; // subUnitNum -> record
  savedAnswers: Record<string, number>; // globalId -> selectedOptionIdx

  // Actions
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  setCategory: (cat: Category) => void;
  toggleBookmark: (globalId: string) => void;
  isBookmarked: (globalId: string) => boolean;
  saveAnswer: (globalId: string, optionIdx: number) => void;
  recordQuizAttempt: (subUnitNum: string, record: QuizAttemptRecord) => void;
  clearSubunitAnswers: (subUnitNum: string) => void;
  resetAllProgress: () => void;
}

export const useQuizStore = create<QuizStoreState>()(
  persist(
    (set, get) => ({
      language: 'bilingual',
      theme: 'light',
      category: 'UR',
      bookmarks: [],
      quizHistory: {},
      savedAnswers: {},

      setLanguage: (lang) => set({ language: lang }),
      toggleTheme: () => set((state) => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { theme: nextTheme };
      }),
      setCategory: (cat) => set({ category: cat }),

      toggleBookmark: (globalId) => set((state) => {
        const exists = state.bookmarks.includes(globalId);
        const updated = exists
          ? state.bookmarks.filter(id => id !== globalId)
          : [...state.bookmarks, globalId];
        return { bookmarks: updated };
      }),

      isBookmarked: (globalId) => get().bookmarks.includes(globalId),

      saveAnswer: (globalId, optionIdx) => set((state) => ({
        savedAnswers: { ...state.savedAnswers, [globalId]: optionIdx }
      })),

      recordQuizAttempt: (subUnitNum, record) => set((state) => ({
        quizHistory: { ...state.quizHistory, [subUnitNum]: record }
      })),

      clearSubunitAnswers: (subUnitNum) => set((state) => {
        const newAnswers = { ...state.savedAnswers };
        Object.keys(newAnswers).forEach(key => {
          if (key.includes(`sub${subUnitNum.replace('.', '_')}_`)) {
            delete newAnswers[key];
          }
        });
        return { savedAnswers: newAnswers };
      }),

      resetAllProgress: () => set({
        bookmarks: [],
        quizHistory: {},
        savedAnswers: {}
      }),
    }),
    {
      name: 'bihar_slet_storage_v2',
    }
  )
);
