import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuestMusic} from '../cycle-quest/music.js';
function fixture(saved=null){
 const tracks=[],timers=new Map(),values=new Map(saved===null?[]:[['cycle-quest-music-enabled',saved]]);let id=0;
 const music=createQuestMusic({makeAudio(src){const a={src,currentTime:0,plays:0,pauses:0,listeners:{},play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;},addEventListener(name,fn){this.listeners[name]=fn;}};tracks.push(a);return a;},storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},schedule(fn,ms){timers.set(++id,{fn,ms});return id;},cancel(id){timers.delete(id);}});
 return {music,tracks,timers,values};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));
test('all battle kinds share one loop and repeated telemetry never restarts it',async()=>{
 const {music,tracks}=fixture();music.sync({battle:true});await settled();assert.equal(tracks[0].loop,true);assert.equal(tracks[0].plays,1);
 for(let i=0;i<20;i++)music.sync({battle:true});assert.equal(tracks[0].plays,1);assert.equal(tracks[1].plays,0);
 music.sync({battle:false});await settled();assert.equal(tracks[1].plays,1);assert.equal(tracks[0].currentTime,0);assert.ok(tracks[0].pauses>0);
});
test('fanfare stops after five seconds and a new battle cancels the old timer',async()=>{
 const {music,tracks,timers}=fixture();music.sync({battle:true});music.sync({});await settled();assert.equal([...timers.values()][0].ms,5000);
 music.sync({battle:true});assert.equal(timers.size,0);await settled();assert.equal(music.state().scene,'battle');
 music.sync({});await settled();[...timers.values()][0].fn();assert.equal(music.state().scene,'silent');assert.ok(tracks[1].pauses>0);
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
test('victory uses the dedicated 0–5-second asset and always restarts at zero',async()=>{
 const {music,tracks}=fixture();assert.ok(tracks[1].src.endsWith('/victory-opening-0-5.wav'));
 music.sync({battle:true});tracks[1].currentTime=5;music.sync({});await settled();assert.equal(tracks[1].currentTime,0);assert.equal(tracks[1].loop,false);
});
