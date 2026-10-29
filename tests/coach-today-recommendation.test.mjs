import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/coach-engine.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/coach-v2.css',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const coach=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const date=(s)=>new Date(s);
const profile=coach.validProfile({ftp:300,days:3,hours:5,goal:'ftp',experience:'advanced',restDay:6});

test('recommendations follow the scheduled day instead of defaulting to library selection',()=>{
 const mon=coach.recommendToday(profile,date('2026-10-26T12:00:00'));
 assert.equal(mon.status,'planned');
 assert.equal(mon.workoutId,coach.recommendWeek(profile,false)[1].workoutId);
 assert.match(mon.reason,/building sustainable power/);
});
test('rest days and previously completed riding do not auto-prescribe another workout',()=>{
 const thursday=coach.recommendToday(profile,date('2026-10-29T12:00:00'));
 assert.equal(thursday.status,'rest');assert.equal(thursday.workoutId,null);
 const monday=date('2026-10-26T12:00:00');
 const done=coach.recommendToday(profile,monday,[{start:date('2026-10-26T09:00:00').getTime(),elapsed:3600,avgPower:120}]);
 assert.equal(done.status,'completed');assert.equal(done.workoutId,null);
});
test('recent hard rides (including game modes) prompt a lighter recommendation on training days',()=>{
 const monday=date('2026-10-26T12:00:00');
 const recent=[{start:date('2026-10-25T16:00:00').getTime(),elapsed:5400,avgPower:265,source:'cyclequest'}];
 const rec=coach.recommendToday(profile,monday,recent);
 assert.equal(rec.status,'recovery');assert.equal(rec.workoutId,'recovery');
 assert.match(rec.reason,/demanding ride/);
});
test('high perceived effort triggers recovery; non-recorded power never fabricates fatigue',()=>{
 const monday=date('2026-10-26T12:00:00');
 const hard=coach.recommendToday(profile,monday,[],[{date:date('2026-10-25T19:00:00').getTime(),rpe:10}]);
 assert.equal(hard.workoutId,'recovery');
 const missing=coach.recommendToday(profile,monday,[{start:date('2026-10-25T15:00:00').getTime(),elapsed:3500,avgPower:null}]);
 assert.equal(missing.status,'planned');
});
test('shortening a selected workout preserves wattage ranges and gives real shorter intervals',()=>{
 const w=coach.workoutLibrary(profile).find(w=>w.id==='endurance');
 const shortened=coach.shortenWorkout(w,30);
 assert.ok(coach.workoutDuration(shortened)<=30*60);
 assert.ok(coach.workoutDuration(shortened)<coach.workoutDuration(w));
 assert.deepEqual(shortened.segments.map(x=>[x.low,x.high]),w.segments.map(x=>[x.low,x.high]));
 assert.notEqual(w.id,shortened.id);
});
test('the daily UI prioritizes recommendation and keeps swapping optional',()=>{
 assert.doesNotMatch(ui,/id="coachWorkout"/);
 assert.match(ui,/id="coachRecommendedName"/);
 assert.match(ui,/id="coachWhy"/);
 assert.match(ui,/id="coachRestState"/);
 assert.match(ui,/id="coachSwapPanel"/);
 assert.match(ui,/id="coachSwapToggle"/);
 assert.match(ui,/id="coachUseRecommendation"/);
 assert.match(ui,/id="coachBrowseOptional"/);
 assert.match(ui,/data-coach-question="short"/);
 assert.match(ui,/shortenWorkout\(w,target\)/);
 assert.match(ui,/recommendToday\(rider,nowDate,inputs,feedback\)/);
 assert.match(ui,/loadHistoricalRides\(\)/);
 assert.match(styles,/\.coach-v2 \.coach-swap-panel/);
});
