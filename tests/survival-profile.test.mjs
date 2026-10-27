import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const start=source.indexOf('const SURVIVAL_GRADE_COLORS=');
const end=source.indexOf('\nfunction svg()',start);
if(start<0||end<0)throw Error('Survival grade palette was not found');
const palette=source.slice(start,end);
test('Survival grades use the four approved discrete colors',()=>{
 const c=vm.createContext({document:{body:{dataset:{rideExperience:'survival'}}}});
 vm.runInContext(ts.transpile(palette),c);
 for(const [grade,color] of [[-5,'#394252'],[-1,'#B5A7A9'],[0,'#B5A7A9'],[3,'#D54051'],[8.9,'#D54051'],[9,'#F19F71']]){
  assert.equal(c.gradeColor(grade),color);
 }
});

test('overlay profile contains vertical rider and threat lines with no extra dots',()=>{
 const begin=source.indexOf('function overlayChart(');
 const end=source.indexOf('\nlet overlayZoomFactor=',begin);
 assert.ok(begin>=0&&end>begin);
 const c=vm.createContext({
  overviewPoints:()=>[{distance:0,elevation:0},{distance:100,elevation:10}],
  overviewAt:d=>({distance:d,elevation:d/10}),gradeColor:()=> '#394252',
  gradeHud:()=>({color:'#fff',size:12,label:'1%'}),displayGrade:()=>1,
  at:()=>({grade:1}),climbHud:()=>'',climbNow:()=>null,
  surviveOn:true,survivePrepRemaining:0,surviveEnemyDistance:30,Math
 });
 vm.runInContext(ts.transpile(source.slice(begin,end)),c);
 const graphic=c.overlayChart(0,100,60);
 assert.match(graphic,/<line[^>]*stroke="#ff304b"/);
 assert.match(graphic,/<line[^>]*stroke="#ffc85c"/);
 assert.doesNotMatch(graphic,/<circle|survive-hud-dots/);
});
