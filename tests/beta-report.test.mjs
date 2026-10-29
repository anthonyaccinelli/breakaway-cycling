import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/beta-report.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {validateBugReport,sendBugReport}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const valid={trainer:' Elite Direto XR-T ',browser:'Chrome · Windows',mode:'Cycle Quest',description:'Overlay does not open.',build:'test-build'};
test('reports validate four fields, trim values and exclude unrelated data',()=>{
 const r=validateBugReport({...valid,privateSave:'not included'});assert.equal(r.trainer,'Elite Direto XR-T');assert.deepEqual(Object.keys(r),['trainer','browser','mode','description','build']);
 for(const key of ['trainer','browser','mode','description','build'])assert.throws(()=>validateBugReport({...valid,[key]:''}));
 for(const [key,max] of [['trainer',120],['browser',200],['description',5000],['build',100]])assert.throws(()=>validateBugReport({...valid,[key]:'x'.repeat(max+1)}));
 assert.throws(()=>validateBugReport({...valid,mode:'unknown'}));
});
test('submission uses write-only minimal response and does not require a user session',async()=>{
 let seen;await sendBugReport(valid,'https://example.supabase.co','public-test-key',async(...args)=>{seen=args;return new Response(null,{status:201});});
 assert.equal(String(seen[0]),'https://example.supabase.co/rest/v1/beta_bug_reports');assert.equal(seen[1].method,'POST');assert.equal(seen[1].headers.Prefer,'return=minimal');assert.equal(seen[1].headers.apikey,'public-test-key');assert.equal(JSON.parse(seen[1].body).mode,'Cycle Quest');
});
test('missing configuration, rejected writes and network failures do not report success',async()=>{
 await assert.rejects(sendBugReport(valid,undefined,undefined),/temporarily unavailable/);
 await assert.rejects(sendBugReport(valid,'https://example.supabase.co','public',async()=>new Response(null,{status:403})),/Could not send/);
 await assert.rejects(sendBugReport(valid,'https://example.supabase.co','public',async()=>{throw Error('offline');}),/offline/);
});
