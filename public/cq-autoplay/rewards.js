// After a win the rider earns the XP, then picks ONE branch reward: heal or coins.
// Healing is a share of max HP per defeated enemy, so it stays meaningful at every level.
export const HEAL_PERCENT_PER_ENEMY = 35;

// Slow healing between fights while pedaling. Easy spinning heals twice as fast.
export const HEALING = Object.freeze({
  percentPerMinute: 1.5,
  easyPercentPerMinute: 3,
  easyEffort: 0.55, // at or below 55% FTP counts as easy
  encounterMinPercent: 20, // random encounters wait until HP is back to 20%
  lossHPPercent: 50, // losing a battle leaves you at half HP...
  lossCoinPercent: 10 // ...and drops 10% of your coins
});

export function regenPerSecond(maxHP, effort) {
  const rate =
    effort > 0 && effort <= HEALING.easyEffort ? HEALING.easyPercentPerMinute : HEALING.percentPerMinute;
  return (maxHP * rate) / 100 / 60;
}
const healPercentFor = count => Math.min(100, HEAL_PERCENT_PER_ENEMY * count);

export function battleRewards(battle) {
  const count =
    battle.kind === 'enemy' && Array.isArray(battle.enemies)
      ? Math.max(1, Math.min(3, battle.enemies.length))
      : 1;
  const coins = Number.isSafeInteger(battle.coins) && battle.coins >= 0 ? battle.coins : 25 * count;
  return { count, xp: Math.max(0, Number(battle.reward) || 0), healPercent: healPercentFor(count), coins };
}

// Older saves stored a flat `hp` heal. Convert so a pending choice survives the update.
export function normalizePendingReward(value) {
  if (!value || typeof value !== 'object') return value;
  if (value.healPercent === undefined && Number.isFinite(value.hp)) {
    const next = { ...value, healPercent: healPercentFor(value.count) };
    delete next.hp;
    return next;
  }
  return value;
}

export function validPendingReward(value) {
  return (
    !!value &&
    [1, 2, 3].includes(value.count) &&
    value.healPercent === healPercentFor(value.count) &&
    Number.isSafeInteger(value.coins) &&
    value.coins >= 0 &&
    Number.isFinite(value.xp) &&
    value.xp >= 0
  );
}
export function sessionMetrics(state, live) {
  const seconds = Number.isFinite(live.sessionSeconds)
    ? live.sessionSeconds
    : state.session
      ? state.rideSeconds - (state.session.startSeconds ?? state.rideSeconds)
      : 0;
  const miles = Number.isFinite(live.sessionDistanceM)
    ? live.sessionDistanceM / 1609.344
    : state.session
      ? state.rideMiles - state.session.startMiles
      : 0;
  return { seconds: Math.max(0, seconds), miles: Math.max(0, miles) };
}
