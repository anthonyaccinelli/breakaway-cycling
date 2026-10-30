import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../src/account-storage.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(initial={},rows=[]){
 class Storage{values=new Map(Object.entries(initial));get length(){return this.values.size;}key(i){return [...this.values.keys()][i]??null;}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,String(v));}removeItem(k){this.values.delete(k);}}
 const localStorage=new Storage(),writes=[],deletes=[],timers=new Map();let id=0,loadError=null;
 const window={setTimeout(fn){timers.set(++id,fn);return id;},setInterval(){},addEventListener(){}};
 const context={exports:{},Storage,localStorage,window,document:{hidden:false},Blob,console,Date,clearTimeout:i=>timers.delete(i)};
 vm.runInNewContext(source,context);
 const client={from(name){assert.equal(name,'account_settings');return {
 select(){return {eq(){return {limit:async()=>({data:rows,error:loadError})};}};},
 async upsert(batch){writes.push(...batch);return {error:null};},
 delete(){return {eq(k,user){return {async in(k,keys){deletes.push({user,keys});return {error:null};}};}};}
 };}};
 return {api:context.exports,client,localStorage,writes,deletes,setLoadError(e){loadError=e;}};
}
test('first login adopts guest settings while cloud keys win; tokens and Bluetooth IDs stay local',async()=>{
 const f=fixture({'breakaway-ftp':'280','cycle-quest-character-v1':'guest','sb-token':'private','breakaway-remembered-ble-v1':'device'},[{setting_key:'cycle-quest-character-v1',setting_value:'cloud'}]);
 assert.equal((await f.api.prepareAccountSettings(f.client,'alice')).adoptLegacy,true);
 assert.equal(f.localStorage.getItem('cycle-quest-character-v1'),'cloud');assert.equal(f.localStorage.getItem('breakaway-ftp'),'280');
 assert.equal(f.writes.length,1);assert.equal(f.writes[0].user_id,'alice');assert.equal(f.writes[0].setting_key,'breakaway-ftp');
 assert.equal(f.localStorage.getItem('sb-token'),'private');
});
test('switching accounts never adopts the previous rider settings',async()=>{
 const f=fixture({'breakaway.account.owner.v1':'alice','cycle-quest-character-v1':'alice-save','breakaway-ftp':'280'},[{setting_key:'breakaway-ftp',setting_value:'220'}]);
 assert.equal((await f.api.prepareAccountSettings(f.client,'bob')).adoptLegacy,false);
 assert.equal(f.localStorage.getItem('cycle-quest-character-v1'),null);assert.equal(f.localStorage.getItem('breakaway-ftp'),'220');assert.equal(f.writes.length,0);
});
test('failed cloud load preserves the browser save and prevents app activation',async()=>{
 const f=fixture({'cycle-quest-character-v1':'irreplaceable'});f.setLoadError({message:'offline'});
 await assert.rejects(f.api.prepareAccountSettings(f.client,'alice'),/Could not load your cloud settings/);
 assert.equal(f.localStorage.getItem('cycle-quest-character-v1'),'irreplaceable');assert.equal(f.localStorage.getItem('breakaway.account.owner.v1'),null);
});
test('changes and removals sync only for the active account; sign out clears rider data',async()=>{
 const f=fixture({},[{setting_key:'breakaway-ftp',setting_value:'280'},{setting_key:'cycle-quest-character-v1',setting_value:'save'}]);
 await f.api.prepareAccountSettings(f.client,'alice');f.localStorage.setItem('breakaway-ftp','300');f.localStorage.removeItem('cycle-quest-character-v1');await f.api.syncAccountSettings();
 assert.equal(f.writes.length,1);assert.equal(f.writes[0].user_id,'alice');assert.equal(f.writes[0].setting_value,'300');assert.equal(f.deletes[0].user,'alice');assert.deepEqual([...f.deletes[0].keys],['cycle-quest-character-v1']);
 f.api.eraseLocalAccountSettings();assert.equal(f.localStorage.getItem('breakaway-ftp'),null);assert.equal(f.localStorage.getItem('breakaway.account.owner.v1'),'alice');assert.equal(f.api.getAccountUserId(),'');
});
