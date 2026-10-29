import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/coach-engine.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const coach=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

test('profiles are validated and clamped',()=>{
  const p=coach.validProfile({ftp:9999,hours:0,days:20,experience:'unknown',goal:'ftp'});
  assert.equal(p.ftp,550);assert.equal(p.hours,1);assert.equal(p.days,6);
  assert.equal(p.experience,'beginner');assert.equal(p.goal,'ftp');
});
test('all coach workouts have safe, ordered and finite intervals',()=>{
  const list=coach.workoutLibrary(coach.defaultProfile);
  assert.ok(list.length>=5);
  for(const workout of list){
    assert.ok(coach.workoutDuration(workout)>0);
    for(const s of workout.segments) {
      assert.ok(s.minutes>0&&s.low>0&&s.low<s.high&&s.high<1.5);
    }
    assert.equal(coach.segmentAt(workout,0).index,0);
    assert.equal(coach.segmentAt(workout,coach.workoutDuration(workout)).done,true);
  }
});
test('workout timer changes intervals at exact boundary',()=>{
  const w=coach.workoutLibrary(coach.defaultProfile).find(x=>x.id==='preview');
  assert.equal(coach.segmentAt(w,119.9).index,0);
  assert.equal(coach.segmentAt(w,120).index,1);
  assert.equal(coach.segmentAt(w,480).done,true);
  assert.equal(coach.segmentAt(w,100000).remaining,0);
});
test('structured power targets respect FTP and adjustment',()=>{
  const s={name:'test',minutes:2,low:.88,high:.94};
  assert.equal(coach.targetWatts(300,s),273);
  assert.equal(coach.targetWatts(300,s,.95),259);
  assert.equal(coach.inTargetRange(270,300,s),true);
  assert.equal(coach.inTargetRange(350,300,s),false);
});
test('Coach only offers structured and guided workouts inside Classic',()=>{
  assert.deepEqual(coach.availableControls('classic'),['structured','guided']);
  assert.doesNotMatch(source,/export type CoachMode\s*=\s*[^;]*(survival|cyclequest)/);
});
test('weekly training contains rider-defined days and a hard-session fatigue safeguard',()=>{
  const p=coach.validProfile({ftp:300,hours:6,days:4,goal:'race',experience:'advanced'});
  const normal=coach.recommendWeek(p,false);
  const fatigued=coach.recommendWeek(p,true);
  assert.equal(normal.filter(s=>s.workoutId).length,4);
  assert.equal(normal[6].workoutId,null); // Saturday is the default rest day.
  assert.ok(normal[5].workoutId);
  assert.equal(normal.find(s=>s.workoutId).workoutId,'vo2');
  assert.equal(fatigued.find(s=>s.workoutId).workoutId,'recovery');
  assert.ok(fatigued.every(s=>['recovery','endurance',null].includes(s.workoutId)));
});

test('every schedule retains the selected rest day, even for very active riders',()=>{
 const p=coach.validProfile({days:7,restDay:2});
 const week=coach.recommendWeek(p,false);
 assert.equal(p.days,6);
 assert.equal(week[2].workoutId,null);
});
