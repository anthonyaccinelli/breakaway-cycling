import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

async function load(name){
 const source=await readFile(new URL('../src/'+name+'.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
const input=await load('spokemon-input-mode');
const tempo=await load('spokemon-temperament');
const csc=await load('spokemon-csc');

test('Auto input prioritizes real power and falls back to cadence',()=>{
 assert.equal(input.resolveSpokemonInput('auto',true,true),'power');
 assert.equal(input.resolveSpokemonInput('auto',false,true),'cadence');
 assert.equal(input.resolveSpokemonInput('auto',false,false),'none');
 assert.equal(input.resolveSpokemonInput('power',false,true),'none');
 assert.equal(input.resolveSpokemonInput('cadence',true,true),'cadence');
 assert.equal(input.resolveSpokemonInput('auto',false,false,true),'cadence');
 assert.equal(input.resolveSpokemonInput('power',false,false,true),'power');
});

test('Cadence temperaments have RPM targets independent of FTP watts',()=>{
 const a=tempo.initialTemperamentAttempt();
 const shy=tempo.evaluateCadenceTemperament('shy',82,80,true,1,a);
 assert.equal(shy.matched,true);
 assert(shy.trustGain>0);
 assert(shy.targetMin>=70&&shy.targetMax<=90);
 const miss=tempo.evaluateCadenceTemperament('shy',82,110,true,1,a);
 assert.equal(miss.trustGain,0);
 assert.match(miss.feedback,/SLOWER/);
 const stopped=tempo.evaluateCadenceTemperament('shy',82,80,false,1,a);
 assert.equal(stopped.trustGain,0);
});

test('Curious cadence encounters reward alternating easy and brisk holds',()=>{
 let attempt=tempo.initialTemperamentAttempt();
 let earned=0;
 for(let i=0;i<5;i++){
  const result=tempo.evaluateCadenceTemperament('curious',82,72,true,1,attempt);
  earned+=result.trustGain;attempt=result.next;
 }
 assert.equal(attempt.phase,'brisk');
 const result=tempo.evaluateCadenceTemperament('curious',82,88,true,1,attempt);
 assert(result.matched);
 assert(result.trustGain>0&&earned>0);
});

test('CSC wheel and crank counters produce real speed and RPM without estimated watts',()=>{
 const make=(wheel,tm,crank,ct)=>{
  const b=new ArrayBuffer(11),d=new DataView(b);
  d.setUint8(0,3);d.setUint32(1,wheel,true);d.setUint16(5,tm,true);
  d.setUint16(7,crank,true);d.setUint16(9,ct,true);return d;
 };
 const first=csc.parseCscMeasurement(make(100,1000,40,1000),{},2105);
 assert(first.wheelPresent&&first.crankPresent);
 assert.equal(first.speedMps,null);
 const second=csc.parseCscMeasurement(make(102,2024,42,2365),first.state,2105);
 assert(Math.abs(second.speedMps-4.21)<.02);
 assert(Math.abs(second.cadenceRpm-90)<1);
 assert.equal('powerWatts' in second,false);
});

test('CSC accepts wraparound counter timestamps',()=>{
 const make=(rev,t)=>{const d=new DataView(new ArrayBuffer(7));d.setUint8(0,1);d.setUint32(1,rev,true);d.setUint16(5,t,true);return d;};
 const one=csc.parseCscMeasurement(make(500,65000),{});
 const two=csc.parseCscMeasurement(make(502,488),one.state);
 assert(two.speedMps>0&&two.speedMps<20);
});

test('Spokemon play test is isolated from real ride recording and uses its own input menu',async()=>{
 const [game,devices,main]=await Promise.all(['spokemon-playable','pedalkin-handheld-devices','main'].map(f=>readFile(new URL('../src/'+f+'.ts',import.meta.url),'utf8')));
 assert.match(devices,/PLAY TEST THIS MODE/);
 assert.match(devices,/AUTO DETECT \(RECOMMENDED\)/);
 assert.match(game,/spokemon:demo-start/);
 assert.match(game,/evaluateCadenceTemperament/);
 assert.match(main,/CSC_MEASUREMENT/);
 assert.match(main,/if\(cscOnly\)/);
 assert.match(game,/Test rides are simulated and are never recorded or exported/);
});
