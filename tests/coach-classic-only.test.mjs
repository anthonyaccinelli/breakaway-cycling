import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const bundle=read('src/vendor/breakaway-coach/breakaway-coach.js');
const css=read('src/vendor/breakaway-coach/breakaway-coach.css');
const main=read('src/main.ts');
const route=read('src/classic-route-reference.ts');

test('Coach is a Classic subfeature; the host bridge cannot launch another mode',()=>{
  assert.match(route,/id="openBreakawayCoach"/);
  assert.match(route,/Train with Breakaway Coach/);
  assert.match(bundle,/coach-screen coach-v2/);
  assert.match(bundle,/BACK TO CLASSIC/);
  assert.match(bundle,/id="coachStartClassic"/);
  assert.match(main,/launchMode:\(_mode\)=>\{showBreakawayScreen\('setup'\);\}/);
  assert.doesNotMatch(bundle,/data-coach-mode="survival"|data-coach-mode="cyclequest"/);
});

test('Coach shares recorded ride history but cannot command Survival or Quest',()=>{
  assert.match(main,/mode:rideExperience,meters:sessionDistanceMeters\(\)/);
  assert.match(main,/getPlatformRides:async\(\)=> \(await savedRides\(\)\)\.map/);
  assert.match(bundle,/ALL BREAKAWAY RIDES/);
  assert.doesNotMatch(main,/coachRuntime\.isRecovery\(\)|coachRuntime\.onTarget\(power\)/);
});

test('Coach panel stays isolated and its banner lives in Classic Route Studio',()=>{
  assert.match(css,/\.coach-screen\{position:fixed/);
  assert.match(css,/#openBreakawayCoach\{display:none!important/);
  assert.match(css,/\[data-ride-experience=classic\]\[data-breakaway-screen=route\]/);
  assert.match(route,/coachBanner\.hidden=survival/);
});
