import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQuestModule } from './quest-loader.mjs';

const { bikeFor, validBike, changePart, staminaEfficiency, slots, SLOT_STATS, catalog } =
  await loadQuestModule('bike-parts.js');
const { advanceStamina } = await loadQuestModule('stamina.js');
const { validCharacter } = await loadQuestModule('save-state.js');

test('the shop has a fifth slot, Tires, for stamina', () => {
  assert.deepEqual(slots, ['Frame', 'Seat', 'Pedals', 'Wheels', 'Tires']);
  assert.equal(SLOT_STATS[4], 'STAMINA');
  assert.deepEqual(
    catalog.filter(p => p.slot === 4).map(p => p.name),
    ['Standard Tires', 'Trail Tires', 'Race Tires']
  );
});

test('bikes saved with four slots stay valid and gain stock tires without losing parts', () => {
  const legacy = {
    tiers: [3, 0, 2, 1],
    shopStop: 2,
    owned: [3, 1, null, 0, null, null, 2, null, null, 1, null, 4],
    grades: [0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 3],
    equipped: [0, 3, 6, 9]
  };
  assert(validBike(legacy), 'old saves still load');
  const rider = { bike: structuredClone(legacy) };
  const bike = bikeFor(rider);
  assert(validBike(bike));
  assert.deepEqual(bike.owned.slice(0, 12), legacy.owned);
  assert.deepEqual(bike.grades.slice(0, 12), legacy.grades);
  assert.deepEqual(bike.equipped, [0, 3, 6, 9, 12]);
  assert.deepEqual(bike.owned.slice(12), [0, null, null]);
  assert.equal(bike.tiers[4], 0);
  assert.equal(staminaEfficiency(bike), 1, 'stock tires change nothing');
  // Even the oldest saves (tiers only) migrate.
  assert(validBike(bikeFor({ bike: { tiers: [1, 1, 1, 1], shopStop: 0 } })));
});

test('better tires make stamina drain slower and refill faster, at half the part bonus', () => {
  const rider = { coins: 10000, xp: 1e6, chapter: 4 };
  const bike = bikeFor(rider);
  assert(changePart(rider, 14, 'buy', 3)); // Gold Race Tires: +30%
  assert(changePart(rider, 14, 'equip'));
  assert.equal(staminaEfficiency(bike), 1.15);
  assert(validBike(JSON.parse(JSON.stringify(bike))));
  const k = staminaEfficiency(bike);
  const stockDrain = 100 - advanceStamina(100, 1.5, 10);
  const tireDrain = 100 - advanceStamina(100, 1.5, 10, k);
  assert(Math.abs(tireDrain - stockDrain / k) < 1e-9);
  assert(Math.abs(advanceStamina(50, 0.5, 10, k) - 50 - 0.6 * 10 * k) < 1e-9);
  assert.equal(advanceStamina(80, 0.8, 10, k), 80, 'the hold band still holds');
});

test('a character with a five-slot bike passes save validation', () => {
  const s = {
    version: 1,
    xp: 0,
    hp: 100,
    miles: 0,
    chapter: 1,
    mode: 'adventure',
    rideSeconds: 0,
    rideMiles: 0,
    nextEncounter: 100,
    reward: false,
    coins: 0,
    route: null,
    workouts: []
  };
  bikeFor(s);
  const ok = validCharacter(JSON.parse(JSON.stringify(s)));
  assert.equal(ok, validCharacter({ ...s, bike: undefined }), 'adding the bike does not change validity');
});
