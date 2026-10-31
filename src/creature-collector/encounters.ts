/**
 * Separate creature-collector gameplay primitives.
 * Not connected to Cycle Quest, Classic or Survival; the future collector mode
 * will be the sole caller. Trainer FTMS ownership remains in src/main.ts.
 */
export type CreaturePersonality =
  | 'shy' | 'calm' | 'energetic' | 'playful'
  | 'stubborn' | 'unpredictable' | 'chaotic';

export const CREATURE_PERSONALITIES: readonly CreaturePersonality[] = Object.freeze([
  'shy', 'calm', 'energetic', 'playful', 'stubborn', 'unpredictable', 'chaotic'
]);

/**
 * Creature encounters are passive overlays on an uninterrupted ride.
 *
 * This module deliberately never owns FTMS, resistance, gradient,
 * route position, speed, odometer, or ride samples. The existing ride engine
 * continues to advance using the real route while a creature is visible.
 *
 * Future personality evaluation may read smoothed power telemetry but must
 * never command or override trainer behavior.
 */

/** Hash-based, reproducible roll. Do not reroll when a ride restarts. */
function roll(seed: number, block: number, salt: number): number {
  let x = (seed | 0) ^ Math.imul(block + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b);
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export type ChaoticAppearance = {id: string; mile: number};

/**
 * One or two optional Chaotic appearances in each 50-mile LIFETIME-riding
 * block, spaced apart and deterministic for a persistent player seed.
 * No guarantee of a capture. Never schedule from per-route mileage: short
 * rides must contribute toward the same fifty-mile window.
 */
export function chaoticAppearancesForBlock(block: number, playerSeed: number): ChaoticAppearance[] {
  if (!Number.isInteger(block) || block < 0) return [];
  const base = block * 50;
  const two = roll(playerSeed, block, 0) < .5;
  return two ? [
    {id: `chaotic-${block}-0`, mile: base + 5 + 17 * roll(playerSeed, block, 1)},
    {id: `chaotic-${block}-1`, mile: base + 28 + 17 * roll(playerSeed, block, 2)}
  ] : [
    {id: `chaotic-${block}-0`, mile: base + 8 + 34 * roll(playerSeed, block, 1)}
  ];
}

/** Only announce previously unpassed appearances when Chaotic is enabled. */
export function chaoticAppearancesCrossed(
  beforeLifetimeMiles: number,
  afterLifetimeMiles: number,
  playerSeed: number,
  enabled: boolean
): ChaoticAppearance[] {
  if (!enabled || !Number.isFinite(beforeLifetimeMiles) || !Number.isFinite(afterLifetimeMiles) ||
      afterLifetimeMiles <= beforeLifetimeMiles) return [];
  const first = Math.floor(Math.max(0, beforeLifetimeMiles) / 50);
  const last = Math.floor(Math.max(0, afterLifetimeMiles) / 50);
  const appearances: ChaoticAppearance[] = [];
  for (let block = first; block <= last; block++) {
    for (const appearance of chaoticAppearancesForBlock(block, playerSeed)) {
      if (appearance.mile > beforeLifetimeMiles && appearance.mile <= afterLifetimeMiles) {
        appearances.push(appearance);
      }
    }
  }
  return appearances.sort((a, b) => a.mile - b.mile);
}

/**
 * Chaotic is opt-in, never a compulsory Zone 2 task. A rider's best 10-second
 * power must be calibrated or explicitly provided; FTP alone does not
 * describe their near-maximal short-duration ability.
 */
export function chaoticTargetWatts(bestTenSecondWatts: number): number | null {
  return Number.isFinite(bestTenSecondWatts) && bestTenSecondWatts > 0
    ? Math.round(bestTenSecondWatts * .9)
    : null;
}

export type ChaoticAttempt = {
  targetWatts: number;
  requiredSeconds: number;
  patienceSeconds: number;
  sustainedSeconds: number;
  result: 'active' | 'captured' | 'escaped';
};

export function newChaoticAttempt(targetWatts: number, requiredSeconds = 10, patienceSeconds = 40): ChaoticAttempt {
  if (!(targetWatts > 0) || !(requiredSeconds > 0) || !(patienceSeconds >= requiredSeconds))
    throw new RangeError('Invalid calibrated capture challenge');
  return {targetWatts, requiredSeconds, patienceSeconds, sustainedSeconds: 0, result: 'active'};
}

export function advanceChaoticAttempt(attempt: ChaoticAttempt, seconds: number, watts: number): ChaoticAttempt {
  if (attempt.result !== 'active' || !Number.isFinite(seconds) || seconds <= 0) return attempt;
  const dt = Math.min(seconds, 3);
  const sustainedSeconds = watts >= attempt.targetWatts ? attempt.sustainedSeconds + dt : 0;
  const patienceSeconds = Math.max(0, attempt.patienceSeconds - dt);
  const result = sustainedSeconds >= attempt.requiredSeconds ? 'captured' :
    patienceSeconds <= 0 ? 'escaped' : 'active';
  return {...attempt, sustainedSeconds, patienceSeconds, result};
}
