import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const pureSource=await readFile(new URL('../src/classic-route-recipe.ts',import.meta.url),'utf8');
const pureJs=ts.transpileModule(pureSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {validatedClassicRecipe,randomClassicSeed,isClassicSeed,deriveUnregisteredClassicRoute,CLASSIC_BUILTIN_ROUTES}=await import('data:text/javascript;base64,'+Buffer.from(pureJs).toString('base64'));
const mainSource=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const start=mainSource.indexOf('let classicRouteBusy=false;');
const end=mainSource.indexOf('// Dashboard metrics:',start);
assert.ok(start!==-1&&end>start,'Classic cloud generation handler exists');
const snippet=ts.transpileModule(mainSource.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;

function harness({manual=true,seed='937093007',lookup=null,register=async()=> 'saved',newSeed=()=>900123456}={}){
 const fields={
  generateRoute:{disabled:false},
  generatedSeed:{value:seed},
  generatedGain:{value:'123'},
  generatedMiles:{value:'3'},
  generatedTerrain:{value:'flat'},
  generatedDifficulty:{value:'0.55'}
 };
 const messages=[],generated=[],saved=[];
 const ctx={
  fields,seedLock:{checked:manual},
  findClassicRoute:async()=>lookup,
  registerClassicRoute:register,
  randomClassicSeed:newSeed,
  isClassicSeed,validatedClassicRecipe,deriveUnregisteredClassicRoute,
  readRouteGainTarget:(value,isAuto)=>isAuto?'':String(value).trim(),
  status:(msg)=>messages.push(msg),
  saveQuickRide:()=>saved.push(true),
  prepareProcedural:()=>{
   generated.push(Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,field.value])));
   return true;
  }
 };
 const factory=new Function('ctx',`
  const {$,seedLock,findClassicRoute,registerClassicRoute,randomClassicSeed,isClassicSeed,
   validatedClassicRecipe,deriveUnregisteredClassicRoute,readRouteGainTarget,status,saveQuickRide,prepareProcedural}={
    ...ctx,$:(key)=>ctx.fields[key]
   };
  let generatedGainIsAutoFilled=false;
  let userEnteredRouteSeed=${manual};
  ${snippet}
  return generateClassicRoute;
 `);
 return {generate:factory(ctx),fields,messages,generated,saved,ctx};
}

test('a seed by itself restores full saved route definition, overriding wrong form values',async()=>{
 const recipe={seed:937093007,miles:16.7,gain_target_ft:null,terrain:'rolling',difficulty:0.55,generator_version:1};
 const h=harness({lookup:recipe});
 assert.equal(await h.generate(),true);
 assert.equal(h.fields.generatedSeed.value,'937093007');
 assert.equal(h.fields.generatedMiles.value,'16.7');
 assert.equal(h.fields.generatedGain.value,'');
 assert.equal(h.fields.generatedTerrain.value,'rolling');
 assert.equal(h.fields.generatedDifficulty.value,'0.55');
 assert.equal(h.generated.length,1);
 assert.match(h.messages.at(-1),/Restored saved route 937093007/);
 assert.equal(h.saved.length,1);
});

test('seed alone restores explicitly requested elevation target without matching inputs',async()=>{
 const recipe={seed:900222333,miles:100,gain_target_ft:2500,terrain:'mountain',difficulty:1.35,generator_version:1};
 const h=harness({manual:true,seed:'900222333',lookup:recipe});
 assert.equal(await h.generate(),true);
 assert.equal(h.fields.generatedMiles.value,'100');
 assert.equal(h.fields.generatedGain.value,'2500');
 assert.equal(h.fields.generatedTerrain.value,'mountain');
 assert.equal(h.fields.generatedDifficulty.value,'1.35');
});

test('an unregistered numeric seed generates its own consistent canonical route without form settings',async()=>{
 const h=harness({manual:true,seed:'909909909',lookup:null});
 const expected=deriveUnregisteredClassicRoute(909909909);
 assert.equal(await h.generate(),true);
 assert.equal(h.generated.length,1);
 assert.equal(Number(h.fields.generatedMiles.value),expected.miles);
 assert.equal(h.fields.generatedTerrain.value,expected.terrain);
 assert.equal(Number(h.fields.generatedDifficulty.value),expected.difficulty);
 assert.equal(h.fields.generatedGain.value,'');
 assert.match(h.messages.at(-1),/Older custom route settings cannot be recovered/);
});
test('unregistered seeds are stable across sessions and independent from input values',()=>{
 const a=deriveUnregisteredClassicRoute(4821);
 const b=deriveUnregisteredClassicRoute(4821);
 assert.deepEqual(a,b);
 assert.ok(a.miles>0);
 assert.deepEqual(validatedClassicRecipe(a),a);
 assert.equal(CLASSIC_BUILTIN_ROUTES[937093007].miles,16.7);
 const c=deriveUnregisteredClassicRoute(4822);
 assert.notDeepEqual(c,a);
});

test('Generate with no entered seed creates a new immutable, shareable recipe',async()=>{
 const recipes=[];
 const h=harness({manual:false,seed:'',newSeed:()=>900100101,register:async(recipe)=>{recipes.push(recipe);return 'saved';}});
 h.fields.generatedMiles.value='100';
 h.fields.generatedGain.value='2500';
 h.fields.generatedTerrain.value='rolling';
 h.fields.generatedDifficulty.value='1';
 assert.equal(await h.generate(),true);
 assert.deepEqual(recipes,[{seed:900100101,miles:100,gain_target_ft:2500,terrain:'rolling',difficulty:1,generator_version:1}]);
 assert.equal(h.fields.generatedSeed.value,'900100101');
 assert.equal(h.ctx.seedLock.checked,false);
 assert.equal(h.generated.length,1);
});

test('invalid seeds, unsupported recipe values and seed collisions are handled',async()=>{
 assert.equal(isClassicSeed('937093007'),true);
 assert.equal(isClassicSeed('not-a-seed'),false);
 assert.equal(validatedClassicRecipe({seed:1,miles:-1,gain_target_ft:0,terrain:'flat',difficulty:1,generator_version:1}),null);
 assert.equal(randomClassicSeed(()=>0),100000000);
 assert.equal(randomClassicSeed(()=>0.999999999),1000000000);
 let index=0;
 const values=[900000111,900000222];
 const h=harness({manual:false,seed:'',newSeed:()=>values[index++],register:async(recipe)=>recipe.seed===values[0]?'collision':'saved'});
 assert.equal(await h.generate(),true);
 assert.equal(h.fields.generatedSeed.value,'900000222');
});

test('seed-loading feedback is visible and always cleared after a request',async()=>{
 const source=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
 assert.match(source,/button\.textContent='Loading route seed…'/);
 assert.match(source,/button\.textContent=originalButtonLabel;/);
 const reference=await readFile(new URL('../src/classic-route-reference.ts',import.meta.url),'utf8');
 assert.match(reference,/unregistered seed\/i\.test\(message\)/,'missing-legacy-settings notice is visibly surfaced');
});
