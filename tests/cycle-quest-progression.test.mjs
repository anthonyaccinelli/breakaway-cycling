import test from 'node:test';
import assert from 'node:assert/strict';
import {loadQuestModule} from './quest-loader.mjs';
const {levelCost,xpForLevel,levelFromXP}=await loadQuestModule('progression.js');
const {riderLevel}=await loadQuestModule('bike-parts.js');

test('levelFromXP is the inverse of xpForLevel at every boundary',()=>{
 for(let level=1;level<1000;level++){
  const start=xpForLevel(level);
  assert.equal(levelFromXP(start),level);
  if(start>0)assert.equal(levelFromXP(start-1),level-1);
  assert.equal(xpForLevel(level+1)-start,levelCost(level));
 }
});
test('the bike shop and the HUD use the same level formula',()=>{
 for(const xp of [0,599,600,1499,1500,250000,5_000_000])assert.equal(riderLevel({xp}),levelFromXP(xp));
});
test('bad XP values fall back to level 1',()=>{
 for(const xp of [undefined,null,NaN,-5,'x'])assert.equal(levelFromXP(xp),1);
});
