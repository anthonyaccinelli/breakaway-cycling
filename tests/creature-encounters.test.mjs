import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const transpile = source => ts.transpileModule(source, {
  compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}
}).outputText;
async function loadTs(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(transpile(source)).toString('base64'));
}
const {
  CREATURE_PERSONALITIES, encounterRoadGrade, beginFlatEncounter, endFlatEncounter,
  advanceFlatEncounter, chaoticAppearancesForBlock, chaoticAppearancesCrossed,
  chaoticTargetWatts, newChaoticAttempt, advanceChaoticAttempt
} = await loadTs('../src/creature-collector/encounters.ts');
const {advanceRoadSpeed} = await loadTs('../src/virtual-drivetrain.ts');

test('new collector includes Chaotic without altering the existing RPG', () => {
  assert.equal(CREATURE_PERSONALITIES.length, 7);
  assert(CREATURE_PERSONALITIES.includes('chaotic'));
});

test('flat encounter requests flat grade for SIM and virtual shifting but not fixed ERG', () => {
  for (const mode of ['sim', 'erg']) {
    assert.equal(encounterRoadGrade(true, 9, mode), 0);
    assert.equal(encounterRoadGrade(true, -6, mode), 0);
    assert.equal(encounterRoadGrade(false, 9, mode), 9);
  }
  assert.equal(encounterRoadGrade(true, 9, 'target'), 9);
});

test('encounter freezes authored route while accruing real flat-road mileage and time', () => {
  const start = {
    routeMeters: 10000, rideMeters: 10000, elevationMeters: 450,
    speedMps: 7, encounterActive: false
  };
  const road = {massKg: 103, crr: .004};
  const active = beginFlatEncounter(start);
  const one = advanceFlatEncounter(active, 1, 165, road, advanceRoadSpeed);
  const two = advanceFlatEncounter(one, 1, 165, road, advanceRoadSpeed);
  assert.equal(two.routeMeters, 10000);
  assert.equal(two.elevationMeters, 450);
  assert(two.rideMeters > 10012 && two.rideMeters < 10020);
  assert(two.speedMps > 0);
  const restored = endFlatEncounter(two);
  assert.equal(restored.routeMeters, start.routeMeters);
  assert.equal(restored.rideMeters, two.rideMeters);
  assert.equal(restored.encounterActive, false);
  assert.equal(advanceFlatEncounter(restored, 1, 165, road, advanceRoadSpeed), restored);
});

test('coasting is counted using physics, stopped ride and stale frames never invent huge distance', () => {
  const initial = beginFlatEncounter({routeMeters: 450, rideMeters: 470, elevationMeters: 5, speedMps: 9, encounterActive: false});
  const road = {massKg: 103, crr: .004};
  const coast = advanceFlatEncounter(initial, 1, 0, road, advanceRoadSpeed);
  assert(coast.rideMeters > initial.rideMeters);
  assert(coast.speedMps < initial.speedMps);
  assert.equal(advanceFlatEncounter(initial, 0, 150, road, advanceRoadSpeed), initial);
  const stale = advanceFlatEncounter(initial, 200, 150, road, advanceRoadSpeed);
  assert(stale.rideMeters - initial.rideMeters < 50);
  assert.equal(stale.routeMeters, 450);
});

test('Chaotic appears exactly once or twice in every full 50-mile lifetime band', () => {
  for (const seed of [0, 1, 17, 12345, -82]) {
    for (let band = 0; band < 20; band++) {
      const events = chaoticAppearancesForBlock(band, seed);
      assert(events.length >= 1 && events.length <= 2);
      assert.deepEqual(events, chaoticAppearancesForBlock(band, seed));
      assert(events.every(e => e.mile >= band * 50 && e.mile < (band + 1) * 50));
      if (events.length === 2) assert(events[1].mile - events[0].mile >= 6);
    }
  }
});

test('short rides share lifetime schedule; disabling Chaotic never schedules a challenge', () => {
  const seed = 2468;
  const whole = chaoticAppearancesCrossed(0, 100, seed, true);
  const chunks = [];
  for (let i = 0; i < 100; i += 7) {
    chunks.push(...chaoticAppearancesCrossed(i, Math.min(100, i + 7), seed, true));
  }
  assert.deepEqual(chunks, whole);
  assert.equal(chaoticAppearancesCrossed(0, 100, seed, false).length, 0);
  assert.equal(chaoticAppearancesCrossed(10, 10, seed, true).length, 0);
  assert.equal(chaoticAppearancesCrossed(40, 20, seed, true).length, 0);
});

test('Chaotic target is based on the rider\'s actual best 10-second power, not FTP', () => {
  assert.equal(chaoticTargetWatts(600), 540);
  assert.equal(chaoticTargetWatts(0), null);
  assert.equal(chaoticTargetWatts(NaN), null);
});

test('Chaotic capture demands sustained hard effort and can fail; neither result is random', () => {
  let attempt = newChaoticAttempt(540, 10, 30);
  for (let n = 0; n < 5; n++) attempt = advanceChaoticAttempt(attempt, 2, 500);
  assert.equal(attempt.result, 'active');
  assert.equal(attempt.sustainedSeconds, 0);
  for (let n = 0; n < 5; n++) attempt = advanceChaoticAttempt(attempt, 2, 550);
  assert.equal(attempt.result, 'captured');
  assert.equal(attempt.sustainedSeconds, 10);
  assert.equal(advanceChaoticAttempt(attempt, 2, 0), attempt);

  let escaped = newChaoticAttempt(540, 10, 12);
  for (let i = 0; i < 6; i++) escaped = advanceChaoticAttempt(escaped, 2, i % 2 ? 550 : 500);
  assert.equal(escaped.result, 'escaped');
  assert.equal(escaped.patienceSeconds, 0);
  assert.throws(() => newChaoticAttempt(0));
});
