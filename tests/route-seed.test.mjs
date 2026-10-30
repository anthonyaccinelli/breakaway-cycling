import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/route-seed.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {createRouteSeedSelector}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('repeated generation replaces the auto-filled seed even if random repeats',()=>{
 const select=createRouteSeedSelector(()=>.25);
 let seed=select('');const first=seed;
 seed=select(String(seed));assert.notEqual(seed,first);
 const second=seed;seed=select(String(seed));assert.notEqual(seed,second);
});
test('manually entered seeds reproduce the route and presets use their supplied seed',()=>{
 const select=createRouteSeedSelector(()=>.5);
 assert.equal(select('4502'),4502);
 assert.equal(select('4502',true),4502);
 assert.equal(select('6003'),6003);
 assert.notEqual(select('6003'),6003);
 assert.equal(select('0',true),0);
});
