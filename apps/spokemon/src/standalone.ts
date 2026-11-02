import './standalone.css';
import './pedalkin-universal-font.css';
import {mountPedalkinRide} from './pedalkin-ride';
import {mountPedalkinHandheldRoute} from './pedalkin-handheld-route';
import {mountPedalkinHandheldDevices} from './pedalkin-handheld-devices';
import {parseCscMeasurement} from './spokemon-csc';
import type {CscState} from './spokemon-csc';
import {advanceCadenceSensorRide} from './spokemon-sensor-progress';
import {generateProfile,metersForMiles,parseGpxRoute} from './standalone-route';
import type {Profile} from './standalone-route';

type BleDevice = any;
type Sensor={device:BleDevice;state:CscState;hasWheel:boolean;hasCrank:boolean};
const CSC=0x1816,CSC_DATA=0x2a5b,FTMS=0x1826,BIKE_DATA=0x2ad2,HR=0x180d,HR_DATA=0x2a37;
const METERS_PER_MILE=1609.344;
const app=document.getElementById('app')!;
app.innerHTML=[
 '<div id="engine" aria-hidden="true">',
 '<button id="stepRoute"></button><button id="stepSetup"></button><button id="stepRide"></button>',
 '<button id="nativeProfile"></button><button id="start">START REAL RIDE</button>',
 '<button id="rideFinishNow" hidden>FINISH RIDE</button>',
 '<button id="goToRide"></button><button id="enjoyRide"></button>',
 '<button id="connect"></button><button id="connectSpeedCadence"></button>',
 '<button id="connectHr"></button><button id="connectClick"></button>',
 '<button id="down"></button><button id="up"></button><button id="applyErgWatts"></button>',
 '<select id="drivetrainMode"><option value="traditional">Traditional</option><option value="virtual">Virtual</option></select>',
 '<select id="trainerMode"><option value="sim">SIM</option><option value="erg">ERG</option><option value="target">Fixed ERG</option></select>',
 '<input id="fixedErgWatts" type="number" value="180"><input id="autoBluetooth" type="checkbox">',
 '<span id="speedCadenceStatus">Not connected</span><span id="hrStatus">Not connected</span>',
 '<span id="clickStatus">Not connected</span><span id="gear">6</span>',
 '<span id="distance">0.00</span><span id="power">—</span>',
 '<input id="ftp" type="number" value="250">',
 '<span id="studioScrubMiles">0.00 mi</span><span id="studioScrubElevation">0 ft</span><span id="studioScrubGrade">0%</span>',
 '</div>',
 '<section id="screenRoute">',
 '<label>Distance <input id="generatedMiles" type="number" min="0.01" value="15"></label>',
 '<label>Terrain <select id="generatedTerrain"><option value="rolling">Rolling</option><option value="flat">Flat</option><option value="mountain">Mountain</option><option value="punchy">Punchy</option></select></label>',
 '<label>Gain (ft) <input id="generatedGain" type="number"></label>',
 '<label>Seed <input id="generatedSeed" type="number"></label><input id="lockGeneratedSeed" type="checkbox">',
 '<input id="gpx" type="file" accept=".gpx,.xml">',
 '<button id="generateRoute">Generate</button><button id="surpriseRoute">Surprise</button><button id="endlessRoute">Endless</button>',
 '<button class="quick-preset-button" data-presets="recovery">Recovery</button>',
 '<button class="quick-preset-button" data-presets="rolling">Rolling</button>',
 '<button class="quick-preset-button" data-presets="climb">Climb</button>',
 '<div id="studioLiveChart"></div>',
 '<span id="studioPreviewMiles"></span><span id="studioPreviewGain"></span>',
 '<span id="studioDifficulty"></span><span id="studioEstimatedTime"></span><span id="studioSteepestGrade"></span>',
 '</section>',
 '<section id="screenRide"></section>',
 '<div id="standalone-banner" aria-live="polite"></div>'
].join('');
const get=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const banner=get('standalone-banner');
let profile:Profile=generateProfile(15,'rolling',117349);
let isEndless=false;
let riding=false,elapsed=0,distance=0,gear=6;
let cadence=0,speedMps=0,power:number|undefined,heartRate:number|null=null;
let lastCadenceAt=0,lastSpeedAt=0,lastPowerAt=0;
let hasWheel=false,hasCrank=false,trainerConnected=false;
let recorder:{t:number;distance:number;cadence:number;power?:number;hr?:number}[]=[];
let lastFrameAt=performance.now(),lastRecordAt=0;
const sensors=new Map<string,Sensor>();
let trainer:BleDevice|null=null,hrDevice:BleDevice|null=null;
const bluetooth=()=> (navigator as Navigator & {bluetooth?:any}).bluetooth;
function status(message:string){banner.textContent=message;}
function nav(page:'route'|'setup'|'ride'){
 document.body.dataset.breakawayScreen=page;
 get('screenRoute').hidden=page!=='route';
 get('screenRide').hidden=page!=='ride';
}
document.body.dataset.rideExperience='pedalkin';
document.body.dataset.breakawayScreen='route';
get('stepRoute').onclick=()=>nav('route');
get('stepSetup').onclick=()=>nav('setup');
get('stepRide').onclick=()=>nav('ride');
get('goToRide').onclick=()=>nav('ride');
get('enjoyRide').onclick=()=>nav('ride');
get('gear').textContent=String(gear);
get('down').onclick=()=>{gear=Math.max(1,gear-1);get('gear').textContent=String(gear);};
get('up').onclick=()=>{gear=Math.min(24,gear+1);get('gear').textContent=String(gear);};
get('drivetrainMode').onchange=()=>status('Gear preference updated. Smart-trainer virtual resistance is not yet validated in this extraction.');
get('trainerMode').onchange=()=>status('Trainer control selection saved. Current standalone prototype reads FTMS telemetry; it does not yet command resistance.');
get('connectClick').onclick=()=>status('Zwift Click control pairing has not been ported to the standalone engine yet.');
get('applyErgWatts').onclick=()=>status('Fixed ERG control remains unavailable until the original trainer command engine is extracted.');
get('rideFinishNow').onclick=()=>finishRide();
function renderProfile(){
 const total=profile.totalMeters;
 get('studioPreviewMiles').textContent=(total/METERS_PER_MILE).toFixed(1)+' mi';
 get('studioPreviewGain').textContent=Math.round(profile.gainMeters*3.28084)+' ft';
 get('studioDifficulty').textContent=profile.terrain;
 get('studioEstimatedTime').textContent=Math.round(total/METERS_PER_MILE/12*60)+' min';
 get('studioSteepestGrade').textContent=profile.steepestPercent.toFixed(1)+'%';
 const points=profile.samples,minimum=Math.min(...points),maximum=Math.max(...points),range=Math.max(1,maximum-minimum);
 const path=points.map((e,i)=>(i?'L':'M')+(i/(points.length-1)*1000).toFixed(1)+' '+(190-(e-minimum)/range*166).toFixed(1)).join(' ');
 get('studioLiveChart').innerHTML='<svg viewBox="0 0 1000 200" preserveAspectRatio="none" role="img" aria-label="Terrain elevation profile"><path d="'+path+'" fill="none" stroke="#f4d58c" stroke-width="5"/></svg>';
}
function setRoute(next:Profile,endless=false){
 if(riding){status('Pause and finish the current recorded ride before replacing its route.');return;}
 profile=next;isEndless=endless;distance=0;elapsed=0;recorder=[];
 renderProfile();
 status('Route ready: '+(profile.totalMeters/METERS_PER_MILE).toFixed(1)+' miles. Select 02 Devices or 03 Ride.');
}
function selectedSeed(){
 const seedInput=get<HTMLInputElement>('generatedSeed');
 const lock=get<HTMLInputElement>('lockGeneratedSeed').checked;
 const entered=Number(seedInput.value);
 const seed=(lock&&Number.isInteger(entered)&&entered>0)?entered:Math.floor(Math.random()*1000000000)+1;
 seedInput.value=String(seed);
 return seed;
}
function generated(endless=false){
 const miles=Math.max(.1,Math.min(1000,Number(get<HTMLInputElement>('generatedMiles').value)||15));
 const terrain=get<HTMLSelectElement>('generatedTerrain').value;
 const gainText=get<HTMLInputElement>('generatedGain').value;
 const requestedGain=gainText.trim()?Math.max(0,Number(gainText))/3.28084:undefined;
 setRoute(generateProfile(endless?100:miles,terrain,selectedSeed(),requestedGain),endless);
}
get('generateRoute').onclick=()=>generated();
get('endlessRoute').onclick=()=>generated(true);
get('surpriseRoute').onclick=()=>{
 get<HTMLInputElement>('lockGeneratedSeed').checked=false;
 get<HTMLInputElement>('generatedMiles').value=String(5+Math.round(Math.random()*15));
 get<HTMLSelectElement>('generatedTerrain').value=['flat','rolling','mountain','punchy'][Math.floor(Math.random()*4)];
 get<HTMLInputElement>('generatedGain').value='';
 generated();
};
document.querySelectorAll<HTMLButtonElement>('[data-presets]').forEach(b=>b.onclick=()=>{
 const preset=b.dataset.presets;
 get<HTMLSelectElement>('generatedTerrain').value=preset==='climb'?'mountain':preset==='recovery'?'flat':'rolling';
 get<HTMLInputElement>('generatedMiles').value=preset==='climb'?'60':preset==='recovery'?'30':'45';
 get<HTMLInputElement>('generatedGain').value='';
 generated();
});
get<HTMLInputElement>('gpx').onchange=async event=>{
 const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;
 try{setRoute(parseGpxRoute(await file.text()));status('GPX route loaded.');}
 catch(e){status('Could not read GPX: '+String(e));}
};
function liveCadence(now:number){return now-lastCadenceAt<4500?cadence:0;}
function connected(now:number){return (lastCadenceAt>0&&now-lastCadenceAt<4500)||(lastPowerAt>0&&now-lastPowerAt<4500);}
function updateConnection(){
 const flags=[...sensors.values()];
 hasWheel=flags.some(x=>x.hasWheel);hasCrank=flags.some(x=>x.hasCrank);
 const el=get('speedCadenceStatus');
 el.textContent=flags.length?('Speed '+(hasWheel?'✓':'—')+' · Cadence '+(hasCrank?'✓':'—')):'Not connected';
 document.body.dataset.spokemonCscReady=String(hasCrank||trainerConnected);
}
async function subscribe(gatt:any,service:number,characteristic:number,fn:(value:DataView)=>void){
 const serviceRef=await gatt.getPrimaryService(service);
 const characteristicRef=await serviceRef.getCharacteristic(characteristic);
 await characteristicRef.startNotifications();
 characteristicRef.addEventListener('characteristicvaluechanged',(event:any)=>{
  const value=event.target?.value as DataView|null;if(value)fn(value);
 });
}
get('connectSpeedCadence').onclick=async()=>{
 if(!bluetooth()){status('Web Bluetooth requires desktop Chrome or Edge over HTTPS.');return;}
 try{
  const device:BleDevice=await bluetooth().requestDevice({filters:[{services:[CSC]}]});
  const gatt=await device.gatt.connect();
  const sensor:Sensor={device,state:{},hasWheel:false,hasCrank:false};
  sensors.set(device.id,sensor);
  device.addEventListener('gattserverdisconnected',()=>{sensors.delete(device.id);updateConnection();status('Cadence sensor disconnected. Real-ride progression paused if no other sensor is active.');});
  await subscribe(gatt,CSC,CSC_DATA,value=>{
   try{
    const result=parseCscMeasurement(value,sensor.state);
    sensor.state=result.state;sensor.hasWheel=result.wheelPresent;sensor.hasCrank=result.crankPresent;
    const now=Date.now();
    if(result.cadenceRpm!==null){cadence=result.cadenceRpm;lastCadenceAt=now;}
    if(result.speedMps!==null){speedMps=result.speedMps;lastSpeedAt=now;}
    updateConnection();
   }catch(e){console.error('CSC parse failure',e);}
  });
  updateConnection();status('Bluetooth sensor paired. Start Real Ride on 03 Ride; cadence-only movement is estimated.');
 }catch(e){status('Sensor connection failed or was cancelled: '+String(e));}
};
function parseIndoorBikeData(value:DataView){
 if(value.byteLength<2)return;
 const flags=value.getUint16(0,true);let at=2;
 const available=(bytes:number)=>at+bytes<=value.byteLength;
 const u16=()=>{if(!available(2))throw Error('Short FTMS packet');const v=value.getUint16(at,true);at+=2;return v;};
 const s16=()=>{if(!available(2))throw Error('Short FTMS packet');const v=value.getInt16(at,true);at+=2;return v;};
 try{
  if(!(flags&1)){speedMps=u16()/100/3.6;lastSpeedAt=Date.now();}
  if(flags&2)u16();
  if(flags&4){cadence=u16()/2;lastCadenceAt=Date.now();}
  if(flags&8)u16();
  if(flags&16){if(!available(3))return;at+=3;}
  if(flags&32)s16();
  if(flags&64){power=s16();lastPowerAt=Date.now();}
  if(flags&128)s16();
  if(flags&256){if(!available(5))return;at+=5;}
  if(flags&512){if(!available(1))return;heartRate=value.getUint8(at);at++;}
 }catch(e){console.warn('Incomplete FTMS data',e);}
}
get('connect').onclick=async()=>{
 if(!bluetooth()){status('Web Bluetooth is unavailable.');return;}
 try{
  trainer=await bluetooth().requestDevice({filters:[{services:[FTMS]}]});
  const gatt=await trainer.gatt.connect();trainerConnected=true;
  trainer.addEventListener('gattserverdisconnected',()=>{trainerConnected=false;lastPowerAt=0;updateConnection();status('Trainer disconnected. Ride pauses until measurements reconnect.');});
  await subscribe(gatt,FTMS,BIKE_DATA,parseIndoorBikeData);
  updateConnection();status('FTMS trainer connected for live measurement. SIM/ERG resistance controls require further migration.');
 }catch(e){trainerConnected=false;status('Trainer connection failed: '+String(e));}
};
get('connectHr').onclick=async()=>{
 if(!bluetooth()){status('Web Bluetooth is unavailable.');return;}
 try{
  hrDevice=await bluetooth().requestDevice({filters:[{services:[HR]}]});
  const gatt=await hrDevice.gatt.connect();
  hrDevice.addEventListener('gattserverdisconnected',()=>{heartRate=null;get('hrStatus').textContent='Disconnected';});
  await subscribe(gatt,HR,HR_DATA,v=>{
   const large=!!(v.getUint8(0)&1);heartRate=large?v.getUint16(1,true):v.getUint8(1);
   get('hrStatus').textContent=String(heartRate)+' bpm';
  });
  get('hrStatus').textContent='Connected';status('Heart-rate sensor connected.');
 }catch(e){status('Heart-rate connection failed: '+String(e));}
};
get('start').onclick=()=>{
 if(riding){riding=false;get('start').textContent='RESUME REAL RIDE';status('Ride paused.');return;}
 const now=Date.now();
 if(!connected(now)){status('No fresh trainer or cadence telemetry. Pair a device, or use the built-in GAME CONTROLS test ride.');return;}
 riding=true;get('start').textContent='PAUSE REAL RIDE';
 get('rideFinishNow').hidden=false;status('Recording real ride from connected sensor.');
};
function tcx(){
 const esc=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const started=new Date(Date.now()-elapsed*1000).toISOString();
 const points=recorder.map(p=>{
  const powerField=p.power===undefined?'':'<Extensions><TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2"><Watts>'+Math.round(p.power)+'</Watts></TPX></Extensions>';
  return '<Trackpoint><Time>'+new Date(p.t).toISOString()+'</Time><DistanceMeters>'+p.distance.toFixed(2)+'</DistanceMeters>'+
   (p.cadence>0?'<Cadence>'+Math.round(p.cadence)+'</Cadence>':'')+
   (p.hr?'<HeartRateBpm><Value>'+Math.round(p.hr)+'</Value></HeartRateBpm>':'')+powerField+'</Trackpoint>';
 }).join('');
 return '<?xml version="1.0" encoding="utf-8"?><TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2"><Activities><Activity Sport="Biking"><Id>'+esc(started)+'</Id><Lap StartTime="'+esc(started)+'"><TotalTimeSeconds>'+elapsed.toFixed(0)+'</TotalTimeSeconds><DistanceMeters>'+distance.toFixed(2)+'</DistanceMeters><Track>'+points+'</Track></Lap></Activity></Activities></TrainingCenterDatabase>';
}
function download(name:string,content:string,type:string){
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function finishRide(){
 if(!recorder.length){riding=false;get('rideFinishNow').hidden=true;get('start').textContent='START REAL RIDE';status('No measured data recorded. Creature progress remains saved.');return;}
 riding=false;get('rideFinishNow').hidden=true;get('start').textContent='START REAL RIDE';
 const saved={date:new Date().toISOString(),distanceMeters:distance,seconds:elapsed,points:recorder.length};
 try{
  const previous=JSON.parse(localStorage.getItem('spokemon-rides-v1')||'[]');
  localStorage.setItem('spokemon-rides-v1',JSON.stringify([saved,...(Array.isArray(previous)?previous:[])].slice(0,100)));
 }catch(e){console.warn('Ride summary could not save',e);}
 download('spokemon-'+new Date().toISOString().replace(/[:.]/g,'-')+'.tcx',tcx(),'application/xml');
 recorder=[];status('Ride finished. TCX downloaded, summary stored, creature collection retained.');
}
async function openOverlay(){
 const api=(window as Window & {documentPictureInPicture?:any}).documentPictureInPicture;
 if(!api?.requestWindow){status('Always-on-top overlay requires supported desktop Chrome.');return;}
 try{
  const pane=await api.requestWindow({width:900,height:170});
  pane.document.body.style.cssText='background:#0f292f;color:#fff0d4;font:700 20px monospace;margin:0;padding:12px';
  const label=pane.document.createElement('div');pane.document.body.append(label);
  const timer=window.setInterval(()=>{
   if(pane.closed){clearInterval(timer);return;}
   label.textContent='SPOKEMON · '+(distance/METERS_PER_MILE).toFixed(2)+' mi · '+Math.round(liveCadence(Date.now()))+' RPM · '+(power===undefined?'—':Math.round(power)+' W')+' · '+Math.round(gear)+'/24';
  },500);
 }catch(e){status('Overlay could not open: '+String(e));}
}
get('nativeProfile').onclick=()=>void openOverlay();
mountPedalkinHandheldRoute();
mountPedalkinHandheldDevices();
mountPedalkinRide();
renderProfile();nav('route');
status('Standalone Spokemon extraction · Original Illustrator artwork preserved · Test Ride available without hardware.');
function publishFrame(now:number){
 const wall=Date.now();const dt=Math.max(0,Math.min(1,(now-lastFrameAt)/1000));lastFrameAt=now;
 const live=connected(wall);
 const liveSpeed=lastSpeedAt>0&&wall-lastSpeedAt<4500;
 const livePower=lastPowerAt>0&&wall-lastPowerAt<4500;
 const progress=advanceCadenceSensorRide({
  nowMs:wall,lastSpeedAtMs:lastSpeedAt,lastCadenceAtMs:lastCadenceAt,
  speedSensorConnected:hasWheel||trainerConnected, speedMps, cadenceRpm:cadence,
  distanceMeters:distance,stepSeconds:riding?dt:0,routeLimitMeters:isEndless?Infinity:profile.totalMeters
 });
 // Power-only trainers with speed data also progress. Stale speed never extrapolates forever.
 if(riding&&live){
  distance=progress.distanceMeters;
  elapsed+=dt;
  if(wall-lastRecordAt>=1000){
   recorder.push({t:wall,distance,cadence:liveCadence(wall),power:livePower?power:undefined,hr:heartRate||undefined});
   lastRecordAt=wall;
  }
 }
 if(isEndless&&distance>profile.totalMeters-16000){
  const extra=generateProfile(100,profile.terrain,profile.seed+Math.floor(profile.totalMeters/1000));
  const offset=profile.samples[profile.samples.length-1]-extra.samples[0];
  profile={...profile,samples:profile.samples.concat(extra.samples.slice(1).map(x=>x+offset)),totalMeters:profile.totalMeters+extra.totalMeters};
  renderProfile();
 }
 const idx=Math.min(profile.samples.length-2,Math.max(0,Math.floor(distance/profile.totalMeters*(profile.samples.length-1))));
 const grade=(profile.samples[idx+1]-profile.samples[idx])/(profile.totalMeters/(profile.samples.length-1))*100;
 get('distance').textContent=(distance/METERS_PER_MILE).toFixed(2);
 get('power').textContent=livePower?String(Math.round(power||0)):'—';
 const frame={distanceMeters:distance,totalMeters:profile.totalMeters,samples:profile.samples,
  elapsedSeconds:elapsed,gradePercent:grade,
  powerWatts:livePower?power:undefined,powerAvailable:livePower,
  cadenceRpm:lastCadenceAt>0&&wall-lastCadenceAt<4500?cadence:undefined,
  cadenceAvailable:lastCadenceAt>0&&wall-lastCadenceAt<4500,
  heartRateBpm:heartRate,speedMph:progress.speedMps*2.236936,
  gear,ftpWatts:Number(get<HTMLInputElement>('ftp').value)||250,
  running:riding&&live,connected:live};
 window.dispatchEvent(new CustomEvent('pedalkin:ride-frame',{detail:frame}));
}
window.setInterval(()=>publishFrame(performance.now()),250);
