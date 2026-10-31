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
  CREATURE_PERSONALITIES, chaoticAppearancesForBlock, chaoticAppearancesCrossed,
  chaoticTargetWatts, newChaoticAttempt, advanceChaoticAttempt
} = await loadTs('../src/creature-collector/encounters.ts');

test('new collector includes Chaotic without altering the existing RPG', () => {
  assert.equal(CREATURE_PERSONALITIES.length, 7);
  assert(CREATURE_PERSONALITIES.includes('chaotic'));
});

test('collector encounter engine never overrides route progression or trainer load', async () => {
  const source = await readFile(new URL('../src/creature-collector/encounters.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:setGrade|encounterRoadGrade|beginFlatEncounter|endFlatEncounter|advanceFlatEncounter|cycleQuestHold|routeMeters|rideMeters|setVirtualGearResistance)\b/);
  assert.match(source, /passive overlays on an uninterrupted ride/);
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
