import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQuestModule } from './quest-loader.mjs';
const { STAMINA, advanceStamina, isExhausted, staminaDamageMultiplier, validStamina } =
  await loadQuestModule('stamina.js');
const { validCharacter } = await loadQuestModule('save-state.js');

test('hard riding drains stamina from 85% FTP, much faster above FTP', () => {
  // 90% FTP: about 30 minutes to empty; FTP: 10 minutes; 120%: about 3 minutes.
  const minutesToEmpty = effort => 100 / (100 - advanceStamina(100, effort, 60) || 1e-9);
  assert(Math.abs(minutesToEmpty(0.9) - 30) < 1, 'at 90%');
  assert(Math.abs(minutesToEmpty(1) - 10) < 0.2, 'at FTP');
  assert(Math.abs(minutesToEmpty(1.2) - 3) < 0.3, 'at 120%');
  // 250 W at a 280 W FTP (89%) now drains.
  assert(advanceStamina(100, 250 / 280, 60) < 100);
  assert(advanceStamina(100, 1.2, 60) < advanceStamina(100, 1, 60), 'a climb at 120% drains faster');
});

test('stamina holds steady between 70% and 85% FTP and refills at 70% or below', () => {
  assert.equal(advanceStamina(60, 0.8, 30), 60);
  assert.equal(advanceStamina(60, 0.85, 30), 60);
  assert.equal(advanceStamina(60, 0.7, 10), 60 + 10 * STAMINA.recoverPerSecond);
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

test('an all-out 150% FTP effort is exhausted after about one minute', () => {
  let stamina = 100,
    seconds = 0;
  while (!isExhausted(stamina)) ((stamina = advanceStamina(stamina, 1.5, 1)), seconds++);
  assert(seconds >= 55 && seconds <= 75, seconds + ' s');
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
