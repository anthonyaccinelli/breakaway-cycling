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
test('Survival grades use the current five-color palette at every boundary',()=>{
 const c=vm.createContext({document:{body:{dataset:{rideExperience:'survival'}}}});
 vm.runInContext(ts.transpile(palette),c);
 for(const [grade,color] of [[NaN,'#39354f'],[-5,'#39354f'],[0,'#39354f'],[.25,'#39354f'],[.251,'#515076'],[2.999,'#515076'],[3,'#aea9cc'],[5.999,'#aea9cc'],[6,'#92323c'],[11.999,'#92323c'],[12,'#c74343'],[20,'#c74343']]){
  assert.equal(c.gradeColor(grade),color);
 }
});

test('overlay profile contains vertical rider and threat lines with no extra dots',()=>{
 const begin=source.indexOf('function overlayChart(');
 const end=source.indexOf('\nlet overlayZoomFactor=',begin);
 assert.ok(begin>=0&&end>begin);
 const c=vm.createContext({
  document:{body:{dataset:{rideExperience:'survival'}}},
  overviewPoints:()=>[{distance:0,elevation:0},{distance:100,elevation:10}],
  overviewAt:d=>({distance:d,elevation:d/10}),gradeColor:()=> '#aea9cc',
  gradeHud:()=>({color:'#fff',size:12,label:'1%'}),displayGrade:()=>1,
  at:()=>({grade:1}),climbHud:()=>'',climbNow:()=>null,
  surviveOn:true,survivePrepRemaining:0,surviveEnemyDistance:30,Math
 });
 vm.runInContext(ts.transpile(source.slice(begin,end)),c);
 const graphic=c.overlayChart(0,100,60);
 const lines=[...graphic.matchAll(/<line x1="([^"]+)" x2="([^"]+)" y1="0" y2="190" stroke="(#[a-f0-9]+)"/g)];
 assert.equal(lines.length,2);
 for(const line of lines)assert.equal(line[1],line[2],'marker spans the profile vertically');
 assert.deepEqual(lines.map(line=>line[3]),['#ff304b','#ffc85c']);
 assert.equal(Number(lines[0][1]),274.8);
 assert.equal(Number(lines[1][1]),537.6);
 assert.doesNotMatch(graphic,/<circle|survive-hud-dots/);
 c.survivePrepRemaining=10;
 const warming=c.overlayChart(0,100,60);
 assert.doesNotMatch(warming,/<line[^>]*stroke="#ff304b"/);
 assert.match(warming,/<line[^>]*stroke="#ffc85c"/);
 c.survivePrepRemaining=0;c.surviveOn=false;
 assert.doesNotMatch(c.overlayChart(0,100,60),/<line[^>]*stroke="#ff304b"/);
});
