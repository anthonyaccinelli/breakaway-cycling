import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const route=await readFile(new URL('../src/pedalkin-handheld-route.ts',import.meta.url),'utf8');

test('Spokemon Ready for your Adventure advances from 01 Route to 02 Devices',()=>{
 assert.match(route,/doAction\('\.pk-v2-next',get\('stepSetup'\)\)/);
 assert.match(route,/aria-label="Ready for your adventure\? Continue to 02 Devices"/);
 assert.doesNotMatch(route,/doAction\('\.pk-v2-next',get\('stepRide'\)\)/);
});
test('Explicit 03 Ride navigation stays intact',()=>{
 assert.match(route,/doAction\('\.pk-v2-nav-ride',get\('stepRide'\)\)/);
 assert.match(route,/doAction\('\.pk-v2-nav-devices',get\('stepSetup'\)\)/);
});
