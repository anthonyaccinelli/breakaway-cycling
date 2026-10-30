import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuestMusic} from '../cycle-quest/music.js';
function fixture(saved=null,random=()=>.25){
 const tracks=[],timers=new Map(),values=new Map(saved===null?[]:[['cycle-quest-music-enabled',saved]]);let id=0,now=0;
 const music=createQuestMusic({random,makeAudio(src){const a={src,duration:120,currentTime:0,plays:0,pauses:0,listeners:{},play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;},addEventListener(name,fn){this.listeners[name]=fn;}};tracks.push(a);return a;},storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},schedule(fn,ms){timers.set(++id,{fn,ms,due:now+ms});return id;},cancel(id){timers.delete(id);}});
 function advance(ms){const end=now+ms;while(true){const next=[...timers].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!next)break;timers.delete(next[0]);now=next[1].due;next[1].fn();}now=end;}
 return {music,tracks,timers,values,advance};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));
test('all battle kinds share one loop and repeated telemetry never restarts it',async()=>{
 const {music,tracks,advance}=fixture();music.sync({battle:true});await settled();assert.equal(tracks[0].loop,true);assert.equal(tracks[0].plays,1);
 for(let i=0;i<20;i++)music.sync({battle:true});assert.equal(tracks[0].plays,1);assert.equal(tracks[1].plays,0);
 music.sync({battle:false});await settled();assert.equal(tracks[1].plays,1);advance(800);assert.equal(tracks[0].currentTime,0);assert.ok(tracks[0].pauses>0);
});
test('fanfare stops after ten seconds and a new battle cancels the old timer',async()=>{
 const {music,tracks,timers}=fixture();music.sync({battle:true});music.sync({});await settled();assert.ok([...timers.values()].some(t=>t.ms===10000));
 music.sync({battle:true});assert.equal(timers.size,0);await settled();assert.equal(music.state().scene,'battle');
 music.sync({});await settled();[...timers.values()].find(t=>t.ms===10000).fn();assert.equal(music.state().scene,'silent');assert.ok(tracks[1].pauses>0);
});
test('inn music overrides battles and stops when the summary closes',async()=>{
 const {music,tracks}=fixture();music.sync({battle:true});music.sync({battle:true,rest:true});await settled();assert.equal(music.state().scene,'rest');assert.equal(tracks[2].loop,true);
 music.sync({battle:true,paused:true});assert.equal(tracks[0].plays,1);assert.equal(music.state().paused,true);
 music.sync({battle:true,paused:false});await settled();assert.equal(tracks[0].plays,2);
});
test('mute persists, stops sound, and mode exit suspends playback',async()=>{
 const {music,tracks,values}=fixture('false');music.sync({battle:true});assert.equal(tracks[0].plays,0);
 music.toggle();await settled();assert.equal(tracks[0].plays,1);assert.equal(values.get('cycle-quest-music-enabled'),'true');
 music.suspend();music.sync({battle:true});assert.equal(tracks[0].plays,1);
 music.suspend(false);await settled();assert.equal(tracks[0].plays,2);
 music.toggle();assert.equal(values.get('cycle-quest-music-enabled'),'false');music.dispose();assert.equal(music.state().scene,'silent');
});
test('autoplay rejection can be retried from the music control without unhandled failures',async()=>{
 const {music,tracks}=fixture();tracks[0].play=()=>Promise.reject(new Error('NotAllowedError'));music.sync({battle:true});await settled();assert.equal(music.state().blocked,true);
 tracks[0].play=()=>Promise.resolve();music.toggle();await settled();assert.equal(music.state().blocked,false);assert.equal(music.state().enabled,true);
});
test('a delayed play promise cannot start a stale fanfare timer after leaving',async()=>{
 const {music,tracks,timers}=fixture();let release;tracks[1].play=()=>new Promise(resolve=>release=resolve);
 music.sync({battle:true});music.sync({});music.sync({rest:true});release();await settled();assert.equal(timers.size,0);assert.equal(music.state().scene,'rest');
});
test('victory uses the dedicated 0–10-second asset and always restarts at zero',async()=>{
 const {music,tracks}=fixture();assert.ok(tracks[1].src.endsWith('/victory-opening-0-10.wav'));
 music.sync({battle:true});tracks[1].currentTime=5;music.sync({});await settled();assert.equal(tracks[1].currentTime,0);assert.equal(tracks[1].loop,false);
});
test('new battles start at different positions but pause/resume keeps the current position',async()=>{
 const {music,tracks}=fixture();music.sync({battle:true});await settled();assert.equal(tracks[0].currentTime,30);
 tracks[0].currentTime=37;music.sync({battle:true,paused:true});music.sync({battle:true});await settled();assert.equal(tracks[0].currentTime,37);
 music.endBattle('victory');music.sync({});music.sync({battle:true});await settled();assert.equal(tracks[0].currentTime,90);
});
test('defeats play Game Over once, victories play fanfare, and fleeing plays neither',async()=>{
 const {music,tracks}=fixture();music.sync({battle:true});music.endBattle('death');music.sync({});await settled();assert.equal(music.state().scene,'death');assert.equal(tracks[4].plays,1);assert.equal(tracks[1].plays,0);assert.equal(tracks[4].loop,false);
 for(let i=0;i<10;i++)music.sync({});assert.equal(tracks[4].plays,1);
 tracks[4].listeners.ended();assert.equal(music.state().scene,'silent');
 music.sync({battle:true});music.endBattle('flee');music.sync({});await settled();assert.equal(music.state().scene,'silent');assert.equal(tracks[1].plays,0);
});
test('Take Flight follows the actual level-up screen and is interrupted by a new battle',async()=>{
 const {music,tracks}=fixture();music.sync({levelUp:true});await settled();assert.equal(tracks[3].plays,1);assert.ok(tracks[3].src.endsWith('/take-flight.mp3'));
 music.sync({levelUp:true});assert.equal(tracks[3].plays,1);music.sync({});assert.equal(music.state().scene,'silent');
 music.sync({levelUp:true});music.sync({battle:true});await settled();assert.equal(music.state().scene,'battle');assert.equal(tracks[3].currentTime,0);
});

test('victory crossfades from battle and gently fades over its last 1.5 seconds',async()=>{
 const {music,tracks,advance}=fixture();music.sync({battle:true});await settled();
 const pauses=tracks[0].pauses;music.endBattle('victory');music.sync({});await settled();
 assert.equal(tracks[0].pauses,pauses);assert.equal(tracks[1].volume,0);
 advance(400);assert.ok(Math.abs(tracks[0].volume-.3)<.001);assert.ok(Math.abs(tracks[1].volume-.3)<.001);
 advance(400);assert.equal(tracks[0].currentTime,0);assert.equal(tracks[0].pauses,pauses+1);assert.equal(tracks[1].volume,.6);
 advance(7700);assert.equal(tracks[1].volume,.6);advance(750);assert.ok(Math.abs(tracks[1].volume-.3)<.001);
 advance(750);assert.equal(music.state().scene,'silent');
});
test('muting during a crossfade cancels all pending volume changes',async()=>{
 const {music,tracks,timers,advance}=fixture();music.sync({battle:true});await settled();music.sync({});await settled();advance(200);
 music.toggle();assert.equal(timers.size,0);advance(6000);assert.equal(tracks[0].volume,.6);assert.equal(tracks[1].volume,.6);
});
