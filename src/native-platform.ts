/**
 * Native-platform boundary for Ride Breakaway.
 * Keep web Bluetooth untouched on desktop; iOS uses a separate CoreBluetooth
 * bridge implemented in the native Xcode target in a later integration step.
 */
export type BreakawayPlatform = 'web' | 'ios' | 'android';

export function getBreakawayPlatform(): BreakawayPlatform {
  const capacitor = (globalThis as typeof globalThis & {
    Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean };
  }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return 'web';
  const platform = capacitor.getPlatform?.();
  return platform === 'ios' || platform === 'android' ? platform : 'web';
}

export function supportsWebBluetooth(): boolean {
  return getBreakawayPlatform() === 'web' &&
    typeof navigator !== 'undefined' &&
    'bluetooth' in navigator;
}

export function nativeTrainerBridgeStatus(): 'not-installed' | 'available' {
  const capacitor = (globalThis as typeof globalThis & {
    Capacitor?: { Plugins?: Record<string, unknown> };
  }).Capacitor;
  return getBreakawayPlatform() === 'ios' &&
    capacitor?.Plugins?.BreakawayTrainer
    ? 'available' : 'not-installed';
}
