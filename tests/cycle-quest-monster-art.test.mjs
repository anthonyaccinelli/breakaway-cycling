import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { QUEST_ASSETS } from '../cycle-quest/assets.js';
import { loadQuestModule } from './quest-loader.mjs';

const { MONSTERS, monsterArt } = await loadQuestModule('monsters.js');
const { CHAPTERS, chapterRoster } = await loadQuestModule('chapters.js');

const pngSize = bytes => {
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

test('Wolf replaces Octopus in Chapter 1 and stays in Chapters 2–4', () => {
  assert(CHAPTERS[0].newMonsters.includes('wolf'));
  for (const chapter of [1, 2, 3, 4]) assert(chapterRoster(chapter).includes('wolf'), 'chapter ' + chapter);
  for (const chapter of [1, 2]) assert(!chapterRoster(chapter).includes('octopus'), 'chapter ' + chapter);
});

test('monster art is a listed PNG whose real size matches, within the battle limits', async () => {
  const withArt = MONSTERS.filter(m => m.art);
  assert(withArt.some(m => m.id === 'wolf'));
  for (const m of withArt) {
    assert.equal(QUEST_ASSETS[m.art.file], 'image/png', m.art.file + ' must be served');
    const size = pngSize(await readFile(new URL('../cycle-quest/' + m.art.file, import.meta.url)));
    assert.deepEqual(size, { width: m.art.width, height: m.art.height }, m.id);
    assert(m.art.height <= 128, m.id + ' is at most 128 px tall');
    assert(m.art.width <= 200, m.id + ' fits three across');
    const demo = await readFile(new URL('../public/cq-autoplay/' + m.art.file, import.meta.url));
    assert.deepEqual(pngSize(demo), size, 'the autoplay demo copies the art as bytes');
  }
  assert.equal(monsterArt('octopus'), null);
  assert.match(monsterArt('wolf').url, /monster-wolf\.png/);
});

test('the beta endpoint sends images as bytes', async () => {
  const { default: handler } = await import('../api/cycle-quest.js');
  const password = process.env.CYCLE_QUEST_PASSWORD,
    secret = process.env.CYCLE_QUEST_SESSION_SECRET;
  process.env.CYCLE_QUEST_PASSWORD = 'fixture';
  process.env.CYCLE_QUEST_SESSION_SECRET = 'fixture-secret';
  const expiry = String(Date.now() + 60000),
    signature = createHmac('sha256', 'fixture-secret').update(expiry).digest('base64url');
  try {
    let status, body;
    const headers = {};
    const res = {
      setHeader(k, v) {
        headers[k] = v;
      },
      status(code) {
        status = code;
        return this;
      },
      end() {},
      json() {},
      send(b) {
        body = b;
      }
    };
    await handler(
      {
        method: 'GET',
        url: '/api/cycle-quest?asset=monster-wolf.png',
        headers: { host: 'localhost', cookie: 'breakaway_quest_beta=' + expiry + '.' + signature }
      },
      res
    );
    assert.equal(status, 200);
    assert.equal(headers['Content-Type'], 'image/png');
    assert(Buffer.isBuffer(body));
    assert.deepEqual(pngSize(body), { width: 145, height: 86 });
  } finally {
    if (password === undefined) delete process.env.CYCLE_QUEST_PASSWORD;
    else process.env.CYCLE_QUEST_PASSWORD = password;
    if (secret === undefined) delete process.env.CYCLE_QUEST_SESSION_SECRET;
    else process.env.CYCLE_QUEST_SESSION_SECRET = secret;
  }
});
