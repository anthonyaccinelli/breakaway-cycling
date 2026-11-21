import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQuestModule } from './quest-loader.mjs';
const { makeBattle, advanceBossBattle, bossPhase, BOSS_FIGHT, BALANCE } = await loadQuestModule('combat.js');

// A boss too tough to finish, so the phase timer is all that changes.
const tough = kind => ({ ...makeBattle(kind, { chapter: 1 }), hp: 1e9, max: 1e9 });
const riding = { watts: 200, cadence: 85, effort: 0.8 };
const easy = { watts: 120, cadence: 85, effort: 0.5 };
function ride(battle, seconds, opts = riding, hp = 1e6, damage = 100) {
  let b = battle,
    events = [],
    out;
  for (let i = 0; i < seconds; i++) {
    out = advanceBossBattle(b, hp, damage, 1, opts);
    b = out.battle;
    hp = out.hp;
    events.push(...out.events);
  }
  return { battle: b, hp, events, outcome: out?.outcome };
}

test('a summit boss cycles ATTACK 2.5 min → BRACE 60 s → COUNTER 40 s → ATTACK', () => {
  let b = tough('summit');
  assert.equal(bossPhase(b).phase, 'attack');
  assert.equal(bossPhase(b).secondsLeft, BOSS_FIGHT.summit.attack);
  b = ride(b, 134).battle;
  assert(!bossPhase(b).windup);
  b = ride(b, 1).battle;
  assert(bossPhase(b).windup, 'the last 15 s of an attack are the wind-up warning');
  b = ride(b, 15, easy).battle;
  assert.equal(bossPhase(b).phase, 'brace');
  b = ride(b, 60, easy).battle;
  assert.equal(bossPhase(b).phase, 'counter');
  b = ride(b, 40).battle;
  assert.equal(bossPhase(b).phase, 'attack');
  assert.equal(b.round, 1);
});

test('phases are minutes long, never seconds', () => {
  for (const kind of ['summit', 'boss']) {
    const plan = BOSS_FIGHT[kind];
    assert(plan.attack >= 120 && plan.counter >= 30);
    for (const brace of plan.brace) assert(brace >= 45, kind + ' brace ' + brace);
  }
  assert(BOSS_FIGHT.braceEffort >= 0.7, 'bracing asks for an easy spin, not a near stop');
});

test('while bracing the rider deals no damage and the boss saves up one big hit', () => {
  let b = ride(tough('summit'), 150).battle;
  const hpBefore = b.hp;
  const out = ride(b, 30, easy, 500);
  assert.equal(out.battle.hp, hpBefore, 'no rider damage during a brace');
  assert.equal(out.hp, 500, 'no steady boss damage during a brace');
});

test('a full brace blocks 75% of the big hit and heals; skipping it takes the full hit', () => {
  const start = ride(tough('summit'), 150).battle,
    hit = bossPhase(start).bigHit;
  const held = ride(start, 60, { ...easy, maxHP: 1e6 }, 900000);
  assert.equal(held.battle.lastBrace, 1);
  assert.equal(Math.round(held.battle.lastHit), Math.round(hit * (1 - BOSS_FIGHT.braceBlock)));
  assert(held.hp > 900000 - hit * 0.25, 'a good brace heals a little');
  const skipped = ride(start, 60, riding, 900000);
  assert.equal(skipped.battle.lastBrace, 0);
  assert.equal(Math.round(skipped.battle.lastHit), Math.round(hit));
});

test('the first 5 s of a brace are grace for trainer and power-smoothing lag', () => {
  const start = ride(tough('summit'), 150).battle;
  const late = ride(ride(start, 5, riding).battle, 55, easy).battle; // eased off after 5 s
  assert.equal(late.lastBrace, 1);
  assert(bossPhase(ride(start, 3, easy).battle).grace);
});

test('the counter doubles damage only after a brace that was at least half held', () => {
  const start = ride(tough('summit'), 150).battle;
  const good = ride(start, 60, easy).battle,
    bad = ride(start, 60, riding).battle;
  const dealt = b => b.hp - ride(b, 10).battle.hp;
  assert(bossPhase(good).counterLanded && !bossPhase(bad).counterLanded);
  assert.equal(dealt(good), 2 * dealt(bad));
});

test('a chapter boss shortens each brace, grows its hit, then enrages after three', () => {
  let b = tough('boss');
  const hits = [];
  for (const brace of BOSS_FIGHT.boss.brace) {
    b = ride(b, BOSS_FIGHT.boss.attack).battle;
    assert.equal(bossPhase(b).phase, 'brace');
    assert.equal(bossPhase(b).secondsLeft, brace);
    hits.push(bossPhase(b).bigHit);
    b = ride(b, brace + BOSS_FIGHT.boss.counter, easy).battle;
  }
  assert(hits[0] < hits[1] && hits[1] < hits[2]);
  assert.equal(bossPhase(b).phase, 'enrage');
  const out = ride(b, 10, riding, 1000);
  assert.equal(Math.round(1000 - out.hp), Math.round(10 * b.dps * BOSS_FIGHT.boss.enrageAttack));
  assert.equal(bossPhase(ride(b, 600).battle).phase, 'enrage', 'enrage lasts until someone falls');
});

test('summit escape still works, but coasting through a brace never rides away', () => {
  const stopped = { watts: 0, cadence: 0, effort: 0 };
  assert.equal(ride(tough('summit'), BALANCE.summitEscapeSeconds, stopped).outcome, 'flee');
  const bracing = ride(tough('summit'), 150).battle;
  const out = ride(bracing, 50, stopped);
  assert.equal(out.outcome, null);
  assert.equal(out.battle.lastBrace ?? null, null);
  assert.equal(bossPhase(out.battle).phase, 'brace');
  assert.equal(ride(tough('boss'), 60, stopped).outcome, null, 'chapter bosses cannot be escaped');
});

test('a big hit that empties HP is a loss', () => {
  const start = ride(tough('summit'), 150).battle;
  const out = ride(start, 60, riding, 2);
  assert.equal(out.outcome, 'loss');
});

test('saves from the old 40-second phase loop restart at ATTACK', () => {
  const old = { ...tough('summit'), phase: 'stagger', phaseTime: 7, bracedSeconds: 3 };
  assert.equal(bossPhase(old).phase, 'attack');
  assert.equal(bossPhase({ ...tough('summit'), phase: 'enrage' }).phase, 'attack');
  assert.equal(bossPhase({ ...tough('boss'), phase: 'recover' }).secondsLeft, BOSS_FIGHT.boss.attack);
});
