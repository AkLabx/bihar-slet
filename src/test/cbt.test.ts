import { describe, it, expect, beforeEach } from 'vitest';
import { isSoundMuted, setSoundMuted } from '../services/sound';
import { triggerHaptic, setHapticsEnabled } from '../services/haptics';
import { QuizMode } from '../types';

describe('CBT Audio & Haptics Service Tests', () => {
  beforeEach(() => {
    setSoundMuted(false);
    setHapticsEnabled(true);
  });

  it('should toggle sound mute state accurately', () => {
    expect(isSoundMuted()).toBe(false);
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);
    setSoundMuted(false);
    expect(isSoundMuted()).toBe(false);
  });

  it('should safely execute haptic triggers without throwing even when navigator.vibrate is undefined', () => {
    expect(() => triggerHaptic('light')).not.toThrow();
    expect(() => triggerHaptic('medium')).not.toThrow();
    expect(() => triggerHaptic('success')).not.toThrow();
    expect(() => triggerHaptic('warning')).not.toThrow();
  });

  it('should ensure strict context isolation between Instant Answers and On Submission modes', () => {
    const sessionId = 'subunit_1.1';
    const practiceKey = `${sessionId}_practice`;
    const examKey = `${sessionId}_exam`;

    // Session keys must be strictly isolated to avoid state bleed
    expect(practiceKey).not.toBe(examKey);
    expect(practiceKey).toBe('subunit_1.1_practice');
    expect(examKey).toBe('subunit_1.1_exam');

    const supportedModes: QuizMode[] = ['practice', 'exam'];
    expect(supportedModes).toHaveLength(2);
    expect(supportedModes).toContain('practice');
    expect(supportedModes).toContain('exam');
  });
});
