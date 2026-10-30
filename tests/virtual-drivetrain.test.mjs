import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import vm from 'node:vm';
const text=await readFile(new URL('../src/virtual-drivetrain.ts',import.meta.url),'utf8');
const transpile=s=>ts.transpile(s,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext});
const {ZWIFT_GEAR_RATIOS,virtualGearTarget,advanceRoadSpeed,roadForce}=await import('data:text/javascript;base64,'+Buffer.from(transpile(text)).toString('base64'));
const road={massKg:227*.45359237,gradePercent:4,crr:.004};
const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const writer=main.slice(main.indexOf('async function setVirtualGearResistance('),main.indexOf('// True constant-wattage ERG'));
function writerHarness(mode='sim'){
 let clock=1000;const sent=[];
 const c={performance:{now:()=>clock},drivetrainMode:'virtual',connected:true,controlGranted:true,running:true,realTelemetry:true,trainerMode:mode,virtualPowerBusy:false,virtualPowerLastTime:-Infinity,cadenceReceivedAt:1000,cadence:90,gear:1,cycleQuestHold:false,cycleQuestHeldSlope:null,lastTarget:-1,distance:0,at:()=>({grade:4}),num:id=>id==='difficulty'?100:.004,weightKg:id=>(id==='weight'?205:22)*.45359237,virtualGearTarget,command:async bytes=>{sent.push(bytes);return true;}};
 vm.createContext(c);vm.runInContext(transpile(writer),c);return {c,sent,clock:n=>clock=n};
}
test('exact Zwift ratios; gear 1 at 4% is roughly 100–115W at 80–90rpm for 205lb rider + 22lb bike',()=>{
 assert.deepEqual(ZWIFT_GEAR_RATIOS,[.75,.87,.99,1.11,1.23,1.38,1.53,1.68,1.86,2.04,2.22,2.40,2.61,2.82,3.03,3.24,3.49,3.74,3.99,4.24,4.54,4.84,5.14,5.49]);
 for(const rpm of [80,90]){const result=virtualGearTarget(1,rpm,road);assert(result.watts>95&&result.watts<115);assert.equal(result.speedMps,rpm/60*.75*2.105);}
});
test('every gear gets harder at fixed cadence; torque eases when cadence falls instead of ERG lock',()=>{
 for(const slope of [0,4,10,16])for(const rpm of [40,60,90,110]){
  const r={...road,gradePercent:slope};let previous=-1;
  for(let gear=1;gear<=24;gear++){const p=virtualGearTarget(gear,rpm,r).watts;assert(p>=previous);previous=p;}
 }
 for(const rpm of [0,10,20,40,60,80])assert(virtualGearTarget(1,rpm,road).watts<virtualGearTarget(1,90,road).watts);
 assert.equal(virtualGearTarget(1,0,road).watts,0);
});
test('grade, mass and cadence affect pedal load; difficulty zero still has rolling/aero load',()=>{
 assert(virtualGearTarget(1,90,{...road,massKg:120}).watts>virtualGearTarget(1,90,road).watts);
 assert(virtualGearTarget(1,90,{...road,gradePercent:10}).watts>virtualGearTarget(1,90,road).watts);
 assert(virtualGearTarget(12,90,{...road,gradePercent:0}).watts>0);
 assert.equal(virtualGearTarget(1,90,{...road,gradePercent:-10}).watts,0);
});
test('SIM and ERG virtual selections both send the physical target; fixed ERG is untouched',async()=>{
 for(const mode of ['sim','erg']){const {c,sent}=writerHarness(mode);await c.setVirtualGearResistance();assert.equal(sent.length,1);assert.equal(sent[0][0],5);assert.equal(sent[0][1]+256*sent[0][2],Math.round(virtualGearTarget(1,90,road).watts));}
 const {c,sent}=writerHarness('target');await c.setVirtualGearResistance();assert.equal(sent.length,0);
});
test('battle freezes grade, but downshifts and cadence reductions still lower resistance',async()=>{
 const {c,sent,clock}=writerHarness();c.cycleQuestHold=true;c.cycleQuestHeldSlope=4;c.gear=12;await c.setVirtualGearResistance();const initial=c.lastTarget;
 c.at=()=>({grade:16});clock(1300);await c.setVirtualGearResistance();assert.equal(c.lastTarget,initial);
 c.gear=1;clock(1600);await c.setVirtualGearResistance();assert(c.lastTarget<initial/2);
 const low=c.lastTarget;c.cadence=30;clock(1900);await c.setVirtualGearResistance();assert(c.lastTarget<low/2);assert(sent.length>=3);
});
test('stopped or stale cadence unloads the trainer and concurrent updates do not queue stale gear targets',async()=>{
 const {c,sent,clock}=writerHarness();await c.setVirtualGearResistance();clock(4100);await c.setVirtualGearResistance();assert.equal(c.lastTarget,0);
 c.cadenceReceivedAt=4100;c.cadence=90;let release;c.command=()=>new Promise(r=>release=r);clock(4400);const pending=c.setVirtualGearResistance();
 c.gear=24;await c.setVirtualGearResistance(true);assert.equal(sent.length,2);release(true);await pending;
 c.command=async bytes=>{sent.push(bytes);return true;};clock(4700);await c.setVirtualGearResistance();assert(c.lastTarget>1000);
});
test('avatar launches at low power on 4% and converges to the gear/cadence equilibrium without free speed',()=>{
 for(const power of [20,40,60,100]){let v=0;for(let i=0;i<1200;i++)v=advanceRoadSpeed(v,power,.05,road);assert(v>0);assert(Math.abs(roadForce(v,road)*v/.975-power)<.1);}
 const expected=virtualGearTarget(1,90,road);let v=0;for(let i=0;i<1200;i++)v=advanceRoadSpeed(v,expected.watts,.05,road);assert(Math.abs(v-expected.speedMps)<.01);
 assert.equal(advanceRoadSpeed(0,0,.05,road),0);assert(advanceRoadSpeed(0,0,.05,{...road,gradePercent:-4})>0);
});
test('live virtual SIM dispatches power control and never sends the old gradient-offset command',async()=>{
 const fn=main.slice(main.indexOf('async function updateSimResistance('),main.indexOf('// Standard FTMS fallback'));
 const calls=[],c={drivetrainMode:'virtual',trainerMode:'sim',setVirtualGearResistance:async immediate=>calls.push(immediate),setGrade:()=>assert.fail('virtual SIM must not write grade')};
 vm.createContext(c);vm.runInContext(transpile(fn),c);await c.updateSimResistance(1000,true);assert.deepEqual(calls,[true]);
});
