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
 assert.match(css,/\.pk-v2-actions-grid\{/);
 assert.match(css,/\.pk-v2-nav-devices\{/);
 assert.match(css,/\.pk-v2-pad-a\{/);
 assert.match(css,/#0f292f/);
 assert.match(css,/\.pk-v2-route-stats/);
 assert.match(css,/\.pk-v2-live-chart/);
 assert.match(css,/background:#0f292f!important/);
});

test('route facts stay inside the Illustrator preview pane and never spill over the console',()=>{
 const block=css.match(/\.pk-v2-route-stats\{([\s\S]*?)\}/)?.[1]||'';
 const read=(prop)=>Number(block.match(new RegExp(prop+':([0-9.]+)%'))?.[1]);
 const x=read('left'),w=read('width');
 assert(Number.isFinite(x)&&Number.isFinite(w));
 assert(x>=51&&x<53,'stats aligned with preview body');
 assert(x+w<=69.8,'stats overlay must fit inside x=1339/1920 preview card');
 const y=read('top'),h=read('height');
 assert(y*10.8>=380&&y*10.8<=389,'mask covers baked-in first metric but not heading');
 assert((y+h)*10.8<=530,'mask stops above the panel bottom border');
 assert.match(block,/overflow:hidden!important/);
 assert.match(css,/\.pk-v2-route-stats>div\{/);
 assert.match(css,/text-overflow:ellipsis!important/);
 assert.doesNotMatch(block,/left:59\.6%/);
});
test('terrain shows the selected biome, not the verbose generated difficulty summary',()=>{
 assert.match(code,/original\.terrain!\.selectedOptions\[0\]\?\.textContent/);
 assert.match(code,/terrainStat\.textContent=terrainLabel/);
});

test('screen metrics and chart are forcibly clipped to their Illustrator LCD bounds',()=>{
 assert.match(css,/\.pk-v2-live \.pk-v2-route-stats\{/);
 assert.match(css,/left:51\.65%!important;top:35\.50%!important;/);
 assert.match(css,/width:17\.55%!important;height:13\.55%!important;/);
 assert.match(css,/clip-path:inset\(0\)!important;/);
 assert.match(css,/\.pk-v2-route-stats>div\{/);
 assert.match(css,/overflow:hidden!important;text-overflow:ellipsis!important;/);
 assert.match(css,/\.pk-v2-live \.pk-v2-live-chart\{/);
 assert.match(css,/contain:paint!important;/);
});

test('exactly one live lock checkbox and label replace the doubled screenshot control',()=>{
 assert.equal((code.match(/class="pk-v2-lock"/g)||[]).length,1);
 assert.match(code,/<label class="pk-v2-lock-control"><input class="pk-v2-lock" type="checkbox"\/><span>Lock<\/span><\/label>/);
 assert.match(css,/\.pk-v2-lock-control\{/);
 assert.match(css,/background:#ffffff!important/);
 assert.match(css,/\.pk-v2-lock-control input\.pk-v2-lock\{/);
 assert.match(css,/position:static!important/);
 assert.doesNotMatch(css,/\.pk-v2-live input\.pk-v2-lock\{/);
});

test('route buttons share one six-child three-column two-row grid and equal dimensions',()=>{
 assert.match(code,/<div class="pk-v2-actions-grid" role="group"/);
 const group=code.match(/<div class="pk-v2-actions-grid"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'';
 const controls=['pk-v2-generate','pk-v2-surprise','pk-v2-endless','pk-v2-recovery','pk-v2-rolling','pk-v2-climbing'];
 assert.equal((group.match(/<button /g)||[]).length,6);
 for(const name of controls)assert(group.includes('class="pk-v2-hit '+name+'"'),name);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
 assert.match(css,/grid-template-rows:repeat\(2,minmax\(0,1fr\)\)!important/);
 assert.match(css,/\.pk-v2-actions-grid>button\.pk-v2-hit\{/);
 assert.match(css,/width:100%!important;height:100%!important/);
 assert.match(css,/position:static!important/);
 assert.match(css,/\.pk-v2-actions-grid>button:nth-child\(-n\+3\)/);
 assert.doesNotMatch(css,/\.pk-v2-generate\{left:/);
 assert.doesNotMatch(css,/\.pk-v2-generate:after/);
});
