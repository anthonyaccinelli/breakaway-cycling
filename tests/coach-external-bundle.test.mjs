import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path=new URL('../src/vendor/breakaway-coach/',import.meta.url);
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('manifest.json',path),'utf8'));
const bundle=readFileSync(new URL('breakaway-coach.js',path));
const style=readFileSync(new URL('breakaway-coach.css',path));
test('Classic runtime consumes the pinned Coach library and extracted stylesheet',()=>{
 assert.match(main,/import \{mountCoach\} from '\.\/vendor\/breakaway-coach\/breakaway-coach\.js'/);
 assert.match(main,/import '\.\/vendor\/breakaway-coach\/breakaway-coach\.css'/);
 assert.match(main,/coachRuntime=mountCoach\(\{/);
 assert.match(main,/getPlatformRides:async\(\)=> \(await savedRides\(\)\)\.map/);
 assert.match(main,/if\(typeof coachRuntime!=='undefined'\)coachRuntime\?\.tick\(dt,power,cadence,realTelemetry\)/);
 assert.match(main,/const coachReview=typeof coachRuntime==='undefined'\?null:coachRuntime\?\.finish\(\)/);
});
test('Coach bundle is version-pinned and integrity checked',()=>{
 assert.equal(manifest.sourceRepository,'anthonyaccinelli/breakaway-coach');
 assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);
 assert.match(manifest.bundleCommit,/^[a-f0-9]{40}$/);
 for(const [kind,bytes] of [['js',bundle],['css',style]]){
  assert.equal('sha256-'+createHash('sha256').update(bytes).digest('base64'),manifest.integrity[kind]);
 }
 assert.match(bundle.toString('utf8'),/export\s*\{/);
 assert.match(style.toString('utf8'),/#breakawayCoachScreen/);
});
test('The bundled library exports a callable mountCoach function',async()=>{
 const lib=await import(new URL('breakaway-coach.js',path));
 assert.equal(typeof lib.mountCoach,'function');
});
