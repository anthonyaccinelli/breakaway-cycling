import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
function fn(name){const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);return game.slice(start,end);}

test('the character is saved without its ride history, which has its own key',()=>{
 const c={};vm.createContext(c);vm.runInContext(fn('characterText'),c);
 c.state={version:1,xp:5,workouts:[{id:'a'}]};
 const text=vm.runInContext('characterText(state)',c);
 assert.deepEqual(JSON.parse(text),{version:1,xp:5});assert.equal(c.state.workouts.length,1);
});
test('ride history is written at most once a minute unless forced, and only when it changed',()=>{
 const writes=[];let now=0;
 const c={s:{workouts:[]},historyKey:'h',historyText:null,lastHistoryWrite:-Infinity,performance:{now:()=>now},localStorage:{setItem:(k,v)=>writes.push([k,v])}};
 vm.createContext(c);vm.runInContext(fn('saveHistory'),c);
 vm.runInContext('saveHistory()',c);assert.equal(writes.length,1);
 c.s.workouts.push({id:'x'});now=30000;vm.runInContext('saveHistory()',c);assert.equal(writes.length,1);
 vm.runInContext('saveHistory(true)',c);assert.equal(writes.length,2);
 now=200000;vm.runInContext('saveHistory()',c);assert.equal(writes.length,2,'unchanged history is not rewritten');
});
test('while riding, the game saves about every 10 seconds instead of every second',()=>{
 assert(game.includes('if (++saveTick >= 50) {'));
});
