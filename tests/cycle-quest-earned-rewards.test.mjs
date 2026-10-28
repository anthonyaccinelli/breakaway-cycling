import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {battleRewards,validPendingReward,sessionMetrics} from '../cycle-quest/rewards.js';
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
function fn(name){const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);return game.slice(start,end);}
function fixture(state={}){
 const c={externalSaveChanged:false,s:{xp:0,hp:50,coins:0,chapter:1,miles:50,rideSeconds:9000,rideMiles:100,...state},levelUps:{enqueue(){}},message:'',rewardChoice:null,parentSend(){},shareCard(){},render(){},saved:null,save(){c.saved=JSON.parse(JSON.stringify(c.s));},fmt:Math.round,battleRewards};
 c.MAX_XP=10000000;vm.createContext(c);vm.runInContext(['level','cost','threshold','maxHP','atk','award','restoreRewardState','finish','choose'].map(fn).join('\n'),c);return c;
}
test('one/two/three defeated enemies immediately earn 150/300/450 XP and scale both choices',()=>{
 for(const count of [1,2,3]){
  const c=fixture({battle:{kind:'enemy',enemies:Array(count).fill({}),reward:60}});
  vm.runInContext('finish(true)',c);assert.equal(c.s.xp,150*count);assert.equal(c.s.pendingReward.hp,25*count);assert.equal(c.s.pendingReward.coins,25*count);assert.equal(c.s.reward,true);assert.equal(c.saved.xp,150*count);
  vm.runInContext('choose("coins");choose("coins");finish(true)',c);assert.equal(c.s.coins,25*count);assert.equal(c.s.xp,150*count);assert.equal(c.s.pendingReward,null);
 }
});
test('healing choice caps at max HP, never replaces earned XP, and loss grants no coins or XP',()=>{
 const c=fixture({hp:80,battle:{kind:'enemy',enemies:[{},{}]}});vm.runInContext('finish(true);choose("heal")',c);assert.equal(c.s.hp,100);assert.equal(c.s.xp,300);assert.equal(c.s.coins,0);
 const lost=fixture({hp:1,battle:{kind:'enemy',enemies:[{},{},{}]}});vm.runInContext('finish(false);choose("coins")',lost);assert.equal(lost.s.xp,0);assert.equal(lost.s.coins,0);assert.equal(lost.s.hp,100);assert.equal(lost.s.reward,false);
});
test('boss and summit XP are automatic with a separate choice; chapter progression happens once',()=>{
 for(const kind of ['boss','summit']){
  const c=fixture({battle:{kind,reward:1000},boss:{name:'guardian'}});vm.runInContext('finish(true)',c);assert.equal(c.s.xp,1000);assert.equal(c.s.pendingReward.coins,25);assert.equal(c.s.chapter,kind==='boss'?2:1);vm.runInContext('choose("coins")',c);assert.equal(c.s.xp,1000);assert.equal(c.s.coins,25);
 }
});
test('victory survives reload without a duplicate XP grant; legacy pending reward migrates once',()=>{
 const c=fixture({battle:{kind:'enemy',enemies:[{},{},{}]}});vm.runInContext('finish(true)',c);
 const restored=fixture(c.saved);vm.runInContext('restoreRewardState();choose("coins")',restored);assert.equal(restored.s.xp,450);assert.equal(restored.s.coins,75);
 const legacy=fixture({reward:true,coins:undefined});vm.runInContext('restoreRewardState();restoreRewardState()',legacy);assert.equal(legacy.s.xp,150);assert.equal(legacy.s.coins,0);assert(validPendingReward(legacy.s.pendingReward));
});
test('level gains fully heal including multiple levels; ordinary XP does not heal',()=>{
 const c=fixture({xp:590,hp:5});vm.runInContext('award(5)',c);assert.equal(c.s.hp,5);vm.runInContext('award(2400)',c);assert.equal(c.s.hp,c.maxHP());assert(c.s.hp>110);
});
test('session readouts use host session values instead of character lifetime totals',()=>{
 const state={rideSeconds:99999,rideMiles:1234,session:{startSeconds:99000,startMiles:1230}};
 assert.deepEqual(sessionMetrics(state,{sessionSeconds:120,sessionDistanceM:1609.344}),{seconds:120,miles:1});
 assert.deepEqual(sessionMetrics(state,{}),{seconds:999,miles:4});
 assert.deepEqual(sessionMetrics({rideSeconds:99999,rideMiles:1234},{}),{seconds:0,miles:0});
 assert.equal(validPendingReward({count:3,xp:450,hp:25,coins:75}),false);
 assert.equal(battleRewards({kind:'enemy',reward:60}).xp,150);
});

test('earned XP cannot cross the save validator limit and make the next load fail',()=>{
 const c=fixture({xp:9999990});vm.runInContext('award(150)',c);assert.equal(c.s.xp,10000000);
 vm.runInContext('award(1)',c);assert.equal(c.s.xp,10000000);
});
