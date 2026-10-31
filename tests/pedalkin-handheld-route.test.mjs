import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=async(path)=>readFile(new URL(path,import.meta.url),'utf8');
const [main,art,code,css]=await Promise.all([
 load('../src/main.ts'),
 load('../public/pedalkin/route-v2.svg'),
 load('../src/pedalkin-handheld-route.ts'),
 load('../src/pedalkin-handheld-route.css')
]);
test('Version 2 is the exact 1920x1080 uploaded Illustrator handheld, not a redrawn shell',()=>{
 assert.match(art,/viewBox="0 0 1920 1080"/);
 assert.match(art,/id="pedalkin-route-full"/);
 assert.match(art,/SPOKEMON/);
 assert.match(art,/01 ROUTE/);
 assert.match(art,/02 DEVICES/);
 assert.match(art,/03 RIDE/);
 assert.match(art,/OVERLAY/);
 assert.equal((art.match(/<image\b/g)||[]).length,6);
 assert.match(code,/src="\/pedalkin\/route-v2\.svg"/);
});
test('working 01 Route V2 reuses generator, preview and navigation; never generates fake routes',()=>{
 assert.match(main,/mountPedalkinHandheldRoute\(\)/);
 for(const id of ['generatedMiles','generatedTerrain','generatedGain','generatedSeed','lockGeneratedSeed','gpx','generateRoute','surpriseRoute','endlessRoute','enjoyRide','studioLiveChart']){
   assert(code.includes("'"+id+"'"),id);
 }
 assert.match(code,/real\.dispatchEvent\(new Event\('change'/);
 assert.match(code,/real\?\.click\(\)/);
 assert.match(code,/querySelector\('svg'\)/);
 assert.match(code,/\.cloneNode\(true\)/);
 assert.match(code,/rideExperience==='pedalkin'&&document\.body\.dataset\.breakawayScreen==='route'/);
 assert.doesNotMatch(code,/(?:requestDevice|setGrade|setVirtualGearResistance|simRequestedGrade|routeMeters|fakeTrainer)/);
});
test('user-supplied full handheld image appears as sole art layer with aligned click targets',()=>{
 assert.match(css,/aspect-ratio:16\/9/);
 assert.match(css,/container-type:inline-size/);
 assert.match(css,/\.pk-v2-generate\{/);
 assert.match(css,/\.pk-v2-nav-devices\{/);
 assert.match(css,/\.pk-v2-pad-a\{/);
 assert.match(css,/#0f292f/);
 assert.match(css,/\.pk-v2-route-stats/);
 assert.match(css,/\.pk-v2-live-chart/);
 assert.match(css,/background:#0f292f!important/);
});
