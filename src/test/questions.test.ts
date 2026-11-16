import { describe, it, expect } from 'vitest';
import manifest from '../data/manifest.json';
import allQuestions from '../data/questions/all_questions.json';
import fs from 'fs';
import path from 'path';

describe('Bihar SLET 2026 Content Schema & Data Integrity Tests', () => {
  it('should have all 10 syllabus units defined', () => {
    expect(manifest.length).toBe(10);
    const unitNums = manifest.map(u => u.num);
    expect(unitNums).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('should have exactly 30 subunits across all units', () => {
    const totalSubunits = manifest.reduce((acc, u) => acc + u.subUnits.length, 0);
    expect(totalSubunits).toBe(30);
  });

  it('should contain exactly 445 verified exam questions', () => {
    expect(allQuestions.length).toBe(445);
  });

  it('should ensure every question adheres to strict bilingual exam schema', () => {
    allQuestions.forEach((q, index) => {
      // Question ID and texts
      expect(q.id, `Q#${index} must have a valid id`).toBeGreaterThan(0);
      expect(typeof q.q_hi).toBe('string');
      expect(q.q_hi.trim().length, `Q#${index} q_hi must not be empty`).toBeGreaterThan(5);
      expect(typeof q.q_en).toBe('string');
      expect(q.q_en.trim().length, `Q#${index} q_en must not be empty`).toBeGreaterThan(5);

      // Options
      expect(Array.isArray(q.options_hi), `Q#${index} options_hi must be an array`).toBe(true);
      expect(q.options_hi.length, `Q#${index} must have exactly 4 Hindi options`).toBe(4);
      q.options_hi.forEach((opt: string, optIdx: number) => {
        expect(typeof opt).toBe('string');
        expect(opt.trim().length, `Q#${index} Hindi option #${optIdx} cannot be empty`).toBeGreaterThan(0);
      });

      expect(Array.isArray(q.options_en), `Q#${index} options_en must be an array`).toBe(true);
      expect(q.options_en.length, `Q#${index} must have exactly 4 English options`).toBe(4);
      q.options_en.forEach((opt: string, optIdx: number) => {
        expect(typeof opt).toBe('string');
        expect(opt.trim().length, `Q#${index} English option #${optIdx} cannot be empty`).toBeGreaterThan(0);
      });

      // Correct answer index (0, 1, 2, or 3)
      expect(typeof q.correct).toBe('number');
      expect([0, 1, 2, 3]).toContain(q.correct);

      // Explanations
      expect(typeof q.exp_hi).toBe('string');
      expect(q.exp_hi.trim().length, `Q#${index} exp_hi must not be empty`).toBeGreaterThan(5);
      expect(typeof q.exp_en).toBe('string');
      expect(q.exp_en.trim().length, `Q#${index} exp_en must not be empty`).toBeGreaterThan(5);
    });
  });

  it('should verify all 30 markdown study notes exist and have non-empty content', () => {
    manifest.forEach(unit => {
      unit.subUnits.forEach(sub => {
        const notePath = path.resolve(__dirname, '../data/notes', sub.noteFile);
        expect(fs.existsSync(notePath), `Note file ${sub.noteFile} must exist`).toBe(true);
        const content = fs.readFileSync(notePath, 'utf-8');
        expect(content.trim().length, `Note file ${sub.noteFile} must not be empty`).toBeGreaterThan(100);
      });
    });
  });
});
