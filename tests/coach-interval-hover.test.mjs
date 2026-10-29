import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const engineSource=readFileSync(new URL('../src/coach-engine.ts',import.meta.url),'utf8');
const coachSource=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/coach-v2.css',import.meta.url),'utf8');
const js=ts.transpileModule(engineSource,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const coach=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('Workout blocks expose exact duration, FTP-derived wattage range and ERG target',()=>{
 const segment={name:'Sweet Spot',minutes:8,low:.88,high:.94};
 const details=coach.intervalRequirements(300,segment);
 assert.deepEqual(details,{
  duration:'8:00',lowWatts:264,highWatts:282,target:273,range:'264–282 W',ftpRange:'88–94% FTP'
 });
});
test('Power requirements update with the riders FTP, including fractional duration',()=>{
 assert.equal(coach.intervalRequirements(250,{name:'Tempo',minutes:2.5,low:.8,high:.9}).duration,'2:30');
 assert.equal(coach.intervalRequirements(250,{name:'Tempo',minutes:2.5,low:.8,high:.9}).range,'200–225 W');
 assert.equal(coach.intervalRequirements(200,{name:'Tempo',minutes:2.5,low:.8,high:.9}).target,170);
});
test('Each workout block can reveal its requirements by mouse, keyboard or touch',()=>{
 assert.match(coachSource,/id="coachIntervalDetails" aria-live="polite"/);
 assert.match(coachSource,/data-coach-segment/);
 assert.match(coachSource,/chart\.addEventListener\('pointerover',inspect\)/);
 assert.match(coachSource,/chart\.addEventListener\('focusin',inspect\)/);
 assert.match(coachSource,/chart\.addEventListener\('click',inspect\)/);
 assert.match(coachSource,/showIntervalRequirements\(0\)/);
 assert.match(coachSource,/aria-label="'\+escapeHtml\(description\)/);
 assert.match(coachSource,/info\.duration\+' duration, '\+info\.range\+' power range/);
 assert.match(coachSource,/button\.setAttribute\('aria-pressed'/);
});
test('New readout stays visible and chart blocks remain focusable with a clear active state',()=>{
 assert.match(css,/\.coach-v2 \.coach-interval-readout\{/);
 assert.match(css,/\.coach-v2 \.coach-segments \.coach-segment\{/);
 assert.match(css,/\.coach-segment:focus-visible/);
 assert.match(css,/\.coach-segment\[aria-pressed="true"\]/);
});
