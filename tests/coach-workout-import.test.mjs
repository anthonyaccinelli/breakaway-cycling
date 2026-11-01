import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/coach-workout-import.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseWorkoutDescription,EXAMPLE_WORKOUT}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const ui=readFileSync(new URL('../src/coach-workout-import-ui.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/coach-workout-import.css',import.meta.url),'utf8');
const coach=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
test('parses 2h 103–114 bpm Garmin example without inventing wattage',()=>{
 const r=parseWorkoutDescription(EXAMPLE_WORKOUT);
 assert.equal(r.durationMinutes,120);
 assert.deepEqual(r.target,{kind:'heart-rate',minBpm:103,maxBpm:114});
 assert.equal(r.sport,'cycling');
 assert.equal(r.pace,'steady');
 assert.equal(r.ready,true);
 assert.ok(r.warnings.some(x=>x.includes('No power target')));
 assert.ok(r.warnings.some(x=>x.includes('Warmup not specified')));
 assert.ok(r.warnings.some(x=>x.includes('Cooldown not specified')));
});
test('accepts alternate time and wattage formats',()=>{
 assert.equal(parseWorkoutDescription('Ride 1 hour 30 minutes. 115-130 bpm').durationMinutes,90);
 assert.equal(parseWorkoutDescription('Ride 00:45:00 steady at 150–180 watts').durationMinutes,45);
 assert.deepEqual(parseWorkoutDescription('Ride 00:45:00 steady at 150–180 watts').target,{kind:'power',lowWatts:150,highWatts:180});
});
test('missing inputs stay missing, rather than manufacturing workouts',()=>{
 const a=parseWorkoutDescription('Ride steady.');
 assert.equal(a.ready,false);
 assert.equal(a.target,null);
 assert.equal(a.durationMinutes,null);
 const b=parseWorkoutDescription('Ride for 2 hours.');
 assert.equal(b.ready,false);
 assert.equal(b.target,null);
 assert.equal(parseWorkoutDescription('Ride for 2 hours, keep between 300 and 400 bpm').ready,false);
});
test('Create Workout is a fifth real Coach navigation tab and independent screen',()=>{
 assert.match(coach,/id="coachTabImport" role="tab"/);
 assert.match(coach,/id="coachViewImport" role="tabpanel"/);
 assert.match(coach,/mountWorkoutImporter\(\$\('coachImportRoot'\)\)/);
 assert.match(coach,/type CoachTab='today'\|'plan'\|'history'\|'settings'\|'import'/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:570px\)/);
});
test('preview allows editing text and saving drafts, but makes unsupported features clear',()=>{
 assert.match(ui,/input\.addEventListener\('input',render\)/);
 assert.match(ui,/id="ciDescription"/);
 assert.match(ui,/id="ciImage"/);
 assert.match(ui,/Screenshot extraction/); // wording check expanded below
 assert.match(ui,/IMPORTED_WORKOUT_KEY/);
 assert.match(ui,/starting imported workouts in Classic are not yet implemented/);
 assert.match(ui,/ciSave.*disabled/);
});
