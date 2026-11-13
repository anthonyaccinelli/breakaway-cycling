import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CHAPTER_ONE_EVENTS,chapterOneScene,nextChapterOneEvent,overlayContentMode} from '../cycle-quest/chapter-one-narrative.js';
import {QUEST_ASSETS} from '../cycle-quest/assets.js';
import {loadQuestModule} from './quest-loader.mjs';

test('Chapter 1 events are fixed, unlock in distance order and do not replay after save',()=>{
 assert.deepEqual(CHAPTER_ONE_EVENTS.map(event=>event.mile),[0,2,5,8,10]);
 assert.equal(new Set(CHAPTER_ONE_EVENTS.map(event=>event.id)).size,CHAPTER_ONE_EVENTS.length);
 assert.equal(nextChapterOneEvent(0,[]).id,'fallen-courier');
 assert.equal(nextChapterOneEvent(1.99,['fallen-courier']),null);
 assert.equal(nextChapterOneEvent(10,['fallen-courier','fog-bells']).id,'king-road');
 assert.equal(nextChapterOneEvent(10,CHAPTER_ONE_EVENTS.map(event=>event.id)),null);
 assert.equal(chapterOneScene('not-a-scene'),null);
 assert(CHAPTER_ONE_EVENTS.every(event=>event.overlay.length===2&&event.text.length>0));
});
test('the elevation profile is Explore by default; Story switches to text and combat wins priority',()=>{
 assert.equal(overlayContentMode(),'explore');
 assert.equal(overlayContentMode({story:true}),'story');
 for(const state of [{battle:true,story:true},{reward:true,story:true},{levelUp:true,story:true},{warmup:true,story:true}]){
  assert.equal(overlayContentMode(state),'battle');
 }
});
test('Chapter 1 narrative events remain behind the protected Cycle Quest asset manifest',()=>{
 assert.equal(QUEST_ASSETS['chapter-one-narrative.js'],'text/javascript; charset=utf-8');
});
test('narrative seen events, choices and active presentation survive an existing character save',async()=>{
 const {readCharacter}=await loadQuestModule('save-state.js');
 const narrative={seen:['fallen-courier','fog-bells'],choices:{'fallen-courier':'conceal'},current:'fog-bells',shownAt:Date.now()};
 const state={version:1,xp:0,hp:100,miles:2,chapter:1,mode:'adventure',rideSeconds:0,rideMiles:0,nextEncounter:260,reward:false,boss:null,battle:null,workouts:[],narrative};
 const saved=readCharacter(JSON.stringify(state));
 assert.deepEqual(saved.narrative,narrative);
 assert.throws(()=>readCharacter(JSON.stringify({...state,narrative:{...narrative,seen:['same','same']}})),/Invalid Cycle Quest save/);
 assert.throws(()=>readCharacter(JSON.stringify({...state,narrative:{...narrative,shownAt:Infinity}})),/Invalid Cycle Quest save/);
});
test('overlay calls the actual elevation SVG when it is not Story or combat',async()=>{
 const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
 assert(game.includes('overlayContentMode({battle:!!s.battle'));
 assert(game.includes("el.innerHTML=elevationSVG(displayed,sample,w,h,progress)"));
 assert(game.includes("if(compact){"));
 assert(game.includes("cq-text-group"));
 assert(game.includes("$('.cq-route').classList.toggle('cq-story-open'"));
});
