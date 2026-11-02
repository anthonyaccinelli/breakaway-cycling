import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../src/spokemon-temperament.ts',import.meta.url),'utf8');
const javascript=ts.transpileModule(source,{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}
}).outputText;
const {evaluateTemperament,initialTemperamentAttempt}=await import(
 'data:text/javascript;base64,'+Buffer.from(javascript).toString('base64')
);
const step=(m,w,moving=true,dt=1,state=initialTemperamentAttempt(),ftp=250)=>
 evaluateTemperament(m,ftp,w,moving,dt,state);

test('temperament targets are personalized to the rider FTP and remain aerobic',()=>{
 for(const mood of ['shy','gentle','curious','stubborn','playful']){
  const low=step(mood,0,false,1,initialTemperamentAttempt(),250);
  const high=step(mood,0,false,1,initialTemperamentAttempt(),300);
  assert(high.targetMin>low.targetMin,mood);
  assert(high.targetMax>low.targetMax,mood);
  assert(high.targetMax<=300*.8,mood);
 }
});
test('distinct personalities require their correct riding efforts',()=>{
 for(const [mood,watts] of [['shy',160],['gentle',145],['stubborn',180],['curious',147],['playful',150]]){
  const matching=step(mood,watts);
  assert(matching.matched,mood);
  assert(matching.trustGain>0,mood);
  const wrong=step(mood,240);
  assert.equal(wrong.trustGain,0,mood+' must not reward unrelated high-power riding');
 }
});
test('curious and playful demand alternations, not one constant wattage',()=>{
 for(const [mood,required] of [['curious',5],['playful',4]]){
  let attempt=initialTemperamentAttempt();
  for(let i=0;i<required;i++)attempt=step(mood,150,true,1,attempt).next;
  assert.equal(attempt.phase,'brisk',mood);
  for(let i=0;i<5;i++){
   const result=step(mood,150,true,1,attempt);
   assert.equal(result.trustGain,0,mood+' should stop giving progress until effort changes');
   attempt=result.next;
  }
  for(let i=0;i<required;i++)attempt=step(mood,180,true,1,attempt).next;
  assert.equal(attempt.phase,'easy',mood);
 }
});
test('brief cadence or power interruptions never erase Trust or a nearly finished hold',()=>{
 let attempt=initialTemperamentAttempt();
 for(let i=0;i<3;i++)attempt=step('stubborn',180,true,1,attempt).next;
 const during=step('stubborn',240,true,1,attempt);
 assert.equal(during.trustGain,0);
 assert.equal(during.next.heldSeconds,3);
 const after=step('stubborn',180,true,1,during.next);
 assert(after.trustGain>0);
 assert(after.next.heldSeconds>=4);
 const pause=step('stubborn',0,false,.5,after.next);
 assert.equal(pause.trustGain,0);
 assert(pause.next.heldSeconds>=4);
});
test('stubborn sustained upper-Z2 effort is more rewarding than an isolated burst',()=>{
 let attempt=initialTemperamentAttempt(),first=0,later=0;
 for(let i=0;i<6;i++){
  const result=step('stubborn',180,true,1,attempt);
  attempt=result.next;
  if(i===0)first=result.trustGain;
  if(i===5)later=result.trustGain;
 }
 assert(later>first);
});
test('following the instructions can reach 100% Trust before 65 seconds for every personality',()=>{
 for(const mood of ['shy','gentle','stubborn','curious','playful']){
  let total=0,attempt=initialTemperamentAttempt();
  for(let second=0;second<65&&total<100;second++){
   const watts=mood==='gentle'?145:mood==='shy'?160:mood==='stubborn'?180:
    attempt.phase==='easy'?150:180;
   const outcome=step(mood,watts,true,1,attempt);
   total+=outcome.trustGain;
   attempt=outcome.next;
  }
  assert(total>=100,mood+' must be achievable while riding');
 }
});
test('Trust is never earned without pedaling',()=>{
 for(const mood of ['shy','gentle','stubborn','curious','playful']){
  assert.equal(step(mood,175,false).trustGain,0);
 }
});
