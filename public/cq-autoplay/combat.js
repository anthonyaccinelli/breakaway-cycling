// Combat rules: enemy stats, chapter difficulty, rider damage and battle resolution.
// Battles are "ride until they die": no phases or special moves. Riding above FTP lands
// critical hits. Every tuning number lives in BALANCE (see scripts/simulate-balance.mjs).
import { MONSTERS } from './monsters.js';
import { CHAPTER_COUNT, chapterInfo, chapterRoster } from './chapters.js';

export { MONSTERS };
export const COMBAT_VERSION = 3;
export const MAX_ENEMY_LEVEL = 1000;

export const BALANCE = Object.freeze({
  // Rider damage per second at 100% FTP with 100 attack (a level 1 rider on a stock bike).
  referenceWatts: 250,
  // Enemy HP grows at the same rate as rider attack, and enemy attack at the same rate as
  // rider HP, so a fight between equal levels feels the same in Chapter 1 and Chapter 10.
  enemyHPBase: 8400,
  enemyHPGrowth: 1.08,
  enemyAttackBase: 0.4,
  enemyAttackGrowth: 1.06,
  // Fixed difficulty per chapter: enemy levels climb 4.5 per chapter and 1 per 25 miles.
  chapterLevelStep: 4.5,
  levelSpread: 2,
  boss: { hp: 3.5, attack: 1.3, xp: 3 },
  summit: { hp: 2.5, attack: 1.2, xp: 2 },
  xp: { base: 100, perLevel: 15 },
  coins: { base: 20, perLevel: 4 },
  // The heal reward restores this share of max HP per defeated enemy.
  healPercentPerEnemy: 35,
  // Summit bosses can be escaped by not pedaling for this long.
  summitEscapeSeconds: 15
});

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const roll = random => clamp(Number(random()) || 0, 0, 1 - Number.EPSILON);
const pick = (list, random) => list[Math.floor(roll(random) * list.length)];
const ownLevel = value => clamp(Math.floor(Number(value) || 1), 1, MAX_ENEMY_LEVEL);
const cents = value => Math.round(value * 100) / 100;
const species = new Map(MONSTERS.map(m => [m.id, m]));
const clampChapter = chapter => clamp(Math.floor(Number(chapter) || 1), 1, CHAPTER_COUNT);

// ---- Rider damage ---------------------------------------------------------------

// Effort is watts as a share of FTP, so every rider deals the same damage at the same effort.
export function effortShare(watts, ftp) {
  const w = Math.max(0, Number(watts) || 0);
  const f = Math.max(1, Number(ftp) || 0);
  return w / f;
}

// Above FTP every 1% extra effort adds 1% damage: 110% FTP is a +10% crit, 200% is +100%.
export function critBonus(effort) {
  return Math.max(0, effort - 1);
}

export function riderDamagePerSecond(attack, watts, ftp) {
  const effort = effortShare(watts, ftp);
  return (attack / 100) * BALANCE.referenceWatts * effort * (1 + critBonus(effort));
}

// ---- Chapter difficulty -----------------------------------------------------------

export function chapterBaseLevel(chapter) {
  return 1 + Math.round(BALANCE.chapterLevelStep * (clampChapter(chapter) - 1));
}

// Content levels only. Rider level, FTP and watts are never inputs.
// Pass miles = null for Freeroam, which uses the chapter's whole range.
export function chapterLevels(chapter = 1, miles = 0) {
  const base = chapterBaseLevel(chapter);
  const top = base + 3 + BALANCE.levelSpread;
  if (miles === null) return { min: base, max: top, boss: top };
  const quarter = clamp(Math.floor((Number(miles) || 0) / 25), 0, 3);
  return { min: base + quarter, max: base + quarter + BALANCE.levelSpread, boss: top };
}

export function encounterLevel(chapter, miles, random = Math.random) {
  const { min, max } = chapterLevels(chapter, miles);
  return min + Math.floor(roll(random) * (max - min + 1));
}

export const enemyXP = level => BALANCE.xp.base + BALANCE.xp.perLevel * (ownLevel(level) - 1);
export const enemyCoins = level => BALANCE.coins.base + BALANCE.coins.perLevel * (ownLevel(level) - 1);

export function chapterMonsters(chapter) {
  return chapterRoster(chapter).map(id => species.get(id));
}

// Shuffled bag: every roster monster appears once before any repeats, never twice in a row.
export function nextChapterEncounter(chapter, previousState, random = Math.random) {
  const state = previousState?.chapter === chapter ? previousState : null;
  const ids = chapterRoster(chapter);
  const valid = new Set(ids);
  let bag = Array.isArray(state?.bag)
    ? state.bag.filter((id, i, a) => valid.has(id) && a.indexOf(id) === i)
    : [];
  const last = valid.has(state?.last) ? state.last : null;
  if (!bag.length) {
    bag = [...ids];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(roll(random) * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[0] === last) [bag[0], bag[1]] = [bag[1], bag[0]];
  }
  const monsterId = bag.shift();
  return { monsterId, state: { chapter, bag, last: monsterId } };
}

// Summit bosses appear at the top of categorized climbs.
export const SUMMIT_BOSSES = Object.freeze([
  'lifted-dually',
  'oni',
  'silver-dragon-wyrmling',
  'kraken',
  'ancient-green-dragon',
  'young-bronze-dragon',
  'doppelganger',
  'behir',
  'remorhaz',
  'roc',
  'storm-giant',
  'wyvern'
]);

// ---- Battles ---------------------------------------------------------------------

// Single definition of HP, attack, XP and coins for every species/level pair.
export function makeBattle(kind, { chapter = 1, level, monsterId, random = Math.random } = {}) {
  if (!['enemy', 'boss', 'summit'].includes(kind)) throw Error('Unknown battle kind');
  const levels = chapterLevels(chapter, null);
  let monster, L, scale;
  if (kind === 'boss') {
    L = levels.boss;
    monster = species.get(monsterId) || species.get(chapterInfo(clampChapter(chapter)).boss);
    scale = BALANCE.boss;
  } else if (kind === 'summit') {
    L = levels.boss;
    monster = species.get(SUMMIT_BOSSES.includes(monsterId) ? monsterId : pick(SUMMIT_BOSSES, random));
    scale = BALANCE.summit;
  } else {
    L = ownLevel(level ?? chapterLevels(chapter).min);
    monster = species.get(monsterId) || pick(chapterMonsters(chapter), random);
    scale = { hp: 1, attack: 1, xp: 1 };
  }
  monster ||= { id: 'lifted-dually', name: 'Lifted Dually', baseHP: 9000, baseAttack: 0.2 };
  const healthFactor = monster.baseHP / 9000;
  const attackFactor = monster.baseAttack / 0.2;
  const hp = Math.round(BALANCE.enemyHPBase * healthFactor * BALANCE.enemyHPGrowth ** (L - 1) * scale.hp);
  const dps = cents(
    BALANCE.enemyAttackBase * attackFactor * BALANCE.enemyAttackGrowth ** (L - 1) * scale.attack
  );
  return {
    combatVersion: COMBAT_VERSION,
    kind,
    monsterId: monster.id,
    name: monster.name.toUpperCase(),
    level: L,
    hp,
    max: hp,
    dps,
    reward: Math.round(enemyXP(L) * scale.xp),
    coins: enemyCoins(L)
  };
}

export function enemyGroup(battles) {
  if (!Array.isArray(battles) || battles.length < 1 || battles.length > 3)
    throw Error('An encounter needs one to three enemies');
  const enemies = battles.map(b => ({
    id: b.monsterId,
    name: b.name,
    level: b.level,
    hp: b.hp,
    max: b.max,
    dps: b.dps,
    reward: b.reward,
    coins: b.coins
  }));
  return {
    ...battles[0],
    name: enemies.length === 1 ? enemies[0].name : enemies.length + ' ENEMIES',
    enemies,
    hp: enemies.reduce((n, e) => n + e.hp, 0),
    max: enemies.reduce((n, e) => n + e.max, 0),
    dps: enemies.filter(e => e.hp > 0).reduce((n, e) => n + e.dps, 0),
    reward: enemies.reduce((n, e) => n + e.reward, 0),
    coins: enemies.reduce((n, e) => n + (e.coins || 0), 0)
  };
}

// Resolve kills within the tick. Dead enemies stop attacking immediately.
// Reaching 1 HP is a loss; group damage focuses the first living enemy.
export function advanceBattle(battle, playerHP, damagePerSecond, dt) {
  const b = { ...battle, enemies: battle.enemies?.map(e => ({ ...e })) };
  let hp = Math.max(1, playerHP),
    remaining = Math.max(0, dt),
    killed = 0,
    outcome = null;
  const outgoing = Math.max(0, Number(damagePerSecond) || 0),
    group = Array.isArray(b.enemies),
    targets = group ? b.enemies : [b];
  while (remaining > 1e-9) {
    const target = targets.find(e => e.hp > 1e-7);
    if (!target) {
      outcome = hp <= 1 ? 'loss' : 'win';
      break;
    }
    const incoming = group ? targets.filter(e => e.hp > 1e-7).reduce((n, e) => n + e.dps, 0) : b.dps;
    const death = incoming > 0 ? (hp - 1) / incoming : Infinity,
      kill = outgoing > 0 ? target.hp / outgoing : Infinity,
      elapsed = Math.min(remaining, death, kill);
    if (outgoing > 0) target.hp = Math.max(0, target.hp - outgoing * elapsed);
    hp = Math.max(1, hp - incoming * elapsed);
    remaining -= elapsed;
    if (kill <= elapsed + 1e-9) {
      target.hp = 0;
      if (group) killed++;
    }
    if (death <= elapsed + 1e-9) {
      outcome = 'loss';
      break;
    }
    if (targets.every(e => e.hp <= 1e-7)) {
      outcome = 'win';
      break;
    }
    if (elapsed <= 1e-9) break;
  }
  if (group) {
    b.hp = targets.reduce((n, e) => n + e.hp, 0);
    b.dps = targets.filter(e => e.hp > 1e-7).reduce((n, e) => n + e.dps, 0);
  }
  return { battle: b, hp, killed, outcome };
}

// Chapter and summit bosses fight like everyone else. A summit boss is optional:
// stop pedaling for BALANCE.summitEscapeSeconds to ride away from it.
export function advanceBossBattle(battle, playerHP, damagePerSecond, dt, { watts = 0, cadence = 0 } = {}) {
  let b = { ...battle };
  const stopped = watts < 10 && cadence <= 0;
  if (b.kind === 'summit') {
    const escapeLeft = Math.max(0, BALANCE.summitEscapeSeconds - (b.stopped || 0));
    if (stopped && dt >= escapeLeft) {
      const result = advanceBattle(b, playerHP, damagePerSecond, escapeLeft);
      if (result.outcome) return { ...result, killed: 0 };
      return {
        battle: { ...result.battle, stopped: BALANCE.summitEscapeSeconds },
        hp: result.hp,
        killed: 0,
        outcome: 'flee'
      };
    }
    b.stopped = stopped ? (b.stopped || 0) + dt : 0;
  }
  const result = advanceBattle(b, playerHP, damagePerSecond, dt);
  return { ...result, battle: { ...result.battle, stopped: b.stopped }, killed: 0 };
}
