import test from 'node:test';
import assert from 'node:assert/strict';
import {loadQuestModule} from './quest-loader.mjs';
const {advanceTurnBattle}=await loadQuestModule('combat.js');
const start={kind:'enemy',hp:90000,dps:1.2};
const step=(battle,hp,watts,dt,potions=0)=>advanceTurnBattle(battle,hp,100,dt,{watts,cadence:80,potions,maxHP:100});
test('five-second turns resolve a weighted Guard once, even across save and resume',()=>{
 const a=step(start,100,180,5);
 assert.equal(a.battle.hp,89000);assert.equal(a.hp,100);
 const g=step(a.battle,100,140,2);
 const h=step(JSON.parse(JSON.stringify(g.battle)),100,200,3);
 assert.equal(h.hp,94);assert.equal(h.battle.hp,a.battle.hp);
 assert.equal(step(a.battle,100,150,5).hp,91);
 assert.equal(step(a.battle,100,100,5).hp,88);
});
test('six enemy turns charge an automatic special and potions spend the attack turn',()=>{
 const full=step(start,100,180,60);
 assert.equal(full.battle.charge,30);
 const hit=step(full.battle,full.hp,180,1);
 assert.ok(hit.battle.special);assert.equal(hit.battle.hp,full.battle.hp-400);
 const heal=step(full.battle,20,180,5,1);
 assert.equal(heal.hp,50);assert.equal(heal.potions,0);assert.equal(heal.battle.hp,full.battle.hp);
 assert.equal(heal.battle.charge,30);
});
