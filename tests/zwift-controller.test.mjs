import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/zwift-controller.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const z=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

const varint=n=>{const out=[];while(n>=128){out.push((n%128)|128);n=Math.floor(n/128);}out.push(n);return out;};
const ALL=0xfffff;
/** A Click v2 0x23 message with these bits pressed (cleared). */
const v2=(...pressed)=>Uint8Array.from([0x23,0x08,...varint(pressed.reduce((m,b)=>m-b,ALL))]);
const PLUS=0x1000,MINUS=0x100,B=0x20,A=0x10,UP=0x2;
const status=mode=>Uint8Array.from([0xff,0x05,0x00,0xea,0x05,0x04,0x08,0x01,0x10,mode]);

test('original Click v1 packets keep working',()=>{
 const m=z.parseZwiftMessage(Uint8Array.from([0x37,0x08,0x00,0x10,0x01]));
 assert.equal(m.kind,'buttons');assert.equal(m.model,'click-v1');
 assert.deepEqual(z.toClickState(m.buttons),{plus:true,minus:false});
 assert.deepEqual(z.toClickState(z.parseZwiftMessage(Uint8Array.from([0x37,0x08,0x01,0x10,0x00])).buttons),{plus:false,minus:true});
});
test('Click v2 bitmap: cleared bit = pressed, B stands in for minus',()=>{
 const idle=z.parseZwiftMessage(v2());
 assert.equal(idle.model,'click-v2');assert.deepEqual(z.toClickState(idle.buttons),{plus:false,minus:false});
 assert.deepEqual(z.toClickState(z.parseZwiftMessage(v2(PLUS)).buttons),{plus:true,minus:false});
 assert.deepEqual(z.toClickState(z.parseZwiftMessage(v2(MINUS)).buttons),{plus:false,minus:true});
 assert.deepEqual(z.toClickState(z.parseZwiftMessage(v2(0x2000)).buttons),{plus:true,minus:false});
 assert.deepEqual(z.toClickState(z.parseZwiftMessage(v2(B)).buttons),{plus:false,minus:true});
 const ab=z.parseZwiftMessage(v2(A,UP)).buttons;assert.ok(ab.a&&ab.up&&!ab.b);
});
test('status, battery, handshake and idle messages',()=>{
 assert.deepEqual(z.parseZwiftMessage(status(1)),{kind:'status',mode:1});
 assert.deepEqual(z.parseZwiftMessage(status(0)),{kind:'status',mode:0});
 assert.deepEqual(z.parseZwiftMessage(Uint8Array.from([0x19,0x10,0x55])),{kind:'battery',level:0x55});
 assert.equal(z.parseZwiftMessage(new TextEncoder().encode('RideOn\x01\x02')).kind,'handshake');
 assert.equal(z.parseZwiftMessage(Uint8Array.from([0x15])).kind,'idle');
 assert.equal(z.parseZwiftMessage(Uint8Array.from([0x23,0x10,0x05])).kind,'idle');
});

// ---------------------------------------------------------- fake Web Bluetooth
function fakeTimers(){
 let now=0,seq=0;const jobs=new Map();
 return {
  setTimeout:(fn,ms)=>{const id=++seq;jobs.set(id,{at:now+ms,fn});return id;},
  clearTimeout:id=>jobs.delete(id),
  setInterval:(fn,ms)=>{const id=++seq;const job={at:now+ms,fn:()=>{job.at=now+ms;jobs.set(id,job);fn();},every:ms};jobs.set(id,job);return id;},
  clearInterval:id=>jobs.delete(id),
  async advance(ms){const end=now+ms;for(;;){const due=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;jobs.delete(due[0]);due[1].fn();await flush();}now=end;},
 };
}
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function characteristic(){
 const listeners=new Set();
 return {writes:[],properties:{write:true,writeWithoutResponse:true,notify:true},
  addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),
  async startNotifications(){},async writeValueWithResponse(b){this.writes.push([...b]);},async writeValueWithoutResponse(b){this.writes.push([...b]);},
  emit(bytes){const value=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(const fn of listeners)fn({target:{value}});}};
}
function fakeDevice(id,{service=z.ZWIFT_SERVICE}={}){
 const listeners=new Set();
 const chars={[z.ZWIFT_NOTIFY]:characteristic(),[z.ZWIFT_COMMAND]:characteristic(),[z.ZWIFT_RESPONSE]:characteristic()};
 const dev={id,name:'Zwift Click',chars,connects:0,awake:true,
  addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),
  gatt:{connected:false,
   async connect(){if(!dev.awake)throw Error('unreachable');dev.connects++;dev.gatt.connected=true;
    return {getPrimaryService:async uuid=>{if(uuid!==service)throw Error('no service');return {getCharacteristic:async c=>chars[c]};}};},
   disconnect(){if(!dev.gatt.connected)return;dev.gatt.connected=false;for(const fn of listeners)fn();}},
  notify(bytes){chars[z.ZWIFT_NOTIFY].emit(bytes);},
  commands(){return chars[z.ZWIFT_COMMAND].writes;},
 };
 return dev;
}
const RIDE_ON=[...new TextEncoder().encode('RideOn')];
function hub(timers){
 const states=[];
 const h=new z.ZwiftClickHub({onState:s=>states.push(`${s.plus?'+':''}${s.minus?'-':''}`||'0'),...timers});
 return {h,states};
}

test('one Click v2 half: RideOn handshake, + and B shift, no keepalive spam',async()=>{
 const t=fakeTimers();const {h,states}=hub(t);const right=fakeDevice('R');
 await h.add(right);
 assert.deepEqual(right.commands(),[RIDE_ON]);
 right.notify(v2());right.notify(v2(PLUS));right.notify(v2());right.notify(v2(B));right.notify(v2());
 assert.deepEqual(states,['0','+','0','-','0']);
 assert.ok(h.missingV2Half);
 await t.advance(60000);
 assert.equal(right.commands().length,1,'v2 gets no RideOn keepalive');
});
test('works on firmware that advertises the 0xFC82 service',async()=>{
 const {h,states}=hub(fakeTimers());const d=fakeDevice('F',{service:0xfc82});
 await h.add(d);d.notify(v2(PLUS));assert.deepEqual(states,['+']);
});
test('both halves: a press relayed by the left half counts once',async()=>{
 const {h,states}=hub(fakeTimers());const left=fakeDevice('L'),right=fakeDevice('R');
 await h.add(left);await h.add(right);
 right.notify(v2(PLUS));left.notify(v2(PLUS));right.notify(v2());left.notify(v2());
 left.notify(v2(MINUS));left.notify(v2());
 assert.deepEqual(states,['+','0','-','0']);
 assert.equal(h.missingV2Half,false);
});
test('locked left half is restarted (0x18) and reconnected without the chooser',async()=>{
 const t=fakeTimers();const {h,states}=hub(t);const left=fakeDevice('L');
 await h.add(left);
 left.notify(v2(MINUS));
 left.notify(status(1));
 assert.deepEqual(left.commands().at(-1),[0x18]);
 assert.equal(states.at(-1),'0','held state is released while it restarts');
 left.gatt.disconnect(); // the controller reboots
 assert.equal(h.connectedCount,0);
 await t.advance(600);
 assert.equal(left.connects,2);assert.equal(h.connectedCount,1);
 assert.deepEqual(left.commands().at(-1),RIDE_ON);
 left.notify(v2(MINUS));assert.equal(states.at(-1),'-');
});
test('a sleeping controller keeps retrying until it wakes',async()=>{
 const t=fakeTimers();const {h}=hub(t);const d=fakeDevice('D');
 await h.add(d);d.awake=false;d.gatt.disconnect();
 await t.advance(10000);assert.equal(h.connectedCount,0);
 d.awake=true;await t.advance(6000);assert.equal(h.connectedCount,1);
});
test('original Click still gets its RideOn keepalive',async()=>{
 const t=fakeTimers();const {h}=hub(t);const d=fakeDevice('V1');
 await h.add(d);d.notify(Uint8Array.from([0x37,0x08,0x01,0x10,0x01]));
 await t.advance(31000);assert.equal(d.commands().length,3);
});
test('non-Zwift devices are rejected and not retried',async()=>{
 const t=fakeTimers();const {h}=hub(t);const d=fakeDevice('X',{service:'other'});
 await assert.rejects(h.add(d),/not a Zwift/);
 assert.equal(h.has('X'),false);
 await t.advance(30000);assert.equal(d.connects,1);
});
test('removeAll disconnects and stops reconnecting',async()=>{
 const t=fakeTimers();const {h}=hub(t);const d=fakeDevice('D');
 await h.add(d);h.removeAll();await t.advance(30000);
 assert.equal(d.connects,1);assert.equal(d.gatt.connected,false);
});
