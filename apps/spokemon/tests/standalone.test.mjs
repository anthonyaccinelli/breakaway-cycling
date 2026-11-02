import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
async function load(path){
 const result=await build({entryPoints:[new URL(path,import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
}
test('cadence-only moves with fresh sensor and stops on stale readings',async()=>{
 const {advanceCadenceSensorRide}=await load('../src/spokemon-sensor-progress.ts');
 const state={nowMs:10000,lastSpeedAtMs:0,lastCadenceAtMs:9900,speedSensorConnected:false,speedMps:0,cadenceRpm:80,distanceMeters:0,stepSeconds:1,routeLimitMeters:1000};
 let r=advanceCadenceSensorRide(state);
 assert.equal(r.source,'cadence');assert.ok(r.distanceMeters>5&&r.distanceMeters<5.5);
 r=advanceCadenceSensorRide({...state,lastCadenceAtMs:1000});assert.equal(r.source,'stopped');assert.equal(r.distanceMeters,0);
});
test('fresh wheel speed wins over cadence estimate and zero wheel speed is respected',async()=>{
 const {advanceCadenceSensorRide}=await load('../src/spokemon-sensor-progress.ts');
 let r=advanceCadenceSensorRide({nowMs:10000,lastSpeedAtMs:9900,lastCadenceAtMs:9900,speedSensorConnected:true,speedMps:0,cadenceRpm:110,distanceMeters:50,stepSeconds:1,routeLimitMeters:1000});
 assert.equal(r.source,'wheel');assert.equal(r.distanceMeters,50);
});
test('route seeds reproduce equivalent terrain, independent of other game modes',async()=>{
 const {generateProfile}=await load('../src/standalone-route.ts');
 const a=generateProfile(15,'rolling',12345),b=generateProfile(15,'rolling',12345);
 assert.deepEqual(a,b);assert.notDeepEqual(a.samples,generateProfile(15,'rolling',54321).samples);
 assert.ok(a.totalMeters>24000&&a.gainMeters>=0);
});
test('extracted app imports no Classic, Survival, Cycle Quest or Coach features',async()=>{
 const root=await readFile(new URL('../src/standalone.ts',import.meta.url),'utf8');
 assert.doesNotMatch(root,/from ['"].*(classic-cockpit|survival-cockpit|quest-intro|\/coach)['"]/);
 assert.match(root,/mountPedalkinRide/);
 assert.match(root,/parseCscMeasurement/);
 assert.match(root,/advanceCadenceSensorRide/);
});
test('temperament alters cadence challenges',async()=>{
 const {evaluateCadenceTemperament,initialTemperamentAttempt}=await load('../src/spokemon-temperament.ts');
 const a=evaluateCadenceTemperament('gentle',80,70,true,1,initialTemperamentAttempt());
 const b=evaluateCadenceTemperament('stubborn',80,70,true,1,initialTemperamentAttempt());
 assert.notEqual(a.targetMin,b.targetMin);
});
