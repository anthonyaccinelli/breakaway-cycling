// Stamina: how long the rider can keep pushing. Hard riding (from 85% FTP) drains it, in
// battles and while exploring, climbs included; above FTP it drains much faster. Easy riding
// (70% FTP or less) refills it, and between the two it holds steady. Below 25% the rider is
// exhausted and deals less damage.
export const STAMINA = Object.freeze({
  max: 100,
  // Drains from 85% FTP. Between 85% and FTP the drain ramps up to `atFTP` % per second
  // (90% FTP empties the bar in ~30 min, FTP in 10 min); above FTP it adds `perFTPAbove`
  // % per second for each 100% of FTP (120% ≈ 3 min, 150% ≈ 1.5 min).
  drainFromEffort: 0.85,
  drainAtFTP: 100 / 600,
  drainPerFTPAbove: 1.95,
  // Refill at or below this effort (share of FTP), at this many % per second (full in ~3 min).
  // Between 70% and 85% FTP it holds steady.
  recoverBelowEffort: 0.7,
  recoverPerSecond: 0.6,
  // Exhausted below this, with damage multiplied by exhaustedDamage.
  exhaustedBelow: 25,
  exhaustedDamage: 0.6
});

// `efficiency` comes from the bike's tires (bike-parts.js → staminaEfficiency): drain is
// divided by it and refill multiplied by it. 1 = stock tires.
export function advanceStamina(stamina, effort, dt, efficiency = 1) {
  const k = Number.isFinite(efficiency) && efficiency > 0 ? efficiency : 1;
  const current = Number.isFinite(stamina) ? stamina : STAMINA.max;
  const seconds = Math.max(0, Number(dt) || 0);
  const e = Math.max(0, Number(effort) || 0);
  let next = current;
  if (e > 1) next -= ((STAMINA.drainAtFTP + (e - 1) * STAMINA.drainPerFTPAbove) * seconds) / k;
  else if (e > STAMINA.drainFromEffort)
    next -=
      ((STAMINA.drainAtFTP * (e - STAMINA.drainFromEffort)) / (1 - STAMINA.drainFromEffort)) * (seconds / k);
  else if (e <= STAMINA.recoverBelowEffort) next += STAMINA.recoverPerSecond * seconds * k;
  return Math.max(0, Math.min(STAMINA.max, next));
}

export const isExhausted = stamina => Number.isFinite(stamina) && stamina < STAMINA.exhaustedBelow;

export function staminaDamageMultiplier(stamina) {
  return isExhausted(stamina) ? STAMINA.exhaustedDamage : 1;
}

export const validStamina = value => Number.isFinite(value) && value >= 0 && value <= STAMINA.max;
