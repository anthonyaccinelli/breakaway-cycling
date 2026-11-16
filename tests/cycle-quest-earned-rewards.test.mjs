import {chapterRoute as storyRoute} from '../cycle-quest/chapters.js';
import {generateRoute} from '../cycle-quest/routes.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {battleRewards,validPendingReward,sessionMetrics,HEALING} from '../cycle-quest/rewards.js';
import {loadQuestModule} from './quest-loader.mjs';
const {bikeFor,multiplier,changePart,exploreRoadside,partBonus,validBike}=await loadQuestModule('bike-parts.js');
const progression=await loadQuestModule('progression.js');
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
function fn(name){const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);return game.slice(start,end);}
function fixture(state={}){
 const c={encounterDelay:()=>200,bikeFor,multiplier,storyRoute,chapterRoute:storyRoute,generateRoute,HEALING,lastLiveDistance:0,music:{endBattle(){}},externalSaveChanged:false,s:{xp:0,hp:50,coins:0,chapter:1,miles:50,rideSeconds:9000,rideMiles:100,...state},levelUps:{enqueue(){}},message:'',rewardChoice:null,parentSend(){},shareCard(){},render(){},saved:null,save(){c.saved=JSON.parse(JSON.stringify(c.s));},fmt:Math.round,battleRewards};
 Object.assign(c,progression);vm.createContext(c);vm.runInContext(['level','cost','threshold','maxHP','atk','award','restoreRewardState','finish','choose'].map(fn).join('\n'),c);return c;
}
test('a win grants XP immediately, then exactly one heal-or-coins choice',()=>{
 for(const count of [1,2,3]){
  const c=fixture({hp:40,battle:{kind:'enemy',enemies:Array(count).fill({}),reward:150*count,coins:30*count}});
  vm.runInContext('finish(true)',c);
  assert.equal(c.s.xp,150*count);assert.equal(c.s.reward,true);assert.equal(c.s.coins,0);assert.equal(c.saved.xp,150*count);
  assert.deepEqual(c.s.pendingReward,{count,xp:150*count,healPercent:Math.min(100,35*count),coins:30*count});
  vm.runInContext('choose("coins");choose("coins");choose("heal");finish(true)',c);
  assert.equal(c.s.coins,30*count);assert.equal(c.s.hp,40);assert.equal(c.s.reward,false);assert.equal(c.s.xp,150*count);
 }
});
test('heal restores 35% of max HP per enemy and never overfills',()=>{
 const c=fixture({hp:10,battle:{kind:'enemy',enemies:[{}],reward:150,coins:20}});vm.runInContext('finish(true);choose("heal")',c);
 assert.equal(c.s.hp,10+Math.round(c.maxHP()*0.35));assert.equal(c.s.coins,0);
 const full=fixture({hp:95,battle:{kind:'enemy',enemies:[{},{},{}],reward:450,coins:60}});vm.runInContext('finish(true);choose("heal")',full);assert.equal(full.s.hp,full.maxHP());
});
test('a loss gives no XP, drops 10% of coins and leaves half HP',()=>{
 const lost=fixture({hp:1,coins:205,battle:{kind:'enemy',enemies:[{},{},{}],reward:450}});vm.runInContext('finish(false);choose("coins")',lost);
 assert.equal(lost.s.xp,0);assert.equal(lost.s.coins,185);assert.equal(lost.s.hp,Math.round(lost.maxHP()/2));assert.equal(lost.s.reward,false);
});
test('boss and summit wins grant XP once, offer the choice, and advance the chapter once',()=>{
 for(const kind of ['boss','summit']){
  const c=fixture({battle:{kind,reward:1000,coins:40},boss:{name:'guardian'}});vm.runInContext('finish(true);finish(true)',c);
  assert.equal(c.s.xp,1000);assert.equal(c.s.chapter,kind==='boss'?2:1);assert.equal(c.s.reward,true);
  vm.runInContext('choose("coins")',c);assert.equal(c.s.coins,40);assert.equal(c.s.chapter,kind==='boss'?2:1);
 }
});
test('a pending choice survives reload without a duplicate XP grant; legacy rewards still pay once',()=>{
 const c=fixture({battle:{kind:'enemy',enemies:[{},{},{}],reward:450,coins:60}});vm.runInContext('finish(true)',c);
 const restored=fixture(c.saved);vm.runInContext('restoreRewardState();choose("coins")',restored);assert.equal(restored.s.xp,450);assert.equal(restored.s.coins,60);
 const legacy=fixture({reward:true,coins:undefined});vm.runInContext('restoreRewardState();restoreRewardState()',legacy);
 assert.equal(legacy.s.xp,150);assert.equal(legacy.s.reward,true);assert.equal(legacy.s.coins,0);
 vm.runInContext('choose("coins")',legacy);assert.equal(legacy.s.coins,25);assert.equal(legacy.s.reward,false);
});
test('level gains fully heal including multiple levels; ordinary XP does not heal',()=>{
 const c=fixture({xp:4990,hp:5});vm.runInContext('award(5)',c);assert.equal(c.s.hp,5);vm.runInContext('award(12000)',c);assert.equal(c.s.hp,c.maxHP());assert(c.s.hp>110);
});
test('session readouts use host session values instead of character lifetime totals',()=>{
 const state={rideSeconds:99999,rideMiles:1234,session:{startSeconds:99000,startMiles:1230}};
 assert.deepEqual(sessionMetrics(state,{sessionSeconds:120,sessionDistanceM:1609.344}),{seconds:120,miles:1});
 assert.deepEqual(sessionMetrics(state,{}),{seconds:999,miles:4});
 assert.deepEqual(sessionMetrics({rideSeconds:99999,rideMiles:1234},{}),{seconds:0,miles:0});
 assert.equal(validPendingReward({count:3,xp:450,hp:25,coins:75}),false);
 assert.equal(battleRewards({kind:'enemy',reward:800}).xp,800);
});

test('earned XP cannot cross the save validator limit and make the next load fail',()=>{
 const c=fixture({xp:9999990});vm.runInContext('award(150)',c);assert.equal(c.s.xp,10000000);
 vm.runInContext('award(1)',c);assert.equal(c.s.xp,10000000);
});

test('mixed-level victory grants the summed 800 XP once and never scales by rider level',()=>{
 for(const xp of [0,24000,100000]){
  const c=fixture({xp,battle:{kind:'enemy',enemies:[{level:1},{level:6},{level:10}],reward:800,coins:90}});
  vm.runInContext('finish(true);finish(true)',c);assert.equal(c.s.xp,xp+800);assert.equal(c.s.pendingReward.coins,90);
  const restored=fixture(c.saved);vm.runInContext('restoreRewardState();choose("coins")',restored);assert.equal(restored.s.xp,xp+800);assert.equal(restored.s.coins,90);
 }
});
test('the tenth chapter boss ends the chapters without dropping the route or losing the reward',()=>{
 const route=storyRoute(10,generateRoute),c=fixture({mode:'adventure',chapter:10,miles:100,route,routeMiles:100,battle:{kind:'boss',reward:9825,coins:200}});
 vm.runInContext('finish(true)',c);assert.equal(c.s.chapter,11);assert.equal(c.s.mode,'training');assert.equal(c.s.route,route);assert.equal(c.s.routeMiles,100);assert.equal(c.s.reward,true);assert.match(c.message,/ALL TEN CHAPTERS CLEARED/);
 vm.runInContext('choose("coins")',c);assert.equal(c.s.reward,false);assert.equal(c.s.coins,200);assert.equal(c.s.chapter,11);
});
test('chapter grades and rider levels gate purchases and preserve favorite upgrades',()=>{
 const rider={coins:5000,xp:0,chapter:1,rideMiles:20};const bike=bikeFor(rider);
 assert.equal(changePart(rider,1,'buy',2),false);
 assert(changePart(rider,1,'buy',1));assert.equal(rider.coins,4200);
 assert.equal(bike.equipped[0],0);
 assert(changePart(rider,1,'equip'));assert.equal(partBonus(bike,1),10);
 assert(changePart(rider,1,'upgrade'));assert.equal(partBonus(bike,1),12.5);assert.equal(rider.coins,4100);
 assert.equal(changePart(rider,1,'upgrade'),false);
 rider.chapter=2;assert(changePart(rider,1,'promote',2));
 assert.equal(partBonus(bike,1),22.5);assert.equal(bike.owned[1],1);
 assert(validBike(JSON.parse(JSON.stringify(bike))));
 rider.coins=0;assert.equal(changePart(rider,2,'buy'),false);
});
test('legacy bike tiers migrate as stock-grade upgrades',()=>{
 const rider={bike:{tiers:[3,2,1,0],shopStop:1}};
 const bike=bikeFor(rider);
 assert(validBike(bike));assert.equal(partBonus(bike,0),7.5);
 assert.equal(partBonus(bike,3),5);
});
test('loot is stored and mechanics repair without changing equipment',()=>{
 const rider={coins:0,rideMiles:0};const bike=bikeFor(rider);
 bike.roadsideRemaining=1;
 const rolls=[0,.1,.1,.8];
 const result=exploreRoadside(rider,1,()=>rolls.shift());
 assert(result.repair);assert.deepEqual(bike.tiers,[0,0,0,0]);
 assert.equal(bike.owned.filter(n=>n!==null).length,5);
 const saved=JSON.parse(JSON.stringify(rider));
 assert.equal(exploreRoadside(saved,0),null);
 assert.equal(saved.bike.roadsideRemaining,4);
});
test('roadside rolls only occur in the active pedaling exploration branch',()=>{
 const block=game.slice(game.indexOf('if (!s.battle && !s.reward && !levelUp && running) {'),game.indexOf('    if (running) {'));
 assert(block.includes('else if (power > 0 && m.cadence > 0 && warmupSeconds <= 0)'));
 assert(block.includes('else if (delta > 0)'));
 assert.equal(fn('finish').includes('exploreRoadside'),false);
 assert.equal(game.includes('visitShop(s)'),false);
});
