import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';

const ts=await readFile(new URL('../src/spokemon-temperaments.ts',import.meta.url),'utf8');
const js=(await transform(ts,{loader:'ts',format:'esm',target:'es2020'})).code;
const t=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('Seven temperaments are reachable, including extremely rare Chaotic',()=>{
 const sample=[0,.21,.48,.66,.80,.94,.999];
 const found=new Set(sample.map(x=>t.chooseTemperament(()=>x)));
 assert.deepEqual(new Set(['shy','calm','energetic','playful','stubborn','unpredictable','chaotic']),found);
 let chaotic=0;
 for(let i=0;i<10000;i++)if(t.chooseTemperament(()=>i/10000)==='chaotic')chaotic++;
 assert(chaotic>=150&&chaotic<=220,'chaotic should appear around 1.8% per encounter');
});

test('Calm and Shy favor gentle Zone 2 power, Energetic favors upper aerobic effort',()=>{
 const ftp=300;
 assert(t.trustRate('calm',180,ftp,0)>t.trustRate('calm',290,ftp,0));
 assert(t.trustRate('shy',170,ftp,0)>t.trustRate('shy',290,ftp,0));
 assert(t.trustRate('energetic',240,ftp,0)>t.trustRate('energetic',150,ftp,0));
});

test('Stubborn takes longer and playful preferred efforts alternate',()=>{
 assert(t.trustRate('stubborn',180,300,0)<t.trustRate('calm',180,300,0));
 assert.notEqual(t.preferredEffort('playful',1),t.preferredEffort('playful',21));
 assert.notEqual(t.preferredEffort('unpredictable',1),t.preferredEffort('unpredictable',16));
});

test('Chaotic cannot gain Trust through ordinary wattage; its sustained 10-second effort governs capture',()=>{
 assert.equal(t.trustRate('chaotic',300,300,3),0);
 assert.equal(t.trustRate('chaotic',600,300,15),0);
 assert.equal('chanceAtFullTrust' in t,false,'No random failure after reaching 100% Trust');
});
