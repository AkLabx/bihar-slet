/**
 * Haptic feedback utility using the Web Vibration API.
 * Safely feature-detects navigator.vibrate.
 */

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): void {
  if (!hapticsEnabled || typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        // Short subtle tap for option selection
        navigator.vibrate(10);
        break;
      case 'medium':
        // Action confirmation (Next / Prev / Clear)
        navigator.vibrate(20);
        break;
      case 'success':
        // Double pulse for review marked or submitted
        navigator.vibrate([15, 40, 20]);
        break;
      case 'warning':
        // Pause or time alert
        navigator.vibrate([30, 50, 30]);
        break;
    }
  } catch {}
}
