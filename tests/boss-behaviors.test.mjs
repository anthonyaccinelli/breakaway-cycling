import test from 'node:test';
import assert from 'node:assert/strict';
import {loadQuestModule} from './quest-loader.mjs';
const {advanceBossBattle,bossBehavior}=await loadQuestModule('combat.js');
const boss=(extra={})=>({kind:'boss',hp:100000,max:100000,dps:1,...extra});
const tick=(b,hp,damage,dt,options={})=>advanceBossBattle(b,hp,damage,dt,{watts:200,cadence:80,ftp:280,maxHP:100,...options});
test('boss warning follows 20 seconds and a successful brace earns double damage',()=>{
 let out=tick(boss(),100,100,20);assert.equal(out.battle.phase,'brace');assert.equal(out.hp,80);
 out=tick(out.battle,out.hp,100,5,{watts:100});assert.equal(out.battle.phase,'stagger');assert.equal(out.hp,78);
 out=tick(out.battle,out.hp,100,10);assert.equal(out.hp,78);assert.equal(out.battle.hp,95500);assert.equal(out.battle.phase,'recover');
});
test('missing brace deals the full special hit and grants no stagger',()=>{
 const out=tick(boss({phase:'brace'}),100,100,5);assert.equal(out.hp,92);assert.equal(out.battle.phase,'recover');
});
test('armor blocks both attacks, heals at zero watts, and caps at max HP',()=>{
 let out=tick(boss({phase:'recover'}),50,500,5,{watts:0,cadence:0});assert.equal(out.hp,75);assert.equal(out.battle.hp,100000);assert.equal(out.battle.phase,'attack');
 out=tick(boss({phase:'recover'}),90,500,5,{watts:0,cadence:0});assert.equal(out.hp,100);
 out=tick(boss({phase:'recover'}),50,500,5);assert.equal(out.hp,50);
});
test('summit escapes after 15 seconds, resets on pedaling, suspends during armor',()=>{
 let out=tick(boss({kind:'summit'}),100,0,14,{watts:0,cadence:0});assert.equal(out.outcome,null);
 out=tick(out.battle,out.hp,0,1,{watts:0,cadence:0});assert.equal(out.outcome,'flee');
 out=tick(boss({kind:'summit',stopped:14}),100,0,1);assert.equal(out.battle.stopped,0);
 out=tick(boss({kind:'summit',phase:'recover',stopped:14}),50,0,5,{watts:0,cadence:0});assert.equal(out.outcome,null);assert.equal(out.battle.stopped,14);
 out=tick(out.battle,out.hp,0,1,{watts:0,cadence:0});assert.equal(out.outcome,'flee');
});
test('large and small ticks produce the same phases, damage and healing',()=>{
 const one=tick(boss(),100,100,40,{watts:100});let many={battle:boss(),hp:100};for(let i=0;i<400;i++)many=tick(many.battle,many.hp,100,.1,{watts:100});
 assert.equal(one.battle.phase,many.battle.phase);assert.ok(Math.abs(one.hp-many.hp)<1e-7);assert.ok(Math.abs(one.battle.hp-many.battle.hp)<1e-7);
});
test('boss death still ends at 1 HP and phase defaults support existing saves',()=>{
 assert.equal(bossBehavior(boss()).phase,'attack');assert.equal(tick(boss(),2,0,5).outcome,'loss');
});
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
const stepSource=game.slice(game.indexOf('function step('),game.indexOf('\nfunction fleeSummit'));
test('Boss Mode warmup only counts pedaling and defers battle until level-up clears',()=>{
 const c={running:true,s:{rideSeconds:0,reward:false,mode:'boss',bossWarmupRemaining:600},power:0,live:{cadence:0},warmupSeconds:600,levelUp:null,award(){},encounters:0,encounter(){c.encounters++;},};
 vm.createContext(c);vm.runInContext(stepSource,c);vm.runInContext('step(1)',c);assert.equal(c.warmupSeconds,600);
 c.power=150;c.live.cadence=70;for(let i=0;i<600;i++)vm.runInContext('step(1)',c);assert.equal(c.warmupSeconds,0);assert.equal(c.s.bossWarmupReady,true);assert.equal(c.encounters,0);
 c.levelUp={};vm.runInContext('step(1)',c);assert.equal(c.encounters,0);c.levelUp=null;vm.runInContext('step(1)',c);assert.equal(c.encounters,1);
});
