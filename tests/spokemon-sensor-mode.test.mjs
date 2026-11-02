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


test('Cadence-only sensors permit starting and advancing virtual distance without fake power',async()=>{
 const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
 const devices=await readFile(new URL('../src/pedalkin-handheld-devices.ts',import.meta.url),'utf8');
 assert.match(main,/function sensorReadyForRide\(\)\{return rideExperience==='pedalkin'&&cscHasCadence&&cscDevices.size>0;\}/);
 assert.match(main,/advanceCadenceSensorRide\(/);
 assert.match(main,/Math\.min\(160,cadence\)\)\/80\*5\.36448/);
 assert.match(main,/freshCadence\?Math\.max/);
 assert.match(main,/powerWatts:sensorRideOnly\(\)\?undefined/);
 assert.match(main,/Cadence-only ride started · virtual distance estimated/);
 assert.match(devices,/Cadence Sensor<\/strong>/);
 assert.match(devices,/distance is estimated without speed/);
});

test('Cadence-only route movement works without wheel speed, and stops when stale',async()=>{
 const {advanceCadenceSensorRide:advance}=await load('spokemon-sensor-progress');
 const base={nowMs:10000,lastSpeedAtMs:0,lastCadenceAtMs:9900,
  speedSensorConnected:false,speedMps:0,cadenceRpm:80,
  distanceMeters:100,stepSeconds:1,routeLimitMeters:1000};
 const moving=advance(base);
 assert.equal(moving.source,'cadence');
 assert(Math.abs(moving.speedMps-5.36448)<1e-6);
 assert(moving.distanceMeters>base.distanceMeters);
 const stopped=advance({...base,nowMs:15000});
 assert.equal(stopped.source,'stopped');
 assert.equal(stopped.distanceMeters,base.distanceMeters);
 assert.equal(stopped.speedMps,0);
 const routeEnd=advance({...base,distanceMeters:999});
 assert.equal(routeEnd.distanceMeters,1000);
});

test('Fresh wheel speed wins, including zero speed; stale wheel falls back to cadence',async()=>{
 const {advanceCadenceSensorRide:advance}=await load('spokemon-sensor-progress');
 const base={nowMs:10000,lastSpeedAtMs:9900,lastCadenceAtMs:9900,
  speedSensorConnected:true,speedMps:8,cadenceRpm:80,
  distanceMeters:50,stepSeconds:1,routeLimitMeters:1000};
 assert.equal(advance(base).source,'wheel');
 assert.equal(advance(base).distanceMeters,58);
 const stationary=advance({...base,speedMps:0});
 assert.equal(stationary.source,'wheel');
 assert.equal(stationary.distanceMeters,50);
 const staleWheel=advance({...base,lastSpeedAtMs:4000});
 assert.equal(staleWheel.source,'cadence');
 assert(staleWheel.distanceMeters>50);
 const wheelDisconnected=advance({...base,speedSensorConnected:false});
 assert.equal(wheelDisconnected.source,'cadence');
 const allStale=advance({...base,lastSpeedAtMs:4000,lastCadenceAtMs:4000});
 assert.equal(allStale.source,'stopped');
 assert.equal(allStale.distanceMeters,50);
 const noInitialWheel=advance({...base,lastSpeedAtMs:0});
 assert.equal(noInitialWheel.source,'cadence');
});
