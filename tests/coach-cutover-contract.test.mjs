import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Release contract: these names belong to existing Ride Breakaway browser data.
// Changing them requires an explicit, separately tested migration, not a bundle swap.
const bundle=readFileSync(new URL('../src/vendor/breakaway-coach/breakaway-coach.js',import.meta.url),'utf8');
const host=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');

const persistentStorageNames=[
  'breakaway.coach.profile.v1',
  'breakaway.coach.history.v1',
  'breakaway.coach.event-goal.v1',
  'breakaway.coach.skipped-days.v1',
  'breakaway.coach.morning.v1',
  'breakaway.coach.ftp-known.v1',
  'breakaway.coach.strength.settings.v1',
  'breakaway.coach.strength.history.v1',
  'breakaway.coach.imported-workouts.v1',
  'breakaway-coach-training-history-v1',
];

test('Coach cutover keeps the existing local training-data identifiers',()=>{
  for(const name of persistentStorageNames){
    assert.ok(bundle.includes(name),`Coach bundle no longer references saved data identifier: ${name}. Add a tested migration before cutover.`);
  }
  assert.match(bundle,/localStorage\.getItem\(/);
  assert.match(bundle,/localStorage\.setItem\(/);
  assert.match(bundle,/indexedDB\.open\(/);
});

test('Classic loads bundled Coach on its own origin, rather than the legacy module or a remote iframe',()=>{
  assert.match(host,/import \{mountCoach\} from '\.\/vendor\/breakaway-coach\/breakaway-coach\.js'/);
  assert.match(host,/import '\.\/vendor\/breakaway-coach\/breakaway-coach\.css'/);
  assert.doesNotMatch(host,/from ['"]\.\/coach['"]/);
  assert.match(host,/coachRuntime=mountCoach\(\{/);
  assert.match(host,/launchMode:\(_mode\)=>\{showBreakawayScreen\('setup'\);\}/);
  assert.doesNotMatch(bundle,/(?:fetch|import)\s*\(\s*['"`]https?:\/\/[^'"`]*breakaway\.coach/i);
});

test('Host ride-history bridge still passes all recorded riding modes to Coach',()=>{
  assert.match(host,/getPlatformRides:async\(\)=> \(await savedRides\(\)\)\.map/);
  assert.match(host,/mode:rideExperience,meters:sessionDistanceMeters\(\)/);
  assert.match(host,/coachRuntime\?\.tick\(dt,power,cadence,realTelemetry\)/);
});

// These tests protect the integration contract; they cannot prove Bluetooth
// behavior or retention of a specific user's origin-scoped saved data.
