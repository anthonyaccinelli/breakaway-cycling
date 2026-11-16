import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,RIDERS} from '../scripts/simulate-balance.mjs';

test('casual, typical and strong riders can all finish all ten chapters',()=>{
 for(const [id,rider] of Object.entries(RIDERS)){
  const rows=simulate(rider);
  assert.equal(rows.length,10,id);
  for(const row of rows){
   assert.notEqual(row.bossTries,'FAILED',id+' chapter '+row.chapter);
   assert(parseInt(row.winRate)>=80,id+' chapter '+row.chapter+' win rate '+row.winRate);
  }
 }
});
test('casual riders are never weaker than strong riders when they reach a chapter',()=>{
 const casual=simulate(RIDERS.casual),strong=simulate(RIDERS.strong);
 for(let i=0;i<10;i++)assert(parseInt(casual[i].level)>=parseInt(strong[i].level),'chapter '+(i+1));
});
