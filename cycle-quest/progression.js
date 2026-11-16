// Rider progression: the single source of truth for XP per level, HP and attack.
// Everything that needs a rider level (HUD, bike shop limits, level-ups) imports from here.
// Tuned with scripts/simulate-balance.mjs: about one level per hour of riding at any fitness.

export const MAX_XP = 10_000_000;

// XP needed to go from `level` to `level + 1`.
const FIRST_LEVEL_COST = 5000;
const COST_GROWTH = 300;

// Rider attack and HP grow at the same rates as enemy HP and attack (see combat.js BALANCE),
// so out-leveling a chapter makes it feel easier, and being under-leveled makes it harder.
const ATTACK_GROWTH = 1.08;
const HP_GROWTH = 1.06;

export function levelCost(level) {
  return FIRST_LEVEL_COST + COST_GROWTH * (level - 1);
}

// Total XP a rider needs to *reach* `level` (level 1 needs 0).
export function xpForLevel(level) {
  const n = Math.max(0, level - 1);
  return n * FIRST_LEVEL_COST + (COST_GROWTH / 2) * n * (n - 1);
}

// Level for a total XP amount. Closed form, so it is cheap to call every frame.
export function levelFromXP(xp) {
  const total = Math.max(0, Number(xp) || 0);
  // xpForLevel(n + 1) = a·n² + b·n with a = COST_GROWTH / 2, b = FIRST_LEVEL_COST − a.
  const a = COST_GROWTH / 2;
  const b = FIRST_LEVEL_COST - a;
  let level = 1 + Math.floor((-b + Math.sqrt(b * b + 4 * a * total)) / (2 * a));
  // Guard against floating-point edges right at a level boundary.
  while (xpForLevel(level + 1) <= total) level++;
  while (level > 1 && xpForLevel(level) > total) level--;
  return level;
}

// Base stats before bike-part bonuses.
export function baseMaxHP(level) {
  return Math.round(100 * HP_GROWTH ** (level - 1));
}

export function baseAttack(level) {
  return 100 * ATTACK_GROWTH ** (level - 1);
}
