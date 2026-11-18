import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardGesture } from '../cycle-quest/reward-gesture.js';
import { battleRewards, HEALING, SMART_HEAL_BELOW } from '../cycle-quest/rewards.js';

test('pedaling through a reward picks heal when HP is low and bonus coins otherwise', () => {
  const g = createRewardGesture();
  for (const [pedal, other] of [
    ['heal', 'coins'],
    ['coins', 'heal']
  ]) {
    const choice = g.begin(0, pedal);
    g.update(choice, 1000, 85, 200);
    assert.equal(choice.selected, pedal, 'keep pedaling');
    g.update(choice, 2000, 0, 0);
    g.update(choice, 4100, 0, 0);
    assert.equal(choice.selected, other, 'stop for 2 s');
    g.update(choice, 5000, 80, 180);
    assert.equal(choice.selected, pedal, 'pedal again');
  }
  assert.equal(SMART_HEAL_BELOW, 60);
});

test('every win pays its coins; the bonus is half again; healing while riding is 2% a minute', () => {
  const r = battleRewards({ kind: 'enemy', reward: 300, coins: 101 });
  assert.equal(r.coins, 101);
  assert.equal(r.bonusCoins, 51);
  assert.equal(r.coinsPaid, true);
  assert.equal(HEALING.percentPerMinute, 2);
});
