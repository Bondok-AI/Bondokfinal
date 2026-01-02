/**
 * Utility hooks and functions for mobile interactions
 */

// Haptic feedback patterns
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  selection: 10,
  success: [10, 50, 20],
  warning: [20, 30, 20],
  error: [30, 50, 30, 50, 30]
};

/**
 * Trigger haptic feedback on supported devices
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (!('vibrate' in navigator)) return;
  
  const pattern = HAPTIC_PATTERNS[style];
  navigator.vibrate(pattern);
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if device is in low power mode (approximation)
 * Uses battery API if available
 */
export async function isLowPowerMode(): Promise<boolean> {
  try {
    // @ts-ignore - Battery API not fully typed
    const battery = await navigator.getBattery?.();
    if (battery) {
      return battery.level < 0.2 && !battery.charging;
    }
  } catch {
    // Battery API not supported
  }
  return false;
}

/**
 * Get animation duration based on user preferences
 */
export function getAnimationDuration(baseDuration: number): number {
  if (prefersReducedMotion()) return 0;
  return baseDuration;
}

/**
 * Check if touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if iOS device
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Check if Android device
 */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if PWA is installed
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

/**
 * Request persistent storage for PWA
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  
  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) return true;
    
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Get safe area insets (for programmatic use)
 */
export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10)
  };
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
