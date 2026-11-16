import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { QUEST_ASSETS } from '../cycle-quest/assets.js';

const read = path => readFile(new URL('../cycle-quest/' + path, import.meta.url), 'utf8');

test('the ride HUD module and stylesheet are served and linked', async () => {
  assert.ok(QUEST_ASSETS['ride-hud.js']);
  assert.ok(QUEST_ASSETS['ride-hud.css']);
  assert.match(await read('index.html'), /asset=ride-hud\.css/);
  assert.match(await read('game.js'), /mountRideHud\(root/);
});

test('HUD sizes stay readable from about 6 feet on a 13" laptop', async () => {
  const css = await read('ride-hud.css');
  const size = selector => Number(new RegExp(selector + ' \\{[^}]*?font-size: (\\d+)px').exec(css)?.[1]);
  assert(size('\\.cq-hud-hero') >= 180, 'power and heart rate');
  assert(size('\\.cq-hud-stat strong') >= 72, 'time, distance, ascent, cadence, speed');
  assert(size('\\.cq-hud-barvalue') >= 72, 'HP and stamina numbers');
  assert(size('\\.cq-hud-stat small') >= 34, 'labels');
  assert.match(css, /width: 1440px;\s*height: 900px;/, 'one 1440×900 stage, scaled to fit');
});

test('the road layout shows every requested readout, in order along the bottom', async () => {
  const hud = await read('ride-hud.js');
  const order = ['TIME', 'DISTANCE', 'ASCENT', 'CADENCE', 'SPEED'].map(l => hud.indexOf("'" + l + "')"));
  assert(
    order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])),
    order.join(',')
  );
  for (const key of ['power', 'hr', 'coins', 'xp-left', 'miles', 'grade'])
    assert.match(hud, new RegExp('data-h="' + key + '"'));
});
