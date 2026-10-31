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

test('latest Illustrator artboards load the same forest scene shown in the reference screenshot',()=>{
 for(const svg of [explore,encounter]){
  assert.match(svg,/xlink:href="\/pedalkin\/forest\.jpg"/);
  assert.doesNotMatch(svg,/(explorescreen-1|encounter2-1)\.png/);
 }
});
test('encounter has exactly a 460 by 370 crab centered where the white bounding box was',()=>{
 assert.match(encounter,/<image id="pk-encounter-crab" x="730" y="355" width="460" height="370"/);
 assert.match(encounter,/xlink:href="data:image\/png;base64,/);
 assert.doesNotMatch(encounter,/<rect class="st4" x="725" y="360" width="470" height="360"/);
 assert.doesNotMatch(explore,/id="pk-encounter-crab"/);
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
