import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
const expected=[.75,.87,.99,1.11,1.23,1.38,1.53,1.68,1.86,2.04,2.22,2.40,2.61,2.82,3.03,3.24,3.49,3.74,3.99,4.24,4.54,4.84,5.14,5.49];
const gearing=main.slice(main.indexOf('const ZWIFT_GEAR_RATIOS'),main.indexOf('const SIM_TEST_WATTS'));
const erg=main.slice(main.indexOf('async function setVirtualGearResistance('),main.indexOf('// True constant-wattage ERG'));
const sim=main.slice(main.indexOf('function simRequestedGrade('),main.indexOf('function resetSimController('));
test('all 24 ERG gears use Zwift ratios without extra low-gear assistance, including held battles',async()=>{
 const c={gear:12,drivetrainMode:'virtual',connected:true,controlGranted:true,running:true,realTelemetry:true,trainerMode:'erg',cycleQuestHold:false,cycleQuestHeldErgTarget:240,cycleQuestHeldGear:12,lastTarget:-100,cadence:85,distance:0,at:()=>({grade:0}),num:()=>100,command:async()=>true};
 vm.createContext(c);vm.runInContext(ts.transpile(gearing+'\n'+erg),c);
 for(const held of [false,true]){c.cycleQuestHold=held;for(let i=0;i<24;i++){c.gear=i+1;c.lastTarget=-100;await c.setVirtualGearResistance();assert.equal(c.lastTarget,Math.round((held?240:135)*expected[i]/2.4));}}
});
test('SIM shifting applies only the Zwift ratio adjustment across the low gears',()=>{
 const c={gear:12,drivetrainMode:'virtual',cycleQuestHold:false,speed:8,distance:0,at:()=>({grade:6}),num:()=>100};
 vm.createContext(c);vm.runInContext(ts.transpile(gearing+'\n'+sim),c);
 for(let i=0;i<24;i++){c.gear=i+1;assert.equal(c.simRequestedGrade(),Math.max(-12,Math.min(12,6+(expected[i]/2.4-1)*(4+64*.08))));}
});
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
