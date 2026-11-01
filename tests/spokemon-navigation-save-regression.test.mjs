import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const ride=await readFile(new URL('../src/pedalkin-ride.ts',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/pedalkin-ride.css',import.meta.url),'utf8');
const gameplay=await readFile(new URL('../src/spokemon-playable.ts',import.meta.url),'utf8');
const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');

test('All four Spokemon navigation buttons remain visible above the unchanged SVG',()=>{
 for(const [name,label] of [
  ['route','01 ROUTE'],['devices','02 DEVICES'],
  ['ride','03 RIDE'],['overlay','04 OVERLAY']
 ]){
  assert.ok(ride.includes('data-pk-nav="'+name+'"'),name);
  assert.ok(ride.includes(label),label);
 }
 const previousHidden=styles.indexOf(':is(.pk-ride-nav,.pk-demo-bar,.pk-profile-bar)');
 const restored=styles.lastIndexOf('.pk-ride-nav{\n display:flex!important;');
 assert.ok(previousHidden>=0&&restored>previousHidden,
  'Restored exact-artboard nav rule must win over previous hidden rule');
 assert.match(styles,/width:min\(100vw,calc\(\(100dvh - 52px\)\*16\/9\)\)!important/);
 assert.match(styles,/height:min\(calc\(100dvh - 52px\),56\.25vw\)!important/);
});

test('Save & Close keeps native finish confirmation over Spokemon, never exposes old Survival UI',()=>{
 const start=ride.indexOf(' function finishThroughNative(){');
 const end=ride.indexOf('\n if(exactArtwork)playable=',start);
 const finish=ride.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.match(finish,/!finish\.hidden&&!finish\.disabled/);
 assert.match(finish,/finish\.click\(\)/);
 assert.match(finish,/playable\?\.stopTestRide\(\)/);
 assert.match(finish,/triggerNavigation\('route'\)/);
 assert.doesNotMatch(finish,/host\.hidden=true/);
 assert.doesNotMatch(finish,/classList\.remove\('pk-riding'\)/);
 assert.match(styles,/#manualFinishPrompt/);
 assert.match(styles,/\.ride-summary\.ride-summary-fullscreen/);
 assert.match(styles,/z-index:2147483200!important/);
});

test('Unrecorded test sessions stop cleanly while the caught collection persists',()=>{
 assert.match(gameplay,/function stopTestRide\(\)/);
 assert.match(gameplay,/simulator=false;simulationRunning=false/);
 assert.match(gameplay,/return \{setFrame,paint,stopTestRide,/);
 assert.doesNotMatch(gameplay.slice(gameplay.indexOf(' function stopTestRide(){'),gameplay.indexOf(' function sync(){')),/localStorage\.removeItem/);
});

test('Native Spokemon ride summary Done returns to game Route rather than legacy Ride screen',()=>{
 const summary=main.slice(main.indexOf('function showRideSummary(){'),main.indexOf('function setRideFocus(',main.indexOf('function showRideSummary(){')));
 assert.match(summary,/if\(rideExperience==='pedalkin'\)showBreakawayScreen\('route'\)/);
});
