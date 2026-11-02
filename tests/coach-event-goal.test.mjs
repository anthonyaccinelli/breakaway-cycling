import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=async name=>{
 const source=readFileSync(new URL('../src/'+name+'.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
};
const {validEventGoal,goalPhase,eventWeek}=await compile('coach-event-goal');
const {reconcileCoachWeek}=await compile('coach-week-view');
const {adaptWeeklySchedule}=await compile('coach-adaptive-week');
const rider={ftp:280,hours:8,days:5,restDay:6,goal:'endurance',experience:'intermediate'};
const ultra=validEventGoal({discipline:'ultra',date:'2027-07-12',distanceKm:402.33,elevationM:3000,objective:'finish'});
const workouts=[
 {id:'endurance',name:'Aerobic Builder',segments:[]},
 {id:'recovery',name:'Recovery Spin',segments:[]},
 {id:'tempo',name:'Tempo Builder',segments:[]},
 {id:'vo2',name:'VO2 Intervals',segments:[]}
];
test('event goal validates a multi-day race and retains total course metrics',()=>{
 const e=validEventGoal({discipline:'stage-race',stages:5,distanceKm:402.336,elevationM:2500,date:'2027-06-15',terrain:'gravel'});
 assert.equal(e.stages,5);assert.equal(e.date,'2027-06-15');assert.equal(e.distanceKm,402.336);
 assert.equal(e.elevationM,2500);assert.equal(e.terrain,'gravel');
});
test('invalid dates, impossible distances, and malformed event data are sanitized',()=>{
 const e=validEventGoal({discipline:'not-real',date:'2027-02-30',distanceKm:-4,elevationM:9999999,stages:500});
 assert.equal(e.discipline,'general');assert.equal(e.date,'');assert.equal(e.distanceKm,null);assert.equal(e.elevationM,null);assert.equal(e.stages,1);
});
test('phase boundaries are stable and progression is date-specific',()=>{
 const d='2027-07-12';
 assert.equal(goalPhase(ultra,new Date(2027,2,1)).phase,'base');
 assert.equal(goalPhase(ultra,new Date(2027,5,1)).phase,'build');
 assert.equal(goalPhase(ultra,new Date(2027,5,21)).phase,'specific');
 assert.equal(goalPhase(ultra,new Date(2027,6,8)).phase,'taper');
 assert.equal(goalPhase(ultra,new Date(2027,6,12)).phase,'event');
 assert.equal(goalPhase(ultra,new Date(2027,6,13)).phase,'post-event');
});
test('ultra and crit workouts differ as the race-specific phase approaches',()=>{
 const crit=validEventGoal({discipline:'criterium',date:'2027-07-12'});
 const on=new Date(2027,5,22);
 const a=eventWeek(rider,ultra,on),b=eventWeek(rider,crit,on);
 assert.ok(a.some(x=>x.workoutId==='tempo'));
 assert.ok(b.some(x=>x.workoutId==='vo2'));
 assert.equal(a.length,7);assert.equal(b.length,7);
 assert.equal(a.find(x=>x.day===rider.restDay).workoutId,null);
});
test('five-day endurance plan does not silently disappear from My Week',()=>{
 const now=new Date(2026,10,2,8);
 const week=eventWeek(rider,{...ultra,date:'2027-07-12'},now).map(d=>({
  day:d.day,cyclingId:d.workoutId,cyclingMinutes:d.workoutId==='endurance'?90:d.workoutId==='recovery'?30:45,
  strength:null,strengthMinutes:0,reason:d.reason
 }));
 const adapt=adaptWeeklySchedule({now,week,rides:[],feedback:[],skipped:[],ftp:280,ftpKnown:true,budgetMinutes:480,
  recoveryMinutes:30,today:{workoutId:'endurance',status:'planned',reason:'Event goal'}});
 const cal=adapt.days.slice(1,7).map(d=>({
  date:d.date,key:d.key,isToday:d.key==='2026-11-02',label:'',title:'',rideId:d.workoutId,
  rideName:workouts.find(w=>w.id===d.workoutId)?.name??null,rideMinutes:d.minutes,
  rideDescription:null,strength:null,strengthMinutes:0,completedRide:false,reason:d.reason
 }));
 const view=reconcileCoachWeek(adapt.days.slice(0,7),cal,workouts,'2026-11-02');
 for(const day of view.filter(d=>d.key>='2026-11-02')){
  const counterpart=cal.find(c=>c.key===day.key);
  assert.equal(day.workoutId,counterpart.rideId,day.key+' inconsistent ride');
  assert.equal(day.minutes,counterpart.rideMinutes,day.key+' inconsistent duration');
 }
 assert.ok(view.filter(d=>d.workoutId!==null).length>=3,'all-rest week regression');
});
test('November 2–7 scheduled workouts match the rolling seven-day calendar',()=>{
 const now=new Date(2026,10,2,9);
 const schedule=[
  {day:0,cyclingId:'endurance',cyclingMinutes:90},
  {day:1,cyclingId:'endurance',cyclingMinutes:90},
  {day:2,cyclingId:'recovery',cyclingMinutes:30},
  {day:3,cyclingId:'endurance',cyclingMinutes:90},
  {day:4,cyclingId:'endurance',cyclingMinutes:90},
  {day:5,cyclingId:null,cyclingMinutes:0},
  {day:6,cyclingId:null,cyclingMinutes:0}
 ].map(d=>({...d,strength:null,strengthMinutes:0,reason:'Planned'}));
 const adaptive=adaptWeeklySchedule({now,week:schedule,rides:[],feedback:[],skipped:[],
  ftp:280,ftpKnown:true,budgetMinutes:480,recoveryMinutes:30,
  today:{workoutId:'endurance',status:'planned',reason:'Today'}});
 const dates=adaptive.days.filter(d=>d.key>='2026-11-02'&&d.key<='2026-11-08');
 const calendar=dates.map(d=>({key:d.key,rideId:d.workoutId,rideMinutes:d.minutes,
  strength:d.strength,strengthMinutes:d.strengthMinutes}));
 const view=reconcileCoachWeek(adaptive.days.slice(0,7),calendar,workouts,'2026-11-02');
 for(const key of ['2026-11-02','2026-11-03','2026-11-04','2026-11-05']){
  const day=view.find(d=>d.key===key);
  assert.ok(day.workoutId,key+' must not render as rest');
  assert.ok(day.name,key+' must show a workout title');
 }
 for(const key of ['2026-11-06','2026-11-07'])
  assert.equal(view.find(d=>d.key===key).workoutId,null);
});
test('My Week explicitly projects the same calendar dates rendered in Today',()=>{
 const source=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
 assert.match(source,/const shown=currentCalendarDays\.find\(item=>item\.key===day\.key\)/);
 assert.match(source,/workoutId:shown\.rideId&&shown\.rideMinutes>0\?shown\.rideId:null/);
});
test('a Today workout wins over stale or incomplete weekly display data',()=>{
 const date=new Date(2026,10,2);
 const stale=[{key:'2026-11-02',date,weekday:1,workoutId:null,minutes:90,
  status:'planned',reason:'Planned',strength:null,strengthMinutes:0,changed:false}];
 const today=[{key:'2026-11-02',rideId:'endurance',rideMinutes:90,rideName:'Aerobic Builder',
  strength:null,strengthMinutes:0}];
 const view=reconcileCoachWeek(stale,today,workouts,'2026-11-02');
 assert.equal(view[0].name,'Aerobic Builder');
 assert.equal(view[0].minutes,90);
 assert.equal(view[0].workoutId,'endurance');
});
test('a missing workout ID triggers a visible warning, not a false rest day',()=>{
 const date=new Date(2026,10,2);
 const day={key:'2026-11-02',date,weekday:1,workoutId:'unavailable',minutes:35,
  status:'planned',reason:'Planned',strength:null,strengthMinutes:0,changed:false};
 const out=reconcileCoachWeek([day],[],workouts,'2026-11-02')[0];
 assert.equal(out.missingWorkout,true);
 assert.equal(out.workoutId,'unavailable');
});
test('previous unrecorded ride is not mislabeled as user-initiated skip',()=>{
 const now=new Date(2026,10,2,12);
 const week=Array.from({length:7},(_,day)=>({
  day,cyclingId:day===0?'endurance':null,cyclingMinutes:day===0?60:0,
  strength:null,strengthMinutes:0,reason:'Planned'
 }));
 const out=adaptWeeklySchedule({now,week,rides:[],feedback:[],skipped:[],ftp:280,ftpKnown:true,
  budgetMinutes:480,recoveryMinutes:30,today:{workoutId:null,status:'rest',reason:'Rest'}});
 assert.equal(out.days.find(d=>d.key==='2026-11-01').status,'missed');
 assert.equal(out.changes.find(d=>d.key==='2026-11-01').kind,'missed');
});
test('source maps daily recommendations to the same event week displayed in My Week',()=>{
 const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
 assert.match(ui,/reconcileCoachWeek\(thisWeek,currentCalendarDays,library,todayKey\)/);
 assert.match(ui,/schedule\.days\.map\(day=>\(\{day:day\.day,workoutId:day\.cyclingId,reason:day\.reason\}\)\)/);
});

test('race week does not schedule an additional trainer workout on competition day',()=>{
 const now=new Date(2027,6,10,12);
 const goal=validEventGoal({discipline:'criterium',date:'2027-07-12'});
 const w=eventWeek(rider,goal,now).map(d=>({
  day:d.day,cyclingId:d.workoutId,cyclingMinutes:d.workoutId?45:0,
  strength:null,strengthMinutes:0,reason:d.reason
 }));
 const result=adaptWeeklySchedule({now,week:w,rides:[],feedback:[],skipped:[],
  ftp:280,ftpKnown:true,budgetMinutes:480,recoveryMinutes:25,
  today:{workoutId:w.find(d=>d.day===6)?.cyclingId||null,status:'planned',reason:'Plan'},
  event:{startDate:'2027-07-12',stages:1}});
 const race=result.days.find(d=>d.key==='2027-07-12');
 assert.equal(race.status,'event');
 assert.equal(race.workoutId,null);
 assert.equal(race.minutes,0);
 assert.match(race.reason,/Event stage 1 of 1/);
});
test('five-day stage race protects each stage and reserves strength-free racing days',()=>{
 const now=new Date(2027,6,10,12);
 const stage=validEventGoal({discipline:'stage-race',date:'2027-07-12',stages:5});
 const week=eventWeek(rider,stage,now).map(d=>({
  day:d.day,cyclingId:d.workoutId,cyclingMinutes:d.workoutId?60:0,
  strength:'A',strengthMinutes:30,reason:d.reason
 }));
 const result=adaptWeeklySchedule({now,week,rides:[],feedback:[],skipped:[],
  ftp:280,ftpKnown:true,budgetMinutes:600,recoveryMinutes:30,
  today:{workoutId:null,status:'rest',reason:'Rest'},event:{startDate:'2027-07-12',stages:5}});
 const stages=result.days.filter(d=>d.key>='2027-07-12'&&d.key<='2027-07-16');
 assert.equal(stages.length,5);
 for(const [i,d] of stages.entries()){
  assert.equal(d.status,'event','stage '+(i+1));
  assert.equal(d.workoutId,null);
  assert.equal(d.strength,null);
  assert.equal(d.strengthMinutes,0);
  assert.match(d.reason,new RegExp('stage '+(i+1)+' of 5'));
 }
 assert.equal(goalPhase(stage,new Date(2027,6,15)).phase,'event');
 assert.equal(goalPhase(stage,new Date(2027,6,17)).phase,'post-event');
});
test('date-aware planning callback adapts each day across a periodization boundary',()=>{
 const now=new Date(2027,6,3,12);
 const week=Array.from({length:7},(_,day)=>({day,cyclingId:'endurance',cyclingMinutes:45,strength:null,strengthMinutes:0,reason:'Baseline'}));
 const result=adaptWeeklySchedule({now,week,rides:[],feedback:[],skipped:[],ftp:280,ftpKnown:true,budgetMinutes:480,
  recoveryMinutes:25,today:{workoutId:'endurance',status:'planned',reason:'Today'},
  planForDate:date=>({
   day:date.getDay(),cyclingId:date.getDate()>=8?'recovery':'endurance',
   cyclingMinutes:date.getDate()>=8?25:45,strength:null,strengthMinutes:0,
   reason:date.getDate()>=8?'Taper':'Base'
  })});
 assert.equal(result.days.find(d=>d.key==='2027-07-07').workoutId,'endurance');
 assert.equal(result.days.find(d=>d.key==='2027-07-08').workoutId,'recovery');
});
test('the selected calendar workout duration survives navigating into Today',()=>{
 const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
 assert.match(ui,/selectedOverrideMinutes=day\.rideMinutes/);
 assert.match(ui,/selectedOverrideMinutes=planned\?\.rideMinutes/);
 assert.match(ui,/minutes\*60<workoutDuration\(base\)/);
});

const {integratedWeek,defaultStrength}=await compile('coach-strength');
test('weekly time availability is honored even without strength enabled',()=>{
 const busy={...rider,hours:2,days:5};
 const raw=eventWeek(busy,ultra,new Date(2026,10,2));
 const result=integratedWeek(busy,{...defaultStrength,enabled:false},raw, id=>id==='recovery'?30:90);
 assert.ok(result.plannedMinutes<=120,'do not prescribe more than the two available hours');
 assert.ok(result.days.reduce((sum,d)=>sum+d.cyclingMinutes,0)<=120);
 assert.equal(result.days.some(d=>d.day===busy.restDay&&d.cyclingId!==null),false);
});
test('an eight-hour athlete keeps their normal schedule when sessions fit',()=>{
 const raw=eventWeek(rider,ultra,new Date(2026,10,2));
 const normal=integratedWeek(rider,{...defaultStrength,enabled:false},raw,id=>id==='recovery'?30:90);
 assert.ok(normal.plannedMinutes<=480);
 assert.ok(normal.days.filter(d=>d.cyclingId).length>=4);
});
