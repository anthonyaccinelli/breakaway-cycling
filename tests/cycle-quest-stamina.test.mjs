import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQuestModule } from './quest-loader.mjs';
const { STAMINA, advanceStamina, isExhausted, staminaDamageMultiplier, validStamina } =
  await loadQuestModule('stamina.js');
const { validCharacter } = await loadQuestModule('save-state.js');

test('riding above FTP drains stamina in proportion to how far above FTP you are', () => {
  // 150% FTP for 10 s: 0.5 × 1.25%/s × 10 s = 6.25%
  assert.equal(advanceStamina(100, 1.5, 10), 100 - 6.25);
  // Twice as far above FTP drains twice as fast.
  assert.equal(100 - advanceStamina(100, 2, 10), 2 * (100 - advanceStamina(100, 1.5, 10)));
  // A climb ridden at 120% FTP drains just like a battle surge.
  assert(advanceStamina(100, 1.2, 60) < 100);
});

test('stamina holds steady between 75% and 100% FTP and refills at 75% or below', () => {
  assert.equal(advanceStamina(60, 0.9, 30), 60);
  assert.equal(advanceStamina(60, 1, 30), 60);
  assert.equal(advanceStamina(60, 0.75, 10), 60 + 10 * STAMINA.recoverPerSecond);
  assert.equal(advanceStamina(60, 0.4, 10), 60 + 10 * STAMINA.recoverPerSecond);
});

test('stamina never leaves 0–100, and bad input does not corrupt it', () => {
  assert.equal(advanceStamina(1, 3, 60), 0);
  assert.equal(advanceStamina(99.9, 0.5, 60), 100);
  assert.equal(advanceStamina(undefined, 0.5, 1), 100);
  // No power reading counts as coasting, which refills.
  assert.equal(advanceStamina(50, NaN, 1), 50 + STAMINA.recoverPerSecond);
});

test('below 25% the rider is exhausted and deals 40% less damage', () => {
  assert(!isExhausted(25));
  assert(isExhausted(24.9));
  assert.equal(staminaDamageMultiplier(80), 1);
  assert.equal(staminaDamageMultiplier(10), 0.6);
  assert.equal(staminaDamageMultiplier(undefined), 1);
});

test('an all-out 150% FTP effort is exhausted after about two minutes', () => {
  let stamina = 100,
    seconds = 0;
  while (!isExhausted(stamina)) ((stamina = advanceStamina(stamina, 1.5, 1)), seconds++);
  assert(seconds >= 110 && seconds <= 130, seconds + ' s');
});

test('saves accept stamina in range and reject anything else', () => {
  const fresh = {
    version: 1,
    xp: 0,
    hp: 100,
    miles: 2,
    chapter: 1,
    mode: 'adventure',
    rideSeconds: 0,
    rideMiles: 0,
    nextEncounter: 260,
    reward: false,
    boss: null,
    battle: null,
    workouts: []
  };
  assert(validCharacter(fresh));
  assert(validCharacter({ ...fresh, stamina: 42.5 }));
  for (const bad of [-1, 101, NaN, '50']) assert(!validCharacter({ ...fresh, stamina: bad }), String(bad));
  assert(validStamina(0) && validStamina(100) && !validStamina(Infinity));
});
