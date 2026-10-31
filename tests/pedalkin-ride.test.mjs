import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const view=await readFile(new URL('../src/pedalkin-ride.ts',import.meta.url),'utf8');
const style=await readFile(new URL('../src/pedalkin-ride.css',import.meta.url),'utf8');
const explore=await readFile(new URL('../public/pedalkin/explore.svg',import.meta.url),'utf8');
const encounter=await readFile(new URL('../public/pedalkin/encounter.svg',import.meta.url),'utf8');

test('ride uses the two exact 1920x1080 Illustrator artboards rather than a redrawn layout',()=>{
 for(const s of [explore,encounter]){
  assert.match(s,/viewBox="0 0 1920 1080"/);
  assert.match(s,/Generator: Adobe Illustrator/);
  assert.match(s,/DIALOGUE \/ PROMPTS/);
  assert.match(s,/COMPANIONSHIP 12/);
  assert.match(s,/SPOKEMON/);
 }
 assert.match(explore,/ELEVATION PROFILE/);
 assert.match(encounter,/CREECH BAR/);
 assert.doesNotMatch(encounter,/WILD PEDALKIN ART/);
});

test('both Illustrator artboards use the shipped working pixel forest rather than broken JPEG',async()=>{
 const forest=await readFile(new URL('../public/pedalkin/forest-placeholder.svg',import.meta.url),'utf8');
 assert.match(forest,/<svg[^>]+viewBox="0 0 512 288"/);
 assert.match(forest,/shape-rendering="crispEdges"/);
 assert.match(forest,/<title>Pixelated pine forest clearing placeholder for Pedalkin<\/title>/);
 for(const svg of [explore,encounter]){
  assert.match(svg,/xlink:href="\/pedalkin\/forest-placeholder\.svg"/);
  assert.doesNotMatch(svg,/xlink:href="\/pedalkin\/forest\.jpg"/);
 }
});
test('encounter retains a 460x370 crab; both artboards replace green buddy circle with crab',()=>{
 assert.match(encounter,/<image id="pk-encounter-crab" x="730" y="355" width="460" height="370"/);
 for(const svg of [explore,encounter]){
  assert.match(svg,/<image id="pk-buddy-crab" x="1664" y="605" width="120" height="98"/);
  assert.doesNotMatch(svg,/<circle class="st\d+" cx="1724" cy="655\.8" r="37"/);
  assert.doesNotMatch(svg,/BUDDY ART/);
  assert.match(svg,/xlink:href="data:image\/png;base64,/);
 }
 assert.doesNotMatch(explore,/id="pk-encounter-crab"/);
});
test('four menu hotspots remain interactive without legacy blue button rectangles',()=>{
 assert.match(style,/body\.pk-riding #screenRide \.pk-ride-host button\.pk-hitspot/);
 assert.match(style,/opacity:0!important;/);
 assert.match(style,/background:transparent!important;/);
 assert.match(style,/box-shadow:none!important;/);
 assert.match(style,/button\.pk-hitspot:focus-visible/);
 assert.equal((view.match(/class="pk-hitspot /g)||[]).length,4);
});
test('both states retain vector typography and panel geometry after inserting crab',()=>{
 assert((explore.match(/<text\b/g)||[]).length>=40);
 assert((encounter.match(/<text\b/g)||[]).length>=33);
 assert.match(explore,/Cruising through Pinepath Trail/);
 assert.match(encounter,/Keep a steady pace to calm it down/);
});
test('new 03 Ride screens are on Pedalkin only; preview works without trainer and never invents ride data',()=>{
 assert.match(main,/mountPedalkinRide\(\)/);
 assert.match(main,/pedalkinPreviewScreen/);
 assert.match(main,/showBreakawayScreen\(\['ride','explore','encounter'\]/);
 assert.match(view,/rideExperience==='pedalkin'/);
 assert.match(view,/NO TRAINER \/ NO RECORDED RIDE/);
 assert.match(view,/no synthetic wattage, no trainer control/);
 assert.doesNotMatch(view,/(?:setGrade|sendFtms|requestDevice|cycleQuestHold|setVirtualGearResistance)\(/);
 assert.match(style,/\.pk-ride-stage/);
});
test('preview navigation and capture demos are interactive; route remains unaltered',()=>{
 assert.match(view,/data-pk-demo="explore"/);
 assert.match(view,/data-pk-demo="encounter"/);
 assert.match(view,/data-pk-demo="pedal"/);
 assert.match(view,/data-pk-demo="escape"/);
 assert.match(view,/data-pk-action="journal"/);
 assert.match(view,/data-pk-action="save"/);
 assert.match(view,/wildness=Math\.max\(0,wildness-seconds\*1\.55\)/);
 assert.match(main,/rideExperience==='pedalkin'&&\['route','setup','ride','explore','encounter'\]/);
});
