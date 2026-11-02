import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const load=async(file)=>{
 const s=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
 const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
};
const a=await load('coach-adaptive.ts');
const ui=readFileSync(new URL('../src/coach-adaptive-ui.ts',import.meta.url),'utf8');
const coach=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
const when=new Date(2026,10,2,12,0,0);
const profile={ftp:300,days:4,hours:6,restDay:6,goal:'ftp',experience:'advanced'};
const base=Array.from({length:7},(_,day)=>({
 day,cyclingId:day===1?'sweetspot':day===2?'endurance':day===3?'vo2':day===5?'tempo':null,
 cyclingMinutes:day===1?60:day===2?80:day===3?55:day===5?50:0,
 strength:day===1?'A':day===4?'B':null,strengthMinutes:day===1||day===4?30:0,reason:'Scheduled'
}));
const opts=(extra={})=>({now:when,profile,base,rides:[],feedback:[],mornings:[],missed:[],overrides:[],...extra});
const day=(plan,i)=>plan.days.find(x=>x.weekday===i);
test('Garmin Sleep Score is 0–100 and raw HRV without baseline never creates an absolute threshold',()=>{
 assert.equal(a.validMorning({date:'2026-11-02',sleepScore:101,overnightHrv:50,hrvStatus:'unknown'}).sleepScore,null);
 assert.equal(a.morningLight(a.validMorning({date:'2026-11-02',sleepScore:90,overnightHrv:18,hrvStatus:'unknown'})).light,'green');
 assert.equal(a.morningLight(a.validMorning({date:'2026-11-02',sleepScore:75,overnightHrv:32,baselineLow:48,baselineHigh:75,hrvStatus:'unknown'})).light,'yellow');
});
test('low Sleep Score plus low personal HRV switches intervals and strength to rest',()=>{
 const reading=a.validMorning({date:'2026-11-02',sleepScore:40,overnightHrv:31,baselineLow:45,baselineHigh:60,hrvStatus:'low'});
 const plan=a.adaptWeek(opts({mornings:[reading]}));
 assert.equal(plan.today,'red');
 assert.equal(day(plan,1).cyclingId,null);assert.equal(day(plan,1).strength,null);
 assert.ok(day(plan,1).changes.includes('Cycling workout → Rest day.'));
 assert.equal(day(plan,2).light,'yellow');
 assert.equal(day(plan,2).cyclingMinutes,45);
 assert.equal(day(plan,3).light,'green','future sleep is not invented');
});
test('poor sleep alone triggers caution, not unvalidated red-day claims',()=>{
 const reading=a.validMorning({date:'2026-11-02',sleepScore:52,overnightHrv:60,hrvStatus:'balanced'});
 const plan=a.adaptWeek(opts({mornings:[reading]}));
 assert.equal(plan.today,'yellow');
 assert.equal(day(plan,1).cyclingId,'endurance');
 assert.equal(day(plan,1).cyclingMinutes,45);
 assert.equal(day(plan,1).strengthMinutes,20);
});
test('demanding outside ride changes the next day without counting future activity',()=>{
 const ride={start:when.getTime()-13*3600000,elapsed:90*60,avgPower:265,source:'survival'};
 const plan=a.adaptWeek(opts({rides:[ride]}));
 assert.equal(plan.today,'yellow');
 assert.equal(day(plan,1).cyclingId,'endurance');
 assert.equal(day(plan,1).strengthMinutes,20);
});
test('three hard rides in 48h trigger a red rest day and recovery follow-up',()=>{
 const rides=[5,18,32].map(h=>({start:when.getTime()-h*3600000,elapsed:70*60,avgPower:290}));
 const plan=a.adaptWeek(opts({rides}));
 assert.equal(plan.today,'red');
 assert.equal(day(plan,1).cyclingId,null);
 assert.equal(day(plan,2).light,'yellow');
});
test('completed unscheduled ride removes planned session without stacking more training',()=>{
 const ride={start:when.getTime()-2*3600000,elapsed:60*60,avgPower:130};
 const plan=a.adaptWeek(opts({rides:[ride]}));
 assert.equal(day(plan,1).completedRide,true);
 assert.equal(day(plan,1).cyclingId,null);
 assert.ok(day(plan,1).changes.some(x=>x.includes('completed ride')));
});
test('marking missed does not automatically make up workouts tomorrow; repeated misses make the return conservative',()=>{
 const missed=['2026-10-28','2026-10-29','2026-11-01'].map(date=>({date,kind:'missed'}));
 const plan=a.adaptWeek(opts({missed}));
 assert.equal(plan.today,'yellow');
 assert.equal(day(plan,1).cyclingId,'endurance');
 const todayMiss=a.adaptWeek(opts({missed:[{date:'2026-11-02',kind:'skipped'}]}));
 assert.equal(day(todayMiss,1).cyclingId,null);
 assert.equal(day(todayMiss,2).cyclingId,'endurance');
});
test('rider may keep original, and the override remains visible to undo',()=>{
 const check=a.validMorning({date:'2026-11-02',sleepScore:38,overnightHrv:32,baselineLow:45,baselineHigh:65,hrvStatus:'low'});
 const plan=a.adaptWeek(opts({mornings:[check],overrides:['2026-11-02']}));
 assert.equal(day(plan,1).cyclingId,'sweetspot');
 assert.equal(day(plan,1).locked,true);
 assert.ok(plan.changes.some(x=>x.date==='2026-11-02'));
});
test('Coach UI contains manual Garmin morning check-in, missed dates, override and transparent before-after',()=>{
 assert.match(ui,/coachSleepScore/);assert.match(ui,/coachHrv/);assert.match(ui,/coachHrvLow/);
 assert.match(ui,/coachHrvHigh/);assert.match(ui,/coachHrvStatus/);
 assert.match(ui,/data-adaptive-keep/);assert.match(ui,/data-missed-remove/);
 assert.match(ui,/ORIGINALLY/);assert.match(ui,/NOW/);
 assert.match(coach,/mountAdaptiveUI\(/);assert.match(coach,/adaptivePlan\(\)/);
 assert.match(coach,/coachAdaptiveMorning/);assert.match(coach,/coachAdaptiveChanges/);
 assert.match(coach,/coach-calendar-signal/);
});
