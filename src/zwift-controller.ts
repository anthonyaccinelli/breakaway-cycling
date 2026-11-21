/**
 * Zwift handlebar controllers over Web Bluetooth: original Click (v1), Click v2
 * (two halves), Play and Ride. Shared by Ride Breakaway, Cycle Quest and Spindlkin.
 *
 * Everything downstream keeps using the original {plus, minus} Click state, so
 * game gestures (reward choice, hold − to select, virtual gears) work unchanged.
 *
 * Protocol (community reverse-engineering, unencrypted mode only):
 *  - Service 00000001-19ca-4651-86e5-fa29dcdd09d1, or 0xFC82 on newer firmware.
 *  - …0002 notifications (buttons, battery), …0003 commands, …0004 indications.
 *  - Write ASCII "RideOn" to …0003; the controller answers "RideOn…" and then
 *    sends protobuf messages that start with a type byte:
 *      0x37 Click v1  field 1 = plus, field 2 = minus (0 = pressed)
 *      0x07 Play      field 1 = half (0 = right), 2–5 buttons, 7 paddle (0 = pressed)
 *      0x23 Click v2 / Ride  field 1 = button bitmap, a CLEARED bit = pressed
 *      0x19 battery   0x15 idle
 *      ff 05 00 ea 05 <len> <protobuf>  Click v2 status, field 2 = mode
 *  - Click v2 left half (the − side) relays the right half's presses. About a
 *    minute after connecting it reports mode 1 and stops sending plain buttons
 *    unless the Zwift app unlocked it recently. A lone 0x18 written to …0003
 *    reboots that half, which restores plain buttons for another minute; the hub
 *    below does this automatically and reconnects without the chooser.
 *  - The right half (the + side) never locks but only reports its own buttons,
 *    so its B button doubles as "−". Right half alone is therefore a complete,
 *    restart-free shifter.
 */

export const ZWIFT_COMPANY_ID=0x094a;
export const ZWIFT_SERVICE='00000001-19ca-4651-86e5-fa29dcdd09d1';
export const ZWIFT_FC82_SERVICE=0xfc82;
export const ZWIFT_NOTIFY='00000002-19ca-4651-86e5-fa29dcdd09d1';
export const ZWIFT_COMMAND='00000003-19ca-4651-86e5-fa29dcdd09d1';
export const ZWIFT_RESPONSE='00000004-19ca-4651-86e5-fa29dcdd09d1';
export const ZWIFT_OPTIONAL_SERVICES:(string|number)[]=[ZWIFT_SERVICE,ZWIFT_FC82_SERVICE];
export const ZWIFT_REQUEST_FILTERS=[{namePrefix:'Zwift'}];

const RIDE_ON=[0x52,0x69,0x64,0x65,0x4f,0x6e];
const POD_RESET=0x18;

export type ZwiftButton='shiftUp'|'shiftDown'|'up'|'down'|'left'|'right'|'a'|'b'|'y'|'z';
export type ZwiftButtons=Record<ZwiftButton,boolean>;
/** The original Click state every game already understands. */
export type ClickState={plus:boolean;minus:boolean};
export type ControllerModel='click-v1'|'click-v2'|'play'|'unknown';

export type ZwiftMessage=
 |{kind:'handshake'}
 |{kind:'buttons';model:ControllerModel;buttons:ZwiftButtons}
 |{kind:'battery';level:number}
 |{kind:'status';mode:number}
 |{kind:'idle'}
 |{kind:'unknown';type:number};

export function noButtons():ZwiftButtons{
 return {shiftUp:false,shiftDown:false,up:false,down:false,left:false,right:false,a:false,b:false,y:false,z:false};
}

/** Varint protobuf fields (field number → first value). Values up to 2^53 stay exact. */
export function readVarintFields(bytes:Uint8Array,offset=0):Map<number,number>{
 const fields=new Map<number,number>();
 let i=offset;
 const varint=():number|null=>{
  let value=0,scale=1;
  while(i<bytes.length){
   const byte=bytes[i++];
   value+=(byte&0x7f)*scale;
   if(byte<0x80)return value;
   scale*=128;
   if(scale>2**56)return null;
  }
  return null;
 };
 while(i<bytes.length){
  const key=varint();if(key===null)break;
  const field=Math.floor(key/8),wire=key%8;
  if(wire===0){const value=varint();if(value===null)break;if(!fields.has(field))fields.set(field,value);}
  else if(wire===2){const length=varint();if(length===null)break;i+=length;}
  else if(wire===5)i+=4;
  else if(wire===1)i+=8;
  else break;
 }
 return fields;
}

const V2_BITS:[number,ZwiftButton][]=[
 [0x0001,'left'],[0x0002,'up'],[0x0004,'right'],[0x0008,'down'],
 [0x0010,'a'],[0x0020,'b'],[0x0040,'y'],[0x0080,'z'],
 [0x0100,'shiftDown'],[0x0200,'shiftDown'],
 [0x1000,'shiftUp'],[0x2000,'shiftUp'],
];

function startsWith(bytes:Uint8Array,prefix:number[]){
 return bytes.length>=prefix.length&&prefix.every((b,i)=>bytes[i]===b);
}

export function parseZwiftMessage(input:Uint8Array|DataView):ZwiftMessage{
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
 if(!bytes.length)return {kind:'unknown',type:-1};
 if(startsWith(bytes,RIDE_ON))return {kind:'handshake'};
 const type=bytes[0];
 if(type===0x37){
  const f=readVarintFields(bytes,1);
  if(!f.has(1)||!f.has(2))return {kind:'unknown',type};
  const buttons=noButtons();buttons.shiftUp=f.get(1)===0;buttons.shiftDown=f.get(2)===0;
  return {kind:'buttons',model:'click-v1',buttons};
 }
 if(type===0x07){
  const f=readVarintFields(bytes,1);
  const right=f.get(1)===0,pressed=(n:number)=>f.get(n)===0;
  const buttons=noButtons();
  if(right){buttons.y=pressed(2);buttons.z=pressed(3);buttons.a=pressed(4);buttons.b=pressed(5);buttons.shiftUp=pressed(7);}
  else{buttons.up=pressed(2);buttons.left=pressed(3);buttons.right=pressed(4);buttons.down=pressed(5);buttons.shiftDown=pressed(7);}
  return {kind:'buttons',model:'play',buttons};
 }
 if(type===0x23){
  const map=readVarintFields(bytes,1).get(1);
  if(map===undefined)return {kind:'idle'};
  const buttons=noButtons();
  for(const [bit,name] of V2_BITS)if(Math.floor(map/bit)%2===0)buttons[name]=true;
  return {kind:'buttons',model:'click-v2',buttons};
 }
 if(type===0x19){const f=readVarintFields(bytes,1);return {kind:'battery',level:f.get(2)??f.get(1)??0};}
 if(type===0x15)return {kind:'idle'};
 if(startsWith(bytes,[0xff,0x05,0x00,0xea,0x05])&&bytes.length>=7){
  return {kind:'status',mode:readVarintFields(bytes,6).get(2)??0};
 }
 return {kind:'unknown',type};
}

/** + shifts up; − or B (right half's stand-in for −) shifts down. */
export function toClickState(buttons:ZwiftButtons):ClickState{
 return {plus:buttons.shiftUp,minus:buttons.shiftDown||buttons.b};
}

export function mergeButtons(all:Iterable<ZwiftButtons>):ZwiftButtons{
 const merged=noButtons();
 for(const b of all)for(const key of Object.keys(merged) as ZwiftButton[])if(b[key])merged[key]=true;
 return merged;
}

export function packetHex(input:Uint8Array|DataView){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
 return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join(' ');
}

// ---------------------------------------------------------------- connection hub

export type HubDeviceInfo={id:string;name:string;model:ControllerModel;connected:boolean;locked:boolean;battery:number|null;relays:boolean};
export type ZwiftHubOptions={
 /** Merged state of every connected half; only called when it changes. */
 onState:(state:ClickState,buttons:ZwiftButtons)=>void;
 /** Any change worth showing (connect, disconnect, lock, battery). */
 onChange?:(devices:HubDeviceInfo[])=>void;
 onPacket?:(device:HubDeviceInfo,hex:string,message:ZwiftMessage)=>void;
 log?:(text:string)=>void;
 setTimeout?:(fn:()=>void,ms:number)=>any;
 clearTimeout?:(id:any)=>void;
 setInterval?:(fn:()=>void,ms:number)=>any;
 clearInterval?:(id:any)=>void;
 keepaliveMs?:number;
 connectTimeoutMs?:number;
};

type Entry={
 device:any;info:HubDeviceInfo;buttons:ZwiftButtons;
 command:any;session:number;connecting:Promise<void>|null;
 rebooting:boolean;keepalive:any;retry:any;retryIndex:number;removed:boolean;everConnected:boolean;
 onDisconnect:()=>void;
};

const RECONNECT_DELAYS=[500,1000,2000,2000,3000,5000];

export class ZwiftClickHub{
 private entries=new Map<string,Entry>();
 private last='';
 private o:Required<Omit<ZwiftHubOptions,'onChange'|'onPacket'|'log'>>&ZwiftHubOptions;
 constructor(options:ZwiftHubOptions){
  this.o={
   setTimeout:(fn,ms)=>globalThis.setTimeout(fn,ms),clearTimeout:id=>globalThis.clearTimeout(id),
   setInterval:(fn,ms)=>globalThis.setInterval(fn,ms),clearInterval:id=>globalThis.clearInterval(id),
   keepaliveMs:15000,connectTimeoutMs:15000,...options,
  };
 }
 devices():HubDeviceInfo[]{return [...this.entries.values()].map(e=>({...e.info}));}
 has(id:string){return this.entries.has(id);}
 ids(){return [...this.entries.keys()];}
 get connectedCount(){return [...this.entries.values()].filter(e=>e.info.connected).length;}
 /** True when a Click v2 is in use but only one half is paired. */
 get missingV2Half(){
  const list=this.devices();
  return list.length===1&&list[0].model==='click-v2';
 }

 /** Adds (or wakes) a controller. Idempotent for a device already in the hub. */
 async add(device:any):Promise<void>{
  let entry=this.entries.get(device.id);
  if(!entry){
   // Two halves at most; a third device replaces the oldest.
   if(this.entries.size>=2){const oldest=this.entries.keys().next().value as string;this.remove(oldest);}
   entry={
    device,buttons:noButtons(),command:null,session:0,connecting:null,rebooting:false,
    keepalive:null,retry:null,retryIndex:0,removed:false,everConnected:false,onDisconnect:()=>{},
    info:{id:device.id,name:device.name||'Zwift controller',model:'unknown',connected:false,locked:false,battery:null,relays:false},
   };
   const e=entry;
   e.onDisconnect=()=>this.lost(e);
   device.addEventListener('gattserverdisconnected',e.onDisconnect);
   this.entries.set(device.id,entry);
  }
  if(entry.info.connected&&device.gatt?.connected)return;
  try{await this.open(entry);}
  catch(err){
   // A brand new device that never connected is dropped so the caller can report it.
   if(!entry.everConnected)this.remove(device.id);
   throw err;
  }
 }

 remove(id:string){
  const e=this.entries.get(id);if(!e)return;
  e.removed=true;e.session++;
  this.stopTimers(e);
  e.device.removeEventListener?.('gattserverdisconnected',e.onDisconnect);
  this.entries.delete(id);
  try{e.device.gatt?.disconnect();}catch{}
  this.emitState();this.changed();
 }
 removeAll(){for(const id of this.ids())this.remove(id);}

 private stopTimers(e:Entry){
  if(e.keepalive!==null){this.o.clearInterval(e.keepalive);e.keepalive=null;}
  if(e.retry!==null){this.o.clearTimeout(e.retry);e.retry=null;}
 }
 private changed(){this.o.onChange?.(this.devices());}
 private emitState(){
  const buttons=mergeButtons([...this.entries.values()].filter(e=>e.info.connected).map(e=>e.buttons));
  const state=toClickState(buttons);
  const key=JSON.stringify(buttons);
  if(key===this.last)return;
  this.last=key;
  this.o.onState(state,buttons);
 }

 private open(e:Entry):Promise<void>{
  if(e.connecting)return e.connecting;
  const session=++e.session;
  const run=(async()=>{
   const server:any=await withTimeout<any>(e.device.gatt.connect(),this.o.connectTimeoutMs,this.o,'Bluetooth connect timed out');
   if(session!==e.session||e.removed)return;
   let service:any=null;
   for(const uuid of ZWIFT_OPTIONAL_SERVICES){try{service=await server.getPrimaryService(uuid);break;}catch{}}
   if(!service){try{e.device.gatt.disconnect();}catch{}throw Error(`${e.info.name} is not a Zwift Click, Click v2, Play or Ride controller (no Zwift Bluetooth service).`);}
   const notify=await service.getCharacteristic(ZWIFT_NOTIFY);
   e.command=await service.getCharacteristic(ZWIFT_COMMAND);
   const handler=(event:any)=>{if(session===e.session)this.packet(e,event.target.value);};
   notify.addEventListener('characteristicvaluechanged',handler);
   await notify.startNotifications();
   try{
    const response=await service.getCharacteristic(ZWIFT_RESPONSE);
    response.addEventListener('characteristicvaluechanged',handler);
    await response.startNotifications();
   }catch{/* Original Click firmware may not expose indications; buttons still work. */}
   await write(e.command,Uint8Array.from(RIDE_ON));
   e.info.connected=true;e.everConnected=true;e.info.locked=false;e.retryIndex=0;
   const wasRebooting=e.rebooting;e.rebooting=false;
   if(e.keepalive!==null)this.o.clearInterval(e.keepalive);
   // RideOn keepalive keeps the original Click from idling (v1 only; it does nothing for v2).
   e.keepalive=this.o.setInterval(()=>{
    if(session===e.session&&e.device.gatt?.connected&&!e.rebooting&&e.info.model!=='click-v2')void write(e.command,Uint8Array.from(RIDE_ON)).catch(()=>{});
   },this.o.keepaliveMs);
   this.o.log?.(`${e.info.name}: ${wasRebooting?'back after restart':'connected'}`);
   this.changed();
  })();
  e.connecting=run;
  return run.finally(()=>{if(e.connecting===run)e.connecting=null;});
 }

 private packet(e:Entry,view:DataView){
  const message=parseZwiftMessage(view);
  this.o.onPacket?.({...e.info},packetHex(view),message);
  if(message.kind==='buttons'){
   if(e.info.model!==message.model){e.info.model=message.model;this.changed();}
   e.buttons=message.buttons;this.emitState();
  }else if(message.kind==='battery'){
   e.info.relays=true;
   if(e.info.battery!==message.level){e.info.battery=message.level;this.changed();}
  }else if(message.kind==='status'){
   e.info.relays=true;
   if(e.info.model==='unknown')e.info.model='click-v2';
   const locked=message.mode===1;
   if(locked!==e.info.locked){e.info.locked=locked;this.changed();}
   if(locked)this.reboot(e);
  }
 }

 /** Locked Click v2 half: restart it (≈1–2 s offline) for another minute of plain buttons. */
 private reboot(e:Entry){
  if(e.rebooting||!e.command)return;
  e.rebooting=true;
  e.buttons=noButtons();this.emitState();
  this.o.log?.(`${e.info.name}: locked by Zwift firmware, restarting it`);
  write(e.command,Uint8Array.of(POD_RESET)).catch(err=>{
   this.o.log?.(`${e.info.name}: restart failed (${String(err)}), reconnecting`);
   try{e.device.gatt?.disconnect();}catch{}
  });
 }

 private lost(e:Entry){
  if(e.removed)return;
  e.session++;
  if(e.keepalive!==null){this.o.clearInterval(e.keepalive);e.keepalive=null;}
  const wasConnected=e.info.connected;
  e.info.connected=false;e.buttons=noButtons();e.connecting=null;
  this.emitState();
  if(wasConnected&&!e.rebooting)this.o.log?.(`${e.info.name}: disconnected, press a button to wake it`);
  this.changed();
  this.scheduleRetry(e);
 }

 private scheduleRetry(e:Entry){
  if(e.removed||e.retry!==null)return;
  const delay=RECONNECT_DELAYS[Math.min(e.retryIndex,RECONNECT_DELAYS.length-1)];
  e.retryIndex++;
  e.retry=this.o.setTimeout(()=>{
   e.retry=null;
   if(e.removed||e.info.connected)return;
   this.open(e).catch(()=>{if(!e.info.connected)this.scheduleRetry(e);});
  },delay);
 }
}

async function write(characteristic:any,bytes:Uint8Array){
 if(characteristic.properties?.write===false&&characteristic.properties?.writeWithoutResponse)return characteristic.writeValueWithoutResponse(bytes);
 try{await characteristic.writeValueWithResponse(bytes);}
 catch{await characteristic.writeValueWithoutResponse(bytes);}
}

function withTimeout<T>(promise:Promise<T>,ms:number,t:{setTimeout:(fn:()=>void,ms:number)=>any;clearTimeout:(id:any)=>void},message:string):Promise<T>{
 return new Promise<T>((resolve,reject)=>{
  const id=t.setTimeout(()=>reject(Error(message)),ms);
  promise.then(v=>{t.clearTimeout(id);resolve(v);},err=>{t.clearTimeout(id);reject(err);});
 });
}

/** Human status line for a device list. */
export function describeHub(devices:HubDeviceInfo[]):string{
 if(!devices.length)return 'Not connected';
 const v2=devices.some(d=>d.model==='click-v2');
 const up=devices.filter(d=>d.connected).length;
 if(v2){
  if(devices.length===1)return devices[0].connected
   ?'Click v2 · 1 half connected (+ shifts up, B shifts down). Press Connect again to add the other half.'
   :'Click v2 · reconnecting — press a button to wake it';
  return `Click v2 · ${up} of 2 halves connected`+(devices.some(d=>d.locked)?' · restarting left half':'');
 }
 const names=devices.map(d=>d.model==='click-v1'?'Zwift Click':d.model==='play'?'Zwift Play':d.name).join(' + ');
 return up===devices.length?`${names} connected`:`${names} · reconnecting — press a button to wake it`;
}
