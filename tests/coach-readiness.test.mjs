import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/coach-readiness.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const m=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const date='2026-11-01';
const planned={workoutId:'tempo',status:'planned',reason:'scheduled'};
test('morning readings are optional, date-specific, and bounded',()=>{
 assert.equal(m.validCheckIn({date,feeling:'okay',bodyBattery:72,sleepScore:84,hrvMs:48},date).bodyBattery,72);
 assert.equal(m.validCheckIn({date,feeling:'great',bodyBattery:null,sleepScore:null,hrvMs:null},date).hrvMs,null);
 assert.equal(m.validCheckIn({date,feeling:'tired',bodyBattery:101},date),null);
 assert.equal(m.validCheckIn({date,feeling:'okay',hrvMs:0},date),null);
 assert.equal(m.validCheckIn({date,feeling:'okay'},'2026-11-02'),null);
 assert.equal(m.validCheckIn({date,feeling:'unwell'},date),null);
});
test('fatigue self-report suggests recovery without changing the saved schedule',()=>{
 const tired=m.validCheckIn({date,feeling:'tired'},date);
 const adjusted=m.applyRecoveryGuidance(planned,tired);
 assert.equal(adjusted.workoutId,'recovery');
 assert.match(adjusted.reason,/morning check-in/);
 assert.equal(planned.workoutId,'tempo');
 assert.deepEqual(m.applyRecoveryGuidance({...planned,status:'completed'},tired),{...planned,status:'completed'});
 assert.deepEqual(m.applyRecoveryGuidance({...planned,status:'rest',workoutId:null},tired),{...planned,status:'rest',workoutId:null});
});
test('garmin readings are recorded, not treated as independent readiness thresholds',()=>{
 const low=m.validCheckIn({date,feeling:'great',bodyBattery:10,sleepScore:10,hrvMs:10},date);
 assert.equal(m.applyRecoveryGuidance(planned,low).workoutId,'tempo');
 assert.match(m.recoveryGuidance(low).detail,/personalized recovery thresholds/);
 assert.equal(m.recoveryGuidance(null).suggestEasy,false);
});
test('Coach exposes and preserves beginner FTP state and daily check-in',()=>{
 const ui=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
 assert.match(ui,/id="coachFtpKnown"/);
 assert.match(ui,/id="coachSaveCheckin"/);
 assert.match(ui,/applyRecoveryGuidance\(recommendToday/);
 assert.match(ui,/if\(!ftpKnown&&controlChoice==='structured'\)/);
 assert.match(ui,/COACH_FTP_KNOWN_KEY/);
});
