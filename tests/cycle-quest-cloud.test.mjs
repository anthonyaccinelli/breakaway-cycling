import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCloud,validCode,hashCode} from '../api/_quest-cloud.js';
import {loadQuestModule} from './quest-loader.mjs';
const {generateSaveCode,normalizeSaveCode}=await loadQuestModule('cloud-save.js');

// A tiny stand-in for Supabase's REST API with one table.
function fakeSupabase(){
 const rows=new Map();
 const fetchImpl=async(url,{method='GET',body}={})=>{
  const u=new URL(url),hash=(u.searchParams.get('code_hash')||'').replace('eq.',''),rev=u.searchParams.get('revision');
  const json=(status,data)=>({ok:status<300,status,json:async()=>data});
  if(method==='GET')return json(200,rows.has(hash)?[rows.get(hash)]:[]);
  const data=JSON.parse(body);
  if(method==='POST'){if(rows.has(data.code_hash))return json(409,{message:'duplicate'});rows.set(data.code_hash,data);return json(201,[data]);}
  if(method==='PATCH'){const row=rows.get(hash);if(!row||String(row.revision)!==rev.replace('eq.',''))return json(200,[]);Object.assign(row,data);return json(200,[row]);}
 };
 return {rows,fetchImpl,config:{url:'https://example.supabase.co',key:'service'}};
}
const save=xp=>JSON.stringify({version:1,xp});

test('save codes are 12 unambiguous characters and normalize from casual typing',()=>{
 const code=generateSaveCode();assert(validCode(code),code);assert(!/[IO01]/.test(code.replace(/-/g,'')));
 assert.equal(normalizeSaveCode(' abcd efgh-jkLM '),'ABCD-EFGH-JKLM');assert.equal(normalizeSaveCode('short'),null);
 assert(!validCode('ABCD-EFGH-JKL1'));
 assert.notEqual(hashCode('ABCD-EFGH-JKLM'),'ABCD-EFGH-JKLM');
});
test('first save, sync, conflict from another device, and a forced overwrite',async()=>{
 const db=fakeSupabase(),opts={config:db.config,fetchImpl:db.fetchImpl},code='ABCD-EFGH-JKLM';
 let [status,body]=await handleCloud('save',{code,save:save(1),history:'[]',baseRevision:0},opts);assert.equal(status,200);assert.equal(body.revision,1);
 [status,body]=await handleCloud('save',{code,save:save(2),history:'[]',baseRevision:1},opts);assert.equal(body.revision,2);
 // A second device that last synced at revision 1 must not silently overwrite revision 2.
 [status,body]=await handleCloud('save',{code,save:save(99),history:'[]',baseRevision:1},opts);assert.equal(status,409);assert.equal(body.revision,2);
 [status,body]=await handleCloud('load',{code},opts);assert.equal(status,200);assert.equal(JSON.parse(body.save).xp,2);
 [status,body]=await handleCloud('save',{code,save:save(99),history:'[]',baseRevision:1,force:true},opts);assert.equal(status,200);assert.equal(body.revision,3);
 [status,body]=await handleCloud('load',{code},opts);assert.equal(JSON.parse(body.save).xp,99);
 assert(!db.rows.has(code),'the raw code is never stored');assert(db.rows.has(hashCode(code)));
});
test('a new device cannot claim an existing code without loading it first',async()=>{
 const db=fakeSupabase(),opts={config:db.config,fetchImpl:db.fetchImpl},code='WXYZ-2345-6789';
 await handleCloud('save',{code,save:save(5),baseRevision:0},opts);
 const [status]=await handleCloud('save',{code,save:save(1),baseRevision:0},opts);assert.equal(status,409);
});
test('bad codes, non-characters, oversized saves and missing setup are refused',async()=>{
 const db=fakeSupabase(),opts={config:db.config,fetchImpl:db.fetchImpl};
 assert.equal((await handleCloud('save',{code:'nope',save:save(1)},opts))[0],400);
 assert.equal((await handleCloud('save',{code:'ABCD-EFGH-JKLM',save:'{"hello":1}'},opts))[0],400);
 assert.equal((await handleCloud('save',{code:'ABCD-EFGH-JKLM',save:'x'.repeat(300000)},opts))[0],400);
 assert.equal((await handleCloud('load',{code:'ABCD-EFGH-JKLM'},opts))[0],404);
 assert.equal((await handleCloud('load',{code:'ABCD-EFGH-JKLM'},{config:null}))[0],503);
 const failing={config:db.config,fetchImpl:async()=>{throw Error('down');}};
 assert.equal((await handleCloud('load',{code:'ABCD-EFGH-JKLM'},failing))[0],502);
});
test('cloud requests need an unlocked beta session',async()=>{
 process.env.CYCLE_QUEST_PASSWORD='pw';process.env.CYCLE_QUEST_SESSION_SECRET='secret';
 const {default:handler}=await import('../api/cycle-quest.js');
 const res={code:0,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},end(){return this;},send(b){this.body=b;return this;}};
 await handler({method:'POST',url:'/api/cycle-quest?cloud=load',headers:{host:'x.test'},body:{code:'ABCD-EFGH-JKLM'}},res);
 assert.equal(res.code,401);
});
