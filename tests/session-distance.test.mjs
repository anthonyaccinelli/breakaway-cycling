import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {DOMParser} from '@xmldom/xmldom';
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const source=main.slice(main.indexOf('function sessionDistanceMeters('),main.indexOf('type SavedRide='));
function harness(start=68890.79){
 const context={rideStart:'2026-10-30T22:12:01.391Z',rideEnd:'2026-10-30T23:14:30.691Z',rideSessionStartDistance:start,distance:start+22487.25,activeRideMs:3749300,energyKcal:650,routeName:'Story & route',points:[{}],FEET_PER_METER:3.28084,gainLossThrough:d=>({gain:d*.01}),rideSamples:[{seconds:0,distance:start,elevation:720,power:162,cadence:48,heartRate:98},{seconds:1,distance:start+5,elevation:721,power:200,cadence:70,heartRate:100},{seconds:3749,distance:start+22486.42,elevation:722,power:180,cadence:75,heartRate:120}]};
 vm.createContext(context);vm.runInContext(ts.transpile(source,{target:ts.ScriptTarget.ES2022}),context);return context;
}
const elements=(xml,name)=>Array.from(xml.getElementsByTagName(name));
test('resumed Story ride exports only session miles, never the chapter starting mileage',()=>{
 const c=harness(),xml=new DOMParser().parseFromString(c.buildRideTcx(),'application/xml');
 const distances=elements(xml,'DistanceMeters').map(x=>Number(x.textContent));
 assert.deepEqual(distances,[22487.25,0,5,22486.42]);assert.equal((distances[0]/1609.344).toFixed(2),'13.97');
 assert.deepEqual(elements(xml,'Speed').map(x=>Number(x.textContent)),[0,5,6]);
 assert.deepEqual(elements(xml,'Watts').map(x=>Number(x.textContent)),[162,200,180]);
 assert.equal(elements(xml,'TotalTimeSeconds')[0].textContent,'3749.3');assert.equal(elements(xml,'Notes')[0].textContent,'Story & route');
 assert.equal(c.distance,91378.04); // Chapter position stays intact.
});
test('zero-origin rides and short sampling gaps retain real incremental speed',()=>{
 const c=harness(0);assert.equal(c.sessionDistanceMeters(),22487.25);assert.equal(c.sessionDistanceMeters(-1),0);
 c.rideSamples=[{seconds:0,distance:0,elevation:0,power:200,cadence:80,heartRate:null},{seconds:2,distance:12,elevation:1,power:210,cadence:82,heartRate:null},{seconds:5,distance:30,elevation:2,power:220,cadence:84,heartRate:null}];
 const xml=new DOMParser().parseFromString(c.buildRideTcx(),'application/xml');assert.deepEqual(elements(xml,'Speed').map(x=>Number(x.textContent)),[0,6,6]);
});
test('session climbing excludes elevation already covered on earlier Story rides',()=>{
 const c=harness();assert.ok(Math.abs(c.sessionGainFeet()-22487.25*.01*3.28084)<1e-8);
});
