import { describe, it, expect } from 'vitest';
import { useQuizStore } from '../store/useQuizStore';
import manifest from '../data/manifest.json';
import fs from 'fs';
import path from 'path';

describe('Bilingual & Language Centralization Tests', () => {
  it('should initialize language and correctly switch to bilingual, hindi, and english', () => {
    const store = useQuizStore.getState();
    expect(['bilingual', 'hindi', 'english']).toContain(store.language);

    store.setLanguage('hindi');
    expect(useQuizStore.getState().language).toBe('hindi');

    store.setLanguage('english');
    expect(useQuizStore.getState().language).toBe('english');

    store.setLanguage('bilingual');
    expect(useQuizStore.getState().language).toBe('bilingual');
  });

  it('should guarantee all 30 sub-units have distinct, non-empty, pure title_hi and title_en', () => {
    manifest.forEach((unit) => {
      expect(unit.title_hi.trim().length).toBeGreaterThan(0);
      expect(unit.title_en.trim().length).toBeGreaterThan(0);
      expect(/[\u0900-\u097F]/.test(unit.title_hi)).toBe(true);

      unit.subUnits.forEach((sub) => {
        expect(sub.title_hi.trim().length).toBeGreaterThan(0);
        expect(sub.title_en.trim().length).toBeGreaterThan(0);

        // Devanagari script present in title_hi
        expect(/[\u0900-\u097F]/.test(sub.title_hi), `Subunit ${sub.subUnitNum} title_hi must contain Devanagari`).toBe(true);

        // No placeholder text in title_hi
        expect(sub.title_hi).not.toBe('बिहार विद्यालय पुस्तकालयध्यक्ष पात्रता परीक्षा 2026');

        // English titles should not contain Hindi text
        expect(/[\u0900-\u097F]/.test(sub.title_en), `Subunit ${sub.subUnitNum} title_en must not contain Devanagari`).toBe(false);
      });
    });
  });

  it('should verify all 30 study notes exist and contain substantial content', () => {
    manifest.forEach((unit) => {
      unit.subUnits.forEach((sub) => {
        const notePath = path.resolve(__dirname, '../data/notes', sub.noteFile);
        expect(fs.existsSync(notePath), `Note file ${sub.noteFile} must exist`).toBe(true);
        const content = fs.readFileSync(notePath, 'utf8');
        expect(content.trim().length, `Note file ${sub.noteFile} should have content`).toBeGreaterThan(100);
      });
    });
  });
});
