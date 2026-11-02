import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const svg=readFileSync(new URL('../public/pedalkin/encounter.svg',import.meta.url),'utf8');

test('Spokemon encounter embeds its original Pine Forest artwork',()=>{
 assert.match(svg,/<image[^>]+id="pk-original-pine-forest"[^>]+xlink:href="data:image\/png;base64,/);
 assert.doesNotMatch(svg,/xlink:href="(?!data:)[^"]+\.(png|jpg|jpeg|webp)"/i,
  'Encounter artwork must never reference external Illustrator-exported PNGs');
 assert.doesNotMatch(svg,/gamescreens_Encounter Screen-[12]\.png/);
});

test('Spokemon encounter preserves the exact HUD geometry',()=>{
 assert.match(svg,/viewBox="0 0 1920 1080"/);
 assert.match(svg,/x="380" y="111\.3" width="1160" height="700"/);
 for(const label of ['SPOKEMON TRUST','PATIENCE','CREATURE','FRIENDSHIP LV. 1 - XP','PINE FOREST']){
  assert.ok(svg.includes(label),'Missing encounter panel: '+label);
 }
});
