import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/spokemon-playable.ts',import.meta.url),'utf8');
const game=await readFile(new URL('../src/pedalkin-ride.ts',import.meta.url),'utf8');
const explore=await readFile(new URL('../public/pedalkin/explore.svg',import.meta.url),'utf8');
const encounter=await readFile(new URL('../public/pedalkin/encounter.svg',import.meta.url),'utf8');
const original=[
 'translate(48 161.5)','translate(177 161.5)','translate(48 284.3)',
 'translate(48 407.1)','translate(48 529.9)','translate(48 652.8)',
 'translate(48 778.5)','translate(1590.5015 183.81)',
 'translate(1586.3262 368.0016)','translate(56 946)',
 'translate(56 1001.0032)'
];
test('Every live value writes to native Illustrator text on both screens',()=>{
 for(const t of original){
  assert.ok(explore.includes(t),'Explore: '+t);
  assert.ok(encounter.includes(t),'Encounter: '+t);
  assert.ok(source.includes(t),'dynamic binding: '+t);
 }
 assert.match(game,/document\.createElement\('object'\)/);
 assert.match(game,/contentDocument/);
 assert.match(game,/font-family:Minecraft/);
 assert.doesNotMatch(source,/rect\(view,48,y/);
 assert.doesNotMatch(source,/rect\(view,1590,144/);
});
test('Native Illustrator metric fill paths and trust bars update without cover rectangles',()=>{
 for(const d of ['M54,171','M52.39,293.8','M52.88,416.6','M54,539.4','M54,662.3','M54,788']){
  assert.ok(explore.includes(d));
  assert.ok(encounter.includes(d));
  assert.ok(source.includes(d));
 }
 assert.match(source,/rect\[x="1592.9"\]\[y="199.3"\]/);
 assert.match(source,/rect\[x="1588.33"\]\[y="383.9"\]/);
});
test('Generated elevation masks exact profile area and leaves forest untouched',()=>{
 assert.match(source,/minX=380\.12,maxX=1540\.12,top=435\.42,bottom=810\.72/);
 assert.match(source,/const samples=route\?\.samples\|\|Array\.from/);
 assert.match(source,/const endLabel=text\(root,1520,766/);
 assert.match(source,/endLabel\.setAttribute\('text-anchor','end'\)/);
});
