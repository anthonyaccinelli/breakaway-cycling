// Stamina: the rider's reserve for riding above FTP (physiologists call it W′).
// Riding above FTP drains it, in battles and while exploring, climbs included. Riding easily
// refills it. Between the two it holds steady. Below 25% the rider is exhausted and deals
// less damage. Casual riders who stay under FTP never lose any.
export const STAMINA = Object.freeze({
  max: 100,
  // % of the bar per second for each 100% of FTP above threshold. Matches a W′ of about
  // 80 × FTP joules (20 kJ at 250 W): 150% FTP empties a full bar in about 2.7 minutes.
  drainPerSecondPerFTP: 1.25,
  // Refill at or below this effort (share of FTP), at this many % per second (full in ~3 min).
  recoverBelowEffort: 0.75,
  recoverPerSecond: 0.6,
  // Exhausted below this, with damage multiplied by exhaustedDamage.
  exhaustedBelow: 25,
  exhaustedDamage: 0.6
});

export function advanceStamina(stamina, effort, dt) {
  const current = Number.isFinite(stamina) ? stamina : STAMINA.max;
  const seconds = Math.max(0, Number(dt) || 0);
  const e = Math.max(0, Number(effort) || 0);
  let next = current;
  if (e > 1) next -= (e - 1) * STAMINA.drainPerSecondPerFTP * seconds;
  else if (e <= STAMINA.recoverBelowEffort) next += STAMINA.recoverPerSecond * seconds;
  return Math.max(0, Math.min(STAMINA.max, next));
}

export const isExhausted = stamina => Number.isFinite(stamina) && stamina < STAMINA.exhaustedBelow;

export function staminaDamageMultiplier(stamina) {
  return isExhausted(stamina) ? STAMINA.exhaustedDamage : 1;
}

export const validStamina = value => Number.isFinite(value) && value >= 0 && value <= STAMINA.max;
