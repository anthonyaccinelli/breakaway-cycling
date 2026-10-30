import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
test('compact battle renders all living enemies independently and removes each defeated enemy',()=>{
 const c={safeText:String,fmt:Math.round};vm.createContext(c);
 vm.runInContext(game.slice(game.indexOf('function healthColor('),game.indexOf('function patchMarkup('))+game.slice(game.indexOf('function monsterArt('),game.indexOf('function draw')) .split('function groupBars(')[0],c);
 for(const ids of [['rat','bat','snake'],['rat','goblin','wolf'],['goblin','wolf','worg']]){
  const b={enemies:ids.map((id,i)=>({id,name:id.toUpperCase(),hp:100-i*25,max:100,level:1}))};
  for(let dead=0;dead<3;dead++){
   const html=c.monsterArt(b,true);assert.equal((html.match(/class="cq-rat-card"/g)||[]).length,3-dead);
   for(let i=0;i<3;i++){assert.equal(html.includes(ids[i].toUpperCase()+' - LV'),i>=dead);if(i>=dead)assert(html.includes('width:'+b.enemies[i].hp+'%'));}
   b.enemies[dead].hp=0;
  }
  assert.equal(c.monsterArt(b,true),'');
 }
});
