import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const svg=readFileSync(new URL('../public/pedalkin/encounter.svg',import.meta.url),'utf8');

test('Spokemon encounter artboard has no missing linked Illustrator bitmap layers',()=>{
 assert.doesNotMatch(svg,/<image\b/i,'External bitmap images obscure the creature viewport when their PNGs are not deployed');
 assert.doesNotMatch(svg,/gamescreens_Encounter Screen-[12]\.png/);
});

test('Spokemon encounter preserves its original dimensions and HUD geometry',()=>{
 assert.match(svg,/viewBox="0 0 1920 1080"/);
 assert.match(svg,/x="380" y="111\.3" width="1160" height="700"/);
 for(const label of ['SPOKEMON TRUST','PATIENCE','CREATURE','FRIENDSHIP LV. 1 - XP','PINE FOREST']){
  assert.ok(svg.includes(label),'Missing encounter panel: '+label);
 }
});
