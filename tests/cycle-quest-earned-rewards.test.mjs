import {storyRoute} from '../cycle-quest/story-chapters.js';
import {generateRoute} from '../cycle-quest/routes.js';
import {bikeFor,multiplier,changePart,exploreRoadside} from '../cycle-quest/bike-parts.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {battleRewards,validPendingReward,sessionMetrics} from '../cycle-quest/rewards.js';
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
function fn(name){const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);return game.slice(start,end);}
function fixture(state={}){
 const c={bikeFor,multiplier,storyRoute,generateRoute,lastLiveDistance:0,music:{endBattle(){}},externalSaveChanged:false,s:{xp:0,hp:50,coins:0,chapter:1,miles:50,rideSeconds:9000,rideMiles:100,...state},levelUps:{enqueue(){}},message:'',rewardChoice:null,parentSend(){},shareCard(){},render(){},saved:null,save(){c.saved=JSON.parse(JSON.stringify(c.s));},fmt:Math.round,battleRewards};
 c.MAX_XP=10000000;vm.createContext(c);vm.runInContext(['level','cost','threshold','maxHP','atk','award','restoreRewardState','finish','choose'].map(fn).join('\n'),c);return c;
}
test('one/two/three defeated enemies immediately earn 150/300/450 XP and automatic coins',()=>{
 for(const count of [1,2,3]){
  const c=fixture({battle:{kind:'enemy',enemies:Array(count).fill({}),reward:150*count}});
  vm.runInContext('finish(true)',c);assert.equal(c.s.xp,150*count);assert.equal(c.s.pendingReward,null);assert.equal(c.s.coins,25*count);assert.equal(c.s.reward,false);assert.equal(c.saved.xp,150*count);
  vm.runInContext('choose("coins");choose("coins");finish(true)',c);assert.equal(c.s.coins,25*count);assert.equal(c.s.xp,150*count);assert.equal(c.s.pendingReward,null);
 }
});
test('victory credits coins without input and loss grants no coins or XP',()=>{
 const c=fixture({hp:80,battle:{kind:'enemy',enemies:[{},{}],reward:300}});vm.runInContext('finish(true);choose("heal")',c);assert.equal(c.s.hp,80);assert.equal(c.s.xp,300);assert.equal(c.s.coins,50);
 const lost=fixture({hp:1,battle:{kind:'enemy',enemies:[{},{},{}],reward:450}});vm.runInContext('finish(false);choose("coins")',lost);assert.equal(lost.s.xp,0);assert.equal(lost.s.coins,0);assert.equal(lost.s.hp,100);assert.equal(lost.s.reward,false);
});
test('boss and summit XP are automatic with coins; chapter progression happens once',()=>{
 for(const kind of ['boss','summit']){
  const c=fixture({battle:{kind,reward:1000},boss:{name:'guardian'}});vm.runInContext('finish(true)',c);assert.equal(c.s.xp,1000);assert.equal(c.s.coins,25);assert.equal(c.s.chapter,kind==='boss'?2:1);vm.runInContext('choose("coins")',c);assert.equal(c.s.xp,1000);assert.equal(c.s.coins,25);
 }
});
test('victory survives reload without a duplicate XP grant; legacy pending reward migrates once',()=>{
 const c=fixture({battle:{kind:'enemy',enemies:[{},{},{}],reward:450}});vm.runInContext('finish(true)',c);
 const restored=fixture(c.saved);vm.runInContext('restoreRewardState();choose("coins")',restored);assert.equal(restored.s.xp,450);assert.equal(restored.s.coins,75);
 const legacy=fixture({reward:true,coins:undefined});vm.runInContext('restoreRewardState();restoreRewardState()',legacy);assert.equal(legacy.s.xp,150);assert.equal(legacy.s.coins,25);assert.equal(legacy.s.pendingReward,null);
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
 assert.equal(battleRewards({kind:'enemy',reward:800}).xp,800);
});

test('earned XP cannot cross the save validator limit and make the next load fail',()=>{
 const c=fixture({xp:9999990});vm.runInContext('award(150)',c);assert.equal(c.s.xp,10000000);
 vm.runInContext('award(1)',c);assert.equal(c.s.xp,10000000);
});

test('mixed-level victory grants the summed 800 XP once and never scales by rider level',()=>{
 for(const xp of [0,24000,100000]){
  const c=fixture({xp,battle:{kind:'enemy',enemies:[{level:1},{level:6},{level:10}],reward:800}});
  vm.runInContext('finish(true);finish(true)',c);assert.equal(c.s.xp,xp+800);assert.equal(c.s.pendingReward,null);assert.equal(c.s.coins,75);
  const restored=fixture(c.saved);vm.runInContext('restoreRewardState();choose("coins")',restored);assert.equal(restored.s.xp,xp+800);assert.equal(restored.s.coins,75);
 }
});
test('Boss Mode victory awards rewards without unlocking chapters or changing mileage',()=>{
 const c=fixture({mode:'boss',chapter:2,miles:42,battle:{kind:'boss',practice:true,reward:2625}});
 vm.runInContext('finish(true)',c);assert.equal(c.s.chapter,2);assert.equal(c.s.miles,42);assert.equal(c.s.xp,2625);assert.equal(c.s.bossModeComplete,true);assert.equal(c.s.bossWarmupRemaining,0);
});
test('the tenth chapter boss ends Story without dropping the route or losing the reward',()=>{
 const route=storyRoute(10,generateRoute),c=fixture({mode:'adventure',chapter:10,miles:100,route,routeMiles:100,battle:{kind:'boss',reward:9825}});
 vm.runInContext('finish(true)',c);assert.equal(c.s.chapter,11);assert.equal(c.s.mode,'training');assert.equal(c.s.route,route);assert.equal(c.s.routeMiles,100);assert.equal(c.s.reward,false);assert.match(c.message,/STORY COMPLETE/);
 vm.runInContext('choose("coins")',c);assert.equal(c.s.reward,false);assert.equal(c.s.chapter,11);
});


test('manual purchases preserve coins on rides and require explicit equipment selection',()=>{
 const rider={coins:500,rideMiles:20};const bike=bikeFor(rider);
 assert(changePart(rider,1,'buy'));assert.equal(rider.coins,400);
 assert.equal(bike.equipped[0],0);assert.equal(bike.tiers[0],0);
 assert(changePart(rider,1,'equip'));assert.equal(bike.tiers[0],1);
 assert(changePart(rider,1,'upgrade'));assert.equal(bike.tiers[0],2);
 assert.equal(rider.coins,0);assert.equal(changePart(rider,1,'upgrade'),false);
 assert.equal(changePart(rider,1,'buy'),false);
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
 const block=game.slice(game.indexOf('if(!s.battle&&!s.reward&&!levelUp&&running){s.rideMiles'),game.indexOf('if(running){let remaining=dt;'));
 assert(block.includes("else if(power>0&&m.cadence>0&&warmupSeconds<=0)"));
 assert(block.includes("else if(s.mode!=='boss'&&delta>0)"));
 assert.equal(fn('finish').includes('exploreRoadside'),false);
 assert.equal(game.includes('visitShop(s)'),false);
});
