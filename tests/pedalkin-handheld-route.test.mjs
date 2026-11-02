import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [main,route,device,css,art]=await Promise.all([
 read('src/main.ts'),read('src/pedalkin-handheld-route.ts'),
 read('src/pedalkin-handheld-devices.ts'),
 read('src/pedalkin-handheld-route.css'),read('public/pedalkin/route-v3.svg')
]);
test('Both setup screens use the same original 1920x1080 Game Boy v3 artboard',()=>{
 assert.match(art,/viewBox="0 0 1920 1080"/);
 assert.match(route,/src="\/pedalkin\/route-v3.svg"/);
 assert.match(device,/src="\/pedalkin\/route-v3.svg"/);
 assert.match(route,/enableSpokemonHandheldFont\(shell\)/);
});
test('Route generator proxies use real native generator and route seed',()=>{
 for(const key of ['generatedMiles','generatedGain','generatedSeed','lockGeneratedSeed','studioLiveChart']){
  assert.ok(route.includes("'"+key+"'"));
 }
 assert.match(route,/original\.generate!\.click\(\)/);
 assert.match(route,/real\.dispatchEvent\(new Event\('change'/);
 assert.doesNotMatch(route,/fakeTrainer|setVirtualGearResistance\(/);
});
test('Primary CTA leads to 02 Devices, while 03 Ride remains a deliberate shortcut',()=>{
 assert.match(route,/doAction\('\.pk-v2-next',get\('stepSetup'\)\)/);
 assert.match(route,/doAction\('\.pk-v2-nav-ride',get\('stepRide'\)\)/);
});
test('GPX and Endless publish authoritative mode and synchronize visible route inputs',()=>{
 assert.match(main,/mode:'gpx',name:file\.name/);
 assert.match(main,/mode:isEndless\?'endless':'generated'/);
 assert.match(route,/spokemon:route-state/);
 assert.match(route,/routeMode==='gpx'\|\|routeMode==='endless'/);
 assert.match(route,/original\.miles!\.value=String\(miles\)/);
 assert.match(route,/original\.gain!\.value=String\(gain\)/);
 assert.match(route,/No finish line/);
 assert.match(route,/∞ \(next /);
});
test('Invalid distance and gain produce inline, accessible feedback rather than stale preview',()=>{
 assert.match(route,/DISTANCE MUST BE GREATER THAN ZERO/);
 assert.match(route,/ELEVATION GAIN MUST BE ZERO OR MORE/);
 assert.match(route,/role="status" aria-live="polite"/);
 assert.match(css,/pk-v2-feedback/);
});
test('Biome is distinct from physical terrain and only Pine Forest is enabled',()=>{
 assert.match(route,/option\.disabled=!biome\.available/);
 assert.match(route,/route\.dataset\.pedalkinBiome='pine-forest'/);
 assert.match(route,/original\.terrain!\.selectedOptions\[0\]/);
 assert.match(route,/terrainStat\.textContent=routeMode/);
});
test('All six shortcuts retain the original two-row generator grid',()=>{
 for(const name of ['generate','surprise','endless','recovery','rolling','climbing']){
  assert.ok(route.includes('pk-v2-'+name));
 }
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
 assert.match(route,/\.quick-preset-button/);
});
test('The Illustrator game screen is only scaled, never recreated in markup',()=>{
 assert.match(route,/pk-v2-art/);
 assert.match(css,/aspect-ratio:16\/9/);
 assert.doesNotMatch(route,/pk-v2-pad-[abxy]/);
});
