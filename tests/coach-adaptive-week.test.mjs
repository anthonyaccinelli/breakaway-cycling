import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/coach-adaptive-week.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {adaptWeeklySchedule,adaptiveDateKey}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const week=Array.from({length:7},(_,day)=>({
 day,cyclingId:day===1?'tempo':day===2||day===4?'endurance':null,
 cyclingMinutes:day===1?45:day===2||day===4?60:0,
 strength:day===2?'A':null,strengthMinutes:day===2?30:0,reason:'Planned training'
}));
const planned={workoutId:'tempo',status:'planned',reason:"Today's training plan"};
const on=(day,hour=12)=>new Date(2026,10,day,hour).getTime();
function plan(overrides={}){
 return adaptWeeklySchedule({
  now:new Date(2026,10,2,12),week,rides:[],feedback:[],
  skipped:[],ftp:200,ftpKnown:true,budgetMinutes:240,
  recoveryMinutes:25,today:planned,...overrides
 });
}
test('extra easy ride within weekly time budget does not shorten sessions',()=>{
 const result=plan({rides:[{start:on(1,14),elapsed:30*60,avgPower:100}]});
 assert.equal(result.extraMinutes,30);
 assert.equal(result.days.find(x=>x.key==='2026-11-03').minutes,60);
 assert.equal(result.days.find(x=>x.key==='2026-11-04').strength,null);
 assert.equal(result.changes.some(c=>c.kind==='shortened'),false);
});
test('unplanned ride above weekly budget shortens next easy session with explanation',()=>{
 const result=plan({rides:[{start:on(1,14),elapsed:75*60,avgPower:100}]});
 const tuesday=result.days.find(x=>x.key==='2026-11-03');
 assert.equal(result.extraMinutes,75);
 assert.equal(tuesday.minutes,30);
 assert.equal(tuesday.status,'shortened');
 assert.equal(tuesday.workoutId,'endurance');
 assert.match(tuesday.reason,/weekly time/);
 assert.equal(result.days.find(x=>x.key==='2026-11-01').workoutId,null);
 assert.equal(result.days.find(x=>x.key==='2026-11-03').strength,'A');
 assert.equal(result.days.find(x=>x.key==='2026-11-03').strengthMinutes,30);
 assert.equal(result.days.find(x=>x.key==='2026-11-04').workoutId,null);
});
test('recent hard activity changes tomorrow to recovery while preserving rest and strength',()=>{
 const hard={start:on(2,10),elapsed:60*60,avgPower:185};
 const result=plan({now:new Date(2026,10,2,17),rides:[hard],today:{workoutId:null,status:'completed',reason:'Ride done'}});
 const tomorrow=result.days.find(x=>x.key==='2026-11-03');
 assert.equal(tomorrow.workoutId,'recovery');
 assert.equal(tomorrow.minutes,25);
 assert.equal(tomorrow.status,'recovery');
 assert.equal(tomorrow.strength,'A');
 assert.equal(result.days.find(x=>x.key==='2026-11-04').workoutId,null);
 assert.equal(result.days.find(x=>x.key==='2026-11-02').status,'completed');
});
test('low power with unknown FTP does not trigger hard power cutoff',()=>{
 const ride={start:on(2,10),elapsed:60*60,avgPower:300};
 const result=plan({now:new Date(2026,10,2,17),rides:[ride],ftpKnown:false,today:{workoutId:null,status:'completed',reason:'Done'}});
 assert.equal(result.days.find(x=>x.key==='2026-11-03').workoutId,'endurance');
});
test('very hard feedback changes following day even without power measurement',()=>{
 const result=plan({feedback:[{date:on(2,11),rpe:10}]});
 const tomorrow=result.days.find(x=>x.key==='2026-11-03');
 assert.equal(tomorrow.workoutId,'recovery');
 assert.match(tomorrow.reason,/feedback/);
});
test('skipped days do not create make-up workouts or overwrite future rest days',()=>{
 const result=plan({now:new Date(2026,10,3,12),today:{workoutId:'endurance',status:'planned',reason:'Planned'},skipped:['2026-11-02']});
 const missed=result.days.find(x=>x.key==='2026-11-02');
 assert.equal(missed.workoutId,null);
 assert.equal(missed.status,'skipped');
 assert.equal(result.days.find(x=>x.key==='2026-11-03').workoutId,'endurance');
 assert.equal(result.days.find(x=>x.key==='2026-11-04').workoutId,null);
 assert.ok(result.changes.some(c=>c.key==='2026-11-02'&&c.kind==='skipped'));
});
test('skipped today can be undone deterministically, no duplicate session after a ride',()=>{
 const skip=plan({skipped:['2026-11-02']});
 assert.equal(skip.days.find(x=>x.key==='2026-11-02').status,'skipped');
 const restore=plan();
 assert.equal(restore.days.find(x=>x.key==='2026-11-02').workoutId,'tempo');
 const ridden=plan({rides:[{start:on(2,10),elapsed:30*60,avgPower:100}]});
 assert.equal(ridden.days.find(x=>x.key==='2026-11-02').status,'completed');
 assert.equal(ridden.days.find(x=>x.key==='2026-11-02').workoutId,null);
});
test('date keys and future sessions survive daylight-saving week and new week',()=>{
 const result=plan({now:new Date(2026,10,1,12),today:{workoutId:null,status:'rest',reason:'Rest'}});
 assert.equal(result.days.length,14);
 assert.equal(adaptiveDateKey(result.days[0].date),'2026-11-01');
 assert.equal(result.days[7].key,'2026-11-08');
 assert.equal(result.days[13].key,'2026-11-14');
 assert.equal(result.days[8].workoutId,'tempo');
});
test('adaptive UI uses common planner for calendar, week and explicit change summaries',()=>{
 const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
 assert.match(ui,/adaptWeeklySchedule\(/);
 assert.match(ui,/id="coachAdaptiveWeek"/);
 assert.match(ui,/id="coachAdaptiveToday"/);
 assert.match(ui,/currentCalendarDays=calendarDays\(nowDate,schedule\.days,library,recommendation\)\.map/);
 assert.match(ui,/thisWeek=adaptive\.days\.slice\(0,7\)/);
 assert.match(ui,/coachNextUp/);
});
