import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const main = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
const game = await readFile(new URL('../cycle-quest/game.js', import.meta.url), 'utf8');
const hud = await readFile(new URL('../cycle-quest/ride-hud.js', import.meta.url), 'utf8');

// The app's Save & Quit handler, run on its own.
const start = main.indexOf("if(data.type==='finish'){"),
  end = main.indexOf("else if(data.type==='route')");
const handler = main.slice(start, end).trim();

function run(state) {
  const calls = [];
  const c = {
    ...state,
    data: { type: 'finish' },
    console: { info() {} },
    pauseRide: () => calls.push('pause'),
    finishRide: () => calls.push('finish'),
    showRideSummary: () => calls.push('summary'),
    questSend: m => calls.push(m.type + (m.message ? ':' + m.message : ''))
  };
  vm.createContext(c);
  vm.runInContext(handler, c);
  return calls;
}

test('Save & Quit ends an active ride and tells the game', () => {
  assert.deepEqual(run({ rideStart: 'x', rideEnd: null, running: true }), [
    'pause',
    'finish',
    'ride-finished'
  ]);
});
test('Save & Quit on a ride that already ended reopens its summary (TCX, uploads)', () => {
  assert.deepEqual(run({ rideStart: 'x', rideEnd: 'y', running: false }), ['summary', 'ride-finished']);
});
test('with no ride, Save & Quit says so on the ride display', () => {
  const calls = run({ rideStart: null, rideEnd: null, running: false });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^notice:No ride in progress/);
  const notice = game.slice(
    game.indexOf("if (m.type === 'notice') {"),
    game.indexOf("if (m.type === 'navigate')")
  );
  assert.match(notice, /roadsideNotice = message/, 'notices reach the HUD toast');
});
test('the confirm tap has 10 seconds', () => {
  assert.match(hud, /quitArmedUntil = performance\.now\(\) \+ 10000/);
});
