import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const transpile=s=>ts.transpile(s,{target:ts.ScriptTarget.ES2022});
const modes=main.slice(main.indexOf('function recoveryMode('),main.indexOf('function clearRideRecovery('));
const restore=main.slice(main.indexOf('function restoreRideRecovery('),main.indexOf('function offerRideRecovery('));
const checkpoint={mode:'cyclequest',rideStart:'2026-10-30T12:00:00Z',routeName:'Coastal Beginnings',points:[{distance:0,elevation:0,grade:0},{distance:160934,elevation:0,grade:0}],distance:12345,activeRideMs:123000,energyKcal:250,avgPowerEnergy:12000,avgPowerDuration:100,rideSamples:[{seconds:123,distance:12345}],routeLimit:-1};
function harness(){
 const calls=[],controls={start:{},surviveFailScreen:{hidden:false},surviveVictoryScreen:{hidden:false}};
 const c={Number,Infinity,localStorage:{getItem:()=>null},surviveFailScreen:controls.surviveFailScreen,surviveVictoryScreen:controls.surviveVictoryScreen,$:id=>controls[id],resetSimController:()=>{},setRideFocus:()=>{},syncManualFinishButton:()=>{},svg:()=>{},update:()=>{},chooseRideExperience:mode=>calls.push(mode),showBreakawayScreen:page=>calls.push(page),enterCycleQuest:()=>calls.push('quest'),showRideSummary:()=>calls.push('summary'),status:()=>{},c:checkpoint};
 vm.createContext(c);vm.runInContext(transpile(modes+'\n'+restore),c);return {c,calls};
}
test('recovery selects the saved mode instead of the previous screen and keeps metrics paused',()=>{
 for(const mode of ['classic','survival','cyclequest']){
  const {c,calls}=harness();c.c={...checkpoint,mode};vm.runInContext('restoreRideRecovery(c)',c);
  assert.deepEqual(calls,mode==='cyclequest'?['quest']:[mode,'ride']);
  assert.equal(c.running,false);assert.equal(c.rideAwaitingPedaling,false);assert.equal(c.surviveOn,false);assert.equal(c.distance,12345);assert.equal(c.activeRideMs,123000);assert.equal(c.rideStart,checkpoint.rideStart);
  if(mode==='cyclequest')assert.equal(c.pendingQuestRideRecovery,c.c);
 }
});
test('legacy checkpoints infer Quest only from a matching character route',()=>{
 const {c}=harness();const old={...checkpoint};delete old.mode;
 c.localStorage.getItem=()=>JSON.stringify({route:{name:checkpoint.routeName}});assert.equal(c.recoveryMode(old),'cyclequest');
 c.localStorage.getItem=()=>JSON.stringify({route:{name:'Other route'}});assert.equal(c.recoveryMode(old),'classic');
 c.localStorage.getItem=()=>'{broken';assert.equal(c.recoveryMode(old),'classic');
 assert.equal(c.recoveryMode({...old,mode:'survival'}),'survival');
});
test('Quest startup preserves the recovered parent route and sends a paused restoration handshake',()=>{
 const start=main.indexOf('if(pendingQuestRideRecovery){',main.indexOf("else if(data.type==='ready')"));const end=main.indexOf('void savedRides()',start);
 const sent=[],c={pendingQuestRideRecovery:{questStoryChapter:2},points:checkpoint.points,distance:12345,routeName:checkpoint.routeName,endless:false,questSend:m=>sent.push(m)};vm.createContext(c);vm.runInContext(transpile(main.slice(start,end)),c);
 assert.equal(c.pendingQuestRideRecovery,null);assert.equal(c.questStoryChapter,2);assert.equal(sent[0].type,'recover-ride');assert.equal(sent[0].distanceM,12345);assert.equal(sent[0].route.storyChapter,2);assert.equal(sent[1].page,'ride');
});
