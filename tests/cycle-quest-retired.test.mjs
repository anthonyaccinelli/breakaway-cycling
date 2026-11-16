import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadQuestModule} from './quest-loader.mjs';
const {readCharacter,validCharacter}=await loadQuestModule('save-state.js');
const fresh=()=>({version:1,xp:0,hp:100,miles:2,chapter:1,mode:'adventure',rideSeconds:0,rideMiles:0,nextEncounter:260,reward:false,boss:null,battle:null,workouts:[]});

test('saves from the story and Boss Mode era still load, with the retired fields dropped',()=>{
 const old={...fresh(),mode:'boss',bossModeComplete:true,bossWarmupRemaining:120,narrative:{seen:['fallen-courier'],choices:{},current:null,shownAt:0}};
 const loaded=readCharacter(JSON.stringify(old));
 assert.equal(loaded.mode,'training');
 for(const field of ['narrative','bossModeComplete','bossWarmupRemaining'])assert(!(field in loaded),field);
 assert(validCharacter(loaded));
});
test('Boss Mode is not a valid mode for new saves',()=>{
 assert(!validCharacter({...fresh(),mode:'boss'}));
});
test('the game no longer ships story, Boss Mode, Rest or monster artwork code',async()=>{
 const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
 for(const gone of ['chapter-one-narrative','storyJournal','currentStoryScene','b.practice','restButton','/monsters/','return 642'])assert(!game.includes(gone),gone);
});
