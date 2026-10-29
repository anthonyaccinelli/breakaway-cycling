import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const raw=readFileSync(new URL('../src/coach-calendar.ts',import.meta.url),'utf8');
const js=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {calendarDays}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/coach-calendar.css',import.meta.url),'utf8');
const workouts=[
 {id:'endurance',name:'Aerobic Builder',description:'Steady aerobic riding',category:'Endurance',segments:[{name:'Steady',minutes:50,low:.56,high:.75}]},
 {id:'recovery',name:'Recovery Spin',description:'Easy recovery riding',category:'Recovery',segments:[{name:'Easy spin',minutes:35,low:.4,high:.55}]}
];
const plan=Array.from({length:7},(_,day)=>({
 day,cyclingId:day===4||day===5?'endurance':null,cyclingMinutes:day===4?42:day===5?40:0,
 strength:day===0?'A':null,strengthMinutes:day===0?30:0,reason:'Scheduled workout'
}));
const today=new Date(2026,9,29,10,0,0);
test('pills represent seven actual calendar dates crossing the weekly schedule boundary',()=>{
 const days=calendarDays(today,plan,workouts,{workoutId:'endurance',status:'planned',reason:'Planned ride'});
 assert.equal(days.length,7);
 assert.equal(days[0].label,'Today 10/29');
 assert.equal(days[0].rideName,'Aerobic Builder');
 assert.equal(days[0].rideMinutes,42);
 assert.equal(days[2].label,'Sat 10/31');
 assert.equal(days[3].label,'Sun 11/1');
 assert.equal(days[3].strength,'A');
 assert.equal(days[3].strengthMinutes,30);
 assert.equal(days[6].label,'Wed 11/4');
 assert.equal(days[6].rideName,null);
 assert.equal(days[3].rideName,null);
 assert.equal(days[0].key,'2026-10-29');
 assert.equal(days[3].key,'2026-11-01');
});
test('today shows fatigue-adjusted ride rather than an outdated planned prescription',()=>{
 const days=calendarDays(today,plan,workouts,{workoutId:'recovery',status:'recovery',reason:'Hard ride recently'});
 assert.equal(days[0].rideName,'Recovery Spin');
 assert.equal(days[0].rideMinutes,35);
 assert.equal(days[0].reason,'Hard ride recently');
 assert.equal(days[1].rideName,'Aerobic Builder');
 assert.equal(days[1].rideMinutes,40);
});
test('completed rides are not advertised as a second workout',()=>{
 const days=calendarDays(today,plan,workouts,{workoutId:null,status:'completed',reason:'Ride complete'});
 assert.equal(days[0].completedRide,true);
 assert.equal(days[0].rideId,null);
 assert.equal(days[0].rideName,null);
});
test('today can show a strength-only day without adding an unscheduled cycling ride',()=>{
 const days=calendarDays(new Date(2026,10,1,12),plan,workouts,{workoutId:null,status:'rest',reason:'Rest from cycling'});
 assert.equal(days[0].rideId,null);
 assert.equal(days[0].strength,'A');
});
test('calendar pills expand, close and open real riding and strength workflows',()=>{
 assert.match(ui,/id="coachCalendarStrip"/);
 assert.match(ui,/id="coachCalendarDetails"/);
 assert.match(ui,/currentCalendarDays=calendarDays\(nowDate,schedule\.days,library,recommendation\)/);
 assert.match(ui,/aria-expanded/);
 assert.match(ui,/data-calendar-action="ride"/);
 assert.match(ui,/data-calendar-action="strength"/);
 assert.match(ui,/launchStrength\(day\.strength,day\.strengthMinutes\)/);
 assert.match(ui,/expandedCalendarKey===day\.key\?null:day\.key/);
 assert.match(css,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/focus-visible/);
 assert.match(css,/\.coach-calendar-details\[hidden\]/);
});
