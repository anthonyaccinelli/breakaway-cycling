import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url));
const [catalog,render,ride,play]=await Promise.all([
 read('src/pedalkin-creatures.ts').then(b=>b.toString()),
 read('src/pedalkin-creature-art.ts').then(b=>b.toString()),
 read('src/pedalkin-ride.ts').then(b=>b.toString()),
 read('src/spokemon-playable.ts').then(b=>b.toString()),
]);
test('Pine Forest keeps exactly twelve unique species after replacing three',()=>{
 const entries=[...catalog.matchAll(/\{id:'([^']+)',name:'([^']+)'/g)];
 assert.equal(entries.length,12);
 assert.equal(new Set(entries.map(e=>e[1])).size,12);
 for(const [id,name] of [['dear','Dear'],['bob-moss','Bob Moss'],['hedgie','Hedgie']]){
  assert(entries.some(e=>e[1]===id&&e[2]===name),name+' in first biome');
 }
 for(const removed of ['scampernut','foxfire','toadstoolie']){
  assert(!entries.some(e=>e[1]===removed),removed+' replaced');
 }
});
test('All three original uploads are valid 64 x 64 transparent PNG sprites',async()=>{
 for(const name of ['dear','bob-moss','hedgie']){
  const png=await read('public/pedalkin/creatures/'+name+'.png');
  assert.deepEqual(png.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
  assert.equal(png.readUInt32BE(16),64);
  assert.equal(png.readUInt32BE(20),64);
  assert.match(catalog,new RegExp("artSrc:'/pedalkin/creatures/"+name+"\\.png'"));
 }
});
test('Encounter overlay renders approved pixels instead of fallback silhouettes',()=>{
 assert.match(render,/if\(species\.artSrc\)/);
 assert.match(render,/sprite\.setAttribute\('href',species\.artSrc\)/);
 assert.match(render,/sprite\.setAttribute\('image-rendering','pixelated'\)/);
 assert.match(ride,/addWorkingCreatureSilhouette\(sprite,currentSpecies\)/);
 assert.match(ride,/spokemonSpecies/);
 assert.match(play,/spokemonSpecies/);
 assert.match(catalog,/choosePineForestSpokemon/);
});
