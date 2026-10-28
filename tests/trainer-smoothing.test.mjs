import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import vm from 'node:vm';
const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const transpile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const helpers=transpile(await readFile(new URL('../src/trainer-smoothing.ts',import.meta.url),'utf8'));
const {timeWeightedPower,slewGrade}=await import('data:text/javascript;base64,'+Buffer.from(helpers).toString('base64'));

test('power average includes partial boundary intervals and uneven packet timing',()=>{
 const readings=[{time:0,watts:100},{time:1500,watts:300},{time:3200,watts:0}];
 // Window [1000,4000]: 0.5s at 100 + 1.7s at 300 + 0.8s at zero.
 assert.equal(timeWeightedPower(readings,4000),560/3);
 assert.deepEqual(readings.map(x=>x.watts),[100,300,0]);
});
test('startup, real coasting and stale telemetry are not filled with invented power',()=>{
 assert.equal(timeWeightedPower([],1000),null);
 assert.equal(timeWeightedPower([{time:1000,watts:150}],1000),150);
 assert.equal(timeWeightedPower([{time:1000,watts:150},{time:2000,watts:0}],5000),0);
 assert.equal(timeWeightedPower([{time:1000,watts:150}],5001),null);
});
test('resistance ramps have the same rate at high and low update frequencies',()=>{
 for(const dt of [.016, .2, .75]){let value=0;for(let elapsed=0;elapsed<5;elapsed+=dt)value=slewGrade(value,12,dt,.75);assert(value<=.75*(5+dt)+1e-8);}
 assert.equal(slewGrade(4,-4,1,.75),3.25);
 assert.equal(slewGrade(4,8,0,.75),4);
});
test('live SIM controller cannot accelerate its ramp on sub-threshold frames',async()=>{
 const fn=main.slice(main.indexOf('async function updateSimResistance('),main.indexOf('// Experimental fixed-Cog'));
 const context={slewGrade,target:0,now:1000,running:true,trainerMode:'sim',connected:true,controlGranted:true,realTelemetry:true,simBusy:false,simLastTime:0,simAppliedGrade:NaN,trainerGrade:NaN,drivetrainMode:'traditional',gear:12,SIM_COMMAND_INTERVAL_MS:750,SIM_GRADE_SLEW_PERCENT_PER_SECOND:.75,simRequestedGrade(){return this.target;},setGrade:async()=>true};
 context.simRequestedGrade=()=>context.target;
 vm.createContext(context);vm.runInContext(transpile(fn),context);
 await vm.runInContext('updateSimResistance(1000)',context);
 context.target=.1;
 // No GATT write is needed for .1%; then a steep climb starts between packets.
 await vm.runInContext('updateSimResistance(1750)',context);
 context.target=12;
 for(let now=1766;now<2500;now+=16)await vm.runInContext(`updateSimResistance(${now})`,context);
 assert.equal(context.simAppliedGrade,.1);
 await vm.runInContext('updateSimResistance(2500)',context);
 assert(Math.abs(context.simAppliedGrade-.6625)<1e-8);
});
test('battle holds preserve momentum and route mileage; exiting resumes without a zero-speed restart',()=>{
 const fn=main.slice(main.indexOf('function advanceRide('),main.indexOf('function tick('));
 const noop=()=>{};
 const context={last:1000,running:true,points:[{distance:10000}],connected:true,controlGranted:true,realTelemetry:true,activeRideMs:0,energyKcal:0,power:150,GROSS_EFFICIENCY:.24,avgPowerEnergy:0,avgPowerDuration:0,weightKg:()=>40,num:()=>.004,cadence:80,procedural:false,cycleQuestHold:true,speed:8,distance:100,endless:true,trainerMode:'target',lastGearUpdate:0,updateSimResistance:noop,setFixedErgPower:noop,recordRideSample:noop,update:noop,checkStationaryRide:noop,at:()=>({grade:0})};
 vm.createContext(context);vm.runInContext(transpile(fn),context);
 vm.runInContext('advanceRide(2000)',context);assert.equal(context.speed,8);assert.equal(context.distance,100);
 context.cycleQuestHold=false;vm.runInContext('advanceRide(2010)',context);assert(context.speed>7.9);assert(context.distance>100);
});
