import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [play,ride,rideCss,main]=await Promise.all([
 read('src/spokemon-playable.ts'),read('src/pedalkin-ride.ts'),
 read('src/pedalkin-ride.css'),read('src/main.ts')]);
test('Native real virtual gear, not calories, drives the sixth Spokemon readout',()=>{
 assert.match(main,/gear:drivetrainMode==='virtual'\?gear:null/);
 assert.match(play,/gear\?:number\|null/);
 assert.match(play,/translate\(48 778\.5\)',f\.gear==null\?'—':String\(f\.gear\)/);
 assert.match(play,/translate\(52 738\.5\)','GEAR'/);
 assert.match(play,/\['M54,788',f\.gear\|\|0,24\]/);
});
test('Spokemon profile and ride dialogue show US miles, not km',()=>{
 assert.match(play,/METERS_PER_MILE=1609\.344/);
 assert.match(play,/text\(plot,415,766,\(f\.distanceMeters\/METERS_PER_MILE\)/);
 assert.match(play,/text\(plot,1520,766,\(meters\/METERS_PER_MILE\)/);
 assert.match(play,/REAL RIDE · '\+\(f\.distanceMeters\/METERS_PER_MILE\)/);
 assert.match(play,/TEST RIDE · '\+\(simDistance\/METERS_PER_MILE\)/);
});
test('Explore reuses two original upper-right cards for riding metrics, not capture controls',()=>{
 assert.match(play,/getScene\(\)==='explore'/);
 assert.match(play,/pk-explore-ride-stats/);
 assert.match(play,/metric\('distance-label',1586,139,20\)/);
 assert.match(play,/metric\('gain-label',1747,139,19\)/);
 assert.match(play,/metric\('time-label',1586,310,23\)/);
 assert.match(play,/biomePanel\.setAttribute\('y','277'\)/);
 assert.match(play,/biomePanel\.setAttribute\('height','252'\)/);
 assert.match(play,/hide\('text\[transform="translate\(1590\.5015 126\.1968\)"\]'\)/);
 assert.match(play,/hide\('text\[transform="translate\(1586\.3262 309\.9969\)"\]'\)/);
 assert.doesNotMatch(play,/hide\('rect\[x="1566"\]\[y="98\.2"\]'\)/);
});
test('Distance and elevation gain use session-specific, measured totals',()=>{
 assert.match(main,/rideDistanceMeters:sessionDistanceMeters\(\)/);
 assert.match(main,/gainLossThrough\(distance\)\.gain-/);
 assert.match(main,/gainLossThrough\(rideSessionStartDistance\)\.gain/);
 assert.match(play,/elevationGainFeet\?:number/);
 assert.match(play,/simulator\?ascentThrough\(samples,totalMeters,simDistance\):0/);
 assert.match(play,/value\('time',clock\)/);
});
test('Captures automatically appoint a Buddy and selection persists across reload',()=>{
 assert.match(play,/BUDDY_STORAGE='spokemon-buddy-v1'/);
 assert.match(play,/setBuddy\(species\.id\)/);
 assert.match(play,/localStorage\.setItem\(BUDDY_STORAGE,id\)/);
 assert.match(play,/getBuddy:\(\)=>buddy\(\)/);
 assert.match(play,/pk-active-buddy/);
 assert.match(play,/addWorkingCreatureSilhouette\(sprite,creature\)/);
});
test('Clicking the creature display and the Buddy menu opens interactive selection',()=>{
 assert.match(ride,/class="pk-hitspot pk-buddy-art"/);
 assert.match(ride,/data-pk-action="buddy"/);
 assert.match(ride,/pk-buddy-choices/);
 assert.match(ride,/aria-pressed/);
 assert.match(ride,/playable\?\.setBuddy\(caught\.id\)/);
 assert.match(rideCss,/button\.pk-buddy-art/);
 assert.match(rideCss,/pointer-events:auto!important/);
});
test('Both navigation actions use real native Route and Devices controls',()=>{
 assert.match(ride,/target==='route'\?'stepRoute':target==='devices'\?'stepSetup':'stepRide'/);
 assert.match(ride,/RIDE IN PROGRESS/);
 assert.match(rideCss,/\.pk-ride-nav\{z-index:60!important;\}/);
});

test('Buddy name updates with the current selection and active rides can pause before navigating',()=>{
 assert.match(play,/BUDDY: '\+currentBuddy\.name\.toUpperCase\(\)/);
 assert.match(ride,/PAUSE RIDE & OPEN /);
 assert.match(ride,/start\.click\(\)/);
 assert.match(ride,/requestAnimationFrame\(\(\)=>/);
 assert.match(rideCss,/\.pk-ride-leave-confirm/);
});
