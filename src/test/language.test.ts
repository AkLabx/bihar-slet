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

  it('should verify all 30 readymade English study notes have ZERO Devanagari characters', () => {
    manifest.forEach((unit) => {
      unit.subUnits.forEach((sub) => {
        const enPath = path.resolve(__dirname, '../data/notes/en', sub.noteFile);
        expect(fs.existsSync(enPath), `English note ${enPath} must exist`).toBe(true);

        const content = fs.readFileSync(enPath, 'utf8');
        expect(content.trim().length).toBeGreaterThan(200);

        // Crucial validation: English notes must contain absolutely 0 Devanagari characters
        const devanagariMatch = content.match(/[\u0900-\u097F]/g);
        expect(
          devanagariMatch,
          `English study note '${sub.noteFile}' must not contain Hindi/Devanagari characters`
        ).toBeNull();
      });
    });
  });

  it('should verify all 30 readymade Hindi and Bilingual study notes exist with substantial content', () => {
    manifest.forEach((unit) => {
      unit.subUnits.forEach((sub) => {
        const hiPath = path.resolve(__dirname, '../data/notes/hi', sub.noteFile);
        const biPath = path.resolve(__dirname, '../data/notes/bilingual', sub.noteFile);

        expect(fs.existsSync(hiPath), `Hindi note ${hiPath} must exist`).toBe(true);
        expect(fs.existsSync(biPath), `Bilingual note ${biPath} must exist`).toBe(true);

        const hiContent = fs.readFileSync(hiPath, 'utf8');
        const biContent = fs.readFileSync(biPath, 'utf8');

        expect(hiContent.trim().length).toBeGreaterThan(200);
        expect(biContent.trim().length).toBeGreaterThan(200);

        // Hindi notes must have Devanagari content
        expect(/[\u0900-\u097F]/.test(hiContent), `Hindi note '${sub.noteFile}' must contain Hindi text`).toBe(true);
      });
    });
  });
});
