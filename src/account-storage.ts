import type {SupabaseClient} from '@supabase/supabase-js';

/** Account-scoped, incremental cloud mirror for Breakaway's existing browser preferences. */
const OWNER_KEY='breakaway.account.owner.v1';
const MAX_SETTING_BYTES=1024*1024;
const IGNORE=new Set([
 'breakaway-remembered-ble-v1', // Browser-specific BLE IDs aren't portable.
 'cycle-quest-share-cards-v1' // Generated PNG data URLs are not preferences.
]);
let accountId='';
let accountClient:SupabaseClient|null=null;
let synced=new Map<string,string>();
let pendingTimer:number|undefined;
let retryTimer:number|undefined;
let writing:Promise<void>|null=null;
let isReady=false;
let statusCallback:((message:string,error?:boolean)=>void)|null=null;

export function getAccountUserId():string{return accountId;}
export function setSyncStatusListener(callback:(message:string,error?:boolean)=>void):void{
 statusCallback=callback;
 if(isReady)callback('Saved to your account');
}
function status(message:string,error=false):void{statusCallback?.(message,error);}
function trackedKey(key:string):boolean{
 if(key===OWNER_KEY||IGNORE.has(key))return false;
 if(key.startsWith('breakaway-ride-recovery'))return false; // Large, device-bound crash checkpoint.
 if(key.startsWith('sb-'))return false; // Never copy authentication tokens into settings.
 return key.startsWith('breakaway')||key.startsWith('cycle-quest-');
}
function snapshot():Map<string,string>{
 const result=new Map<string,string>();
 try{
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(!key||!trackedKey(key)||key.length>160)continue;
   const value=localStorage.getItem(key);
   if(value!==null&&new Blob([value]).size<=MAX_SETTING_BYTES)result.set(key,value);
  }
 }catch(error){console.warn('[Account] Could not read browser preferences',error);}
 return result;
}
function clearTracked():void{
 const keys=[...snapshot().keys()];
 for(const key of keys)try{localStorage.removeItem(key);}catch{}
}
function dataRows(values:Map<string,string>){
 return [...values].map(([setting_key,setting_value])=>({user_id:accountId,setting_key,setting_value,updated_at:new Date().toISOString()}));
}
async function upload(values:Map<string,string>):Promise<void>{
 if(!accountClient||!values.size)return;
 const rows=dataRows(values);
 for(let i=0;i<rows.length;i+=40){
  const {error}=await accountClient.from('account_settings').upsert(rows.slice(i,i+40),{onConflict:'user_id,setting_key'});
  if(error)throw error;
 }
}
/** Local legacy state is adopted only if it has no other account owner. */
export async function prepareAccountSettings(client:SupabaseClient,userId:string):Promise<{adoptLegacy:boolean}>{
 accountClient=client;accountId=userId;isReady=false;
 const {data,error}=await client.from('account_settings').select('setting_key,setting_value').eq('user_id',userId).limit(400);
 if(error)throw Error('Could not load your cloud settings: '+error.message);
 const owner=localStorage.getItem(OWNER_KEY);
 const adoptLegacy=!owner;
 const sameAccount=owner===userId;
 const original=(!owner||sameAccount)?snapshot():new Map<string,string>();
 const cloud=new Map<string,string>();
 for(const row of data||[]){
  if(row&&typeof row.setting_key==='string'&&typeof row.setting_value==='string'&&trackedKey(row.setting_key))cloud.set(row.setting_key,row.setting_value);
 }
 // Cloud is authoritative for keys already saved there. Legacy settings with no
 // previous account owner may fill missing keys once, never overwrite cloud.
 const carry=new Map<string,string>();
 if(adoptLegacy||sameAccount){
  for(const [key,value] of original)if(!cloud.has(key))carry.set(key,value);
 }
 clearTracked();
 for(const [key,value] of cloud)try{localStorage.setItem(key,value);}catch{}
 for(const [key,value] of carry)try{localStorage.setItem(key,value);}catch{}
 localStorage.setItem(OWNER_KEY,userId);
 synced=new Map(cloud);
 if(carry.size)await upload(carry);
 synced=new Map(snapshot());
 isReady=true;
 installWatchers();
 status('Saved to your account');
 return {adoptLegacy};
}
function schedule():void{
 if(!isReady||!accountId)return;
 if(pendingTimer!==undefined)clearTimeout(pendingTimer);
 pendingTimer=window.setTimeout(()=>{pendingTimer=undefined;void syncAccountSettings().catch(()=>{});},600);
 status('Saving…');
}
function installWatchers():void{
 const oldSet=Storage.prototype.setItem;
 const oldRemove=Storage.prototype.removeItem;
 Storage.prototype.setItem=function(key:string,value:string){
  oldSet.call(this,key,value);
  if(this===localStorage&&trackedKey(key))schedule();
 };
 Storage.prototype.removeItem=function(key:string){
  oldRemove.call(this,key);
  if(this===localStorage&&trackedKey(key))schedule();
 };
 // Cycle Quest lives in a same-origin iframe; it writes directly to its own
 // Storage object. The parent observes those writes via the storage event.
 window.addEventListener('storage',event=>{
  if(event.storageArea!==localStorage)return;
  if(event.key===OWNER_KEY&&event.newValue&&event.newValue!==accountId){location.reload();return;}
  if(event.key===null||trackedKey(event.key))schedule();
 });
 window.addEventListener('visibilitychange',()=>{
  if(document.hidden)void syncAccountSettings().catch(()=>{});
 });
 window.addEventListener('pagehide',()=>{void syncAccountSettings().catch(()=>{});});
 window.setInterval(()=>{if(isReady&&hasChanges())void syncAccountSettings().catch(()=>{});},4000);
}
function hasChanges():boolean{
 const current=snapshot();
 if(current.size!==synced.size)return true;
 return [...current].some(([key,val])=>synced.get(key)!==val);
}
export async function syncAccountSettings():Promise<void>{
 if(!isReady||!accountClient||!accountId)return;
 if(pendingTimer!==undefined){clearTimeout(pendingTimer);pendingTimer=undefined;}
 if(writing){await writing; if(hasChanges())return syncAccountSettings();return;}
 const current=snapshot();
 const changes=new Map([...current].filter(([key,value])=>synced.get(key)!==value));
 const removals=[...synced.keys()].filter(key=>!current.has(key));
 if(!changes.size&&!removals.length){status('Saved to your account');return;}
 const work=(async()=>{
  status('Saving…');
  try{
   if(changes.size)await upload(changes);
   if(removals.length){
    const {error}=await accountClient!.from('account_settings').delete().eq('user_id',accountId).in('setting_key',removals);
    if(error)throw error;
   }
   for(const [key,value] of changes)synced.set(key,value);
   for(const key of removals)synced.delete(key);
   if(!hasChanges())status('Saved to your account');
  }catch(error){
   status('Unable to sync — retrying',true);
   console.warn('[Account] Preference sync failed',error);
   if(retryTimer!==undefined)clearTimeout(retryTimer);
   retryTimer=window.setTimeout(()=>{retryTimer=undefined;void syncAccountSettings().catch(()=>{});},10000);
   throw error;
  }
 })();
 writing=work;
 try{await work;}finally{writing=null;}
}
export function eraseLocalAccountSettings():void{
 isReady=false;accountId='';
 if(pendingTimer!==undefined)clearTimeout(pendingTimer);
 if(retryTimer!==undefined)clearTimeout(retryTimer);
 clearTracked();
 // Leave the ownership marker intact: prevents importing another person's data.
}
