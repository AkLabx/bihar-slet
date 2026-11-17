import { describe, it, expect, beforeEach } from 'vitest';
import { isSoundMuted, setSoundMuted } from '../services/sound';
import { triggerHaptic, setHapticsEnabled } from '../services/haptics';

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
});
