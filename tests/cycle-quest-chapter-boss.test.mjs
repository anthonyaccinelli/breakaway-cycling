import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQuestModule } from './quest-loader.mjs';

const combat = await loadQuestModule('combat.js');

test('chapter bosses meet the rider at their level, never below the chapter boss level', () => {
  const fixed = combat.chapterLevels(1).boss;
  assert.equal(
    combat.chapterBossLevel(1, 1),
    fixed,
    'an under-leveled rider meets the chapter boss as written'
  );
  assert.equal(combat.chapterBossLevel(1, fixed + 5), fixed + 5, 'out-leveling does not make the boss easy');
  assert.equal(combat.chapterBossLevel(1, undefined), fixed);
  const strong = combat.makeBattle('boss', { chapter: 1, level: fixed + 5 }),
    written = combat.makeBattle('boss', { chapter: 1 });
  assert.equal(strong.level, fixed + 5);
  assert(strong.max > written.max && strong.dps > written.dps);
});

test('each loss lowers the chapter boss 2 levels, down to the chapter boss level', () => {
  const fixed = combat.chapterLevels(3).boss;
  assert.equal(combat.BALANCE.bossRetryLevels, 2);
  assert.equal(combat.chapterBossLevel(3, fixed + 5, 1), fixed + 3);
  assert.equal(combat.chapterBossLevel(3, fixed + 5, 2), fixed + 1);
  assert.equal(combat.chapterBossLevel(3, fixed + 5, 9), fixed);
});
