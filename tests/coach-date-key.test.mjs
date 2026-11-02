import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

async function compile(filename) {
 const source=readFileSync(new URL('../src/'+filename+'.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
const {dayKey,normalizeDayKey}=await compile('coach-dom');
const {calendarDays}=await compile('coach-calendar');
const {adaptiveDateKey}=await compile('coach-adaptive-week');
const {validCheckIn}=await compile('coach-readiness');

test('Coach uses padded local dates throughout the calendar and adaptive planner',()=>{
 for(const date of [new Date(2026,10,2,9),new Date(2026,10,8,9),new Date(2026,0,1,9),new Date(2026,11,31,9)]){
  assert.equal(dayKey(date),adaptiveDateKey(date));
  assert.match(dayKey(date),/^\d{4}-\d{2}-\d{2}$/);
 }
 assert.equal(dayKey(new Date(2026,10,2,9)),'2026-11-02');
});

test('My Week never marks the seven future Nov 2–8 calendar dates as past',()=>{
 const now=new Date(2026,10,2,9);
 const week=Array.from({length:7},(_,day)=>({
  day,cyclingId:day===5||day===6?null:'endurance',
  cyclingMinutes:day===5||day===6?0:45,
  strength:null,strengthMinutes:0,reason:'Planned'
 }));
 const library=[{id:'endurance',name:'Aerobic Builder',description:'Steady aerobic workout',segments:[{minutes:45}]}];
 const days=calendarDays(now,week,library,{workoutId:'endurance',status:'planned',reason:'Scheduled'});
 const todayKey=dayKey(now);
 assert.deepEqual(days.map(d=>d.key),['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']);
 assert.ok(days.every(d=>d.key>=todayKey),'un-padded todayKey incorrectly hides seven scheduled dates');
 assert.equal(days[0].rideName,'Aerobic Builder');
 assert.equal(days[1].rideName,'Aerobic Builder');
 const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
 assert.ok(ui.includes('const weekDisplay=currentCalendarDays.map(shown=>'));
 assert.ok(ui.includes('const isPast=day.key<todayKey;'));
});

test('legacy unpadded skipped-day and morning check-in dates stay readable',()=>{
 assert.equal(normalizeDayKey('2026-11-2'),'2026-11-02');
 assert.equal(normalizeDayKey('2026-11-02'),'2026-11-02');
 assert.equal(normalizeDayKey('2026-11-31'),'');
 assert.equal(normalizeDayKey('invalid'),'');
 const old=validCheckIn({date:'2026-11-2',feeling:'okay',bodyBattery:80},'2026-11-02');
 assert.equal(old?.date,'2026-11-02');
 assert.equal(old?.bodyBattery,80);
});
