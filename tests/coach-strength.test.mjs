import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const get=async(path)=>{
 const content=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const js=ts.transpileModule(content,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
};
const engine=await get('src/coach-engine.ts');
const strength=await get('src/coach-strength.ts');
const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
const player=readFileSync(new URL('../src/coach-strength-ui.ts',import.meta.url),'utf8');
const settings=(options={})=>strength.validStrength({enabled:true,equipment:['bodyweight'],experience:'beginner',sessions:2,minutes:30,...options});
const rider=engine.validProfile({ftp:270,hours:3,days:3,restDay:6,experience:'beginner'});
const base=engine.recommendWeek(rider,false);
test('equipment settings are opt-in, validated and retain bodyweight baseline',()=>{
 const s=strength.validStrength({enabled:true,equipment:['barbell','barbell','weapons'],sessions:20,minutes:100,experience:'unfamiliar'});
 assert.equal(s.enabled,true);assert.deepEqual(s.equipment,['bodyweight','barbell']);assert.equal(s.sessions,1);
 assert.equal(s.minutes,30);assert.equal(s.experience,'beginner');
 assert.equal(strength.defaultStrength.enabled,false);
});
test('bodyweight-only riders get a full routine without unavailable equipment',()=>{
 const s=settings();
 for(const variant of ['A','B']){
  const routine=strength.strengthRoutine(s,variant);
  assert.equal(routine.exercises.length,5);
  for(const exercise of routine.exercises)assert.ok(exercise.equipment.every(eq=>s.equipment.includes(eq)));
 }
});
test('a barbell does not imply a bench; all substitutions satisfy selected equipment',()=>{
 const s=settings({equipment:['bodyweight','barbell']});
 const routine=strength.strengthRoutine(s);
 assert.ok(routine.exercises.some(x=>x.id==='bar-squat'));
 assert.ok(!routine.exercises.some(x=>x.id==='bar-bench'));
 assert.equal(strength.availableExercises(s,'Push').some(x=>x.id==='bar-bench'),false);
 const withBench=settings({equipment:['bodyweight','barbell','bench']});
 assert.equal(strength.availableExercises(withBench,'Push').some(x=>x.id==='bar-bench'),true);
});
test('strength plan shares the total weekly budget, scheduled days, and respects rest days',()=>{
 const s=settings();
 const plan=strength.integratedWeek(rider,s,base,id=>({endurance:70,tempo:45,sweetspot:50,vo2:45,recovery:25}[id]||40));
 assert.ok(plan.plannedMinutes<=plan.budgetMinutes);
 assert.equal(plan.budgetMinutes,180);
 assert.equal(plan.days[6].strength,null);
 assert.equal(plan.days[6].cyclingId,null);
 assert.ok(plan.days.filter(d=>d.strength).length>=1);
 for(const day of plan.days)if(day.strength)assert.ok(base[day.day].workoutId,'only planned days can have strength');
});
test('minimum time budgets may reduce frequency or shorten cycling rather than exceeding hours',()=>{
 const tiny=engine.validProfile({hours:1,days:2,restDay:0});
 const basic=engine.recommendWeek(tiny);
 const plan=strength.integratedWeek(tiny,settings({minutes:45,sessions:2}),basic,()=>50);
 assert.ok(plan.plannedMinutes<=60);
 assert.equal(plan.days[0].strength,null);
 assert.ok(plan.days.every(day=>day.cyclingMinutes>=0&&day.strengthMinutes>=0));
});
test('preview includes strength setup, mixed schedule, no trainer needed and saved set logs',()=>{
 assert.match(ui,/id="coachStrengthSettings"/);
 assert.match(ui,/id="coachStrengthToday"/);
 assert.match(ui,/id="coachStrengthHistory"/);
 assert.match(ui,/data-strength-variation/);
 assert.match(ui,/integratedWeek\(/);
 assert.match(ui,/mountCoachStrength/);
 assert.match(player,/id="strengthEnabled"/);
 assert.match(player,/data-gear/);
 assert.match(player,/data-strength-sub/);
 assert.match(player,/data-check/);
 assert.match(player,/data-reps/);
 assert.match(player,/data-load/);
 assert.match(player,/STRENGTH_HISTORY_KEY/);
 assert.match(player,/strengthFinish/);
});
