import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const gainStart=main.indexOf('function estimatedGain(');
const gainEnd=main.indexOf('const selectRouteSeed=',gainStart);
const terrainStart=main.indexOf('function random01(');
const terrainEnd=main.indexOf('function prepareProcedural(',terrainStart);
assert.ok(gainStart>=0&&gainEnd>gainStart&&terrainStart>=0&&terrainEnd>terrainStart);

const harness=`
type Point={distance:number;elevation:number;grade:number};
type Terrain='flat'|'rolling'|'mountain'|'punchy';
type Hill={start:number;end:number;sign:number;peak:number;skew:number;rough:number};
const FEET_PER_METER=3.280839895;
const STEP=80,CHUNK=1609.344*5;
let points:Point[]=[],hills:Hill[]=[];
let procedural=true,endless=false,distance=0,generatedThrough=0,routeLimit=0;
let proceduralSeed=0,proceduralTerrain:Terrain='rolling',proceduralIntensity=1,gainScale=1;
${main.slice(gainStart,gainEnd)}
${main.slice(terrainStart,terrainEnd)}
function buildRoute(seed:number,miles:number,terrain:Terrain,intensity:number,targetGain:number|null){
 proceduralSeed=seed;proceduralTerrain=terrain;proceduralIntensity=intensity;
 routeLimit=miles*1609.344;points=[];generatedThrough=0;resetHills();gainScale=1;
 if(targetGain!==null)gainScale=targetGain===0?0:solveGain(targetGain);
 appendTerrain(routeLimit);
 return points.map(p=>[p.distance,p.elevation,p.grade]);
}
`;
const js=ts.transpileModule(harness,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const buildRoute=new Function(js+'\nreturn buildRoute;')();

test('actual Classic terrain generator reproduces the exact 100-mile / 2500-ft profile for one seed',()=>{
 const original=buildRoute(4821,100,'rolling',1,2500);
 const recreated=buildRoute(4821,100,'rolling',1,2500);
 assert.ok(original.length>2000);
 assert.deepEqual(recreated,original);
 assert.notDeepEqual(buildRoute(4822,100,'rolling',1,2500),original);
});

test('natural-gain terrain remains exactly deterministic across re-generations',()=>{
 const original=buildRoute(75012,37.5,'mountain',1.35,null);
 const recreated=buildRoute(75012,37.5,'mountain',1.35,null);
 assert.deepEqual(recreated,original);
});
