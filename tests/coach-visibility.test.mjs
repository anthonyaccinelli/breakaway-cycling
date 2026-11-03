import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Home screen hides only the original shell, not the bundled Coach screen',()=>{
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  const rule=css.match(/body\[data-breakaway-screen="home"\]\s*>\s*main,[^\n]*display:none!important/g);
  assert.ok(rule?.length,'The home visibility rule should hide only the original shell');
  assert.doesNotMatch(css,/body\[data-breakaway-screen="home"\]\s+main\s*,/);
  assert.doesNotMatch(css,/body\[data-breakaway-screen="home"\]\s+header\s*,/);
  const bundle=readFileSync(new URL('../src/vendor/breakaway-coach/breakaway-coach.js',import.meta.url),'utf8');
  for(const id of ['coachRecommendedName','coachSwapPanel'])assert.ok(bundle.includes('id="'+id+'"'));
  assert.match(bundle,/coach-screen coach-v2/);
});
