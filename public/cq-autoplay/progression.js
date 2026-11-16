// Rider progression: the single source of truth for XP per level, HP and attack.
// Everything that needs a rider level (HUD, bike shop limits, level-ups) imports from here.

export const MAX_XP = 10_000_000;

// XP needed to go from `level` to `level + 1`. Grows by 300 per level, then flattens.
const FIRST_LEVEL_COST = 600;
const COST_GROWTH = 300;
const COST_CAP = 10_800;
const CAP_FROM_LEVEL = 1 + (COST_CAP - FIRST_LEVEL_COST) / COST_GROWTH; // level 35

export function levelCost(level) {
  return Math.min(COST_CAP, FIRST_LEVEL_COST + COST_GROWTH * (level - 1));
}

// Total XP a rider needs to *reach* `level` (level 1 needs 0).
export function xpForLevel(level) {
  const steps = Math.max(0, level - 1);
  const growing = Math.min(steps, CAP_FROM_LEVEL - 1);
  const flat = steps - growing;
  return growing * FIRST_LEVEL_COST + (COST_GROWTH / 2) * growing * (growing - 1) + flat * COST_CAP;
}

// Level for a total XP amount. Closed form, so it is cheap to call every frame.
export function levelFromXP(xp) {
  const total = Math.max(0, Number(xp) || 0);
  const capStart = xpForLevel(CAP_FROM_LEVEL);
  let level;
  if (total >= capStart) {
    level = CAP_FROM_LEVEL + Math.floor((total - capStart) / COST_CAP);
  } else {
    // xpForLevel(n + 1) = 150n² + 450n for n below the cap; solve for n.
    const a = COST_GROWTH / 2;
    const b = FIRST_LEVEL_COST - a;
    level = 1 + Math.floor((-b + Math.sqrt(b * b + 4 * a * total)) / (2 * a));
  }
  // Guard against floating-point edges right at a level boundary.
  while (xpForLevel(level + 1) <= total) level++;
  while (level > 1 && xpForLevel(level) > total) level--;
  return level;
}

// Base stats before bike-part bonuses.
export function baseMaxHP(level) {
  return 100 + 10 * (level - 1);
}

export function baseAttack(level) {
  return 100 * 1.08 ** (level - 1);
}
