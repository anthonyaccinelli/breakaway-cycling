import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const raw=readFileSync(new URL('../src/coach-route.ts',import.meta.url),'utf8');
const js=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {coachRouteMiles}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const bridge=main.split('// Coach preview reuses the existing FTMS writer.')[1]
  ?.split('// Pedalkin preview:')[0];

test('Coach creates route headroom without forcing 39 mph or a 20-mile minimum',()=>{
  assert.equal(coachRouteMiles(5*60),5);
  assert.equal(coachRouteMiles(30*60),12);
  assert.equal(coachRouteMiles(60*60),24);
  assert.equal(coachRouteMiles(90*60),36);
  assert.equal(coachRouteMiles(120*60),48);
  assert.equal(coachRouteMiles(8*3600),150);
  assert.equal(coachRouteMiles(NaN),5);
  assert.equal(coachRouteMiles(-60),5);
});

test('Coach route generation discards stale locked seed and uses Classic seed registry',()=>{
  assert.ok(bridge,'Coach bridge should exist');
  assert.match(main,/import \{coachRouteMiles\} from '\.\/coach-route'/);
  assert.match(bridge,/makeRoute:\(seconds,structured\)=>\{[\s\S]*?seedLock\.checked=false;[\s\S]*?userEnteredRouteSeed=false;[\s\S]*?generatedGainIsAutoFilled=false;[\s\S]*?coachRouteMiles\(seconds\)/);
  assert.match(bridge,/\('generateRoute'\) as HTMLButtonElement\)\.click\(\)/);
  assert.doesNotMatch(bridge,/\('generatedSeed'\) as HTMLInputElement\)\.value=/);
  assert.match(main,/const recipe=validatedClassicRecipe\(\{seed:randomClassicSeed\(\),miles:mileage/);
});
