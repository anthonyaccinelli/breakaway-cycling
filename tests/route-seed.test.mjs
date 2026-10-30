import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/route-seed.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {createRouteSeedSelector,readRouteGainTarget}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
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

test('locking an auto-generated seed recreates it on every subsequent generation',()=>{
 const select=createRouteSeedSelector(()=>.42);
 const original=select('');
 assert.equal(select(String(original),true),original);
 assert.equal(select(String(original),true),original);
 const newAuto=select(String(original));
 assert.notEqual(newAuto,original);
 assert.equal(select(String(original),true),original);
});
test('manually entered seeds remain stable across repeated locked generations',()=>{
 const select=createRouteSeedSelector(()=>.42);
 assert.equal(select('4821',true),4821);
 assert.equal(select('4821',true),4821);
 assert.equal(select('7002',true),7002);
 assert.equal(select('4821',true),4821);
});
test('computed elevation gain remains display-only, not an implicit constraint',()=>{
 assert.equal(readRouteGainTarget('2476',true),'');
 assert.equal(readRouteGainTarget('',false),'');
 assert.equal(readRouteGainTarget(' 2500.25 ',false),'2500.25');
 assert.equal(readRouteGainTarget('3000',false),'3000');
});
test('Classic form offers seed locking and does not silently round route distance',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
 assert.match(html,/id="lockGeneratedSeed"/);
 assert.match(main,/seedLock\.checked=\(\$\('generatedSeed'\)/);
 assert.match(main,/seedLock\.checked=false;/);
 assert.match(main,/readRouteGainTarget\(gainField\.value,generatedGainIsAutoFilled\)/);
 assert.doesNotMatch(main,/\$\('generatedMiles'\).*\.toFixed\(1\)/);
});

test('Classic lock stays beside the seed input without becoming a sixth route setting',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/route-seed.css',import.meta.url),'utf8');
 const fields=html.match(/<div class="route-fields">([\s\S]*?)<\/div><div class="route-actions">/)?.[1];
 assert.ok(fields,'route settings panel found');
 assert.equal((fields.match(/<label>/g)||[]).length,4,'only four top-level traditional settings');
 assert.equal((fields.match(/class="route-seed-field"/g)||[]).length,1,'seed and lock occupy fifth setting');
 assert.match(fields,/<div class="route-seed-inline"><input id="generatedSeed"[^>]*\/><label class="route-seed-lock"/);
 assert.match(css,/grid-template-columns:\s*minmax\(0, 1fr\) max-content\s*!important/);
});
