import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [main,ride,style,play,explore,encounter]=await Promise.all([
 read('src/main.ts'),read('src/pedalkin-ride.ts'),read('src/pedalkin-ride.css'),
 read('src/spokemon-playable.ts'),read('public/pedalkin/explore.svg'),
 read('public/pedalkin/encounter.svg')
]);
test('Exact original SVG masters are present and loaded as isolated same-origin documents',()=>{
 for(const svg of [explore,encounter]){
  assert.match(svg,/viewBox="0 0 1920 1080"/);
  assert.match(svg,/Generator: Adobe Illustrator/);
 }
 assert.match(ride,/document\.createElement\('object'\)/);
 assert.match(ride,/untouched\.data=svgUrl\(stageName\)/);
 assert.match(ride,/slot\.replaceChildren\(untouched\)/);
});
test('Explore and Encounter display inside fixed aspect-ratio viewport, no synthetic artwork',()=>{
 assert.match(style,/aspect-ratio:16\/9!important/);
 assert.match(style,/pk-exact-artwork-mode/);
 assert.match(ride,/pk-exact-artboard/);
 assert.match(ride,/document\.body\.append\(host\)/);
});
test('Original readouts are updated by Illustrator transforms, not opaque double-painted boxes',()=>{
 for(const transform of ['translate(48 161.5)','translate(48 284.3)','translate(48 407.1)',
  'translate(48 529.9)','translate(48 652.8)','translate(48 778.5)',
  'translate(1590.5015 183.81)','translate(1586.3262 368.0016)']){
  assert.ok(play.includes(transform),transform);
 }
 assert.match(play,/const doc=object\?\.contentDocument/);
 assert.doesNotMatch(play,/rect\(view,48,y/);
});
test('Gradient colors and scanlines share a clipped elevation silhouette',()=>{
 for(const color of ['#f6d58c','#9eca96','#6aad38','#989141','#c6744a','#f45853'])
  assert.ok(play.includes(color));
 assert.match(play,/pk-spokemon-grade-clip/);
 assert.match(play,/rect\(clipped,x1,top/);
 assert.match(play,/line\(clipped,minX,y,maxX,y/);
 assert.match(play,/samplePosition/);
});
test('Desktop route controls are visible; changing mode while recording is guarded',()=>{
 assert.match(style,/min-width:901px/);
 assert.match(style,/\.pk-ride-tabs button/);
 assert.match(ride,/RIDE IN PROGRESS/);
 assert.match(ride,/Finish and save your recorded ride/);
 assert.match(ride,/get\('stepSetup'\)|stepSetup/);
});
test('Trainer-free test rides never send FTMS commands or fake recorded workouts',()=>{
 assert.match(play,/Test Ride moves along the route about 5× faster for gameplay QA/);
 assert.doesNotMatch(play,/saveRecordedRide|setResistance\(|dispatchEvent\(new CustomEvent\('pedalkin:ride-frame'/);
 assert.match(main,/pedalkin:ride-frame/);
 assert.match(play,/const ready=\(\)=>Boolean\(lastReal\?\.connected/);
});
test('Capture loop prevents non-rider manual encounters and persists real collection data',()=>{
 assert.match(play,/if\(getScene\(\)==='encounter'\|\|!active\(\)\|\|!riding\(\)\)return/);
 assert.match(play,/saveCollection\(\)/);
 assert.match(play,/getCollection:\(\)=>collection\.slice\(\)/);
 assert.match(play,/temperament=chooseTemperament\(\)/);
});
test('Journal, buddy selection and test-mode stats call actual game state',()=>{
 assert.match(ride,/playable\?\.getCollection\(\)/);
 assert.match(ride,/playable\?\.setBuddy\(c\.id\)/);
 assert.match(ride,/playable\?\.getLiveStats\(\)/);
 assert.match(play,/BUDDY_STORAGE/);
 assert.match(play,/activeBuddy\.xp=/);
});
test('Save & Close returns test rides to Route but uses native Finish for recorded rides',()=>{
 assert.match(ride,/function finishThroughNative\(\)/);
 assert.match(ride,/finish\.click\(\)/);
 assert.match(ride,/playable\?\.stopTestRide\(\)/);
 assert.match(ride,/triggerNavigation\('route'\)/);
});
test('Only the real riding session receives trainer power, cadence and grade updates',()=>{
 for(const key of ['powerWatts','cadenceRpm','heartRateBpm','speedMph','caloriesKcal','running','connected']){
  assert.ok(main.includes(key),key);
 }
 assert.match(ride,/playable\?\.setFrame/);
});
