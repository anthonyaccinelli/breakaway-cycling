import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('home page hides only original shell, not the Coach header and dashboard', () => {
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  const rule=css.match(/body\[data-breakaway-screen="home"\]\s*>\s*main,[^\n]*display:none!important/g);
  assert.ok(rule?.length, 'home visibility rule must hide the original direct-child app shell');
  assert.doesNotMatch(css,/body\[data-breakaway-screen="home"\]\s+main\s*,/, 'a descendant main selector hides the Coach dashboard');
  assert.doesNotMatch(css,/body\[data-breakaway-screen="home"\]\s+header\s*,/, 'a descendant header selector hides the Coach heading');
  assert.doesNotMatch(css,/body\[data-breakaway-screen="home"\]\s+footer\s*,/, 'only original shell elements should be hidden');
  const coach=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
  assert.match(coach,/className='coach-screen coach-v2'/);
  assert.match(coach,/screen\.hidden=false/);
  assert.match(coach,/id="coachRecommendedName"/);
  assert.match(coach,/id="coachSwapPanel"/);
});
