// Combat rules: enemy stats, chapter difficulty, rider damage and battle resolution.
// Random encounters are "ride until they die"; summit and chapter bosses fight in phases
// (see BOSS_FIGHT). Riding above FTP lands critical hits. Every tuning number lives in BALANCE (see scripts/simulate-balance.mjs).
import { MONSTERS } from '/api/cycle-quest?asset=monsters.js';
import { CHAPTER_COUNT, chapterInfo, chapterRoster } from '/api/cycle-quest?asset=chapters.js';

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
  boss: { hp: 22, attack: 0.22, xp: 3 },
  summit: { hp: 10.5, attack: 0.35, xp: 2 },
  xp: { base: 65, perLevel: 10 },
  coins: { base: 14, perLevel: 3 },
  // The heal reward restores this share of max HP per defeated enemy.
  healPercentPerEnemy: 35,
  // Random encounters: the gap between fights, and how soon the first one comes in a ride
  // (seconds of riding, min and max).
  encounterGap: [150, 240],
  firstEncounter: [60, 90],
  // Scaled Freeroam: enemies come in at the rider's level minus 0 to this many levels.
  scaledLevelsBelow: 2,
  // Summit bosses can be escaped by not pedaling for this long.
  summitEscapeSeconds: 15,
  // Random encounters wait while the road descends more steeply than this (percent grade).
  steepestEncounterDescent: -3
});

// Riders coasting down a steep descent cannot fight, so random encounters wait for the road
// to level out. Summit and chapter bosses keep their fixed places on the route.
export function encounterAllowedOnGrade(gradePercent) {
  const grade = Number(gradePercent);
  return !Number.isFinite(grade) || grade >= BALANCE.steepestEncounterDescent;
}

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

// Seconds of riding until the next random encounter: ~every 3 minutes, sooner at ride start.
export function encounterDelay(first = false, random = Math.random) {
  const [low, high] = first ? BALANCE.firstEncounter : BALANCE.encounterGap;
  return low + roll(random) * (high - low);
}

// Scaled Freeroam: an enemy level near the rider's own, so quick rides always fit.
export function scaledEncounterLevel(riderLevel, random = Math.random) {
  const top = ownLevel(riderLevel);
  return Math.max(1, top - Math.floor(roll(random) * (BALANCE.scaledLevelsBelow + 1)));
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
    // Scaled Freeroam passes the rider's level; everywhere else a summit boss uses the
    // chapter boss level.
    L = level === undefined ? levels.boss : ownLevel(level);
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

// ---- Boss fights -----------------------------------------------------------------
// Summit and chapter bosses fight in minutes-long phases, so riders ease in and out of
// efforts the way a coached workout would, never a snap from 400 W to 140 W:
//   ATTACK (2.5 min)  ride however you like; the last 15 s are a WIND-UP warning.
//   BRACE  (45–75 s)  hold at or under 75% FTP (the stamina refill zone). The first 5 s are
//                     grace for trainer and power-smoothing lag. The boss stops its steady
//                     attack and lands one big hit at the end; bracing blocks up to 75% of it
//                     and heals a little. The rider deals no damage while bracing.
//   COUNTER (40 s)    double damage if the brace was at least half held; the staggered boss
//                     hits at half strength.
// A summit boss repeats the cycle. A chapter boss gets three braces, each shorter and with a
// bigger hit, then ENRAGES: no more braces and a harder steady attack until someone falls.
// Trainer resistance is never changed by any phase.
export const BOSS_FIGHT = Object.freeze({
  windupSeconds: 15,
  braceEffort: 0.75,
  braceGraceSeconds: 5,
  bigHitSeconds: 120,
  braceBlock: 0.75,
  braceHealPercent: 5,
  counterMultiplier: 2,
  counterNeedsBrace: 0.5,
  counterBossAttack: 0.5,
  summit: { attack: 150, brace: [60], counter: 40, rounds: Infinity, bigHitGrowth: 0 },
  boss: { attack: 150, brace: [75, 60, 45], counter: 40, rounds: 3, bigHitGrowth: 0.25, enrageAttack: 1.5 }
});
const BOSS_PHASES = ['attack', 'brace', 'counter', 'enrage'];

function bossPlan(kind) {
  return kind === 'boss' ? BOSS_FIGHT.boss : BOSS_FIGHT.summit;
}
function braceSeconds(kind, round) {
  const list = bossPlan(kind).brace;
  return list[Math.min(round, list.length - 1)];
}
function phaseLength(b) {
  const plan = bossPlan(b.kind);
  if (b.phase === 'attack') return plan.attack;
  if (b.phase === 'brace') return braceSeconds(b.kind, b.round);
  if (b.phase === 'counter') return plan.counter;
  return Infinity; // enrage
}
// The size of the big hit that ends the current (or next) brace.
export function bigHit(b) {
  const plan = bossPlan(b.kind);
  return b.dps * BOSS_FIGHT.bigHitSeconds * (1 + plan.bigHitGrowth * (b.round || 0));
}

// What the screen needs: phase, seconds left, whether this is the wind-up warning, and how
// well the brace is going. Old saves (no phase, or phases from the 40-second loop) start ATTACK.
export function bossPhase(battle) {
  const b = normalizeBoss(battle);
  const left = Math.max(0, phaseLength(b) - b.phaseTime);
  const scoring = Math.max(1, braceSeconds(b.kind, b.round) - BOSS_FIGHT.braceGraceSeconds);
  return {
    phase: b.phase,
    secondsLeft: left,
    windup: b.phase === 'attack' && left <= BOSS_FIGHT.windupSeconds,
    grace: b.phase === 'brace' && b.phaseTime < BOSS_FIGHT.braceGraceSeconds,
    braceShare: Math.min(1, (b.bracedSeconds || 0) / scoring),
    counterLanded: b.phase === 'counter' && (b.lastBrace || 0) >= BOSS_FIGHT.counterNeedsBrace,
    round: b.round,
    braceEffort: BOSS_FIGHT.braceEffort,
    bigHit: bigHit(b)
  };
}

function normalizeBoss(battle) {
  const b = { ...battle };
  if (!BOSS_PHASES.includes(b.phase) || (b.phase === 'enrage' && b.kind !== 'boss')) {
    b.phase = 'attack';
    b.phaseTime = 0;
  }
  b.phaseTime = Math.max(0, Number(b.phaseTime) || 0);
  b.round = Math.max(0, Math.floor(Number(b.round) || 0));
  b.bracedSeconds = Math.max(0, Number(b.bracedSeconds) || 0);
  return b;
}

// Advance a boss fight. `effort` is watts ÷ FTP; `maxHP` lets a good brace heal.
// A summit boss is optional: stop pedaling for BALANCE.summitEscapeSeconds to ride away.
// The escape countdown pauses during a brace, so coasting through a brace never flees.
export function advanceBossBattle(
  battle,
  playerHP,
  damagePerSecond,
  dt,
  { watts = 0, cadence = 0, effort = 0, maxHP = 0 } = {}
) {
  let b = normalizeBoss(battle);
  let hp = Math.max(1, playerHP),
    remaining = Math.max(0, Number(dt) || 0),
    events = [];
  const stopped = watts < 10 && cadence <= 0;
  const baseDamage = Math.max(0, Number(damagePerSecond) || 0);
  const baseDPS = b.dps;
  while (remaining > 1e-9) {
    const plan = bossPlan(b.kind);
    const slice = Math.min(remaining, phaseLength(b) - b.phaseTime);
    // Summit escape (not while bracing).
    if (b.kind === 'summit' && b.phase !== 'brace') {
      const escapeLeft = Math.max(0, BALANCE.summitEscapeSeconds - (b.stopped || 0));
      if (stopped && slice >= escapeLeft) {
        const r = advanceBattle(phaseStats(b, baseDPS), hp, phaseDamage(b, baseDamage), escapeLeft);
        b = { ...b, hp: r.battle.hp, stopped: BALANCE.summitEscapeSeconds };
        if (r.outcome) return { battle: b, hp: r.hp, killed: 0, outcome: r.outcome, events };
        return { battle: b, hp: r.hp, killed: 0, outcome: 'flee', events };
      }
      b.stopped = stopped ? (b.stopped || 0) + slice : 0;
    }
    if (
      b.phase === 'brace' &&
      b.phaseTime + slice > BOSS_FIGHT.braceGraceSeconds &&
      effort <= BOSS_FIGHT.braceEffort
    )
      b.bracedSeconds += Math.min(slice, b.phaseTime + slice - BOSS_FIGHT.braceGraceSeconds);
    const r = advanceBattle(phaseStats(b, baseDPS), hp, phaseDamage(b, baseDamage), slice);
    b.hp = r.battle.hp;
    hp = r.hp;
    if (r.outcome) return { battle: { ...b, dps: baseDPS }, hp, killed: 0, outcome: r.outcome, events };
    b.phaseTime += slice;
    remaining -= slice;
    if (b.phaseTime < phaseLength(b) - 1e-9) continue;
    // Phase change.
    b.phaseTime = 0;
    if (b.phase === 'attack') {
      b.phase = 'brace';
      b.bracedSeconds = 0;
      events.push('brace');
    } else if (b.phase === 'brace') {
      const scoring = Math.max(1, braceSeconds(b.kind, b.round) - BOSS_FIGHT.braceGraceSeconds);
      const share = Math.min(1, b.bracedSeconds / scoring);
      const hit = bigHit({ ...b, dps: baseDPS }) * (1 - BOSS_FIGHT.braceBlock * share);
      hp = Math.max(1, hp - hit);
      if (maxHP > 0) hp = Math.min(maxHP, hp + (maxHP * BOSS_FIGHT.braceHealPercent * share) / 100);
      b.lastBrace = share;
      b.lastHit = Math.round(hit);
      b.phase = 'counter';
      events.push('hit');
      if (hp <= 1) return { battle: { ...b, dps: baseDPS }, hp: 1, killed: 0, outcome: 'loss', events };
    } else if (b.phase === 'counter') {
      b.round++;
      b.phase = b.round >= plan.rounds ? 'enrage' : 'attack';
      events.push(b.phase);
    }
  }
  return { battle: { ...b, dps: baseDPS }, hp, killed: 0, outcome: null, events };
}
// The boss's steady attack in each phase (it winds up instead of attacking while you brace).
function phaseStats(b, dps) {
  const plan = bossPlan(b.kind);
  const factor =
    b.phase === 'brace'
      ? 0
      : b.phase === 'counter'
        ? BOSS_FIGHT.counterBossAttack
        : b.phase === 'enrage'
          ? plan.enrageAttack
          : 1;
  return { ...b, dps: dps * factor };
}
function phaseDamage(b, damage) {
  if (b.phase === 'brace') return 0;
  if (b.phase === 'counter' && (b.lastBrace || 0) >= BOSS_FIGHT.counterNeedsBrace)
    return damage * BOSS_FIGHT.counterMultiplier;
  return damage;
}
