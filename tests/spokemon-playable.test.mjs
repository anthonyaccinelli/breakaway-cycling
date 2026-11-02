import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const gameplay=await readFile(new URL('../src/spokemon-playable.ts',import.meta.url),'utf8');
const ride=await readFile(new URL('../src/pedalkin-ride.ts',import.meta.url),'utf8');
const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const css=await readFile(new URL('../src/spokemon-playable.css',import.meta.url),'utf8');

test('Spokemon real game receives route, measured cadence, power and save state',()=>{
 assert.match(main,/window\.dispatchEvent\(new CustomEvent\('pedalkin:ride-frame'/);
 for(const key of ['powerWatts','cadenceRpm','heartRateBpm','speedMph','caloriesKcal','running','connected']){
  assert.ok(main.includes(key),key);
 }
 assert.match(ride,/playable\?\.setFrame/);
 assert.match(ride,/mountSpokemonPlayable/);
 assert.match(gameplay,/const ready=\(\)=>Boolean\(lastReal\?\.connected/);
});
test('Test mode cannot synthesize ride records or trainer commands',()=>{
 assert.match(gameplay,/Test Ride moves along the route about 5× faster for gameplay QA/);
 assert.match(gameplay,/simulationRunning/);
 assert.doesNotMatch(gameplay,/dispatchEvent\(new CustomEvent\('pedalkin:ride-frame'/);
 assert.doesNotMatch(gameplay,/setResistance|setSimGradient|saveRecordedRide/);
});
test('Encounter gameplay includes captures, failures, cooldown, and collection persistence',()=>{
 assert.match(gameplay,/choosePineForestSpokemon/);
 assert.match(gameplay,/if\(trust>=100\)/);
 assert.match(gameplay,/resolve\(Math\.random\(\)<chanceAtFullTrust\(temperament\)\)/);
 assert.match(gameplay,/patience<=0/);
 assert.match(gameplay,/saveCollection\(\)/);
 assert.match(gameplay,/encounterCooldown=progressDistance/);
});
test('Exact Illustrator SVG assets remain untouched, with grade profiles rendered separately',()=>{
 assert.match(ride,/slot\.replaceChildren\(untouched\)/);
 assert.match(gameplay,/slot\.append\(view\)/);
 assert.match(css,/pointer-events:none!important/);
 for(const color of ['#f6d58c','#9eca96','#6aad38','#989141','#c6744a','#f45853']){
  assert.ok(gameplay.includes(color),color);
 }
});
