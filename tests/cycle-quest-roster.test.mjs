import test from 'node:test';
import assert from 'node:assert/strict';
import {loadQuestModule} from './quest-loader.mjs';
const {MONSTERS,makeBattle,enemyGroup}=await loadQuestModule('combat.js');
const {readCharacter}=await loadQuestModule('save-state.js');
const fresh=()=>({version:1,xp:0,hp:100,miles:10,chapter:1,mode:'adventure',rideSeconds:100,rideMiles:2,nextEncounter:260,reward:false,boss:null});
test('retired monster ids stay out of the roster data',()=>{
 assert(!MONSTERS.some(m=>['stirge','kobold','giant-rat'].includes(m.id)));
 assert.equal(MONSTERS.filter(m=>m.id==='bat').length,1);assert.equal(MONSTERS.filter(m=>m.id==='snake').length,1);
});
test('current-version saved fights and encounter bags migrate without losing damage or progression',()=>{
 const group=enemyGroup([makeBattle('enemy',{monsterId:'bat',level:6}),makeBattle('enemy',{monsterId:'snake',level:10})]);
 group.monsterId='stirge';group.enemies[0].id='stirge';group.enemies[0].name='STIRGE';group.enemies[1].id='kobold';group.enemies[1].name='KOBOLD';
 for(const e of group.enemies)e.hp=e.max/2;group.hp=group.max/2;
 const state={...fresh(),battle:group,chapterEncounter:{chapter:1,bag:['stirge','bat','kobold'],last:'kobold'}};
 const next=readCharacter(JSON.stringify(state));assert.equal(next.xp,state.xp);assert.equal(next.miles,state.miles);assert.equal(next.hp,state.hp);
 assert.deepEqual(next.battle.enemies.map(e=>e.id),['bat','snake']);assert.deepEqual(next.battle.enemies.map(e=>e.name),['BAT','SNAKE']);
 for(const e of next.battle.enemies)assert.equal(e.hp,e.max/2);
 assert.deepEqual(next.chapterEncounter.bag,['bat','snake']);assert.equal(next.chapterEncounter.last,'snake');
 assert.deepEqual(readCharacter(JSON.stringify(next)),next);
});
