import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQuestModule } from './quest-loader.mjs';
const routes = await loadQuestModule('routes.js'),
  chapters = await loadQuestModule('chapters.js');
const grades = r => r.points.slice(1).map((b, i) => (100 * (b.e - r.points[i].e)) / (b.d - r.points[i].d));
const jumps = r => grades(r).filter((g, i, all) => i && Math.abs(g - all[i - 1]) > 1.5).length;

test('chapter routes are smooth but keep the same total ascent', () => {
  for (let k = 1; k <= chapters.CHAPTER_COUNT; k++) {
    const smooth = chapters.chapterRoute(k, routes.generateRoute),
      raw = chapters.chapterRoute(k, (m, t, g, seed) =>
        routes.generateRoute(m, t, g, seed, { smooth: false })
      );
    assert(Math.abs(smooth.gain - raw.gain) < 1, 'chapter ' + k + ' ascent');
    assert(jumps(smooth) <= 5, 'chapter ' + k + ' has ' + jumps(smooth) + ' sudden grade changes');
    assert(jumps(raw) > 15, 'the unsmoothed route really was choppy');
  }
});

test('every chapter has 3–5 summit bosses, spread out and away from the start and the boss', () => {
  for (let k = 1; k <= chapters.CHAPTER_COUNT; k++) {
    const route = chapters.chapterRoute(k, routes.generateRoute),
      ends = routes.routeSummits(route);
    assert(ends.length >= 3 && ends.length <= 5, 'chapter ' + k + ': ' + ends.length);
    for (const e of ends) assert(e > routes.METERS_PER_MILE && e < route.distance - routes.METERS_PER_MILE);
    for (let i = 1; i < ends.length; i++) assert(ends[i] - ends[i - 1] >= 3 * routes.METERS_PER_MILE);
  }
});

test('generated Freeroam routes are smoothed and get summits too', () => {
  for (const terrain of ['rolling', 'climbing', 'punchy']) {
    const r = routes.generateRoute(15, terrain, null, 42);
    assert.equal(r.generator, 'classic-hills-v2-smooth');
    assert(routes.routeSummits(r).length >= 1, terrain);
  }
});
