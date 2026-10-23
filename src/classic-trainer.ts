/** Classic ("dumb") trainer telemetry and virtual road-speed primitives.
 * This module has no Bluetooth side effects and cannot send resistance commands.
 */
export type ClassicSensorMode = 'power' | 'wheel-speed' | 'cadence' | 'heart-rate';
export type ClassicTrainerSettings = {
  riderKg: number;
  bikeKg: number;
  crr: number;
  cdA: number;
  wheelCircumferenceMm: number;
};
export const DEFAULT_CLASSIC_SETTINGS: ClassicTrainerSettings = {
  riderKg: 80, bikeKg: 10, crr: 0.005, cdA: 0.38,
  wheelCircumferenceMm: 2105,
};
export function parseCyclingPowerMeasurement(value: DataView): number {
  if (value.byteLength < 4) throw new Error('Short Cycling Power Measurement');
  return value.getInt16(2, true); // 0x2A63: flags uint16 + instantaneous watts int16
}
export type WheelRevolution = { revolutions: number; eventTime: number };
/** CSC 0x2A5B wheel revolutions, with 1/1024 second rollover timestamps. */
export function parseWheelRevolution(value: DataView): WheelRevolution | null {
  if (value.byteLength < 1) throw new Error('Short CSC Measurement');
  if (!(value.getUint8(0) & 1)) return null;
  if (value.byteLength < 7) throw new Error('Short CSC wheel data');
  return { revolutions: value.getUint32(1, true), eventTime: value.getUint16(5, true) };
}
export function wheelSpeedMps(previous: WheelRevolution, next: WheelRevolution, circumferenceMm: number): number | null {
  const turns = (next.revolutions - previous.revolutions) >>> 0;
  const ticks = (next.eventTime - previous.eventTime + 65536) % 65536;
  if (!ticks || turns > 100 || !Number.isFinite(circumferenceMm) || circumferenceMm < 500 || circumferenceMm > 4000) return null;
  return Math.min(35, turns * circumferenceMm / 1000 / (ticks / 1024));
}
/** Physics-derived virtual road speed for measured power, including grade.
 * Semi-implicit stepping prevents instant jumps in speed on steep gradients.
 */
export function stepPowerSpeed(
  speedMps: number, watts: number, gradePercent: number, dtSeconds: number,
  settings: ClassicTrainerSettings = DEFAULT_CLASSIC_SETTINGS,
): number {
  const mass = Math.max(35, settings.riderKg + settings.bikeKg);
  const grade = Math.atan(Math.max(-25, Math.min(25, gradePercent)) / 100);
  const dt = Math.max(0, Math.min(3, dtSeconds));
  const v = Math.max(0, Math.min(35, speedMps));
  const drive = Math.min(700, Math.max(0, watts) * 0.975 / Math.max(1.5, v));
  const gravity = mass * 9.80665 * Math.sin(grade);
  const rolling = mass * 9.80665 * Math.cos(grade) * Math.max(0, settings.crr);
  const aero = 0.5 * 1.225 * Math.max(0.1, settings.cdA) * v * v;
  return Math.max(0, Math.min(35, v + (drive - gravity - rolling - aero) / mass * dt));
}
export type ClassicSpeedPolicy = 'grade-aware-power' | 'measured-wheel' | 'estimated-effort';
export function speedPolicy(mode: ClassicSensorMode): ClassicSpeedPolicy {
  return mode === 'power' ? 'grade-aware-power' : mode === 'wheel-speed' ? 'measured-wheel' : 'estimated-effort';
}
