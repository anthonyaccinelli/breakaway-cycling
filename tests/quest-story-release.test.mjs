import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {STORY_CHAPTERS,storyRoute} from '../cycle-quest/story-chapters.js';
import {generateRoute,METERS_PER_MILE} from '../cycle-quest/routes.js';
const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
function fn(name){const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);return game.slice(start,end);}
test('all ten fixed Story seeds reproduce their 100-mile terrain and target ascent',()=>{
 assert.equal(STORY_CHAPTERS.length,10);
 for(const chapter of STORY_CHAPTERS){const route=storyRoute(chapter.chapter,generateRoute);assert.equal(route.storyChapter,chapter.chapter);assert.equal(route.seed,chapter.seed);assert.equal(route.distance,100*METERS_PER_MILE);assert.ok(Math.abs(route.gain/.3048-chapter.gainFeet)<.001);assert.deepEqual(storyRoute(chapter.chapter,generateRoute),route);}
 assert.equal(storyRoute(11,generateRoute),null);
});
test('returning from Freeroam restores Story chapter mileage on the same fixed route',()=>{
 const sent=[],c={s:{chapter:2,mode:'training',miles:42,route:generateRoute(15),routeMiles:3},storyRoute,generateRoute,METERS_PER_MILE,message:'',summitChoices:new Map(),summitSeen:new Set(),lastLiveDistance:0,parentSend:m=>sent.push(m),save(){},render(){}};
 vm.createContext(c);vm.runInContext(fn('loadStoryRoute'),c);vm.runInContext('loadStoryRoute()',c);
 assert.equal(c.s.mode,'adventure');assert.equal(c.s.route.storyChapter,2);assert.equal(c.s.routeMiles,42);assert.equal(c.lastLiveDistance,42*METERS_PER_MILE);assert.equal(sent[0].restoreMiles,42);
 vm.runInContext('loadStoryRoute()',c);assert.equal(c.s.routeMiles,42);
});
test('Story route endpoint waits for its boss; Freeroam endpoints still finish normally',async()=>{
 const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
 const line=main.split('\n').find(line=>line.includes('if(!waitForSummit&&'));assert(line);
 for(const [mode,chapter,wait,expected] of [['cyclequest',1,false,0],['cyclequest',0,false,1],['classic',0,false,1],['cyclequest',1,true,0]]){
  let finishes=0;const c={rideExperience:mode,questStoryChapter:chapter,waitForSummit:wait,finishRide(){finishes++;},status(){}};vm.createContext(c);vm.runInContext(line,c);assert.equal(finishes,expected);
 }
});
