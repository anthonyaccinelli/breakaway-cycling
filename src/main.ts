import './style.css';
import {createClient} from '@supabase/supabase-js';
import {startRiderPresence} from './rider-presence';
import {renderAdvancedRideCharts} from './ride-analysis';

startRiderPresence(createClient, document.getElementById('liveRidersCount'), document.getElementById('liveRiders'));
type Point = {distance:number; elevation:number; grade:number};
type BLEDevice = any;
const FTMS='00001826-0000-1000-8000-00805f9b34fb';
const CYCLING_POWER='00001818-0000-1000-8000-00805f9b34fb';
const CYCLING_POWER_MEASUREMENT='00002a63-0000-1000-8000-00805f9b34fb';
const CONTROL='00002ad9-0000-1000-8000-00805f9b34fb';
const STATUS='00002ada-0000-1000-8000-00805f9b34fb';
const BIKE='00002ad2-0000-1000-8000-00805f9b34fb';
let cycleQuestHold=false;let cycleQuestHeldSpeed=0;
let drivetrainMode:'traditional'|'virtual'='traditional';let realTelemetry=false;let trainerMode:'sim'|'erg'|'target'='sim';let lastTarget=0;let targetErgWatts=180;let lastFixedErgCommand=0;let controlResponseWaiter:((v:DataView)=>void)|null=null;let controlQueue=Promise.resolve();let points:Point[]=[];let distance=0;let speed=0;let power=0;let cadence=0;let gear=6;let running=false;let last=0;let device:BLEDevice;let control:any;let connected=false;let controlGranted=false;let pending=false;let trainerGrade=NaN;
// Procedural routes: deterministic, streaming terrain; never allocate the entire endless route.
type Terrain = 'flat'|'rolling'|'mountain'|'punchy';
let procedural=false, endless=false, proceduralSeed=0, proceduralTerrain:Terrain='rolling', proceduralIntensity=1;
let routeLimit=0, generatedThrough=0;
let gainScale=1, plannedGainFeet:number|null=null;
// Elevation totals for discarded route segments, in meters. Never reset on chunk eviction.
let retiredGainMeters=0, retiredLossMeters=0;
// Bounded, compressed overview of retired endless terrain. Cumulative totals are
// stored at each checkpoint, so inspecting the past does not depend on live points.
type HistoryPoint = Point & {gain:number;loss:number};
let elevationHistory:HistoryPoint[]=[];
let historyStride=400; // meters between archived checkpoints; doubles when compacted
function archivePoint(p:Point,gain:number,loss:number){
 const prev=elevationHistory.at(-1);
 if(!prev||p.distance-prev.distance>=historyStride){
  elevationHistory.push({...p,gain,loss});
  if(elevationHistory.length>3000){elevationHistory=elevationHistory.filter((_,i)=>i%2===0);historyStride*=2;}
 }
}
function overviewPoints():Point[]{
 if(!endless)return points;
 const boundary=points[0]?.distance??Infinity;
 return [...elevationHistory.filter(p=>p.distance<boundary),...points];
}
function overviewAt(d:number):Point{
 if(!endless||!points.length||d>=points[0].distance)return at(d);
 const arr=elevationHistory;
 if(!arr.length)return at(d);
 if(d<=arr[0].distance)return {...arr[0]};
 let lo=0,hi=arr.length-1;
 while(lo<hi){const m=(lo+hi)>>1;if(arr[m].distance<d)lo=m+1;else hi=m;}
 const b=arr[lo],a=arr[Math.max(0,lo-1)];const t=Math.max(0,Math.min(1,(d-a.distance)/Math.max(1,b.distance-a.distance)));
 return {distance:d,elevation:a.elevation+(b.elevation-a.elevation)*t,grade:a.grade+(b.grade-a.grade)*t};
}
function resetClimbingTotals(){retiredGainMeters=0;retiredLossMeters=0;elevationHistory=[];historyStride=400;}
function accumulateRetiredTerrain(cutIndex:number){
 for(let i=1;i<=cutIndex;i++){
  const delta=points[i].elevation-points[i-1].elevation;
  if(delta>=0)retiredGainMeters+=delta;else retiredLossMeters-=delta;
  archivePoint(points[i],retiredGainMeters,retiredLossMeters);
 }
}

function totalClimb(pts:Point[]){let gain=0;for(let i=1;i<pts.length;i++)gain+=Math.max(0,pts[i].elevation-pts[i-1].elevation);return gain*FEET_PER_METER;}
function estimatedGain(scale:number){
 let gain=0;
 for(let start=0;start<routeLimit;start+=STEP){const end=Math.min(routeLimit,start+STEP);const grade=Math.max(-12,Math.min(12,terrainGradeRaw((start+end)/2)*scale));gain+=Math.max(0,grade)*(end-start)/100;}
 return gain*FEET_PER_METER;
}
function solveGain(target:number){
 let lo=0,hi=1;
 while(estimatedGain(hi)<target&&hi<10000)hi*=2;
 if(estimatedGain(hi)+1<target)throw Error('Requested elevation gain exceeds the 12% grade limit for this route.');
 for(let i=0;i<22;i++){const mid=(lo+hi)/2;if(estimatedGain(mid)<target)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
const CHUNK=1609.344*5, STEP=80;
// Seeded, non-repeating hill segments. Each segment has its own length, height,
// steepness, direction and asymmetric crest. No repeating sine-wave patterns.
// The seed makes the same route reproducible across reloads and endless chunks.
type Hill = {start:number; end:number; sign:number; peak:number; skew:number; rough:number};
let hills:Hill[]=[];
function random01(index:number,salt:number){
 let n=(Math.imul(index+1,0x9e3779b1)^Math.imul(proceduralSeed|0,0x85ebca6b)^Math.imul(salt,0xc2b2ae35))|0;
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
 return ((n^(n>>>16))>>>0)/4294967296;
}
function resetHills(){hills=[];}
function extendHills(m:number){
 const config={flat:[220,1100,0.4,2.2],rolling:[230,1550,1.8,7.5],mountain:[450,3100,3.0,10.5],punchy:[130,950,2.5,11]}[proceduralTerrain];
 while(!hills.length||hills[hills.length-1].end<=m){
  const i=hills.length, start=i?hills[i-1].end:0;
  // Two independent random variables produce strongly nonuniform climb lengths.
  const length=config[0]+(config[1]-config[0])*Math.pow(random01(i,1),1.25);
  const sign=i===0?(random01(i,2)<0.5?1:-1):
    (random01(i,2)<0.78?-hills[i-1].sign:hills[i-1].sign);
  const peak=(config[2]+(config[3]-config[2])*Math.pow(random01(i,3),1.35))*proceduralIntensity;
  hills.push({start,end:start+length,sign,peak,skew:0.25+0.5*random01(i,4),rough:random01(i,5)});
 }
}
function terrainGradeRaw(m:number){
 extendHills(Math.max(0,m));
 // Binary search prevents long endless rides from scanning the whole hill list.
 let lo=0,hi=hills.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(hills[mid].end<=m)lo=mid+1;else hi=mid;}
 const h=hills[lo],t=Math.max(0,Math.min(1,(m-h.start)/(h.end-h.start)));
 // A different crest position and shape on every climb or descent.
 const crest=t<h.skew?t/h.skew:(1-t)/(1-h.skew);
 const envelope=Math.pow(Math.max(0,Math.sin(Math.PI*crest/2)),0.65+1.2*h.rough);
 // Seeded, spatially coherent grade variation at three road-scale wavelengths.
 // Unlike periodic sine waves, this creates uneven ramps, false flats, and
 // short pitches without introducing discontinuities at sample boundaries.
 const noise=(distance:number,spacing:number,salt:number)=>{
  const cell=Math.floor(distance/spacing),fraction=(distance/spacing)-cell;
  const smooth=fraction*fraction*(3-2*fraction);
  return (2*(random01(cell,salt)*(1-smooth)+random01(cell+1,salt)*smooth)-1);
 };
 const undulation=0.40*noise(m,920,21)+0.34*noise(m,310,22)+0.26*noise(m,95,23);
 const roughness=proceduralTerrain==='flat'?0.45:proceduralTerrain==='mountain'?1.45:1.1;
 const base=h.sign*h.peak*envelope;
 const variation=undulation*roughness*proceduralIntensity;
 // Keep the same seeded route reproducible, while making the gradient
 // irregular instead of perfectly smooth at the crest of each hill.
 return base+variation;
}
function terrainGrade(m:number){return Math.max(-12,Math.min(12,terrainGradeRaw(m)*gainScale));}
function appendTerrain(target:number){
 if(!procedural)return;
 const stop=endless?target:Math.min(target,routeLimit);
 let prev=points.at(-1);
 if(!prev){prev={distance:0,elevation:600,grade:terrainGrade(0)};points=[prev];generatedThrough=0;}
 while(generatedThrough+0.001<stop){
  const next=Math.min(stop,generatedThrough+STEP),mid=(next+generatedThrough)/2;
  const grade=terrainGrade(mid);
  const elevation:number=prev.elevation+(next-generatedThrough)*grade/100;
  prev={distance:next,elevation,grade:terrainGrade(next)};points.push(prev);generatedThrough=next;
 }
 // Preserve the latest 3 miles behind the rider, plus the forward window.
 if(endless&&points.length>1200){const cutoff=Math.max(0,distance-3*1609.344);let i=0;while(i<points.length-2&&points[i+1].distance<cutoff)i++;if(i>0){accumulateRetiredTerrain(i);points.splice(0,i);}}
}
function ensureTerrain(){if(!procedural)return;const ahead=distance+CHUNK; if(generatedThrough<ahead)appendTerrain(Math.ceil(ahead/CHUNK)*CHUNK);}
function prepareProcedural(isEndless:boolean){
 if(rideStart&&!rideEnd)finishRide();
 const input=($('generatedMiles') as HTMLInputElement).value.trim();const mi=Number(input);
 if(!isEndless&&(!input||!Number.isFinite(mi)||mi<=0||mi>Number.MAX_SAFE_INTEGER/1609.344)){status('Enter a valid positive distance in miles.');return;}
 procedural=true;endless=isEndless;routeLimit=isEndless?Infinity:mi*1609.344;
 proceduralTerrain=($('generatedTerrain') as HTMLSelectElement).value as Terrain;
 const gainText=($('generatedGain') as HTMLInputElement).value.trim(),targetGain=gainText===""?null:Number(gainText);
 if(targetGain!==null&&(!Number.isFinite(targetGain)||targetGain<0)){status("Enter a valid total elevation gain in feet.");return;}
 proceduralIntensity=Number(($('generatedDifficulty') as HTMLSelectElement).value);
 proceduralSeed=Number(($('generatedSeed') as HTMLInputElement).value)||Math.floor(Math.random()*1000000000);
 ($('generatedSeed') as HTMLInputElement).value=String(proceduralSeed);
 resetHills();gainScale=1;plannedGainFeet=null;
 if(!isEndless){
  try{gainScale=targetGain===null?1:targetGain===0?0:solveGain(targetGain);plannedGainFeet=estimatedGain(gainScale);}
  catch(error){status(String(error));return;}
 }
 routeName=`${isEndless?'Endless':'Generated'} ${proceduralTerrain} ride (seed ${proceduralSeed})`;
 clearElevationEditor();zoomMeters=null;selectedClimbIndex=-1;inspectDistance=null;resetClimbingTotals();points=[];generatedThrough=0;distance=0;speed=0;rideStart=null;rideEnd=null;clearRideRecovery();running=false;resetRideMetrics();
 resetSimController();setRideFocus(false);$('start').textContent='Let’s Ride!';if(!isEndless&&routeLimit/STEP<=250000)appendTerrain(routeLimit);else ensureTerrain();svg();update();
 if(!isEndless){const actualGain=Math.round(gainLossThrough(routeLimit).gain*FEET_PER_METER);($('generatedGain') as HTMLInputElement).value=String(actualGain);($('generatedMiles') as HTMLInputElement).value=(routeLimit/METERS_PER_MILE).toFixed(1);}
 status(`${isEndless?'Endless ride ready':`Generated ${mi} mi route ready`} — connect trainer and pedal to begin.`);
}
// Dashboard metrics: 3-second rolling power and power-derived energy expenditure.
// 24% assumed gross efficiency; 150 kcal per illustrative beer (not alcohol guidance).
const POWER_WINDOW_MS=3000, BEER_KCAL=150, GROSS_EFFICIENCY=0.24;
let powerHistory:{time:number;watts:number}[]=[];
let energyKcal=0, activeRideMs=0, lastActiveTick=0;
type RideSample={seconds:number; distance:number; elevation:number; power:number; cadence:number; heartRate:number|null};
let rideSamples:RideSample[]=[];let lastSampleSecond=-1;
// v409: local, versioned crash-recovery checkpoint. Never stores Bluetooth credentials.
const RIDE_RECOVERY_KEY='breakaway-ride-recovery-v409';
type RideCheckpoint={version:1;savedAt:number;rideStart:string;rideEnd:string|null;routeName:string;points:Point[];distance:number;speed:number;procedural:boolean;endless:boolean;proceduralSeed:number;proceduralTerrain:Terrain;proceduralIntensity:number;routeLimit:number;generatedThrough:number;gainScale:number;plannedGainFeet:number|null;retiredGainMeters:number;retiredLossMeters:number;elevationHistory:HistoryPoint[];historyStride:number;activeRideMs:number;energyKcal:number;avgPowerEnergy:number;avgPowerDuration:number;rideSamples:RideSample[]};
let recoveryWriteFailed=false;
function clearRideRecovery(){try{localStorage.removeItem(RIDE_RECOVERY_KEY);}catch{}}
function saveRideRecovery(){
 if(!rideStart||!points.length)return;
 const checkpoint:RideCheckpoint={version:1,savedAt:Date.now(),rideStart,rideEnd,routeName,points,distance,speed,procedural,endless,proceduralSeed,proceduralTerrain,proceduralIntensity,routeLimit: Number.isFinite(routeLimit)?routeLimit:-1,generatedThrough,gainScale,plannedGainFeet,retiredGainMeters,retiredLossMeters,elevationHistory,historyStride,activeRideMs,energyKcal,avgPowerEnergy,avgPowerDuration,rideSamples};
 try{localStorage.setItem(RIDE_RECOVERY_KEY,JSON.stringify(checkpoint));recoveryWriteFailed=false;}
 catch(error){if(!recoveryWriteFailed){console.warn('Ride autosave unavailable',error);status('Ride autosave unavailable — storage full or blocked. Export your TCX when finished.');}recoveryWriteFailed=true;}
}
function readRideRecovery():RideCheckpoint|null{
 try{const raw=localStorage.getItem(RIDE_RECOVERY_KEY);if(!raw)return null;const value=JSON.parse(raw) as RideCheckpoint;
 if(value.version!==1||!value.rideStart||!Array.isArray(value.points)||!value.points.length||!Array.isArray(value.rideSamples)||!Number.isFinite(value.distance)||!Number.isFinite(value.activeRideMs))throw Error('Invalid checkpoint');
 return value;
 }catch(error){console.warn('Invalid ride checkpoint',error);return null;}
}
function restoreRideRecovery(c:RideCheckpoint){
 // A restored ride is always paused. No resistance/control command is sent until the rider reconnects and presses Resume.
 running=false;rideStart=c.rideStart;rideEnd=c.rideEnd||null;routeName=c.routeName;points=c.points;distance=c.distance;speed=0;
 procedural=c.procedural;endless=c.endless;proceduralSeed=c.proceduralSeed;proceduralTerrain=c.proceduralTerrain;proceduralIntensity=c.proceduralIntensity;routeLimit=c.routeLimit===-1?Infinity:c.routeLimit;generatedThrough=c.generatedThrough;gainScale=c.gainScale;plannedGainFeet=c.plannedGainFeet;
 retiredGainMeters=c.retiredGainMeters||0;retiredLossMeters=c.retiredLossMeters||0;elevationHistory=c.elevationHistory||[];historyStride=c.historyStride||400;
 activeRideMs=c.activeRideMs;energyKcal=c.energyKcal;avgPowerEnergy=c.avgPowerEnergy;avgPowerDuration=c.avgPowerDuration;rideSamples=c.rideSamples;lastSampleSecond=rideSamples.at(-1)?.seconds??-1;powerHistory=[];lastActiveTick=0;stationarySince=0;stationaryPromptShown=false;
 resetSimController();setRideFocus(false);$('start').textContent=rideEnd?'Let’s Ride!':'Resume ride';syncManualFinishButton();svg();update();showBreakawayScreen('ride');if(rideEnd){showRideSummary();status('Finished ride summary recovered.');}else status('Ride recovered and paused. Reconnect trainer, then resume or finish.');
}
function offerRideRecovery(){
 const saved=readRideRecovery();if(!saved)return;
 const overlay=document.createElement('div');overlay.className='stationary-ride-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 const dialog=document.createElement('div');dialog.className='stationary-ride-dialog';const title=document.createElement('h2');title.textContent='Recover your ride?';const detail=document.createElement('p');
 const minutes=Math.floor(saved.activeRideMs/60000);detail.textContent=`${saved.routeName} · ${(saved.distance/METERS_PER_MILE).toFixed(2)} mi · ${minutes} min recorded. Saved ${new Date(saved.savedAt).toLocaleString()}. The saved ride will reopen ${saved.rideEnd?"at its summary":"paused"}.`;
 const actions=document.createElement('div');actions.className='stationary-ride-actions';const discard=document.createElement('button');discard.className='secondary';discard.textContent='Discard saved ride';const recover=document.createElement('button');recover.textContent='Recover ride';
 discard.onclick=()=>{clearRideRecovery();overlay.remove();};recover.onclick=()=>{try{restoreRideRecovery(saved);overlay.remove();}catch(error){console.error('Recovery failed',error);status('Could not restore saved ride. Reload to try again.');}};
 actions.append(discard,recover);dialog.append(title,detail,actions);overlay.append(dialog);document.body.append(overlay);recover.focus();
}

function recordRideSample(){
 const seconds=Math.floor(activeRideMs/1000);
 if(seconds<=lastSampleSecond)return;
 lastSampleSecond=seconds;
 rideSamples.push({seconds,distance,elevation:at(distance).elevation,power:Math.round(Math.max(0,power)),cadence:Math.round(Math.max(0,cadence)),heartRate:Number(($('heartRate').textContent||'').trim())||null});
}
function tcxEscape(v:string){return v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));}
function buildRideTcx(){
 if(!rideStart||!rideEnd||rideSamples.length<2)throw Error('Not enough recorded ride data to upload.');
 const startMs=Date.parse(rideStart),start=new Date(startMs).toISOString();
 const entries=rideSamples.map(s=>{
  const t=new Date(startMs+s.seconds*1000).toISOString();
  return `<Trackpoint><Time>${t}</Time><AltitudeMeters>${s.elevation.toFixed(2)}</AltitudeMeters><DistanceMeters>${s.distance.toFixed(2)}</DistanceMeters>${s.heartRate!==null?`<HeartRateBpm><Value>${s.heartRate}</Value></HeartRateBpm>`:''}<Cadence>${s.cadence}</Cadence><Extensions><TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2"><Watts>${s.power}</Watts><Speed>${(s.seconds>0?s.distance/s.seconds:0).toFixed(2)}</Speed></TPX></Extensions></Trackpoint>`;
 }).join('');
 return `<?xml version="1.0" encoding="UTF-8"?><TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"><Activities><Activity Sport="Biking"><Id>${start}</Id><Lap StartTime="${start}"><TotalTimeSeconds>${(activeRideMs/1000).toFixed(1)}</TotalTimeSeconds><DistanceMeters>${distance.toFixed(2)}</DistanceMeters><Calories>${Math.round(energyKcal)}</Calories><Intensity>Active</Intensity><TriggerMethod>Manual</TriggerMethod><Track>${entries}</Track></Lap><Notes>${tcxEscape(routeName)}</Notes></Activity></Activities></TrainingCenterDatabase>`;
}

type SavedRide={id:string;start:string;end:string;name:string;meters:number;elapsed:number;kcal:number;gain:number;avgPower:number|null;tcx:string};
const RIDE_DB='breakaway-local-rides-v1',RIDE_STORE='rides';
function rideDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 const request=indexedDB.open(RIDE_DB,1);
 request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(RIDE_STORE))request.result.createObjectStore(RIDE_STORE,{keyPath:'id'});};
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});}
async function rideTransaction<T>(mode:IDBTransactionMode,work:(store:IDBObjectStore,done:(value:T)=>void)=>void):Promise<T>{
 const db=await rideDb();
 return new Promise<T>((resolve,reject)=>{
  const tx=db.transaction(RIDE_STORE,mode);let result:T;let assigned=false;
  tx.oncomplete=()=>{db.close();if(assigned)resolve(result);else reject(Error('Ride database operation incomplete'));};
  tx.onerror=()=>{db.close();reject(tx.error||Error('Ride storage failed'));};
  tx.onabort=()=>{db.close();reject(tx.error||Error('Ride storage cancelled'));};
  work(tx.objectStore(RIDE_STORE),value=>{result=value;assigned=true;});
 });}
function savedRides():Promise<SavedRide[]>{return rideTransaction('readonly',(store,done)=>{const req=store.getAll();req.onsuccess=()=>done((req.result as SavedRide[]).sort((a,b)=>b.start.localeCompare(a.start)));});}
function saveRide(ride:SavedRide):Promise<void>{return rideTransaction('readwrite',(store,done)=>{store.put(ride);done(undefined);});}
function deleteRide(id:string):Promise<void>{return rideTransaction('readwrite',(store,done)=>{store.delete(id);done(undefined);});}
function downloadTcx(ride:SavedRide){
 const url=URL.createObjectURL(new Blob([ride.tcx],{type:'application/vnd.garmin.tcx+xml;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='breakaway-'+ride.start.replace(/[:.]/g,'-')+'.tcx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function renderRideHistory(){
 const list=document.getElementById('localRideHistory');if(!list)return;
 list.replaceChildren();
 try{
  const rides=await savedRides();
  if(!rides.length){const empty=document.createElement('p');empty.className='note';empty.textContent='No saved rides yet. Finished rides will appear here automatically.';list.append(empty);return;}
  for(const ride of rides){
   const item=document.createElement('div');item.className='ride-history-item';
   const details=document.createElement('div');
   const title=document.createElement('strong');title.textContent=ride.name||'Virtual Ride';
   const stats=document.createElement('p');stats.className='note';stats.textContent=`${new Date(ride.start).toLocaleString()} · ${(ride.meters/METERS_PER_MILE).toFixed(2)} mi · ${Math.round(ride.elapsed/60)} min · ${Math.round(ride.gain)} ft climbed`;
   details.append(title,stats);item.append(details);
   const actions=document.createElement('div');actions.className='ride-history-actions';
   const download=document.createElement('button');download.type='button';download.className='secondary';download.textContent='Download TCX';download.onclick=()=>downloadTcx(ride);actions.append(download);

   const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Delete';remove.onclick=async()=>{if(!confirm('Delete this locally saved ride? This cannot be undone.'))return;try{await deleteRide(ride.id);await renderRideHistory();}catch(e){alert('Could not delete ride: '+String(e));}};actions.append(remove);
   item.append(actions);list.append(item);
  }
 }catch(e){list.textContent='Local ride history unavailable: '+String(e);}
}
async function archiveFinishedRide(){
 if(!rideStart||!rideEnd||rideSamples.length<2)throw Error('Not enough recorded data to archive ride.');
 try{
  const gain=points.length?gainLossThrough(distance).gain*FEET_PER_METER:rideSamples.reduce((a,x,i)=>a+(i?Math.max(0,x.elevation-rideSamples[i-1].elevation):0),0)*FEET_PER_METER;
  await saveRide({id:rideStart,start:rideStart,end:rideEnd,name:routeName,meters:distance,elapsed:activeRideMs/1000,kcal:energyKcal,gain,avgPower:avgPowerDuration>0?avgPowerEnergy/avgPowerDuration:null,tcx:buildRideTcx()});
  await renderRideHistory();
 }catch(e){status('Could not save ride locally: '+String(e));throw e;}
}

function resetRideMetrics(){rideSamples=[];lastSampleSecond=-1;powerHistory=[];energyKcal=0;activeRideMs=0;lastActiveTick=0;avgPowerEnergy=0;avgPowerDuration=0;}
function threeSecondWatts(){
 if(!realTelemetry||!powerHistory.length)return null;
 const now=performance.now();
 const samples=powerHistory.filter(s=>now-s.time<=POWER_WINDOW_MS);
 if(!samples.length)return null;
 // Time-weighted average, treating each reading as valid until the next reading.
 let sum=0,total=0;
 for(let i=0;i<samples.length;i++){
  const start=Math.max(now-POWER_WINDOW_MS,samples[i].time);
  const end=i+1<samples.length?Math.min(now,samples[i+1].time):now;
  const duration=Math.max(0,end-start);sum+=samples[i].watts*duration;total+=duration;
 }
 return total>0?sum/total:samples.at(-1)!.watts;
}
function rideClock(){
 const seconds=Math.floor(activeRideMs/1000);
 return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}

let rideStart:string|null=null;let rideEnd:string|null=null;let pedalSince=0;let rideAwaitingPedaling=false;let routeName='Virtual Ride';
let stationarySince=0;let stationaryPromptShown=false;
const STOP_SPEED_MPS=0.15; // About 0.34 mph; power alone must never trigger a stop.
function closeStationaryPrompt(){document.getElementById('stationaryRidePrompt')?.remove();}
function showStationaryPrompt(){
 if(!running||!rideStart||rideEnd)return;
 // Pausing is non-modal: rider can resume with the button or by pedaling.
 stationaryPromptShown=true;
 pauseRide();
 status('Ride paused after 30 seconds stationary. Pedal for 3 seconds or select Resume ride.');
}
function checkStationaryRide(now:number){
 if(!running||!connected||!realTelemetry||!rideStart||rideEnd){stationarySince=0;return;}
 if(speed>STOP_SPEED_MPS||cadence>=20||power>=15){stationarySince=0;return;}
 if(!stationarySince)stationarySince=now;
 if(now-stationarySince>=30000)showStationaryPrompt();
}

let avgPowerEnergy=0, avgPowerDuration=0;
function showRideSummary(){
 const root=$('rideSummary');
 const gain=(()=>{try{return points.length?gainLossThrough(distance).gain*FEET_PER_METER:rideSamples.reduce((acc,s,i)=>acc+(i?Math.max(0,s.elevation-rideSamples[i-1].elevation):0),0)*FEET_PER_METER;}catch{return 0;}})();
 const elapsed=rideClock();
 const values:[string,string][]=[
  ['Distance',`${(distance/METERS_PER_MILE).toFixed(2)} mi`],
  ['Ride time',elapsed],
  ['Elevation gain',`${Math.round(gain).toLocaleString()} ft`],
  ['Estimated calories',`${Math.round(energyKcal)} kcal`],
  ['Average power',avgPowerDuration>0?`${Math.round(avgPowerEnergy/avgPowerDuration)} W`:'—'],
  ['Average speed',activeRideMs>0?`${(distance/(activeRideMs/1000)*MPH_PER_MPS).toFixed(1)} mph`:'—'],
  ['Maximum power',rideSamples.length?`${rideSamples.reduce((max,s)=>Math.max(max,s.power),0)} W`:'—'],
  ['Average cadence',rideSamples.some(s=>s.cadence>0)?`${Math.round(rideSamples.reduce((a,s)=>a+s.cadence,0)/rideSamples.length)} rpm`:'—'],
  ['Maximum cadence',rideSamples.length?`${rideSamples.reduce((max,s)=>Math.max(max,s.cadence),0)} rpm`:'—'],
  ['Average heart rate',rideSamples.some(s=>s.heartRate!==null)?`${Math.round(rideSamples.filter(s=>s.heartRate!==null).reduce((a,s)=>a+(s.heartRate||0),0)/rideSamples.filter(s=>s.heartRate!==null).length)} bpm`:'—'],
  ['Maximum heart rate',rideSamples.some(s=>s.heartRate!==null)?`${rideSamples.reduce((max,s)=>Math.max(max,s.heartRate||0),0)} bpm`:'—']
 ];
 root.replaceChildren();
 const title=document.createElement('h2');title.textContent='Ride complete';root.append(title);
 const rideName=document.createElement('p');rideName.textContent=routeName;root.append(rideName);
 const grid=document.createElement('div');grid.className='ride-summary-grid';
 for(const [label,value] of values){const item=document.createElement('div');item.className='ride-summary-stat';const small=document.createElement('small');small.textContent=label;const strong=document.createElement('strong');strong.textContent=value;item.append(small,strong);grid.append(item);}
 root.append(grid);
 renderAdvancedRideCharts(root,rideSamples,Number((document.getElementById('ftp') as HTMLInputElement|null)?.value)||250);
 const saveTcx=document.createElement('button');saveTcx.type='button';saveTcx.className='secondary';saveTcx.textContent='Download TCX';saveTcx.onclick=()=>{try{downloadTcx({id:rideStart||'',start:rideStart||'',end:rideEnd||'',name:routeName,meters:distance,elapsed:activeRideMs/1000,kcal:energyKcal,gain,avgPower:null,tcx:buildRideTcx()});}catch(e){status(String(e));}};root.append(saveTcx);
 const garminBox=document.createElement('section');garminBox.className='garmin-export-card';garminBox.setAttribute('aria-label','Garmin Connect export');
 const garminTitle=document.createElement('h3');garminTitle.textContent='Garmin Connect';
 const garminInfo=document.createElement('p');garminInfo.className='note';garminInfo.textContent='Automatic activity upload is not connected yet. Garmin’s standard Activity API imports rides from Garmin into partner apps; sending Breakaway rides to Garmin requires a separately approved upload integration. For now, export this ride and import it into Garmin Connect.';
 const garminActions=document.createElement('div');garminActions.className='garmin-export-actions';
 const garminDownload=document.createElement('button');garminDownload.type='button';garminDownload.className='secondary';garminDownload.textContent='Download / Upload to Garmin Connect';
 garminDownload.addEventListener('click',()=>{
  // Open in the user gesture before initiating the file download, avoiding popup blockers.
  const connectTab=window.open('https://connect.garmin.com/modern/activities','_blank','noopener,noreferrer');
  try{downloadTcx({id:rideStart||'',start:rideStart||'',end:rideEnd||'',name:routeName,meters:distance,elapsed:activeRideMs/1000,kcal:energyKcal,gain,avgPower:null,tcx:buildRideTcx()});}
  catch(e){status('Could not download ride: '+String(e));}
  if(!connectTab)status('Ride download started. Allow pop-ups to open Garmin Connect automatically.');
 });
 const garminHelp=document.createElement('p');garminHelp.className='note';garminHelp.textContent='Downloads your .tcx ride file and opens Garmin Connect in a new tab. In Garmin Connect, use the cloud upload icon → Import Data → choose the downloaded file.';
 garminActions.append(garminDownload);garminBox.append(garminTitle,garminInfo,garminActions,garminHelp);root.append(garminBox);
 const note=document.createElement('p');note.className='note';note.textContent='Ride history and TCX files are stored in this browser, not the Breakaway cloud. Export TCX backups regularly.';root.append(note);
 const done=document.createElement('button');done.type='button';done.textContent='Done — new ride';done.addEventListener('click',()=>{root.hidden=true;root.style.removeProperty('display');root.classList.remove('ride-summary-fullscreen');setRideFocus(false);distance=0;speed=0;rideStart=null;rideEnd=null;resetRideMetrics();resetSimController();$('start').textContent='Let’s Ride!';syncManualFinishButton();update();});root.append(done);
 document.body.append(root);root.hidden=false;root.classList.add('ride-summary-fullscreen');root.style.display='block';root.scrollTop=0;
}
function setRideFocus(active:boolean){
 document.body.classList.toggle('ride-focus-active',active);
 if(active){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const stage=document.querySelector<HTMLElement>('.ride-stage');
   if(!stage)return;
   const top=window.scrollY+stage.getBoundingClientRect().top-8;
   window.scrollTo({top:Math.max(0,top),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }));
 }
}
function syncManualFinishButton(){
 const button=document.getElementById('rideFinishNow') as HTMLButtonElement|null;
 if(button)button.hidden=!(rideStart&&!rideEnd);
}
function confirmManualFinish(){
 if(!rideStart||rideEnd)return;
 const overlay=document.createElement('div');overlay.id='manualFinishPrompt';overlay.className='stationary-ride-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','manualFinishTitle');
 overlay.innerHTML='<div class="stationary-ride-dialog"><h2 id="manualFinishTitle">Finish your ride?</h2><p>Your ride will end and your recorded statistics will be available in the summary and TCX download.</p><div class="stationary-ride-actions"><button type="button" id="manualKeepRiding">Keep riding</button><button type="button" class="secondary" id="manualConfirmFinish">Finish ride</button></div></div>';
 document.body.append(overlay);
 overlay.querySelector<HTMLButtonElement>('#manualKeepRiding')!.onclick=()=>overlay.remove();
 overlay.querySelector<HTMLButtonElement>('#manualConfirmFinish')!.onclick=()=>{overlay.remove();finishRide();};
 overlay.querySelector<HTMLButtonElement>('#manualKeepRiding')!.focus();
}
function beginRide(){rideAwaitingPedaling=false;stationarySince=0;stationaryPromptShown=false;closeStationaryPrompt();if(running||!points.length||!connected||!controlGranted||!realTelemetry)return; if(!rideStart||rideEnd){editElevation=false;chartEl.classList.remove('editing');$('editElevation').textContent='Edit elevation';rideStart=new Date().toISOString();rideEnd=null;clearRideRecovery();resetRideMetrics();$('rideSummary').hidden=true;}running=true;setRideFocus(true);if(rideExperience==='cyclequest')showCycleQuest();else showBreakawayScreen('ride');lastActiveTick=performance.now();$('start').textContent='Pause ride';syncManualFinishButton();void command([0x07]);if(trainerMode==='target')void setFixedErgPower(true);else if(trainerMode==='erg')void setVirtualGearResistance();else{resetSimController();void updateSimResistance(performance.now(),true);}status('Ride started');}
function pauseRide(){if(!running)return;rideAwaitingPedaling=(breakawayScreen==='ride'||rideExperience==='cyclequest')&&!rideEnd;running=false;lastActiveTick=0;pedalSince=0;$('start').textContent='Resume ride';if(connected&&controlGranted)void command([0x08,0x02]);}
function finishRide(){
 closeStationaryPrompt();stationarySince=0;
 if(!rideStart||rideEnd)return;
 try{recordRideSample();}catch(error){console.warn('Could not record final ride sample',error);}
 pauseRide();setRideFocus(false);
 rideEnd=new Date().toISOString();
 rideAwaitingPedaling=false;
 saveRideRecovery(); // Preserve final stats until archival succeeds.
 $('start').textContent='Let’s Ride!';syncManualFinishButton();
 try{showRideSummary();}
 catch(error){
  console.error('Ride summary error',error);
  const root=$('rideSummary');document.body.append(root);root.replaceChildren();
  const heading=document.createElement('h2');heading.textContent='Ride complete';root.append(heading);
  const note=document.createElement('p');note.textContent='Your ride ended, but some summary statistics could not be displayed.';root.append(note);
  const reset=document.createElement('button');reset.textContent='Done — New Ride';reset.onclick=()=>{root.hidden=true;root.style.removeProperty('display');root.classList.remove('ride-summary-fullscreen');rideStart=null;rideEnd=null;clearRideRecovery();distance=0;speed=0;resetRideMetrics();resetSimController();syncManualFinishButton();update();};root.append(reset);
  root.hidden=false;root.classList.add('ride-summary-fullscreen');root.style.display='block';
 }
 const completedRideId=rideStart;
 void archiveFinishedRide().then(()=>{const saved=readRideRecovery();if(saved?.rideStart===completedRideId)clearRideRecovery();}).catch(error=>console.warn('Ride archive failed; recovery checkpoint retained',error));
 status('Ride complete');
}
// Zwift default Mixed Terrain 1x24 published virtual gear ratios.
// Ratios are relative to gear 12 (2.40), matching Zwift's midpoint reference.
const ZWIFT_GEAR_RATIOS:readonly number[]=[
 0.75,0.87,0.99,1.11,1.23,1.38,1.53,1.68,
 1.86,2.04,2.22,2.40,2.61,2.82,3.03,3.24,
 3.49,3.74,3.99,4.24,4.54,4.84,5.14,5.49
];
const zwiftGearMultiplier=()=>ZWIFT_GEAR_RATIOS[gear-1]/ZWIFT_GEAR_RATIOS[11];
const SIM_TEST_WATTS=300, SIM_COMMAND_INTERVAL_MS=750;
const SIM_GRADE_SLEW_PERCENT_PER_SECOND=1.0;
let simAppliedGrade=NaN,simLastTime=0,simLastCommandTime=0,simBusy=false;
const $=(id:string)=>document.getElementById(id)!;
$('generateRoute').addEventListener('click',()=>prepareProcedural(false));
$('endlessRoute').addEventListener('click',()=>prepareProcedural(true));
$('surpriseRoute').addEventListener('click',()=>{
 const terrainInput=$('generatedTerrain') as HTMLSelectElement;
 const difficultyInput=$('generatedDifficulty') as HTMLSelectElement;
 const seedInput=$('generatedSeed') as HTMLInputElement;
 const milesInput=$('generatedMiles') as HTMLInputElement;
 const gainInput=$('generatedGain') as HTMLInputElement;
 const terrainOptions:Terrain[]=['flat','rolling','mountain','punchy'];
 const difficultyOptions=[0.55,1,1.35];
 // Always produce a finite 5–20 mile route. Each new seed generates
 // natural randomized elevation changes; no stale elevation target carries over.
 const randomMiles=Math.round((5+Math.random()*15)*10)/10;
 milesInput.value=randomMiles.toFixed(1);
 gainInput.value='';
 terrainInput.value=terrainOptions[Math.floor(Math.random()*terrainOptions.length)];
 difficultyInput.value=String(difficultyOptions[Math.floor(Math.random()*difficultyOptions.length)]);
 seedInput.value=String(Math.floor(Math.random()*1000000000)+1);
 prepareProcedural(false);
});

const num=(id:string)=>Number(($(id) as HTMLInputElement).value);
const weightKg=(id:string)=>num(id)/POUNDS_PER_KG;
const status=(s:string)=>{$('status').textContent=s;const diagnostic=document.querySelector<HTMLElement>('.trainer-diagnostic');if(diagnostic&&/trainer connection error|ftms|gatt|bluetooth/i.test(s)){diagnostic.textContent=s;diagnostic.hidden=false;}};
const rad=(v:number)=>v*Math.PI/180;
const METERS_PER_MILE=1609.344;
const FEET_PER_METER=3.280839895;
const MPH_PER_MPS=2.2369362921;
const POUNDS_PER_KG=2.2046226218;
// GPX and trainer physics remain SI internally; imperial is used for display/input only.

function parseGPX(xml:string):Point[]{
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror'))throw Error('Invalid route XML');
 const all=Array.from(doc.getElementsByTagName('*'));
 const tcx=all.some(e=>e.localName==='TrainingCenterDatabase');
 const nodes=all.filter(e=>tcx?e.localName==='Trackpoint':['trkpt','rtept'].includes(e.localName));
 const childText=(node:Element,name:string)=>Array.from(node.getElementsByTagName('*')).find(e=>e.localName===name)?.textContent?.trim()||'';
 const raw=nodes.map(e=>{
  const lat=tcx?Number(childText(e,'LatitudeDegrees')):Number(e.getAttribute('lat'));
  const lon=tcx?Number(childText(e,'LongitudeDegrees')):Number(e.getAttribute('lon'));
  const elevationText=tcx?childText(e,'AltitudeMeters'):childText(e,'ele');
  return {lat,lon,ele:elevationText===''?NaN:Number(elevationText)};
 }).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Number.isFinite(p.ele)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180);
 if(raw.length<2)throw Error('Route must contain at least two GPS points with elevation');
 let d=0;const result:Point[]=[{distance:0,elevation:raw[0].ele,grade:0}];
 for(let i=1;i<raw.length;i++){
  const a=raw[i-1],b=raw[i];const dl=rad(b.lat-a.lat),dn=rad(b.lon-a.lon);
  const h=Math.sin(dl/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dn/2)**2;
  const segment=6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
  if(segment<0.5)continue;
  d+=segment;result.push({distance:d,elevation:b.ele,grade:0});
 }
 // Calculate grade over a 30m window to suppress short GPS elevation spikes.
 for(let i=0;i<result.length;i++){
  let a=i,b=i;while(a>0&&result[i].distance-result[a].distance<15)a--;
  while(b<result.length-1&&result[b].distance-result[i].distance<15)b++;
  const run=result[b].distance-result[a].distance;
  result[i].grade=run>0?Math.max(-20,Math.min(20,100*(result[b].elevation-result[a].elevation)/run)):0;
 }
 return result;
}
function at(d:number):Point{
 if(!points.length)return {distance:0,elevation:0,grade:0};
 let lo=0,hi=points.length-1;while(lo<hi){const m=(lo+hi)>>1;if(points[m].distance<d)lo=m+1;else hi=m;}
 const b=points[lo],a=points[Math.max(0,lo-1)];const t=b.distance===a.distance?0:Math.max(0,Math.min(1,(d-a.distance)/(b.distance-a.distance)));
 return {distance:d,elevation:a.elevation+(b.elevation-a.elevation)*t,grade:a.grade+(b.grade-a.grade)*t};
}
// Automatic categorized climbs. Classification uses distance and mean ascent grade;
// duration examples are descriptive, not fixed time limits.
type Climb = {start:number;end:number;category:string;meanGrade:number;gain:number};
let climbs:Climb[]=[];
let lastClimbScan=0;
let climbAwardUntil=0;
let awardedClimbEnd=-1;
let previousRideDistance=0;
let activeClimbKey='';
let climbSpeedEstimate=3.0; // m/s fallback until moving samples are available
function climbCategory(km:number,grade:number):string|null{
 if(km>=15&&grade>=7)return 'HC';
 if(km>=8&&km<=18&&grade>=6&&grade<=9)return 'CAT 1';
 if(km>=5&&km<=10&&grade>=5&&grade<=8)return 'CAT 2';
 if(km>=2&&km<=5&&grade>=5&&grade<=8)return 'CAT 3';
 if(km>=1&&km<=3&&grade>=4&&grade<=7)return 'CAT 4';
 return null;
}
function classifyClimb(start:number,end:number,gain:number):Climb|null{
 const km=(end-start)/1000,grade=100*gain/Math.max(1,end-start);
 const category=climbCategory(km,grade);
 return category?{start,end,category,meanGrade:grade,gain}:null;
}
function detectClimbs(){
 const end=Math.max(0,Math.min(routeEndForProfile(),procedural?generatedThrough:routeEndForProfile()));
 if(end<1000||!points.length){climbs=[];return;}
 const step=100;
 const elevations:number[]=[];
 for(let d=0;d<=end;d+=step)elevations.push(at(d).elevation);
 // Include the last point when route length is not a multiple of 100 m.
 const candidates:Climb[]=[];
 let start=-1,lastUp=-1;
 const commit=()=>{
  if(start<0||lastUp<=start)return;
  const d0=start*step,d1=Math.min(end,lastUp*step);
  const gain=elevations[lastUp]-elevations[start];
  const c=classifyClimb(d0,d1,gain);
  if(c)candidates.push(c);
 };
 for(let i=1;i<elevations.length;i++){
  const delta=elevations[i]-elevations[i-1];
  if(delta>0.2){if(start<0)start=i-1;lastUp=i;}
  else if(start>=0&&(i-lastUp)*step>250){commit();start=-1;lastUp=-1;}
 }
 commit();
 // Retain distinct, nonoverlapping climbs. Long climbs take precedence.
 climbs=candidates.filter((c,i)=>i===0||c.start>=candidates[i-1].end);
}
function climbNow():Climb|null{
 return climbs.find(c=>distance>=c.start&&distance<c.end)||null;
}
function climbEta(c:Climb){
 const remaining=Math.max(0,c.end-distance);
 const speedEstimate=Math.max(0.8,climbSpeedEstimate);
 const mins=Math.ceil(remaining/speedEstimate/60);
 return mins>=60?`${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}m`:`${mins} min`;
}
function climbHud(c:Climb|null){
 if(!c)return '';
 return `<div class="climb-hud-details" style="margin-top:7px;font:700 13px system-ui;color:#f1f8fc;text-shadow:0 2px 4px #081521;line-height:1.45">${c.category} · ${c.meanGrade.toFixed(1)}% avg<br>${((c.end-distance)/1000).toFixed(2)} km to summit<br>ETA ${climbEta(c)}</div>`;
}
function refreshClimbState(){
 if(distance<previousRideDistance-100){awardedClimbEnd=-1;climbAwardUntil=0;}
 const now=Date.now();
 if(!lastClimbScan||now-lastClimbScan>10000){detectClimbs();lastClimbScan=now;}
 const current=climbNow();
 const key=current?`${current.start}-${current.end}`:'';
 if(key!==activeClimbKey){activeClimbKey=key;}
 if(running&&distance>previousRideDistance){
  const completed=climbs.find(c=>previousRideDistance<c.end&&distance>=c.end&&distance<=c.end+200);
  if(completed&&completed.end!==awardedClimbEnd){awardedClimbEnd=completed.end;climbAwardUntil=now+6000;}
  if(speed>0.7)climbSpeedEstimate=climbSpeedEstimate*.92+speed*.08;
 }
 previousRideDistance=distance;
 return current;
}
// Elevation editor: smooth localized vertical displacement, with undo and reset.
// Editing is disabled once a ride has started to prevent abrupt resistance changes.
let editElevation=false;
let editOriginal:Point[]|null=null;
let editHistory:Point[][]=[];
let dragEdit:{pointer:number;startY:number;center:number;base:number[];metersPerPixel:number;radius:number}|null=null;
function copyPoints(){return points.map(p=>({...p}));}
function editingAllowed(){return points.length>1&&!running&&!rideStart;}
function recomputeGrades(){
 for(let i=0;i<points.length;i++){
  let a=i,b=i;while(a>0&&points[i].distance-points[a].distance<15)a--;
  while(b<points.length-1&&points[b].distance-points[i].distance<15)b++;
  const run=points[b].distance-points[a].distance;
  points[i].grade=run>0?Math.max(-20,Math.min(20,100*(points[b].elevation-points[a].elevation)/run)):0;
 }
}
function clearElevationEditor(){editOriginal=null;editHistory=[];dragEdit=null;}
// Zoom controls: whole route by default; nearest zoom is a 5-mile window.
const MIN_ZOOM_METERS=5*1609.344;
let zoomMeters:number|null=null;
let selectedClimbIndex=-1; // Manual climb focus only; default is the entire route.
function routeEndForProfile(){return procedural?(endless?Math.max(generatedThrough,distance+CHUNK):routeLimit):(points.at(-1)?.distance||1);}
function profileBounds(){
 const first=0;
 const end=Math.max(first+1,procedural&&!endless&&generatedThrough<routeLimit?generatedThrough:routeEndForProfile());
 const climb=selectedClimbIndex>=0?climbs[selectedClimbIndex]:null;
 if(zoomMeters===null&&climb){
  const margin=Math.min(350,Math.max(100,(climb.end-climb.start)*.04));
  return {start:Math.max(0,climb.start-margin),max:Math.min(end,climb.end+margin)};
 }
 if(zoomMeters===null||end-first<=MIN_ZOOM_METERS)return {start:first,max:end};
 const span=Math.min(zoomMeters,end-first);
 // Keep the selected marker (or rider) in view as the rider moves.
 const center=Math.max(first,Math.min(end,inspectDistance??distance));
 const start=Math.max(first,Math.min(end-span,center-span/2));
 return {start,max:start+span};
}
function editWindow(){
 const {start,max}=profileBounds();
 const visible=overviewPoints().filter(p=>p.distance>=start&&p.distance<=max);
 const elevations=(visible.length?visible:overviewPoints()).map(p=>p.elevation);
 return {start,max,min:Math.min(...elevations),range:Math.max(1,Math.max(...elevations)-Math.min(...elevations))};
}
function zoomDisplay(){
 const {start,max}=profileBounds(),full=routeEndForProfile();
 // Always show the complete route summary, even while the graph is zoomed in.
 // For endless rides, show the cumulative gain of terrain generated so far;
 // a truly endless route has no final distance or total ascent.
 const totalMiles=procedural&&!endless?routeLimit/METERS_PER_MILE:(endless?generatedThrough/METERS_PER_MILE:routeEndForProfile()/METERS_PER_MILE);
 const totalGainFeet=procedural&&!endless&&generatedThrough+1<routeLimit
  ?(plannedGainFeet??estimatedGain(gainScale))
  :gainLossThrough(endless?generatedThrough:routeEndForProfile()).gain*FEET_PER_METER;
 const summary=endless
  ?`Endless overview · ${totalMiles.toFixed(1)} mi generated · ${Math.round(totalGainFeet).toLocaleString()} ft gain generated`
  :`Entire route · ${totalMiles.toFixed(1)} mi · ${Math.round(totalGainFeet).toLocaleString()} ft total gain`;
 $('zoomLabel').textContent=zoomMeters===null?(selectedClimbIndex>=0&&climbs[selectedClimbIndex]?`${climbs[selectedClimbIndex].category} climb focus · ${summary}`:summary):`${((max-start)/METERS_PER_MILE).toFixed(1)} mi visible · ${summary}`;
 ($('zoomIn') as HTMLButtonElement).disabled=full<=MIN_ZOOM_METERS+1||(zoomMeters!==null&&zoomMeters<=MIN_ZOOM_METERS+1);
 ($('zoomOut') as HTMLButtonElement).disabled=zoomMeters===null;
}
$('zoomAll').addEventListener('click',()=>{zoomMeters=null;selectedClimbIndex=-1;svg();update();});
$('zoomClimb').addEventListener('click',()=>{
 detectClimbs();
 if(!climbs.length){status('No categorized climbs detected on this route.');return;}
 selectedClimbIndex=(selectedClimbIndex+1)%climbs.length;
 zoomMeters=null;svg();update();
 status(`Showing ${climbs[selectedClimbIndex].category} climb ${selectedClimbIndex+1} of ${climbs.length}. Select Next climb to continue or Entire route to reset.`);
});
$('zoomIn').addEventListener('click',()=>{const full=(procedural&&!endless&&generatedThrough<routeLimit?generatedThrough:routeEndForProfile());selectedClimbIndex=-1;zoomMeters=Math.max(MIN_ZOOM_METERS,(zoomMeters??full)/2);svg();update();});
$('zoomOut').addEventListener('click',()=>{if(zoomMeters===null){selectedClimbIndex=-1;svg();update();return;}const full=(procedural&&!endless&&generatedThrough<routeLimit?generatedThrough:routeEndForProfile());zoomMeters=zoomMeters*2>=full?null:zoomMeters*2;svg();update();});
const chartEl=$('chart');
// Inspection is independent of the actual ride position and trainer commands.
let inspectDistance:number|null=null;
let scrubPointer:number|null=null;
function inspectionBounds(){const {start,max}=editWindow();return {start,max};}
function inspectFromX(clientX:number){
 if(editElevation)return;
 const rect=chartEl.querySelector('svg')?.getBoundingClientRect();if(!rect)return;
 const {start,max}=inspectionBounds();
 const fraction=Math.max(0,Math.min(1,((clientX-rect.left)/Math.max(1,rect.width)*900-12)/876));
 inspectDistance=start+fraction*(max-start);refreshInspection();
}
function gainLossThrough(target:number){
 let gain=retiredGainMeters,loss=retiredLossMeters;
 if(endless&&points.length&&target<points[0].distance){
  const arr=elevationHistory;
  if(!arr.length)return {gain:0,loss:0};
  if(target<=arr[0].distance)return {gain:0,loss:0};
  let lo=0,hi=arr.length-1;
  while(lo<hi){const m=(lo+hi)>>1;if(arr[m].distance<target)lo=m+1;else hi=m;}
  const b=arr[lo],a=arr[Math.max(0,lo-1)];
  const t=Math.max(0,Math.min(1,(target-a.distance)/Math.max(1,b.distance-a.distance)));
  return {gain:a.gain+(b.gain-a.gain)*t,loss:a.loss+(b.loss-a.loss)*t};
 }
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];if(target<=a.distance)break;
  const part=Math.max(0,Math.min(1,(target-a.distance)/Math.max(0.00001,b.distance-a.distance)));
  const delta=(b.elevation-a.elevation)*part;
  if(delta>0)gain+=delta;else loss-=delta;
  if(target<=b.distance)break;
 }
 return {gain,loss};
}
function updateRiderDot(marker:Element|null,position:number){
 if(!marker)return;
 const {start,max}=profileBounds();
 const visible=[overviewAt(start),...overviewPoints().filter(p=>p.distance>start&&p.distance<max),overviewAt(max)];
 const elevations=visible.map(p=>p.elevation);
 const min=Math.min(...elevations),range=Math.max(1,Math.max(...elevations)-min);
 const d=Math.max(start,Math.min(max,position));
 const x=12+(d-start)/Math.max(1,max-start)*876;
 const y=210-12-(overviewAt(d).elevation-min)/range*(210-24);
 marker.setAttribute('cx',x.toFixed(2));
 marker.setAttribute('cy',y.toFixed(2));
}
function refreshInspection(){
 if(!points.length)return;
 const {start,max}=inspectionBounds();
 const d=editElevation?0:Math.max(start,Math.min(max,inspectDistance??distance));
 const p=overviewAt(d),totals=gainLossThrough(d);
 $('inspectMiles').textContent=(d/METERS_PER_MILE).toFixed(2)+' mi';
 $('inspectElevation').textContent=Math.round(p.elevation*FEET_PER_METER)+' ft';
 $('inspectGain').textContent='+'+Math.round(totals.gain*FEET_PER_METER)+' ft';
 $('inspectLoss').textContent='−'+Math.round(totals.loss*FEET_PER_METER)+' ft';
 $('inspectGrade').textContent=p.grade.toFixed(1)+'%';
 const fullLength=procedural?(endless?generatedThrough:routeLimit):(points.at(-1)?.distance||0);
 $('profileRouteMiles').textContent=(fullLength/METERS_PER_MILE).toFixed(1)+' mi';
 $('profileRouteGain').textContent=Math.round(gainLossThrough(fullLength).gain*FEET_PER_METER)+' feet';
 // During editing, the dashboard elevation readout follows the inspected terrain.
 // Dashboard shows elapsed time; elevation remains available in the profile inspector.
 updateRiderDot($('marker'),distance);
}
$('inspectReset').addEventListener('click',()=>{inspectDistance=null;update();refreshInspection();});

$('editElevation').addEventListener('click',()=>{
 if(!editingAllowed()){status('Finish or reset your ride before editing elevation.');return;}
 editElevation=!editElevation;
 $('editElevation').textContent=editElevation?'Done editing':'Edit elevation';
 chartEl.classList.toggle('editing',editElevation);
 if(editElevation){inspectDistance=null;scrubPointer=null;zoomMeters=null;selectedClimbIndex=-1;svg();}
 update();
 status(editElevation?'Drag the elevation line up to add a climb or down to create a descent.':'Elevation editing closed.');
});
chartEl.addEventListener('pointerdown',e=>{
 if(e.button!==0||!points.length)return;
 const rect=chartEl.querySelector('svg')?.getBoundingClientRect();if(!rect)return;
 const marker=$('marker')?.getBoundingClientRect();
 // During editing, even clicks near the marker modify terrain rather than scrubbing.
 void marker;
 if(!editElevation){scrubPointer=e.pointerId;inspectFromX(e.clientX);chartEl.setPointerCapture(e.pointerId);e.preventDefault();return;}
 if(!editingAllowed())return;
 const {start,max,range}=editWindow();
 const x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
 const center=start+x*(max-start);
 // Keep the yellow position marker fixed at route start while editing.
 // 15% of the displayed distance, bounded to 150m-3km, is affected.
 const radius=Math.max(150,Math.min(3000,(max-start)*0.15));
 if(!editOriginal)editOriginal=copyPoints();
 editHistory.push(copyPoints());if(editHistory.length>20)editHistory.shift();
 dragEdit={pointer:e.pointerId,startY:e.clientY,center,base:points.map(p=>p.elevation),metersPerPixel:Math.max(60,range*1.6)/Math.max(1,rect.height),radius};
 chartEl.setPointerCapture(e.pointerId);e.preventDefault();
});
chartEl.addEventListener('pointermove',e=>{
 if(scrubPointer===e.pointerId){inspectFromX(e.clientX);e.preventDefault();return;}
 if(!dragEdit||dragEdit.pointer!==e.pointerId)return;
 const {startY,center,base,metersPerPixel,radius}=dragEdit;
 const change=Math.max(-300,Math.min(300,(startY-e.clientY)*metersPerPixel));
 for(let i=0;i<points.length;i++){
  const t=(points[i].distance-center)/radius;
  const weight=Math.abs(t)<1?Math.pow((1+Math.cos(Math.PI*t))/2,2):0;
  points[i].elevation=base[i]+change*weight;
 }
 recomputeGrades();svg();update();e.preventDefault();
});
function endElevationDrag(e:PointerEvent){if(scrubPointer===e.pointerId){scrubPointer=null;if(chartEl.hasPointerCapture(e.pointerId))chartEl.releasePointerCapture(e.pointerId);return;}if(dragEdit?.pointer!==e.pointerId)return;dragEdit=null;if(chartEl.hasPointerCapture(e.pointerId))chartEl.releasePointerCapture(e.pointerId);}
chartEl.addEventListener('pointerup',endElevationDrag);
chartEl.addEventListener('pointercancel',endElevationDrag);
$('undoElevation').addEventListener('click',()=>{if(!editingAllowed())return;const prev=editHistory.pop();if(!prev)return;points=prev;svg();update();status('Undid last elevation edit.');});
$('resetElevation').addEventListener('click',()=>{if(!editingAllowed()||!editOriginal)return;points=editOriginal;clearElevationEditor();svg();update();status('Elevation edits reset.');});
// Live heart-rate trace over the elevation profile, aligned to ride distance.
const ftpSetting=$('ftp') as HTMLInputElement;
try{const stored=localStorage.getItem('breakaway-rider-ftp');if(stored&&Number(stored)>=50&&Number(stored)<=1000)ftpSetting.value=stored;}catch{}
ftpSetting.addEventListener('change',()=>{const value=Math.max(50,Math.min(1000,Math.round(Number(ftpSetting.value)||250)));ftpSetting.value=String(value);try{localStorage.setItem('breakaway-rider-ftp',String(value));}catch{}refreshHeartRateProfile();});
function refreshHeartRateProfile(){
 const {start,max}=profileBounds();
 const samples=rideSamples.filter(sample=>sample.distance>=start&&sample.distance<=max);
 const downsample=(arr:RideSample[])=>arr.length>700?arr.filter((_,i)=>i%Math.ceil(arr.length/700)===0||i===arr.length-1):arr;
 const heart=downsample(samples.filter(sample=>sample.heartRate!==null));
 const values=heart.map(sample=>sample.heartRate as number);
 const low=values.length?Math.max(45,Math.floor((Math.min(...values)-12)/10)*10):60;
 const high=values.length?Math.max(low+50,Math.ceil((Math.max(...values)+12)/10)*10):180;
 const x=(d:number)=>12+(d-start)/Math.max(1,max-start)*876;
 const hrLine=heart.map(sample=>x(sample.distance).toFixed(1)+','+Math.max(8,Math.min(64,9+(1-((sample.heartRate as number)-low)/(high-low))*53)).toFixed(1)).join(' ');
 const ftp=Math.max(50,Math.min(1000,Number(($('ftp') as HTMLInputElement).value)||250));
 const watts=downsample(samples.filter(sample=>Number.isFinite(sample.power)));
 const segments=watts.slice(1).map((sample,i)=>{
  const prev=watts[i],pct=sample.power/ftp;
  const color=pct>=1.2?'#aa65f5':pct>=1?'#f05252':pct>=.75?'#f4d44c':'#38d877';
  const y=(w:number)=>Math.max(76,Math.min(127,127-Math.max(0,w)/(ftp*1.6)*51));
  return '<line x1="'+x(prev.distance).toFixed(1)+'" y1="'+y(prev.power).toFixed(1)+'" x2="'+x(sample.distance).toFixed(1)+'" y2="'+y(sample.power).toFixed(1)+'" stroke="'+color+'" stroke-width="2.6" vector-effect="non-scaling-stroke" stroke-linecap="round"/>';
 }).join('');
 const latestHr=heart.at(-1)?.heartRate;
 const latestPower=watts.at(-1)?.power;
 for(const root of [$('chart'),document.getElementById('floatChart')]){
  if(!root)continue;
  const trace=root.querySelector<SVGPolylineElement>('.ride-hr-trace');
  const hrLabel=root.querySelector<HTMLElement>('.profile-hr-readout');
  const powerTrace=root.querySelector<SVGGElement>('.ride-power-trace');
  if(trace){trace.setAttribute('points',hrLine);trace.style.display=heart.length>1?'':'none';}
  if(hrLabel){hrLabel.textContent=latestHr!=null?latestHr+' bpm':'— bpm';hrLabel.style.display='';}
  if(root.id==='chart'){const barHr=document.getElementById('profileBarHR');if(barHr)barHr.textContent=latestHr!=null?latestHr+' bpm':(($('heartRate').textContent||'—').trim()+' bpm').replace('— bpm bpm','— bpm');}
  const gearLabel=root.querySelector<HTMLElement>('.profile-gear-readout');
  if(gearLabel){gearLabel.textContent=drivetrainMode==='virtual'?'Gear '+gear:'Gear —';gearLabel.style.display=drivetrainMode==='virtual'?'':'none';}
  if(root.id==='chart'){const barGear=document.getElementById('profileBarGear');if(barGear)barGear.textContent=drivetrainMode==='virtual'?String(gear):'—';}
  if(powerTrace){powerTrace.innerHTML=segments;powerTrace.style.display=watts.length>1?'':'none';}
 }
}

const GRADE_STOPS:[number,string][]=[[-3,'#4b9be9'],[0,'#35c96b'],[3,'#d4d94b'],[6,'#ff9b31'],[9,'#f04452'],[12,'#a65cf5']];
function gradeColor(g:number){
 if(!Number.isFinite(g))return GRADE_STOPS[1][1];
 if(g<=GRADE_STOPS[0][0])return GRADE_STOPS[0][1];
 for(let i=1;i<GRADE_STOPS.length;i++){
  const [end,hex]=GRADE_STOPS[i], [start,from]=GRADE_STOPS[i-1];
  if(g<=end){
   const t=(g-start)/(end-start);
   const rgb=(a:string,b:string)=>Math.round(parseInt(a,16)+(parseInt(b,16)-parseInt(a,16))*t).toString(16).padStart(2,'0');
   return '#'+rgb(from.slice(1,3),hex.slice(1,3))+rgb(from.slice(3,5),hex.slice(3,5))+rgb(from.slice(5,7),hex.slice(5,7));
  }
 }
 return GRADE_STOPS[GRADE_STOPS.length-1][1];
}

function svg(){
 const w=900,h=210,pad=12;
 const {start,max}=profileBounds();
 // Include interpolated endpoints so zoomed segments start and finish at their true elevation.
 const visible=[overviewAt(start),...overviewPoints().filter(p=>p.distance>start&&p.distance<max),overviewAt(max)];
 const elevations=visible.map(p=>p.elevation),min=Math.min(...elevations),range=Math.max(1,Math.max(...elevations)-min);
 const stride=Math.max(1,Math.ceil(visible.length/650));
 const reduced=visible.filter((_,i)=>i%stride===0);if(reduced.at(-1)!==visible.at(-1))reduced.push(visible.at(-1)!);
 const x=(d:number)=>pad+(d-start)/Math.max(1,max-start)*(w-2*pad);
 const y=(e:number)=>h-pad-(e-min)/range*(h-2*pad);
 const line=reduced.map(p=>`${x(p.distance)},${y(p.elevation)}`).join(' ');
 // Use the same grade colors in Chrome and in the floating Electron overlay.
 // A segment's grade is measured from its two endpoints, not the entire hill.

 const strips=240;
 const colored=Array.from({length:strips},(_,i)=>{
  const d0=start+(max-start)*i/strips;
  const d1=start+(max-start)*(i+1)/strips;
  const e0=overviewAt(d0).elevation;
  const e1=overviewAt(d1).elevation;
  const grade=100*(e1-e0)/Math.max(0.001,d1-d0);
  return `<rect x="${x(d0).toFixed(2)}" y="0" width="${(x(d1)-x(d0)+0.3).toFixed(2)}" height="${h}" fill="${gradeColor(grade)}"/>`;
 }).join('');
 const terrainPath=`M ${x(start)} ${h-pad} L ${line.replaceAll(' ',' L ')} L ${x(max)} ${h-pad} Z`;
 $('chart').innerHTML=`<div id="profileLiveGrade" class="profile-live-grade" aria-label="Current gradient">0.0%</div><div class="profile-telemetry"><span class="profile-gear-readout"></span><span class="profile-hr-readout">— bpm</span></div><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><clipPath id="breakaway-main-grade-clip"><path d="${terrainPath}"/></clipPath></defs><g clip-path="url(#breakaway-main-grade-clip)">${colored}</g><polyline points="${line}" fill="none" stroke="#e9f0f2" stroke-width="1.6"/><circle id="marker" cx="${pad}" cy="${h-pad}" r="6" fill="#ffc85c" stroke="#fff1b8" stroke-width="2" vector-effect="non-scaling-stroke" pointer-events="none"/><circle id="surviveProfileThreat" cx="${pad}" cy="${h-pad}" r="8" fill="#f04452" stroke="#fff" stroke-width="2.5" vector-effect="non-scaling-stroke" pointer-events="none" style="display:none"/></svg>`;
 zoomDisplay();syncProfileCharts();refreshHeartRateProfile();refreshInspection();
}
function update(){const currentClimb=refreshClimbState();const p=at(distance),max=procedural?routeLimit:(points.at(-1)?.distance||0);
 zoomDisplay();
 const liveGrade=$('profileLiveGrade');const hud=gradeHud(displayGrade());const barGrade=document.getElementById('profileBarGrade');if(barGrade){barGrade.textContent=hud.label;barGrade.style.color=hud.color;}
 if(liveGrade){liveGrade.textContent=hud.label;liveGrade.style.color=hud.color;liveGrade.style.fontSize=hud.size+'px';liveGrade.innerHTML=hud.label+climbHud(currentClimb);}
 $('totalGain').textContent=Math.round(points.length?gainLossThrough(distance).gain*FEET_PER_METER:0).toLocaleString();
 $('distance').textContent=(distance/METERS_PER_MILE).toFixed(2);$('remaining').textContent=(endless?'∞':((max-distance)/METERS_PER_MILE).toFixed(2));$('grade').textContent=p.grade.toFixed(1);$('elapsedTime').textContent=rideClock();$('beersEarned').textContent=(energyKcal/BEER_KCAL).toFixed(2);$('caloriesBurned').textContent=Math.round(energyKcal).toLocaleString();$('speed').textContent=(speed*MPH_PER_MPS).toFixed(1);$('power').textContent=threeSecondWatts()?.toFixed(0)??'—';$('cadence').textContent=realTelemetry?cadence.toFixed(0):'—';$('gear').textContent=drivetrainMode==='virtual'?String(gear):'—';
 refreshInspection();
 updateFloatingProfile();
 refreshHeartRateProfile();
 publishDesktopOverlay();
}
// Serialize FTMS control point operations and wait for the indicated result.
// A successful GATT write is NOT proof that the trainer accepted a command.
async function command(bytes:number[]):Promise<boolean>{
 const operation=async()=>{
  if(!control||!connected) return false;
  try{
   const response=new Promise<DataView>((resolve,reject)=>{
    const timer=setTimeout(()=>{controlResponseWaiter=null;reject(Error('FTMS response timeout'));},3000);
    controlResponseWaiter=(v)=>{clearTimeout(timer);controlResponseWaiter=null;resolve(v);};
   });
   await control.writeValue(new Uint8Array(bytes));
   const v=await response;
   if(v.byteLength<3||v.getUint8(0)!==0x80||v.getUint8(1)!==bytes[0]||v.getUint8(2)!==1)
    throw Error(`FTMS rejected opcode ${bytes[0]} (result ${v.byteLength>=3?v.getUint8(2):'missing'})`);
   return true;
  }catch(e){controlResponseWaiter=null;status('FTMS: '+String(e));return false;}
 };
 const result=controlQueue.then(operation,operation);
 controlQueue=result.then(()=>undefined,()=>undefined);
 return result;
}
async function setGrade(grade:number){
 const scaled=Math.round(Math.max(-20,Math.min(20,grade))*100);
 const b=new ArrayBuffer(7),v=new DataView(b);
 v.setUint8(0,0x11);v.setInt16(1,0,true);v.setInt16(3,scaled,true);
 v.setUint8(5,Math.min(255,Math.round(num('crr')*10000)));v.setUint8(6,51);
 return command(Array.from(new Uint8Array(b)));
}
// FTMS SIM exposes gradient, not virtual gearing or a hard watt limit. Translate
// the Zwift 24-speed ratio changes into a bounded *equivalent gradient*.
// This is an approximation, not Zwift's proprietary drivetrain simulation.
// Climbing-assist gearing: gears 1–8 intentionally reduce trainer torque
// beyond standard Zwift Mixed Terrain ratios. Virtual route physics remains
// based on the actual gradient and measured rider watts.
const CLIMB_ASSIST=[0.10,0.15,0.21,0.28,0.36,0.45,0.56,0.70] as const;
function climbingAssist():number{return gear<=8?CLIMB_ASSIST[gear-1]:1;}
function simRequestedGrade():number{
 const routeGrade=at(distance).grade*num('difficulty')/100;
 if(drivetrainMode==='traditional')return Math.max(-12,Math.min(12,routeGrade));
 const ratio=zwiftGearMultiplier();
 const effectiveLoad=4+Math.max(0,(cycleQuestHold?cycleQuestHeldSpeed:speed)**2*0.08);
 const shifted=routeGrade+(ratio-1)*effectiveLoad;
 // Scale down BOTH grade and baseline load for low climbing gears.
 // Negative effective grades are intentional: they lower trainer resistance
 // and make 16%+ climbs pedalable at a comfortable cadence.
 const assist=climbingAssist();
 const requested=gear<=8 ? -5+(shifted+5)*assist : shifted;
 // Do not feed delayed power readings back into SIM grade; that oscillates.
 return Math.max(-12,Math.min(12,requested));
}
function resetSimController(){simAppliedGrade=NaN;simLastTime=0;simLastCommandTime=0;trainerGrade=NaN;}
async function updateSimResistance(now:number,immediate=false){
 if(trainerMode!=='sim'||!running||!connected||!controlGranted||!realTelemetry||simBusy)return;
 if(!immediate&&now-simLastCommandTime<SIM_COMMAND_INTERVAL_MS)return;
 const target=simRequestedGrade();
 const elapsed=simLastTime?Math.min(2,Math.max(0,(now-simLastTime)/1000)):0;
 simLastTime=now;
 if(!Number.isFinite(simAppliedGrade))simAppliedGrade=target;
 const step=Math.max(0.15,elapsed*(drivetrainMode==='virtual'&&gear<=8?0.65:SIM_GRADE_SLEW_PERCENT_PER_SECOND));
 simAppliedGrade+=Math.max(-step,Math.min(step,target-simAppliedGrade));
 if(Number.isFinite(trainerGrade)&&Math.abs(simAppliedGrade-trainerGrade)<0.15)return;
 simBusy=true;simLastCommandTime=now;
 try{if(await setGrade(simAppliedGrade))trainerGrade=simAppliedGrade;}
 finally{simBusy=false;}
}
// Experimental fixed-Cog shifting approximation: use ERG target watts computed
// from cadence, gear and slope. NOT Zwift's proprietary gear/torque algorithm.
// Standard FTMS ERG commands are supported on many trainers but may feel unlike SIM.
async function setVirtualGearResistance(){
 if(drivetrainMode!=='virtual'||!connected||!controlGranted||!running||!realTelemetry||trainerMode!=='erg')return;
 const slope=at(distance).grade*num('difficulty')/100;
 const rpm=Math.max(40,cadence);
 const ratio=zwiftGearMultiplier();
 const base=1.5*(90+Math.max(-12,slope)*11)*ratio*rpm/85;
 // Low gears must also be easier in experimental virtual-gear ERG.
 const watts=Math.round(Math.max(30,Math.min(32767,gear<=8?base*climbingAssist():base)));
 if(Math.abs(watts-lastTarget)<5)return;
 if(await command([0x05,watts&255,watts>>8]))lastTarget=watts;
}
// True constant-wattage ERG: direct FTMS Set Target Power (0x05).
// Route elevation and virtual gears have no effect on the requested power.
async function setFixedErgPower(force=false){
 if(!connected||!controlGranted||!running||!realTelemetry||trainerMode!=='target')return;
 const now=performance.now();
 if(!force&&now-lastFixedErgCommand<1500)return;
 const watts=Math.round(Math.max(30,Math.min(1000,targetErgWatts)));
 if(!force&&watts===lastTarget)return;
 lastFixedErgCommand=now;
 if(await command([0x05,watts&255,(watts>>8)&255])){lastTarget=watts;status(`ERG target: ${watts} W (elevation ignored)`);}
}
function parseBikeData(v:DataView){
 if(v.byteLength<2)return;
 const flags=v.getUint16(0,true);let o=2;
 const has=(n:number)=>!!(flags&(1<<n));
 // Speed is present when bit 0 is 0. Cadence and power are optional.
 if(!has(0)&&o+2<=v.byteLength){/* speed available but virtual route uses modeled speed */o+=2;}
 if(has(1))o+=2; // average speed
 if(has(2)&&o+2<=v.byteLength){cadence=v.getUint16(o,true)/2;o+=2;}
 if(has(3))o+=2; // average cadence
 if(has(4))o+=3; // total distance
 if(has(5))o+=2; // resistance level
 if(has(6)&&o+2<=v.byteLength){power=v.getInt16(o,true);o+=2;}
 if(has(7))o+=2; // average power
 if(has(8))o+=5; // expended energy
 if(has(9))o+=1; // heart rate
 if(has(10))o+=1; // MET
 if(has(11))o+=2; // elapsed time
 if(has(12))o+=2; // remaining time
 realTelemetry=true;
 const sampleTime=performance.now();
 powerHistory.push({time:sampleTime,watts:Math.max(0,power)});
 powerHistory=powerHistory.filter(sample=>sampleTime-sample.time<=POWER_WINDOW_MS+2000);
 // Advance distance from actual trainer notifications even when Chrome throttles background animation frames.
 advanceRide(performance.now());
 // Require sustained pedaling to avoid starting from a single noisy cadence packet.
 if(rideAwaitingPedaling&&!running&&!rideEnd&&!document.getElementById('stationaryRidePrompt')&&(breakawayScreen==='ride'||(rideExperience==='cyclequest'&&document.body.dataset.breakawayScreen==='quest'))&&points.length&&connected&&controlGranted&&(cadence>=20||power>=15)){if(!pedalSince)pedalSince=Date.now();if(Date.now()-pedalSince>=3000){pedalSince=0;beginRide();}}else if(!running)pedalSince=0;
 update();
}
function shift(delta:number){if(drivetrainMode!=='virtual')return;gear=Math.max(1,Math.min(24,gear+delta));update();if(trainerMode==='erg')void setVirtualGearResistance();else if(trainerMode==='sim'&&running)void updateSimResistance(performance.now(),true);}
let lastChartUpdate=0;let lastGearUpdate=0;
function advanceRide(now:number){
 const dt=Math.max(0,Math.min(3,(now-last)/1000||0));last=now;
 if(running&&points.length&&connected&&controlGranted&&realTelemetry){
  activeRideMs+=dt*1000;
  // Power measured in joules per second; estimate metabolic calories using
  // a fixed cycling efficiency. Do not accrue calories while coasting at 0 W.
  energyKcal+=Math.max(0,power)*dt/(GROSS_EFFICIENCY*4184);
  if(realTelemetry){avgPowerEnergy+=Math.max(0,power)*dt;avgPowerDuration+=dt;}
  // Time-stepped road dynamics: pedaling force, gravity, rolling friction,
  // and aerodynamic drag. Coasting works at zero watts on flats and descents.
  const mass=Math.max(35,weightKg('weight')+weightKg('bikeWeight'));
  const airDensity=1.225,cdA=0.38,g=9.80665;
  const crr=Math.max(0,num('crr'));
  const watts=Math.max(0,power)*0.975;
  const steps=Math.max(1,Math.ceil(dt/0.05));
  const step=dt/steps;
  if(procedural)ensureTerrain();
  for(let i=0;i<steps;i++){
   if(cycleQuestHold){speed=0;break;}
   const grade=at(distance).grade/100;
   const angle=Math.atan(grade);
   const gravityForce=mass*g*Math.sin(angle);
   const rollingForce=mass*g*Math.cos(angle)*crr;
   const aeroForce=0.5*airDensity*cdA*speed*speed;
   // At low speed, cap the driving force to avoid infinite force at launch.
   const driveForce=Math.min(700,watts/Math.max(speed,1.5));
   const acceleration=(driveForce-gravityForce-rollingForce-aeroForce)/mass;
   const oldSpeed=speed;
   speed=Math.max(0,Math.min(35,speed+acceleration*step));
   if(watts>=35&&cadence>=30)speed=Math.max(speed,0.25);
   const limit=procedural?routeLimit:points.at(-1)!.distance;
   distance=Math.min(limit,distance+(oldSpeed+speed)*0.5*step);
   if(distance>=limit)break;
  }
  if(procedural&&now-lastChartUpdate>5000){lastChartUpdate=now;ensureTerrain();svg();}

  checkStationaryRide(now);
  if(!endless&&distance>=(procedural?routeLimit:points.at(-1)!.distance)){finishRide();status('Route complete');}
  if(trainerMode==='sim')void updateSimResistance(now);
  if(trainerMode==='erg'&&now-lastGearUpdate>1100){lastGearUpdate=now;void setVirtualGearResistance();}
  if(trainerMode==='target'&&now-lastGearUpdate>1500){lastGearUpdate=now;void setFixedErgPower();}
  recordRideSample();
  update();
 }
}
function tick(now:number){
 // Advance the ride and SURVIVE timers together; the chase countdown must be ticked every frame.
 advanceRide(now);
 surviveTick(now);
 surviveFailTick(now);
 requestAnimationFrame(tick);
}
$('gpx').addEventListener('change',async e=>{try{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;if(rideStart&&!rideEnd)finishRide();procedural=false;endless=false;zoomMeters=null;selectedClimbIndex=-1;inspectDistance=null;routeLimit=0;plannedGainFeet=null;gainScale=1;resetClimbingTotals();clearElevationEditor();points=parseGPX(await file.text());routeName=file.name;rideStart=null;rideEnd=null;clearRideRecovery();distance=0;speed=0;resetRideMetrics();svg();update();requestAnimationFrame(()=>syncStudioRoutePreview());status(`Loaded ${file.name}: ${(points.at(-1)!.distance/METERS_PER_MILE).toFixed(1)} mi`);}catch(err){status(String(err));}});
// Wahoo SNAP compatibility phase 1: read-only Cycling Power Service discovery.
// Never issue undocumented Wahoo resistance commands.
function parseCyclingPowerMeasurement(v:DataView){
 if(v.byteLength<4)return;
 const flags=v.getUint16(0,true);
 power=Math.max(0,v.getInt16(2,true));
 // Crank revolution data is optional; use it only when present and safely bounded.
 let o=4;
 if(flags&(1<<0))o+=1;
 if(flags&(1<<2))o+=1;
 if(flags&(1<<4))o+=6;
 if(flags&(1<<5))o+=4;
 if(flags&(1<<6))o+=4;
 if(flags&(1<<7))o+=2;
 if((flags&(1<<8))&&o+4<=v.byteLength){
  const rev=v.getUint16(o,true),eventTime=v.getUint16(o+2,true);
  if(lastSnapCrank){
   const dr=(rev-lastSnapCrank.rev+65536)%65536;
   const dt=(eventTime-lastSnapCrank.time+65536)%65536;
   if(dt>0&&dr>0&&dr<20)cadence=Math.min(200,Math.round(dr*60*1024/dt));
  }
  lastSnapCrank={rev,time:eventTime};
 }
 realTelemetry=true;
 const sampleTime=performance.now();
 powerHistory.push({time:sampleTime,watts:power});
 powerHistory=powerHistory.filter(sample=>sampleTime-sample.time<=POWER_WINDOW_MS+2000);
 update();
}
let lastSnapCrank:{rev:number;time:number}|null=null;
async function connectLegacyCyclingPower(server:any,selected:any){
 const service=await server.getPrimaryService(CYCLING_POWER);
 const measurement=await service.getCharacteristic(CYCLING_POWER_MEASUREMENT);
 await measurement.startNotifications();
 measurement.addEventListener('characteristicvaluechanged',(event:any)=>parseCyclingPowerMeasurement(event.target.value));
 connected=true;
 controlGranted=false;
 status('Wahoo '+(selected.name||'trainer')+' connected: cycling power telemetry only. SIM/ERG resistance control is not yet supported. This is a diagnostic connection, not a ride-ready trainer.');
}
async function connectTrainerDevice(selected:any){try{
 if(connected&&device?.id===selected.id)return;
 if(device?.gatt?.connected&&device.id!==selected.id)device.gatt.disconnect();
 const bluetooth=(navigator as any).bluetooth;if(!bluetooth)throw Error('Use desktop Chrome or Edge over localhost/HTTPS.');
 device=selected;
 device.addEventListener('gattserverdisconnected',()=>{if(rideStart&&!rideEnd){pauseRide();saveRideRecovery();}connected=false;controlGranted=false;realTelemetry=false;running=false;setRideFocus(false);resetSimController();speed=0;power=0;cadence=0;$('start').textContent='Let’s Ride!';update();status('Trainer disconnected — ride paused and saved. Reconnect to resume.');});
 const server=await device.gatt.connect();
 let service:any;
 try{service=await server.getPrimaryService(FTMS);}catch(err){
  if((selected.name||'').toLowerCase().includes('kickr')||(selected.name||'').toLowerCase().includes('wahoo')){
   try{await connectLegacyCyclingPower(server,selected);return;}catch(powerErr){
    server.disconnect();
    throw Error('Wahoo detected but Cycling Power Service unavailable: '+String(powerErr));
   }
  }
  server.disconnect();
  throw Error('Device does not expose Bluetooth FTMS. Non-FTMS Wahoo trainers can be tested with read-only Cycling Power Service.');
 }
 control=await service.getCharacteristic(CONTROL);
 await control.startNotifications();
 control.addEventListener('characteristicvaluechanged',(event:any)=>{
  const v:DataView=event.target.value;
  if(v.byteLength>=3&&v.getUint8(0)===0x80)controlResponseWaiter?.(v);
 });
 const bike=await service.getCharacteristic(BIKE);
 await bike.startNotifications();
 bike.addEventListener('characteristicvaluechanged',(event:any)=>parseBikeData(event.target.value));
 connected=true;controlGranted=await command([0x00]);
 status(controlGranted?'Trainer connected via FTMS; waiting for live power/cadence':'Trainer connected, but FTMS control not granted');
 }catch(err){status('Trainer connection error: '+String(err));throw err;}
}
$('connect').addEventListener('click',async()=>{try{const bluetooth=(navigator as any).bluetooth;if(!bluetooth)throw Error('Web Bluetooth unavailable');const selected=await bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[FTMS,CYCLING_POWER]});pausedBleRoles.delete('trainer');rememberDevice('trainer',selected);await connectTrainerDevice(selected);}catch(err){status('Trainer connection error: '+String(err));}});

// v3.8.7 — persist rider and trainer preferences on this browser.
// Restore values before the existing trainer-mode event listeners are installed.
const RIDE_SETTINGS_KEY='breakaway-rider-trainer-settings-v1';
const savedSettingIds=['weight','bikeWeight','crr','difficulty','trainerMode','fixedErgWatts','drivetrainMode'] as const;
try{
 const saved=JSON.parse(localStorage.getItem(RIDE_SETTINGS_KEY)||'{}') as Record<string,string>;
 for(const id of savedSettingIds){
  const el=document.getElementById(id) as HTMLInputElement|HTMLSelectElement|null;
  if(!el||typeof saved[id]!=='string')continue;
  const candidate=saved[id];
  if(id==='trainerMode'||id==='drivetrainMode'){
   if((id==='trainerMode'&&['sim','erg','target'].includes(candidate))||(id==='drivetrainMode'&&['traditional','virtual'].includes(candidate)))el.value=candidate;
  }else{
   const n=Number(candidate);
   const input=el instanceof HTMLInputElement ? el : null;
   const min=input && input.min!=='' ? Number(input.min) : -Infinity;
   const max=input && input.max!=='' ? Number(input.max) : Infinity;
   if(candidate.trim()!==''&&Number.isFinite(n)&&n>=min&&n<=max)el.value=candidate;
  }
 }
}catch{}
drivetrainMode=($('drivetrainMode') as HTMLSelectElement).value as 'traditional'|'virtual';
function applyDrivetrainMode(){
 const virtual=drivetrainMode==='virtual';
 ($('virtualShiftingSettings') as HTMLElement).hidden=!virtual;
 ($('connectClick') as HTMLButtonElement).disabled=!virtual;
 ($('drivetrainHelp') as HTMLElement).textContent=virtual
  ?'Virtual gear controls adjust resistance in supported modes. Zwift Click is optional; on-screen and keyboard shifting are also available.'
  :'Use your physical cassette and chainrings. In SIM mode, Breakaway sends the route gradient directly to the trainer without virtual gear adjustments. ERG target mode ignores elevation.';
 if(!virtual&&trainerMode==='erg'){
  trainerMode='sim';($('trainerMode') as HTMLSelectElement).value='sim';
  ($('fixedErgSettings') as HTMLElement).hidden=true;
 }
 const experimental=($('trainerMode') as HTMLSelectElement).querySelector('option[value="erg"]') as HTMLOptionElement|null;
 if(experimental)experimental.disabled=!virtual;
 resetSimController();lastTarget=0;update();
 if(connected&&controlGranted&&running&&trainerMode==='sim')void updateSimResistance(performance.now(),true);
}
$('drivetrainMode').addEventListener('change',()=>{
 drivetrainMode=($('drivetrainMode') as HTMLSelectElement).value as 'traditional'|'virtual';
 applyDrivetrainMode();saveRideSettings();
});
trainerMode=($('trainerMode') as HTMLSelectElement).value as 'sim'|'erg'|'target';
targetErgWatts=Number(($('fixedErgWatts') as HTMLInputElement).value)||180;
($('fixedErgSettings') as HTMLElement).hidden=trainerMode!=='target';
function saveRideSettings(){
 try{
  const values:Record<string,string>={};
  for(const id of savedSettingIds)values[id]=(document.getElementById(id) as HTMLInputElement|HTMLSelectElement).value;
  localStorage.setItem(RIDE_SETTINGS_KEY,JSON.stringify(values));
 }catch{}
}
for(const id of savedSettingIds){
 const el=document.getElementById(id);
 el?.addEventListener('change',saveRideSettings);
}

$('trainerMode').addEventListener('change',async()=>{
 trainerMode=($('trainerMode') as HTMLSelectElement).value as 'sim'|'erg'|'target';
 ($('fixedErgSettings') as HTMLElement).hidden=trainerMode!=='target';
 resetSimController();lastTarget=0;
 if(connected&&controlGranted&&running){if(trainerMode==='sim')void updateSimResistance(performance.now(),true);else if(trainerMode==='erg')await setVirtualGearResistance();else await setFixedErgPower(true);}
});
$('fixedErgWatts').addEventListener('change',()=>{
 const input=$('fixedErgWatts') as HTMLInputElement;
 const requested=Number(input.value);
 if(!Number.isFinite(requested)||requested<30||requested>1000){input.value=String(targetErgWatts);status('Enter an ERG target between 30 and 1000 watts');return;}
 targetErgWatts=Math.round(requested);input.value=String(targetErgWatts);
 lastTarget=0;
 if(trainerMode==='target')void setFixedErgPower(true);
});
$('applyErgWatts').addEventListener('click',()=>{
 ($('fixedErgWatts') as HTMLInputElement).dispatchEvent(new Event('change'));
});
$('rideFinishNow').addEventListener('click',confirmManualFinish);
syncManualFinishButton();
$('start').addEventListener('click',()=>{if(running)pauseRide();else if(rideEnd){const summary=$('rideSummary');summary.hidden=false;summary.classList.add('ride-summary-fullscreen');summary.style.display='block';document.body.append(summary);status('Finish the summary to start another ride');}else if(!points.length)status('Import a GPX route or generate one first');else if(!connected||!controlGranted||!realTelemetry)status('Connect trainer first');else beginRide();});
$('reset').addEventListener('click',()=>{if(rideStart&&!rideEnd){finishRide();return;}if(rideEnd){$('rideSummary').scrollIntoView({behavior:'smooth'});return;}distance=0;speed=0;resetRideMetrics();resetSimController();update();});
$('finishRide').addEventListener('click',()=>finishRide());
$('up').addEventListener('click',()=>shift(1));$('down').addEventListener('click',()=>shift(-1));
window.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){shift(1);e.preventDefault();}if(e.key==='ArrowDown'){shift(-1);e.preventDefault();}});
// Zwift Click adapter integration point: a verified BLE decoder should call shift(+1/-1).
// Do not assume Zwift Click exposes standard HID keys or a public BLE characteristic.
// Start rendering only after the floating profile and overlay bridge are initialized.


// Standard Bluetooth Heart Rate Service (0x180D) and Measurement (0x2A37).
let hrDevice:any=null;
let hrCharacteristic:any=null;
let hrHandler:((event:any)=>void)|null=null;
const HR_SERVICE='heart_rate';
const HR_MEASUREMENT='heart_rate_measurement';
function hrMessage(message:string){$('hrStatus').textContent=message;}
function readHeartRate(value:DataView):number{
 if(value.byteLength<2)throw Error('Short heart-rate packet');
 const flags=value.getUint8(0);
 if(flags&1){if(value.byteLength<3)throw Error('Short 16-bit HR packet');return value.getUint16(1,true);}
 return value.getUint8(1);
}
async function connectHrDevice(selected:any){
 try{
  const bluetooth=(navigator as any).bluetooth;
  if(!bluetooth)throw Error('Web Bluetooth requires Chrome/Edge on localhost or HTTPS');
  hrMessage('Choose your heart rate monitor…');
  if(hrDevice?.id===selected.id&&hrDevice.gatt?.connected)return;
  if(hrDevice?.gatt?.connected)hrDevice.gatt.disconnect();
  hrDevice=selected;
  selected.addEventListener('gattserverdisconnected',()=>{if(hrDevice===selected){$('heartRate').textContent='—';hrMessage('Heart rate monitor disconnected');}});
  const server=await selected.gatt.connect();
  const service=await server.getPrimaryService(HR_SERVICE);
  hrCharacteristic=await service.getCharacteristic(HR_MEASUREMENT);
  hrHandler=(event:any)=>{try{const bpm=readHeartRate(event.target.value);$('heartRate').textContent=String(bpm);hrMessage(`Connected: ${selected.name||'Heart rate monitor'} · ${bpm} BPM`);}catch(err){hrMessage(String(err));}};
  hrCharacteristic.addEventListener('characteristicvaluechanged',hrHandler);
  await hrCharacteristic.startNotifications();
  hrMessage(`Connected: ${selected.name||'Heart rate monitor'} · waiting for BPM`);
 }catch(err){hrMessage('Heart rate connection: '+String(err));throw err;}
}
$('connectHr').addEventListener('click',async()=>{try{const bluetooth=(navigator as any).bluetooth;if(!bluetooth)throw Error('Web Bluetooth unavailable');const selected=await bluetooth.requestDevice({filters:[{services:[HR_SERVICE]}]});pausedBleRoles.delete('hr');rememberDevice('hr',selected);await connectHrDevice(selected);}catch(err){hrMessage('Heart rate connection: '+String(err));}});
$('disconnectHr').addEventListener('click',()=>{pausedBleRoles.add('hr');
 if(hrCharacteristic&&hrHandler)hrCharacteristic.removeEventListener('characteristicvaluechanged',hrHandler);
 hrDevice?.gatt?.disconnect();hrDevice=null;hrCharacteristic=null;hrHandler=null;
 $('heartRate').textContent='—';hrMessage('Heart rate monitor disconnected');
});

// Original Zwift Click (BC1) protocol: RC1 service, unencrypted RideOn activation.
// Reference: jat255/Zwift_click_handling and Makinolo's RC1 protocol notes.
const CLICK_SERVICE='00000001-19ca-4651-86e5-fa29dcdd09d1';
const CLICK_NOTIFY='00000002-19ca-4651-86e5-fa29dcdd09d1';
const CLICK_WRITE='00000003-19ca-4651-86e5-fa29dcdd09d1';
let clickDevice:any=null;
let clickCharacteristic:any=null;
let clickHandler:((event:any)=>void)|null=null;
let plusPressed=false,minusPressed=false;
let clickPackets=0;
let clickButtonEvents=0;
// The original Click may go idle without periodic RC1 activation traffic.
// Keepalive is best-effort; no automatic Bluetooth chooser or silent re-pairing.
let clickKeepaliveTimer:ReturnType<typeof setInterval>|null=null;
let clickWriteCharacteristic:any=null;
let clickKeepaliveBusy=false;
let clickSession=0;
const CLICK_KEEPALIVE_MS=15000;
function stopClickKeepalive(){
 if(clickKeepaliveTimer!==null){clearInterval(clickKeepaliveTimer);clickKeepaliveTimer=null;}
 clickWriteCharacteristic=null;
}
async function sendClickRideOn(session:number){
 if(session!==clickSession||clickKeepaliveBusy||!clickDevice?.gatt?.connected||!clickWriteCharacteristic)return;
 clickKeepaliveBusy=true;
 try{
  const payload=new TextEncoder().encode('RideOn');
  if(clickWriteCharacteristic.properties.writeWithoutResponse)await clickWriteCharacteristic.writeValueWithoutResponse(payload);
  else if(clickWriteCharacteristic.properties.write)await clickWriteCharacteristic.writeValueWithResponse(payload);
  else throw Error('Click activation characteristic is not writable');
 }catch(err){
  if(session===clickSession)clickMessage('Zwift Click keepalive failed: '+String(err));
 }finally{clickKeepaliveBusy=false;}
}
function clickMessage(message:string){$('clickStatus').textContent=message;}
function packetHex(view:DataView):string{
 return Array.from(new Uint8Array(view.buffer,view.byteOffset,view.byteLength)).map(b=>b.toString(16).padStart(2,'0')).join(' ');
}
// Click message 0x37 carries two protobuf varint fields: field 1 = plus,
// field 2 = minus; zero means pressed, one means released.
function decodeClickState(bytes:Uint8Array):{plus:boolean;minus:boolean}|null{
 if(bytes.length<2||bytes[0]!==0x37)return null;
 const fields=new Map<number,number>();let i=1;
 while(i<bytes.length){
  let tag=0,shiftBits=0,b=0;
  do{if(i>=bytes.length||shiftBits>28)return null;b=bytes[i++];tag|=(b&127)<<shiftBits;shiftBits+=7;}while(b&128);
  const field=tag>>>3,wire=tag&7;
  if(wire===0){let value=0;shiftBits=0;
   do{if(i>=bytes.length||shiftBits>28)return null;b=bytes[i++];value|=(b&127)<<shiftBits;shiftBits+=7;}while(b&128);
   fields.set(field,value);
  }else if(wire===2){let length=0;shiftBits=0;
   do{if(i>=bytes.length||shiftBits>28)return null;b=bytes[i++];length|=(b&127)<<shiftBits;shiftBits+=7;}while(b&128);
   if(i+length>bytes.length)return null;i+=length;
  }else return null;
 }
 if(!fields.has(1)||!fields.has(2))return null;
 return {plus:fields.get(1)===0,minus:fields.get(2)===0};
}
async function connectClickDevice(selected:any){
 try{
  const bluetooth=(navigator as any).bluetooth;
  if(!bluetooth)throw Error('Use desktop Chrome or Edge on localhost or HTTPS.');
  clickMessage('Press a Click button to wake it, then select Zwift Click…');
  if(clickDevice?.id===selected.id&&clickDevice.gatt?.connected)return;
  stopClickKeepalive();clickSession++;
  if(clickCharacteristic&&clickHandler)clickCharacteristic.removeEventListener('characteristicvaluechanged',clickHandler);
  if(clickDevice?.gatt?.connected)clickDevice.gatt.disconnect();
  clickDevice=selected;plusPressed=false;minusPressed=false;clickPackets=0;clickButtonEvents=0;
  selected.addEventListener('gattserverdisconnected',()=>{if(clickDevice===selected){stopClickKeepalive();clickSession++;plusPressed=false;minusPressed=false;clickMessage('Zwift Click disconnected — press a button to wake it, then reconnect');}});
  const server=await selected.gatt.connect();
  let service:any;
  try{service=await server.getPrimaryService(CLICK_SERVICE);}
  catch{
   throw Error('Connected to '+(selected.name||'Zwift controller')+', but its Bluetooth service differs from the original Click. Newer Cog & Click / Play controllers need protocol support. Device name: '+(selected.name||'unknown'));
  }
  clickCharacteristic=await service.getCharacteristic(CLICK_NOTIFY);
  clickHandler=(event:any)=>{
   const view:DataView=event.target.value;
   clickPackets++;
   $('clickPacket').textContent=`Packets: ${clickPackets} | Last: ${packetHex(view)}`;
   const bytes=new Uint8Array(view.buffer,view.byteOffset,view.byteLength);
   const state=decodeClickState(bytes);
   if(!state)return;
   clickButtonEvents++;
   $('clickDecoded').textContent=`Decoded button packets: ${clickButtonEvents} | Plus: ${state.plus?'PRESSED':'released'} | Minus: ${state.minus?'PRESSED':'released'}`;
   // Edge detection: one gear change per press, not per notification.
   const questConsumed=routeQuestClick(state.plus,state.minus);
   if(!questConsumed&&drivetrainMode==='virtual'&&state.plus&&!plusPressed)shift(1);
   if(!questConsumed&&drivetrainMode==='virtual'&&state.minus&&!minusPressed)shift(-1);
   plusPressed=state.plus;minusPressed=state.minus;
   clickMessage(`Zwift Click connected · + ${plusPressed?'pressed':'ready'} / − ${minusPressed?'pressed':'ready'} · ${clickPackets} packets`);
  };
  clickCharacteristic.addEventListener('characteristicvaluechanged',clickHandler);
  await clickCharacteristic.startNotifications();
  // A successful Zwift Click connection always enables virtual shifting, including auto-reconnects.
  if(drivetrainMode!=='virtual'){
   drivetrainMode='virtual';
   ($('drivetrainMode') as HTMLSelectElement).value='virtual';
   applyDrivetrainMode();
   saveRideSettings();
  }
  // Crucial: notifications stay silent until the original Click is activated.
  clickWriteCharacteristic=await service.getCharacteristic(CLICK_WRITE);
  const session=clickSession;
  await sendClickRideOn(session);
  clickKeepaliveTimer=setInterval(()=>{void sendClickRideOn(session);},CLICK_KEEPALIVE_MS);
  clickMessage('Zwift Click activated · idle keepalive every 15s · press + or − to shift');
 }catch(err){clickMessage('Zwift Click: '+String(err));throw err;}
}
$('connectClick').addEventListener('click',async()=>{try{const bluetooth=(navigator as any).bluetooth;if(!bluetooth)throw Error('Web Bluetooth unavailable');const selected=await bluetooth.requestDevice({filters:[{namePrefix:'Zwift Click'},{namePrefix:'Zwift Play'},{namePrefix:'Zwift'}],optionalServices:[CLICK_SERVICE]});pausedBleRoles.delete('click');rememberDevice('click',selected);await connectClickDevice(selected);}catch(err){clickMessage('Zwift Click: '+String(err));}});
$('disconnectClick').addEventListener('click',()=>{pausedBleRoles.add('click');
 stopClickKeepalive();clickSession++;
 if(clickCharacteristic&&clickHandler)clickCharacteristic.removeEventListener('characteristicvaluechanged',clickHandler);
 clickDevice?.gatt?.disconnect();clickDevice=null;clickCharacteristic=null;clickHandler=null;
 plusPressed=false;minusPressed=false;
 clickMessage('Zwift Click disconnected');
});


// Browser-approved Bluetooth device recovery. Never calls requestDevice outside a user click.
// The browser retains permissions; localStorage only records device role/ID, not pairing secrets.
type DeviceRole='trainer'|'hr'|'click';
const REMEMBERED_BLE_KEY='breakaway-remembered-ble-v1';
const pausedBleRoles=new Set<DeviceRole>();
const AUTO_BLE_KEY='breakaway-auto-bluetooth-v1';
const rememberedBle:Partial<Record<DeviceRole,string>>=(()=>{
 try{return JSON.parse(localStorage.getItem(REMEMBERED_BLE_KEY)||'{}');}catch{return {};}
})();
let autoBluetoothEnabled=localStorage.getItem(AUTO_BLE_KEY)!=='false';
let autoBluetoothBusy=false;
let lastAutoAttempt=0;
const autoBleStatus=$('autoBleStatus');
const autoBleToggle=$('autoBluetooth') as HTMLInputElement;
autoBleToggle.checked=autoBluetoothEnabled;
function rememberDevice(role:DeviceRole,selected:any){
 if(!selected?.id)return;
 rememberedBle[role]=selected.id;
 try{localStorage.setItem(REMEMBERED_BLE_KEY,JSON.stringify(rememberedBle));}catch{}
 autoBleStatus.textContent=`Remembered ${selected.name||role}. Automatic reconnect ${autoBluetoothEnabled?'enabled':'disabled'}.`;
}
function roleConnected(role:DeviceRole){
 return role==='trainer'?connected&&!!device?.gatt?.connected:role==='hr'?!!hrDevice?.gatt?.connected:!!clickDevice?.gatt?.connected;
}
async function reconnectRememberedBluetooth(){
 if(!autoBluetoothEnabled||autoBluetoothBusy||document.hidden)return;
 const bluetooth=(navigator as any).bluetooth;
 if(typeof bluetooth?.getDevices!=='function'){
  autoBleStatus.textContent='Automatic reconnection requires a Chrome/Edge version supporting previously approved Bluetooth devices.';
  return;
 }
 autoBluetoothBusy=true;
 try{
  const devices:any[]=await bluetooth.getDevices();
  const roles:DeviceRole[]=['trainer','hr','click'];
  let count=0;
  for(const role of roles){
   if(!autoBluetoothEnabled||pausedBleRoles.has(role)||roleConnected(role)||!rememberedBle[role])continue;
   const selected=devices.find(d=>d.id===rememberedBle[role]);
   if(!selected)continue;
   try{
    if(role==='trainer')await connectTrainerDevice(selected);
    else if(role==='hr')await connectHrDevice(selected);
    else await connectClickDevice(selected);
    count++;
   }catch{/* Device may be powered off or out of range; retry later. */}
  }
  if(count)autoBleStatus.textContent=`Automatically reconnected ${count} remembered device${count===1?'':'s'}.`;
  else if(!roles.some(role=>rememberedBle[role]))autoBleStatus.textContent='Connect each device once to remember it for future sessions.';
 }catch(err){autoBleStatus.textContent='Bluetooth recovery unavailable: '+String(err);}
 finally{autoBluetoothBusy=false;}
}
autoBleToggle.addEventListener('change',()=>{
 autoBluetoothEnabled=autoBleToggle.checked;
 localStorage.setItem(AUTO_BLE_KEY,String(autoBluetoothEnabled));
 autoBleStatus.textContent=autoBluetoothEnabled?'Automatic reconnection enabled.':'Automatic reconnection paused.';
 if(autoBluetoothEnabled)void reconnectRememberedBluetooth();
});
$('forgetBluetooth').addEventListener('click',()=>{
 for(const role of ['trainer','hr','click'] as DeviceRole[]){delete rememberedBle[role];pausedBleRoles.add(role);}
 localStorage.removeItem(REMEMBERED_BLE_KEY);
 autoBleStatus.textContent='Remembered device assignments cleared. Browser Bluetooth permissions can be removed in site settings.';
});
window.addEventListener('focus',()=>void reconnectRememberedBluetooth());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void reconnectRememberedBluetooth();});
setInterval(()=>{
 if(Date.now()-lastAutoAttempt<12000)return;
 lastAutoAttempt=Date.now();
 void reconnectRememberedBluetooth();
},12000);
void reconnectRememberedBluetooth();


// Floating overlay is a movable, resizable panel over the ride dashboard.
// Pop-out window is a separate browser window; it stays synced via postMessage.
const floatPanel=$('floatingProfile') as HTMLElement;
const floatChart=$('floatChart') as HTMLElement;
let popout:Window|null=null;
function syncProfileCharts(){
 const original=$('chart').querySelector('svg');
 if(original)floatChart.innerHTML='<div id="floatLiveGrade" class="profile-live-grade" aria-label="Current gradient"></div><div class="profile-telemetry"><span class="profile-gear-readout"></span><span class="profile-hr-readout">— bpm</span></div>'+original.outerHTML.replace('id="marker"','id="floatMarker"');
 publishProfile();
}
function profileSnapshot(){
 const p=at(distance),max=points.at(-1)?.distance||0;
 const chartCopy=$('chart').cloneNode(true) as HTMLElement;const live=chartCopy.querySelector<HTMLElement>('#profileLiveGrade');if(live){const hud=gradeHud(displayGrade());live.textContent=hud.label;live.style.color=hud.color;live.style.fontSize=hud.size+'px';}
 return {kind:'gpx-profile',chart:chartCopy.innerHTML,distance:(distance/METERS_PER_MILE).toFixed(2)+' mi',grade:displayGrade().toFixed(1)+'%',elevation:Math.round(p.elevation*FEET_PER_METER)+' ft',progress:endless?0:(max?distance/max:0)};
}
function publishProfile(){
 if(popout&&!popout.closed)popout.postMessage(profileSnapshot(),location.origin);
}
function updateFloatingProfile(){
 const p=at(distance),max=points.at(-1)?.distance||0;
 $('floatDistance').textContent=(distance/METERS_PER_MILE).toFixed(2)+' mi';
 $('floatGrade').textContent=displayGrade().toFixed(1)+'%';
 const floatingHud=$('floatLiveGrade');if(floatingHud){const hud=gradeHud(displayGrade());floatingHud.textContent=hud.label;floatingHud.style.color=hud.color;floatingHud.style.fontSize=hud.size+'px';floatingHud.innerHTML=hud.label+climbHud(climbNow());}
 $('floatElevation').textContent=Math.round(p.elevation*FEET_PER_METER)+' ft';
 if(Date.now()<climbAwardUntil){const ch=$('floatChart');ch.innerHTML='<div style="min-height:180px;display:grid;place-items:center;font:900 36px system-ui;color:#6cf5c9;text-align:center">⛰ CLIMB COMPLETE!</div>'; }else if(!$('floatMarker'))syncProfileCharts();
 updateRiderDot($('floatMarker'),distance);
 publishProfile();
}
$('floatProfile').addEventListener('click',()=>{
 floatPanel.hidden=false;
 if(!floatChart.querySelector('svg'))syncProfileCharts();
 updateFloatingProfile();
});
$('dockProfile').addEventListener('click',()=>{floatPanel.hidden=true;});
$('closeFloat').addEventListener('click',()=>{floatPanel.hidden=true;});
// Pointer-based dragging works with a mouse or touch. Position remains on-screen.
const handle=$('floatingProfileHandle') as HTMLElement;
let drag:{x:number;y:number;left:number;top:number}|null=null;
handle.addEventListener('pointerdown',e=>{
 if((e.target as HTMLElement).closest('button'))return;
 const rect=floatPanel.getBoundingClientRect();
 floatPanel.style.left=rect.left+'px';floatPanel.style.top=rect.top+'px';floatPanel.style.right='auto';floatPanel.style.bottom='auto';
 drag={x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};handle.setPointerCapture(e.pointerId);
});
handle.addEventListener('pointermove',e=>{
 if(!drag)return;
 const left=Math.max(0,Math.min(window.innerWidth-80,drag.left+e.clientX-drag.x));
 const top=Math.max(0,Math.min(window.innerHeight-55,drag.top+e.clientY-drag.y));
 floatPanel.style.left=left+'px';floatPanel.style.top=top+'px';
});
const stopDragging=()=>{drag=null;};
handle.addEventListener('pointerup',stopDragging);
handle.addEventListener('pointercancel',stopDragging);
// The native companion starts hidden. A user click reveals it above other apps.
$('entertainmentView').addEventListener('click',()=>{($('nativeProfile') as HTMLButtonElement).click();});
$('nativeProfile').addEventListener('click',async()=>{
 if(window.breakawayDesktop){
  try{await window.breakawayDesktop.openOverlay();lastOverlayPush=0;publishDesktopOverlay();status('Native always-on-top overlay opened. Adjust true window opacity in its header.');}
  catch(e){status('Unable to open native overlay: '+String(e));}
  return;
 }
 if(!('documentPictureInPicture' in window)){status('Always-on-top requires a recent desktop Chrome or Edge. Use Pop out window as a fallback.');return;}
 try{
  const pip=await (window as any).documentPictureInPicture.requestWindow({width:Math.max(760,Math.min(1800,window.screen.availWidth-24)),height:245});
  const savedOverlayOpacity=Math.max(20,Math.min(100,Number(localStorage.getItem('breakaway-overlay-opacity')||'100')||100));
  pip.document.head.innerHTML=`<title>Breakaway Cycling Overlay</title><style>
   *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b1520;color:#f4f8ff;font:12px system-ui,sans-serif}
   body{padding:5px 9px 7px}#overlayContent{height:100%;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,12%)) minmax(0,1fr) repeat(2,minmax(0,12%));grid-template-rows:19px repeat(2,minmax(0,1fr));gap:4px 7px}
   #overlayTop{grid-column:1 / -1;grid-row:1;display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
   #overlayTop strong{font-size:10px;letter-spacing:.05em;white-space:nowrap;color:#b8c9dc}
   #overlayLabel{font-size:10px;color:#c7d5e4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
   #overlayActions{display:flex;align-items:center;gap:5px;flex:0 0 auto}
   #overlayZoomControls{display:flex;gap:3px;align-items:center}#overlayZoomControls button{min-width:27px;padding:2px 4px!important}#overlayZoomControls button.active{background:#8db6ff!important;color:#0b1520!important;border-color:#8db6ff!important}#overlayActions button{background:#20374c;color:#e8f4ff;border:1px solid #446079;border-radius:5px;font:600 10px system-ui;padding:2px 7px;cursor:pointer}
   #overlaySettings{display:none;position:absolute;right:9px;top:26px;z-index:5;background:#20374c;padding:9px;border:1px solid #537087;border-radius:8px;box-shadow:0 6px 18px #0008}
   #overlaySettings.open{display:flex;align-items:center;gap:6px}
   #overlayOpacity{width:100px;accent-color:#45d6aa}
   #overlayMetrics{display:contents}
   .tile{min-width:0;min-height:0;background:#1b3246;border-radius:5px;padding:3px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;cursor:grab}
   .tile b{font-size:clamp(17px,2vw,29px);line-height:1.1;font-weight:800;color:#f4f8ff;white-space:nowrap;font-variant-numeric:tabular-nums}
   .tile small{font-size:10px;line-height:1.2;color:#c7d5e4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
   #overlayChart{grid-column:3;grid-row:2 / span 2;min-height:0;overflow:hidden;border-radius:4px;background:#0d1d2b}
   #overlayChart .overlay-profile-graphic{height:100%!important}
   #overlayChart svg{width:100%!important;height:100%!important;display:block}
   body.expanded #overlayContent{grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:19px repeat(2,minmax(0,1fr)) minmax(0,2fr)}
   body.expanded #overlayChart{grid-column:1 / -1;grid-row:4}
   body.expanded .tile b{font-size:clamp(16px,1.8vw,26px)}
   #overlayContent:not(.survive-overlay) .tile{padding:2px 3px}
   #overlayContent:not(.survive-overlay) .tile b{font-size:clamp(13px,1.5vw,24px);max-width:100%;letter-spacing:-.035em}
   #overlayContent:not(.survive-overlay) .tile small{font-size:clamp(8px,.7vw,10px)}
   #overlayContent:not(.survive-overlay) .tile[data-metric-key="elapsedTime"] b{font-size:clamp(14px,1.65vw,25px)}
   #overlayContent.survive-overlay{display:block!important;box-sizing:border-box;background:#102a2d!important;border:2px solid #35c96b;border-radius:8px;padding:10px 16px!important}#overlayContent.survive-overlay.survive-danger{background:#493221!important;border-color:#ff9b31}#overlayContent.survive-overlay.survive-critical{background:#541d2a!important;border-color:#f04452}#overlayContent.survive-overlay.survive-phase-chase{background:#441724!important;border-color:#ff4868!important;box-shadow:inset 0 0 38px #ff315326;transition:background .55s ease,border-color .55s ease,box-shadow .55s ease}#overlayContent.survive-overlay.survive-phase-recover{background:#103c2c!important;border-color:#42df9c!important;box-shadow:inset 0 0 38px #24e18d24;transition:background .55s ease,border-color .55s ease,box-shadow .55s ease}#overlayContent.survive-overlay.survive-phase-prepare{background:#183348!important;border-color:#60b8ff!important;transition:background .55s ease,border-color .55s ease}#overlayContent.survive-overlay.survive-phase-chase .survive-hud-head{color:#ffafc0!important}#overlayContent.survive-overlay.survive-phase-recover .survive-hud-head{color:#a1f4c9!important}#overlayContent.survive-overlay.survive-phase-chase .survive-hud-metric{background:#62273a!important}#overlayContent.survive-overlay.survive-phase-recover .survive-hud-metric{background:#205541!important}#overlayContent.survive-overlay.survive-phase-chase .survive-hud-timer>div{background:#62273a!important}#overlayContent.survive-overlay.survive-phase-recover .survive-hud-timer>div{background:#205541!important}#overlayContent.survive-overlay.survive-phase-chase .survive-hud-timer{background:#2d101d!important}#overlayContent.survive-overlay.survive-phase-recover .survive-hud-timer{background:#0c2d22!important}#overlayContent.survive-overlay #overlayTop,#overlayContent.survive-overlay #overlayMetrics,#overlayContent.survive-overlay #overlayChart{display:none!important}#surviveHud{height:100%;display:flex;flex-direction:column;justify-content:space-around;gap:5px;color:white;font-family:system-ui}.survive-hud-head,.survive-hud-main,.survive-hud-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px}.survive-hud-head{font-size:12px;color:#a8e9cb}.survive-hud-main strong{font-size:clamp(15px,2.4vw,26px)}.survive-hud-main b{font-size:clamp(25px,4vw,42px);color:#ffb09c;white-space:nowrap}.survive-hud-track{height:13px;border-radius:9px;background:#15202d;overflow:hidden}.survive-hud-track i{display:block;height:100%;background:#35c96b}.survive-hud-bottom{font-size:11px;font-weight:800;flex-wrap:wrap}#overlayContent.survive-overlay.survive-critical .survive-hud-track i{background:#f04452}
   #surviveHud{justify-content:flex-start!important;gap:5px!important}
   .survive-hud-grid{display:grid;grid-template-columns:minmax(95px,18%) minmax(0,1fr) minmax(95px,18%);grid-template-rows:repeat(2,minmax(0,1fr));gap:5px 7px;flex:1;min-height:0}
   .survive-hud-metric{background:#1b3246;border-radius:6px;display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:0}
   .survive-hud-metric small{font-size:10px;font-weight:800;color:#b6cddd;white-space:nowrap}
   .survive-hud-metric b{font-size:clamp(19px,2.8vw,36px);font-weight:900;font-variant-numeric:tabular-nums;color:#fff}
   .survive-hud-profile{grid-column:2;grid-row:1 / span 2;position:relative;overflow:hidden;background:#0d1d2b;border-radius:6px;min-height:0}
   .survive-hud-profile .overlay-profile-graphic{height:calc(100% - 64px)!important}.survive-hud-profile svg{width:100%!important;height:calc(100% - 64px)!important}
   .survive-hud-dots{position:absolute;left:7px;right:7px;bottom:72px;height:12px;border-top:2px solid #ffffff66}
   .survive-hud-dots i{position:absolute;top:-7px;width:12px;height:12px;border-radius:50%;box-shadow:0 0 0 2px #0d1d2b}
   .survive-hud-dots .threat{background:#f04452}.survive-hud-dots .rider{background:#ffd43b;right:auto}
   .survive-hud-timer{position:absolute;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:4px;background:#071724;border-radius:0 0 6px 6px;white-space:nowrap}.survive-hud-timer>div{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;background:#1b3246;border-radius:5px}.survive-hud-timer small{font-size:9px;color:#b6cddd;font-weight:800}
   .survive-hud-timer strong{font-size:clamp(14px,2vw,24px);color:#fff;font-variant-numeric:tabular-nums}.survive-hud-timer span{font-size:10px;color:#d9eaf2;overflow:hidden;text-overflow:ellipsis;max-width:100%}
   .survive-hud-gap{font-size:clamp(15px,1.8vw,24px);color:#ffd43b;font-weight:900;white-space:nowrap;text-shadow:0 1px 4px #000}.survive-hud-spacer{display:none}
   .survive-hud-grid>.survive-hud-metric:nth-child(1){grid-column:1;grid-row:1}
   .survive-hud-grid>.survive-hud-metric:nth-child(3){grid-column:3;grid-row:1}
   .survive-hud-grid>.survive-hud-metric:nth-child(4){grid-column:1;grid-row:2}
   .survive-hud-grid>.survive-hud-metric:nth-child(6){grid-column:3;grid-row:2}
   @media(max-width:800px){.tile b{font-size:17px}.tile small{font-size:9px}#overlayTop strong{font-size:9px}}
  </style>`;
  pip.document.body.innerHTML='<div id="overlayContent"><div id="overlayTop"><strong>BREAKAWAY</strong><div id="overlayLabel"></div><div id="overlayActions"><button id="overlayMode" type="button" aria-label="Switch overlay layout">Expand</button><div id="overlayZoomControls" role="group" aria-label="Elevation zoom"><button type="button" data-zoom="1">1×</button><button type="button" data-zoom="2">2×</button><button type="button" data-zoom="5">5×</button><button type="button" data-zoom="10">10×</button></div><button id="overlaySettingsToggle" type="button" aria-label="Overlay settings">⚙</button></div></div><div id="overlayMetrics"></div><div id="overlayChart"></div></div><div id="overlaySettings"><label for="overlayOpacity">Opacity</label><input id="overlayOpacity" type="range" min="20" max="100" step="5" value="100"><output id="overlayOpacityValue">100%</output></div>';
  const modeButton=pip.document.getElementById('overlayMode') as HTMLButtonElement;
  const settingsButton=pip.document.getElementById('overlaySettingsToggle') as HTMLButtonElement;
  const settingsPanel=pip.document.getElementById('overlaySettings') as HTMLElement;
  const zoomControls=pip.document.getElementById('overlayZoomControls') as HTMLElement;
  const refreshZoomButtons=()=>{zoomControls.querySelectorAll<HTMLButtonElement>('button').forEach(button=>{const active=Number(button.dataset.zoom)===overlayZoomFactor;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});};
  zoomControls.addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-zoom]');if(!button)return;overlayZoomFactor=Number(button.dataset.zoom)||1;try{localStorage.setItem('breakaway-overlay-zoom',String(overlayZoomFactor));}catch{}refreshZoomButtons();lastOverlayPush=0;publishDesktopOverlay();});
  refreshZoomButtons();
  const savedMode=localStorage.getItem('breakaway-overlay-mode')==='expanded'?'expanded':'compact';
  const setMode=(mode:'compact'|'expanded')=>{
   pip.document.body.classList.toggle('expanded',mode==='expanded');
   modeButton.textContent=mode==='expanded'?'Compact':'Expand';
   try{localStorage.setItem('breakaway-overlay-mode',mode);}catch{}
   try{pip.resizeTo(pip.outerWidth,mode==='expanded'?315:245);}catch{}
  };
  modeButton.addEventListener('click',()=>setMode(pip.document.body.classList.contains('expanded')?'compact':'expanded'));
  settingsButton.addEventListener('click',()=>settingsPanel.classList.toggle('open'));
  setMode(savedMode);
  const opacityInput=pip.document.getElementById('overlayOpacity') as HTMLInputElement;
  const opacityValue=pip.document.getElementById('overlayOpacityValue') as HTMLOutputElement;
  const opacityContent=pip.document.getElementById('overlayContent') as HTMLElement;
  const applyOpacity=()=>{
   const pct=Math.max(20,Math.min(100,Number(opacityInput.value)||100));
   opacityContent.style.opacity=String(pct/100);
   opacityValue.textContent=pct+'%';
   try{localStorage.setItem('breakaway-overlay-opacity',String(pct));}catch{}
  };
  opacityInput.value=String(savedOverlayOpacity);
  opacityInput.addEventListener('input',applyOpacity);
  applyOpacity();
  overlayWindow=pip;applyReadoutSize();
  const pipMetrics=pip.document.getElementById('overlayMetrics') as HTMLElement;
  // Compact slots are independently customizable: drag/drop or click two tiles to swap.
  // The wide elapsed-time slot stays reserved to prevent its clock from being clipped.
  const compactStorageKey='breakaway-overlay-compact-slots-v1';
  const defaultCompact=['gear','speed','power','cadence','heartRate','totalGain','elapsedTime'];
  const loadCompact=()=>{try{const v=JSON.parse(localStorage.getItem(compactStorageKey)||'null');return Array.isArray(v)&&v.length===7&&new Set(v).size===7&&defaultCompact.every(k=>v.includes(k))?v as string[]:defaultCompact.slice();}catch{return defaultCompact.slice();}};
  let swapSelection:string|null=null,dragKey:string|null=null;
  const swapCompact=(first:string,second:string)=>{
   if(first===second)return;
   const slots=loadCompact(),a=slots.indexOf(first),b=slots.indexOf(second);
   if(a<0||b<0||a===6||b===6)return; // Keep elapsed time in the full-width slot.
   [slots[a],slots[b]]=[slots[b],slots[a]];
   localStorage.setItem(compactStorageKey,JSON.stringify(slots));
   swapSelection=null;lastOverlayPush=0;publishDesktopOverlay();
  };
  pipMetrics.addEventListener('click',event=>{
   if(pip.document.body.classList.contains('expanded'))return;
   const tile=(event.target as HTMLElement).closest<HTMLElement>('.tile'),key=tile?.dataset.metricKey;
   if(!key||key==='elapsedTime')return;
   if(swapSelection){swapCompact(swapSelection,key);swapSelection=null;}
   else swapSelection=key;
   pipMetrics.querySelectorAll<HTMLElement>('.tile').forEach(t=>t.style.outline=t.dataset.metricKey===swapSelection?'2px solid #45d6aa':'');
  });
  pipMetrics.addEventListener('dragstart',event=>{
   if(pip.document.body.classList.contains('expanded'))return;
   dragKey=(event.target as HTMLElement).closest<HTMLElement>('.tile')?.dataset.metricKey||null;
   if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
  });
  pipMetrics.addEventListener('dragover',event=>{if(dragKey&&!pip.document.body.classList.contains('expanded'))event.preventDefault();});
  pipMetrics.addEventListener('drop',event=>{
   if(!dragKey||pip.document.body.classList.contains('expanded'))return;
   event.preventDefault();
   const target=(event.target as HTMLElement).closest<HTMLElement>('.tile')?.dataset.metricKey;
   if(target)swapCompact(dragKey,target);
   dragKey=null;
  });
  pipMetrics.addEventListener('dragend',()=>{dragKey=null;});
  wireReadoutSorting(pipMetrics,'.tile',keys=>{overlayOrder=keys;localStorage.setItem(OVERLAY_ORDER_KEY,JSON.stringify(keys));});
  lastOverlayPush=0;publishDesktopOverlay();
  pip.addEventListener('pagehide',()=>{if(overlayWindow===pip)overlayWindow=null;});
  status('Floating ride overlay opened.');
 }catch(e){status('Unable to open floating overlay: '+String(e));}
});
$('popProfile').addEventListener('click',()=>{
 const w=window.open('','gpxElevationProfile','width=850,height=360,resizable=yes');
 if(!w){status('Pop-up blocked: allow pop-ups for this site.');return;}
 popout=w;
 // This window displays only route data sent by its opener, not Bluetooth controls.
 w.document.open();
 w.document.write(`<!doctype html><html><head><title>GPX Elevation Profile</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:15px system-ui;background:#0b1520;color:#e9f0f2;margin:14px}header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}b{color:#45d6aa}#plot svg{width:100%;height:240px;background:#0c1c2b;border-radius:10px}</style></head><body><header><strong>GPX Elevation Profile</strong><span id="stats">Waiting for route…</span></header><div id="plot"></div><script>window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.opener||e.data?.kind!=='gpx-profile')return;document.getElementById('plot').innerHTML=e.data.chart;document.getElementById('stats').textContent=e.data.distance+'  ·  '+e.data.grade+'  ·  '+e.data.elevation;/* Rider dot position is included in the live profile snapshot. */});window.opener?.postMessage({kind:'profile-ready'},location.origin);<\/script></body></html>`);
 w.document.close();
 publishProfile();
});
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===popout&&e.data?.kind==='profile-ready')publishProfile();});

// Render a rider-centered profile independently of the route inspector.
// The overlay must not inherit the main chart's manually scrubbed position.
// The overlay uses its own terrain windows, independent of the main inspector.
// Hysteresis avoids flickering at the 6% threshold; brief terrain spikes are ignored.
let steepOverlay=false, steepSince=0, gentleSince=0;
function updateSteepOverlay(now:number){
 const grade=at(distance).grade;
 if(grade>=6){gentleSince=0;if(!steepSince)steepSince=now;if(!steepOverlay&&now-steepSince>=1200)steepOverlay=true;}
 else if(grade<5){steepSince=0;if(!gentleSince)gentleSince=now;if(steepOverlay&&now-gentleSince>=2500)steepOverlay=false;}
 else{steepSince=0;gentleSince=0;}
 return steepOverlay;
}
// Display the selected route's opening slope before the ride begins.
function displayGrade(){
 if(distance<=0&&!running&&points.length>1){
  const first=points[0],next=points.find(p=>p.distance>first.distance+0.1);
  if(next)return (next.elevation-first.elevation)/Math.max(.1,next.distance-first.distance)*100;
 }
 return at(distance).grade;
}
// Shared grade HUD: identical thresholds, colors, and sizing on dashboard and overlay.
function gradeHud(grade:number){
 const color=gradeColor(grade);
 const size=Math.abs(grade)>18?44:Math.abs(grade)>12?38:Math.abs(grade)>6?32:26;
 return {color,size,label:grade.toFixed(1)+'%'};
}
function overlayChart(start:number,stop:number,markerDistance:number){
 const w=900,h=190,pad=12;
 const all=overviewPoints();
 const samples=[overviewAt(start),...all.filter(p=>p.distance>start&&p.distance<stop),overviewAt(stop)];
 const min=Math.min(...samples.map(p=>p.elevation));
 const range=Math.max(1,Math.max(...samples.map(p=>p.elevation))-min);
 const stride=Math.max(1,Math.ceil(samples.length/650));
 const reduced=samples.filter((_,i)=>i%stride===0);
 if(reduced.at(-1)!==samples.at(-1))reduced.push(samples.at(-1)!);
 // Each colored vertical strip represents the grade of the segment ahead.
 // The full descent-to-climb palette blends continuously between grade stops.
 const x=(d:number)=>pad+(d-start)/Math.max(1,stop-start)*(w-2*pad);
 const y=(e:number)=>h-pad-(e-min)/range*(h-2*pad);
 // Use the shared continuous gradient palette.
 const clipId='breakaway-terrain-clip-'+Math.random().toString(36).slice(2,10);
 const terrain=reduced.map(p=>`${x(p.distance)},${y(p.elevation)}`).join(' ');
 const fillPath=`M ${x(start)} ${h-pad} L ${terrain.replaceAll(' ', ' L ')} L ${x(stop)} ${h-pad} Z`;
 // Draw each grade-colored segment as a terrain-bounded polygon rather than
 // relying on SVG clipPath (which can fail in Document Picture-in-Picture).
 const strips=240;
 const segments=Array.from({length:strips},(_,i)=>{
  const d0=start+(stop-start)*i/strips;
  const d1=start+(stop-start)*(i+1)/strips;
  const e0=overviewAt(d0).elevation;
  const e1=overviewAt(d1).elevation;
  const grade=(e1-e0)/Math.max(0.001,d1-d0)*100;
  return `<polygon points="${x(d0).toFixed(2)},${h-pad} ${x(d0).toFixed(2)},${y(e0).toFixed(2)} ${x(d1).toFixed(2)},${y(e1).toFixed(2)} ${x(d1).toFixed(2)},${h-pad}" fill="${gradeColor(grade)}"/>`;
 }).join('');
 const markerX=x(Math.max(start,Math.min(stop,markerDistance)));
 const hud=gradeHud(markerDistance<=0?displayGrade():at(markerDistance).grade);
 return `<div class="overlay-profile-graphic" style="position:relative;width:100%;overflow:hidden"><div class="overlay-profile-grade" aria-label="Current gradient" style="position:absolute;z-index:3;top:12px;left:16px;pointer-events:none;font-weight:850;line-height:1;letter-spacing:-.045em;text-shadow:0 2px 6px #061019,0 0 3px #061019;color:${hud.color};font-size:${hud.size}px">${hud.label}${climbHud(climbNow())}</div><svg viewBox="0 0 ${w} ${h}" style="display:block;width:100%;height:210px" preserveAspectRatio="none">${segments}<polyline points="${terrain}" fill="none" stroke="#e9f0f2" stroke-width="1.6" opacity=".85"/><line x1="${markerX}" x2="${markerX}" y1="0" y2="${h}" stroke="#ffc85c" stroke-width="3"/></svg></div>`;
}
let overlayZoomFactor=[1,2,5,10].includes(Number(localStorage.getItem('breakaway-overlay-zoom')))?Number(localStorage.getItem('breakaway-overlay-zoom')):1;
function desktopOverlayProfiles(){
 const routeEnd=Math.max(1,routeEndForProfile());
 const steep=updateSteepOverlay(Date.now());
 const activeClimb=climbNow();
 const climb=activeClimb&&distance>=activeClimb.start&&distance<activeClimb.end?activeClimb:null;
 // An active categorized climb takes priority over manual zoom; restore the
 // selected zoom level as soon as the rider passes the climb finish.
 const baseSpan=endless?Math.min(routeEnd,5*METERS_PER_MILE):routeEnd;
 const span=climb?Math.min(routeEnd,climb.end-climb.start+300):Math.min(routeEnd,baseSpan/overlayZoomFactor);
 const start=climb?Math.max(0,climb.start-150):Math.max(0,Math.min(routeEnd-span,distance-span/2));
 const stop=Math.min(routeEnd,start+span);
 const label=climb?'⛰ CLIMB · '+((climb.end-distance)/METERS_PER_MILE).toFixed(2)+' MI LEFT · '+climb.meanGrade.toFixed(1)+'% AVG':(steep?'STEEP GRADE · ':'')+(overlayZoomFactor===1?'ENTIRE ROUTE':overlayZoomFactor+'× ZOOM')+' · '+(span/METERS_PER_MILE).toFixed(1)+' MI';
 return {
  detailChart:overlayChart(start,stop,distance),
  profileStart:start,
  profileStop:stop,
  detailLabel:label,
  endless
 };
}


// Custom readout layout for dashboard and Chrome Picture-in-Picture.
// Drag cards to reorder; use the size slider for all readouts.
// Layout is stored only in this browser.
const READOUT_LAYOUT_KEY='breakaway-readout-layout-v404';
const READOUT_SIZE_KEY='breakaway-readout-size-v404';
let readoutSize=Math.max(24,Math.min(56,Number(localStorage.getItem(READOUT_SIZE_KEY)||40)||40));
function wireReadoutSorting(container:HTMLElement,selector:string,onSorted:(keys:string[])=>void){
 let dragged:HTMLElement|null=null;
 container.addEventListener('dragstart',event=>{
  const card=(event.target as HTMLElement).closest<HTMLElement>(selector);
  if(!card)return;dragged=card;event.dataTransfer?.setData('text/plain',card.dataset.metricKey||'');
  if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
 });
 container.addEventListener('dragover',event=>{
  if(!dragged)return;event.preventDefault();
  const over=(event.target as HTMLElement).closest<HTMLElement>(selector);
  if(!over||over===dragged)return;
  const r=over.getBoundingClientRect();
  container.insertBefore(dragged,event.clientY<r.top+r.height/2?over:over.nextSibling);
 });
 container.addEventListener('drop',event=>{
  if(!dragged)return;event.preventDefault();
  onSorted(Array.from(container.querySelectorAll<HTMLElement>(selector)).map(el=>el.dataset.metricKey||''));
  dragged=null;
 });
 container.addEventListener('dragend',()=>{dragged=null;});
}
const dashboardContainer=document.querySelector<HTMLElement>('.metrics');
const dashboardCards=Array.from(dashboardContainer?.querySelectorAll<HTMLElement>('.metric')||[]);
const dashboardKeys=dashboardCards.map(card=>card.querySelector('b')?.id||'');
dashboardCards.forEach((card,i)=>{card.dataset.metricKey=dashboardKeys[i];card.draggable=true;card.title='Drag to rearrange';});
let dashboardOrder:string[]=dashboardKeys;
try{const stored=JSON.parse(localStorage.getItem(READOUT_LAYOUT_KEY)||'null');if(Array.isArray(stored))dashboardOrder=[...stored.filter((k:unknown)=>typeof k==='string'&&dashboardKeys.includes(k)),...dashboardKeys.filter(k=>!stored.includes(k))];}catch{}
dashboardOrder.forEach(key=>{const card=dashboardCards.find(c=>c.dataset.metricKey===key);if(card)dashboardContainer?.append(card);});
if(dashboardContainer)wireReadoutSorting(dashboardContainer,'.metric',keys=>{dashboardOrder=keys;localStorage.setItem(READOUT_LAYOUT_KEY,JSON.stringify(keys));});
let selectedReadout:HTMLElement|null=null;
dashboardContainer?.addEventListener('click',event=>{const card=(event.target as HTMLElement).closest<HTMLElement>('.metric');if(!card)return;if(!selectedReadout){selectedReadout=card;card.classList.add('readout-selected');return;}if(selectedReadout===card){card.classList.remove('readout-selected');selectedReadout=null;return;}const a=selectedReadout,b=card,marker=document.createElement('span');a.before(marker);b.before(a);marker.replaceWith(b);a.classList.remove('readout-selected');selectedReadout=null;dashboardOrder=Array.from(dashboardContainer!.querySelectorAll<HTMLElement>('.metric')).map(el=>el.dataset.metricKey||'');localStorage.setItem(READOUT_LAYOUT_KEY,JSON.stringify(dashboardOrder));});
const readoutControls=document.createElement('div');
readoutControls.className='readout-controls';readoutControls.id='rideReadoutSettings';
readoutControls.innerHTML='<label>Readout text size <input id="readoutSize" type="range" min="24" max="56" step="2"></label><output id="readoutSizeValue"></output><span class="note">Drag tiles or select two to swap. Changes save automatically.</span>';
dashboardContainer?.before(readoutControls);
 const readoutToggle=document.createElement('button');
 readoutToggle.type='button';readoutToggle.className='secondary ride-readout-toggle';
 readoutToggle.textContent='⚙ Dashboard settings';readoutToggle.setAttribute('aria-expanded','false');
 readoutControls.hidden=true;
 readoutToggle.addEventListener('click',()=>{readoutControls.hidden=!readoutControls.hidden;readoutToggle.setAttribute('aria-expanded',String(!readoutControls.hidden));});
 readoutControls.before(readoutToggle);
const sizeInput=readoutControls.querySelector<HTMLInputElement>('#readoutSize')!;
const sizeOutput=readoutControls.querySelector<HTMLOutputElement>('#readoutSizeValue')!;
function applyReadoutSize(){
 dashboardContainer?.style.setProperty('--readout-size',readoutSize+'px');
 sizeOutput.textContent=readoutSize+'px';
 if(overlayWindow&&!overlayWindow.closed)overlayWindow.document.documentElement.style.setProperty('--readout-size',Math.round(readoutSize*.78)+'px');
}
sizeInput.value=String(readoutSize);
sizeInput.addEventListener('input',()=>{readoutSize=Number(sizeInput.value);localStorage.setItem(READOUT_SIZE_KEY,String(readoutSize));applyReadoutSize();});

// Overlay metric selection is independent of the main Ride Dashboard.
// The ordered registry is shared by the selection UI and the telemetry payload.
const OVERLAY_METRICS=[
 ['distance','Distance (mi)'],['totalGain','Total ascent (ft)'],
 ['remaining','Remaining (mi)'],['grade','Gradient (%)'],
 ['elapsedTime','Elapsed time'],['speed','Virtual speed (mph)'],
 ['power','3-second power (W)'],['beersEarned','Beers earned'],
 ['caloriesBurned','Calories (kcal)'],['cadence','Cadence (RPM)'],
 ['heartRate','Heart rate (BPM)'],['gear','Virtual gear']
] as const;
type OverlayMetricKey=typeof OVERLAY_METRICS[number][0];
const OVERLAY_PREF_KEY='breakaway-overlay-metrics-v346';
const OVERLAY_ORDER_KEY='breakaway-overlay-order-v368';
let overlayOrder:string[]=[];
try{const value=JSON.parse(localStorage.getItem(OVERLAY_ORDER_KEY)||'null');if(Array.isArray(value))overlayOrder=value.filter((v:unknown)=>typeof v==='string');}catch{}
const OVERLAY_DEFAULT:OverlayMetricKey[]=['power','cadence','heartRate','gear','speed','distance','grade','elapsedTime'];
const OVERLAY_KEYS=new Set<string>(OVERLAY_METRICS.map(([key])=>key));
function loadOverlayMetrics():OverlayMetricKey[]{
 try{const raw=localStorage.getItem(OVERLAY_PREF_KEY);if(raw===null)return [...OVERLAY_DEFAULT];const data:unknown=JSON.parse(raw);
  if(Array.isArray(data))return [...new Set(data.filter((key):key is OverlayMetricKey=>typeof key==='string'&&OVERLAY_KEYS.has(key)))];
 }catch{}return [...OVERLAY_DEFAULT];
}
let selectedOverlayMetrics=loadOverlayMetrics();
function setOverlayMetrics(keys:OverlayMetricKey[]){
 selectedOverlayMetrics=[...new Set(keys)].filter(k=>OVERLAY_KEYS.has(k));
 try{localStorage.setItem(OVERLAY_PREF_KEY,JSON.stringify(selectedOverlayMetrics));}catch{}
 document.querySelectorAll<HTMLInputElement>('[data-overlay-metric]').forEach(input=>{input.checked=selectedOverlayMetrics.includes(input.dataset.overlayMetric as OverlayMetricKey);});
 lastOverlayPush=0;publishDesktopOverlay();
}
function initOverlayMetricChoices(){
 const container=$('overlayMetricChoices');
 for(const [key,label] of OVERLAY_METRICS){
  const wrapper=document.createElement('label');const input=document.createElement('input');
  input.type='checkbox';input.dataset.overlayMetric=key;input.checked=selectedOverlayMetrics.includes(key);
  input.addEventListener('change',()=>setOverlayMetrics(input.checked?[...selectedOverlayMetrics,key]:selectedOverlayMetrics.filter(k=>k!==key)));
  wrapper.append(input,document.createTextNode(label));container.append(wrapper);
 }
 $('overlaySelectAll').addEventListener('click',()=>setOverlayMetrics(OVERLAY_METRICS.map(([key])=>key)));
 $('overlaySelectNone').addEventListener('click',()=>setOverlayMetrics([]));
}
initOverlayMetricChoices();

// One-way, local-only telemetry bridge. No Bluetooth access from overlay.
let overlayWindow:Window|null=null;
applyReadoutSize();
let lastOverlayPush=0;
function publishDesktopOverlay(){
 const now=Date.now();if(now-lastOverlayPush<350)return;lastOverlayPush=now;
 const p=at(distance),max=points.at(-1)?.distance||0;
 const overlayProfiles=points.length?desktopOverlayProfiles():null;
 const snapshot={
  running, connected, trainerMode, gear,
  power:threeSecondWatts()?.toFixed(0)??null,
  cadence:realTelemetry?Math.round(cadence):null,
  heartRate:($('heartRate').textContent||'').trim(),
  speed:(speed*MPH_PER_MPS).toFixed(1),
  distance:(distance/METERS_PER_MILE).toFixed(2),
  remaining:(endless?'∞':((max-distance)/METERS_PER_MILE).toFixed(2)),
  grade:p.grade.toFixed(1),elevation:Math.round(p.elevation*FEET_PER_METER),
  totalGain:Math.round(points.length?gainLossThrough(distance).gain*FEET_PER_METER:0).toLocaleString(),
  elapsedTime:rideClock(),beersEarned:(energyKcal/BEER_KCAL).toFixed(2),
  caloriesBurned:Math.round(energyKcal).toLocaleString(),
  selectedMetrics:selectedOverlayMetrics,
  progress:endless?0:(max?Math.min(1,distance/max):0),
  detailChart:overlayProfiles?.detailChart||'',
  profileStart:overlayProfiles?.profileStart??0,
  profileStop:overlayProfiles?.profileStop??1,
  detailLabel:overlayProfiles?.detailLabel||'',
  climbComplete:Date.now()<climbAwardUntil,
  endless,
  timestamp:now
 };
 window.breakawayDesktop?.updateOverlay(snapshot);
 if(overlayWindow&&!overlayWindow.closed){
  const doc=overlayWindow.document;
  const chase=surviveData(),root=doc.getElementById('overlayContent');if(root){root.classList.toggle('survive-overlay',chase.active||chase.caught);root.classList.toggle('survive-phase-chase',chase.active&&!chase.warming&&chase.phase==='CHASE');root.classList.toggle('survive-phase-recover',chase.active&&!chase.warming&&chase.phase==='RECOVER');root.classList.toggle('survive-phase-prepare',chase.active&&chase.warming);root.classList.toggle('survive-danger',chase.active&&!chase.warming&&chase.gap<65);root.classList.toggle('survive-critical',chase.active&&!chase.warming&&chase.gap<25);let hud=doc.getElementById('surviveHud');if(chase.active||chase.caught){if(!hud){hud=doc.createElement('div');hud.id='surviveHud';root.append(hud);}hud.innerHTML='<div class="survive-hud-head"><strong>☣ SURVIVE · '+(chase.warming?'THREAT STARTS SOON':chase.phase==='RECOVER'?'RECOVERY MODE':'THREAT PURSUING')+'</strong><span>'+chase.theme+'</span></div><div class="survive-hud-grid"><div class="survive-hud-metric"><small>YOU MPH</small><b>'+chase.you.toFixed(1)+'</b></div><div class="survive-hud-profile">'+snapshot.detailChart+'<div class="survive-hud-dots"><i class="threat" style="left:'+Math.max(0,Math.min(100,(surviveEnemyDistance-snapshot.profileStart)/Math.max(1,snapshot.profileStop-snapshot.profileStart)*100))+'%"></i><i class="rider" style="left:'+Math.max(0,Math.min(100,(distance-snapshot.profileStart)/Math.max(1,snapshot.profileStop-snapshot.profileStart)*100))+'%"></i></div><div class="survive-hud-timer"><div><small>'+(chase.warming?'THREAT STARTS':'CHASE ELAPSED')+'</small><strong>'+surviveFormatTime(chase.warming?chase.remaining:surviveElapsed)+'</strong></div><div><small>GAP</small><strong class="survive-hud-gap">'+chase.gap+' m</strong></div><div><small>'+(surviveMode==='finish'?'EST. TIME LEFT':'WAVE')+'</small><strong>'+(surviveMode==='finish'?surviveFormatTime(Math.max(0,surviveFinishDistance-distance)/Math.max(1,speed)):String(chase.wave))+'</strong></div></div></div><div class="survive-hud-metric"><small>WATTS</small><b>'+(snapshot.power??'—')+'</b></div><div class="survive-hud-metric"><small>THREAT MPH</small><b>'+chase.enemy.toFixed(1)+'</b></div><div class="survive-hud-spacer"></div><div class="survive-hud-metric"><small>WAVE #</small><b>'+chase.wave+'</b></div></div>';}else hud?.remove();}
  const chart=doc.getElementById('overlayChart');if(chart)chart.innerHTML=snapshot.climbComplete?'<div style="height:210px;display:grid;place-items:center;font:900 45px system-ui;color:#6cf5c9;text-align:center;text-shadow:0 3px 18px #000">⛰ CLIMB COMPLETE!</div>':snapshot.detailChart;
  const label=doc.getElementById('overlayLabel');if(label)label.textContent=(running?'● RIDING · ':rideStart&&!rideEnd?'Ⅱ PAUSED · ':'')+snapshot.detailLabel;
  const metrics=doc.getElementById('overlayMetrics');if(metrics){
   const oldTiles=new Map(Array.from(metrics.querySelectorAll<HTMLElement>('.tile')).map(el=>[el.dataset.metricKey,el]));
   const values:Record<string,string>={distance:snapshot.distance,totalGain:snapshot.totalGain,remaining:snapshot.remaining,grade:snapshot.grade,elapsedTime:snapshot.elapsedTime,speed:snapshot.speed,power:snapshot.power??'—',beersEarned:snapshot.beersEarned,caloriesBurned:snapshot.caloriesBurned,cadence:snapshot.cadence===null?'—':String(snapshot.cadence),heartRate:snapshot.heartRate,gear:drivetrainMode==='virtual'?String(snapshot.gear):'—'};
   for(const key of [...Array.from(metrics.querySelectorAll<HTMLElement>('.tile')).map(t=>t.dataset.metricKey||''),...overlayOrder,...OVERLAY_METRICS.map(([k])=>k)].filter((k,i,a)=>a.indexOf(k)===i)){const metric=OVERLAY_METRICS.find(([k])=>k===key);if(!metric||(!selectedOverlayMetrics.includes(key as OverlayMetricKey)&&!['power','heartRate','elapsedTime','distance'].includes(key)))continue;const name=metric[1];const tile=oldTiles.get(key)||doc.createElement('div');tile.replaceChildren();tile.draggable=true;tile.dataset.metricKey=key;tile.className='tile';const val=doc.createElement('b');val.textContent=values[key];const title=doc.createElement('small');title.textContent=name;tile.append(val,title);metrics.append(tile);}
   Array.from(metrics.querySelectorAll<HTMLElement>('.tile')).forEach(tile=>{if(!selectedOverlayMetrics.includes(tile.dataset.metricKey as OverlayMetricKey)&&!['power','heartRate','elapsedTime','distance'].includes(tile.dataset.metricKey||''))tile.remove();});
   // Compact: four tiles left, three right, and an uninterrupted central profile.
   // Elapsed time spans both right columns so its digits never clip.
   const compactKeys=['gear','speed','power','cadence','heartRate','totalGain','elapsedTime'];
   const compactSlots:[string,string][]=[['1','2'],['2','2'],['1','3'],['2','3'],['4','2'],['5','2'],['4 / span 2','3']];
   const storedSlots=(()=>{try{const v=JSON.parse(localStorage.getItem('breakaway-overlay-compact-slots-v1')||'null');return Array.isArray(v)&&v.length===7&&new Set(v).size===7&&compactKeys.every(k=>v.includes(k))?v as string[]:compactKeys.slice();}catch{return compactKeys.slice();}})();
   const compactPositions:Record<string,[string,string]>={};
   storedSlots.forEach((key,i)=>{compactPositions[key]=compactSlots[i];});
   const expanded=doc.body.classList.contains('expanded');
   for(const key of compactKeys){
    if(metrics.querySelector('[data-metric-key="'+key+'"]'))continue;
    const metric=OVERLAY_METRICS.find(([k])=>k===key);
    if(!metric)continue;
    const tile=doc.createElement('div');tile.className='tile';tile.dataset.metricKey=key;
    const val=doc.createElement('b');val.textContent=values[key]??'—';
    const title=doc.createElement('small');title.textContent=metric[1];
    tile.append(val,title);metrics.append(tile);
   }
   const tiles=Array.from(metrics.querySelectorAll<HTMLElement>('.tile'));
   for(const tile of tiles){
    const key=tile.dataset.metricKey||'',position=compactPositions[key],index=tiles.indexOf(tile);
    tile.style.display=expanded?(index<8?'flex':'none'):(position?'flex':'none');
    tile.style.gridColumn=expanded?String(1+index%4):(position?.[0]||'auto');
    tile.style.gridRow=expanded?String(2+Math.floor(index/4)):(position?.[1]||'auto');
    tile.style.removeProperty('order');
   }

  }
 }

}


/* SURVIVE beta: opt-in chase; actual trainer power; no resistance manipulation. */
let surviveWarmupRemaining=0;let survivePrepRemaining=0;
let surviveMode:'classic'|'finish'='classic';
let surviveDifficulty:'recovery'|'standard'|'hard'|'nightmare'='standard';
let surviveFinishDistance=0;
let surviveWon=false;
let surviveChaseWattSeconds=0;
let surviveChaseSeconds=0;
let surviveWaitingForPedals=false;
let survivePedalStartSince=0;
const surviveDifficultyPower={recovery:.82,standard:1,hard:1.12,nightmare:1.25};let surviveOn=false,surviveCaught=false,surviveElapsed=0,surviveGap=100,surviveWave=1,surviveLast=0,surviveTheme='ZOMBIES',survivePeriod=180;

const survivePanel=document.createElement('section');survivePanel.className='survive-beta';survivePanel.innerHTML='<header><strong>☣ SURVIVE · BETA</strong><span id="surviveStatus">READY</span></header><div class="survive-controls"><label>Threat <select id="surviveTheme"><option>ZOMBIES</option><option>WOLVES</option><option>THE BUTCHER</option></select></label><label>Mode <select id="surviveMode"><option value="finish">Finish Line Survival</option><option value="classic">Classic Waves</option></select></label><label>Difficulty <select id="surviveDifficulty"><option value="recovery">Recovery</option><option value="standard" selected>Standard</option><option value="hard">Hard</option><option value="nightmare">Nightmare</option></select></label><label id="surviveWaveSettings">Wave <select id="survivePeriod"><option value="180">3 minutes</option><option value="300">5 minutes</option></select></label><button id="surviveStart">START SURVIVE</button><button id="surviveStop" disabled>END</button></div><div id="surviveHudMain" hidden><div class="survive-stats"><span>WAVE <b id="surviveWave">1</b></span><span>GAP <b id="surviveGap">100 m</b></span><span class="survive-speed-box">YOU MPH <b id="surviveYouMph">—</b></span><span class="survive-speed-box">THREAT MPH <b id="surviveThreatMph">—</b></span><span class="survive-countdown"><b id="survivePhase">CHASE</b><strong id="surviveCountdown">1:00</strong></span></div><div class="survive-track"><span class="survive-threat-dot" id="surviveThreatDot"></span><span class="survive-rider-dot" id="surviveRiderDot"></span></div><strong id="surviveMessage">OUTRUN THE PURSUERS</strong></div><p id="surviveRecord">Start with 2 or 4 minutes to prepare, then 60-second chases. Local beta records only.</p>';
// Compact setup banner: expand only when the rider wants to configure a chase.
const surviveExpand=document.createElement('button');
surviveExpand.type='button';
surviveExpand.id='surviveExpand';
surviveExpand.className='survive-expand';
surviveExpand.setAttribute('aria-expanded','false');
surviveExpand.setAttribute('aria-controls','surviveControls');
surviveExpand.textContent='Configure';
survivePanel.querySelector('header')!.append(surviveExpand);
survivePanel.querySelector('.survive-controls')!.id='surviveControls';
survivePanel.classList.add('survive-collapsed');
surviveExpand.addEventListener('click',()=>{
 const collapsed=survivePanel.classList.toggle('survive-collapsed');
 surviveExpand.setAttribute('aria-expanded',String(!collapsed));
 surviveExpand.textContent=collapsed?'Configure':'Close';
});
// Dedicated SURVIVE gameplay HUD: shown only while a chase session is active.
const surviveGameHud=document.createElement('section');
surviveGameHud.id='surviveGameHud';
surviveGameHud.className='survive-game-hud';
surviveGameHud.hidden=true;
surviveGameHud.innerHTML='<div class="survive-game-top"><strong>☣ SURVIVE</strong><span id="surviveGameState">PREPARE</span><span id="surviveGameTheme">ZOMBIES · WAVE 1</span><button id="surviveGameEnd" type="button">END SURVIVE</button></div><div class="survive-game-metrics"><div><small>YOU MPH</small><strong id="surviveGameYou">—</strong></div><div class="survive-game-gap"><small id="surviveGameGapLabel">GAP · STEADY</small><strong id="surviveGameGap">100 m</strong></div><div><small>THREAT MPH</small><strong id="surviveGameThreat">—</strong></div></div><div class="survive-game-clock"><span id="surviveGameClockLabel">CHASE BEGINS IN</span><strong id="surviveGameClock">2:00</strong><span id="surviveGameMessage">GET READY</span></div><div class="survive-game-bottom"><span>POWER <b id="surviveGamePower">—</b> W</span><span>GEAR <b id="surviveGameGear">—</b></span><span>HEART RATE <b id="surviveGameHR">—</b> BPM</span><span>DISTANCE <b id="surviveGameDistance">0.00</b> MI</span><span>ASCENT <b id="surviveGameAscent">0</b> FT</span></div>';
const surviveVictoryScreen=document.createElement('div');
surviveVictoryScreen.id='surviveVictoryScreen';
surviveVictoryScreen.hidden=true;
surviveVictoryScreen.setAttribute('role','dialog');
surviveVictoryScreen.setAttribute('aria-modal','true');
surviveVictoryScreen.innerHTML='<div class="survive-victory-card"><strong class="survive-victory-icon">🏁</strong><h2>YOU SURVIVED</h2><p>YOU REACHED THE FINISH BEFORE THE THREAT</p><div id="surviveVictoryStats"></div><button type="button" id="surviveVictoryContinue">CONTINUE RIDE</button><button type="button" id="surviveVictoryFinish">FINISH & SAVE RIDE</button></div>';
document.body.append(surviveVictoryScreen);
surviveVictoryScreen.querySelector('#surviveVictoryContinue')!.addEventListener('click',()=>{surviveVictoryScreen.hidden=true;});
surviveVictoryScreen.querySelector('#surviveVictoryFinish')!.addEventListener('click',()=>{surviveVictoryScreen.hidden=true;if(rideStart&&!rideEnd)finishRide();});
surviveGameHud.querySelector('#surviveGameEnd')!.addEventListener('click',()=>surviveEnd());
const gameSet=(id:string,value:string)=>{const el=surviveGameHud.querySelector('#'+id);if(el&&el.textContent!==value)el.textContent=value;};
const surviveFailScreen=document.createElement('div');
surviveFailScreen.id='surviveFailScreen';
surviveFailScreen.className='survive-fail-screen';
surviveFailScreen.hidden=true;
surviveFailScreen.setAttribute('role','dialog');
surviveFailScreen.setAttribute('aria-modal','true');
surviveFailScreen.setAttribute('aria-labelledby','surviveFailTitle');
surviveFailScreen.innerHTML='<div class="survive-fail-card"><div class="survive-fail-icon">☠</div><h2 id="surviveFailTitle">OH YOU DEAD</h2><p id="surviveFailTheme">THE THREAT CAUGHT YOU</p><div class="survive-fail-results"><span>WAVES SURVIVED<strong id="surviveFailWaves">0</strong></span><span>TIME SURVIVED<strong id="surviveFailTime">0:00</strong></span></div><p class="survive-fail-note">START PEDALING TO CONTINUE YOUR RIDE</p><p class="survive-fail-timer">Finishing ride in <strong id="surviveFailCountdown">30</strong> seconds</p><div class="survive-fail-actions"><button type="button" id="surviveFailContinue">CONTINUE RIDING</button><button type="button" id="surviveFailFinish">FINISH RIDE NOW</button></div></div>';
document.body.append(surviveFailScreen);
let surviveFailDeadline=0;
let surviveFailPedalSince=0;
const dismissSurviveFail=()=>{surviveFailScreen.hidden=true;surviveFailDeadline=0;surviveFailPedalSince=0;};
const continueSurviveRide=()=>{dismissSurviveFail();if(!running&&connected&&controlGranted&&realTelemetry&&rideStart&&!rideEnd)beginRide();};
const finishSurviveRide=()=>{dismissSurviveFail();if(rideStart&&!rideEnd)finishRide();};
surviveFailScreen.querySelector('#surviveFailContinue')!.addEventListener('click',continueSurviveRide);
surviveFailScreen.querySelector('#surviveFailFinish')!.addEventListener('click',finishSurviveRide);
function surviveFailTick(now:number){
 if(surviveFailScreen.hidden||!surviveFailDeadline)return;
 // Require sustained live pedaling to prevent stale trainer readings from dismissing the screen.
 const pedaling=connected&&realTelemetry&&(cadence>=20||power>=25);
 if(pedaling){if(!surviveFailPedalSince)surviveFailPedalSince=now;if(now-surviveFailPedalSince>=1200){continueSurviveRide();return;}}
 else surviveFailPedalSince=0;
 const remaining=Math.max(0,Math.ceil((surviveFailDeadline-now)/1000));
 const countdown=surviveFailScreen.querySelector('#surviveFailCountdown');
 if(countdown)countdown.textContent=String(remaining);
 if(now>=surviveFailDeadline)finishSurviveRide();
}
// The ride screen is created later; mount SURVIVE after its DOM exists.
const se=(id:string)=>survivePanel.querySelector<HTMLElement>('#'+id)!;
// A pursuer follows its own route position and obeys the same forces as the rider.
// The gap is road distance (meters), not a difference between invented flat-ground speeds.
let surviveEnemyDistance=0,surviveEnemySpeed=0;
const surviveRouteFinish=()=>Math.max(0,procedural?routeLimit:(points.at(-1)?.distance||0));
const surviveFormatTime=(seconds:number)=>Math.floor(seconds/60)+':'+String(Math.max(0,Math.floor(seconds%60))).padStart(2,'0');
function surviveTarget(){const ftp=Math.max(50,Number(($('ftp') as HTMLInputElement).value)||250),pcts=[50,60,70,75,80,85,90,95,100,105,110,115,120,125,130,135],pct=pcts[Math.min(15,surviveWave-1)]+Math.max(0,surviveWave-16)*5,work=surviveElapsed%survivePeriod<60;return {watts:ftp*(work?pct/100:.45),work};}
function surviveData(){const warming=surviveOn&&survivePrepRemaining>0,target=surviveTarget(),work=surviveMode==='finish'?true:target.work,remaining=warming?Math.ceil(survivePrepRemaining):surviveMode==='finish'?Math.ceil(Math.max(0,surviveFinishDistance-distance)/Math.max(1,speed)):Math.ceil((work?60:survivePeriod)-surviveElapsed%survivePeriod);return {active:surviveOn,caught:surviveCaught,warming,theme:surviveTheme,wave:surviveWave,gap:Math.round(surviveGap),you:speed*MPH_PER_MPS,enemy:warming?0:surviveEnemySpeed*MPH_PER_MPS,target:Math.round(target.watts),phase:warming?'PREPARE':work?'CHASE':'RECOVER',remaining,message:surviveWaitingForPedals?'START PEDALING TO BEGIN':warming?'THREAT STARTS IN '+Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):surviveCaught?'YOU WERE CAUGHT':surviveGap<25?'SPRINT! THEY ARE RIGHT BEHIND YOU':surviveGap<65?'THEY ARE CLOSING IN':surviveMode==='finish'?'REACH THE FINISH BEFORE CAPTURE':work?'OUTRUN YOUR PURSUERS':'RECOVER AND PREPARE'};}

function surviveAdvanceEnemy(dt:number){
 if(!points.length||dt<=0)return;
 const watts=Math.max(0,(surviveMode==='finish'?Math.max(50,Number(($('ftp') as HTMLInputElement).value)||250)*.9:surviveTarget().watts))*.975*(surviveMode==='finish'?surviveDifficultyPower[surviveDifficulty]:1);
 const catchup=surviveMode==='finish'?Math.min(1.2,Math.max(0,(surviveGap-75)/350)*1.2):0;
 const mass=Math.max(35,weightKg('weight')+weightKg('bikeWeight')),g=9.80665,crr=Math.max(0,num('crr'));
 const steps=Math.max(1,Math.ceil(dt/.05)),step=dt/steps;
 for(let i=0;i<steps;i++){
  // The enemy encounters terrain at its own location, not the rider's location.
  const grade=at(Math.max(0,surviveEnemyDistance)).grade/100,angle=Math.atan(grade);
  const gravity=mass*g*Math.sin(angle),rolling=mass*g*Math.cos(angle)*crr;
  const aero=.5*1.225*.38*surviveEnemySpeed*surviveEnemySpeed;
  const drive=Math.min(700,watts/Math.max(surviveEnemySpeed,1.5));
  const acceleration=(drive-gravity-rolling-aero)/mass,old=surviveEnemySpeed;
  surviveEnemySpeed=Math.max(0,Math.min(22,surviveEnemySpeed+acceleration*step));
  // Bounded catch-up acceleration only; no teleportation or instantaneous speed changes.
  if(catchup>0)surviveEnemySpeed=Math.min(22,surviveEnemySpeed+Math.min(catchup,.55)*step);
  if(watts>=35)surviveEnemySpeed=Math.max(.25,surviveEnemySpeed);
  surviveEnemyDistance+=(old+surviveEnemySpeed)*.5*step;
 }
 // Preserve the full physical separation; only the dot visualization is normalized.
 surviveGap=Math.max(0,distance-surviveEnemyDistance);
}
function surviveUpdateProfileThreat(){
 const marker=document.getElementById('surviveProfileThreat') as unknown as SVGCircleElement|null;
 if(!marker)return;
 const visible=surviveOn&&survivePrepRemaining<=0&&points.length>0;
 marker.style.display=visible?'':'none';
 if(!visible)return;
 const {start,max}=profileBounds(),w=900,h=210,pad=12;
 const pos=Math.max(start,Math.min(max,surviveEnemyDistance));
 const elevations=[overviewAt(start),...overviewPoints().filter(p=>p.distance>start&&p.distance<max),overviewAt(max)].map(p=>p.elevation);
 const min=Math.min(...elevations),range=Math.max(1,Math.max(...elevations)-min);
 marker.setAttribute('cx',String(pad+(pos-start)/Math.max(1,max-start)*(w-2*pad)));
 marker.setAttribute('cy',String(h-pad-(overviewAt(pos).elevation-min)/range*(h-2*pad)));
 marker.setAttribute('opacity',surviveEnemyDistance<start?'0.55':'1');
}
let surviveGapHistory:{t:number;gap:number}[]=[];
let surviveGapTrend:'steady'|'closing'|'extending'='steady';
function surviveGapDirection(now:number){
 if(!surviveOn||survivePrepRemaining>0){surviveGapHistory=[];surviveGapTrend='steady';return surviveGapTrend;}
 if(!surviveGapHistory.length||now-surviveGapHistory[surviveGapHistory.length-1].t>=200){
  surviveGapHistory.push({t:now,gap:surviveGap});
  while(surviveGapHistory.length>2&&now-surviveGapHistory[0].t>5000)surviveGapHistory.shift();
 }
 const first=surviveGapHistory[0];
 const elapsed=(now-first.t)/1000;
 if(elapsed<2)return surviveGapTrend;
 const rate=(surviveGap-first.gap)/elapsed;
 if(surviveGapTrend==='steady'){
  if(rate>0.7)surviveGapTrend='extending';
  else if(rate< -0.7)surviveGapTrend='closing';
 }else if(surviveGapTrend==='extending'){
  if(rate< -0.7)surviveGapTrend='closing';
  else if(rate<0.3)surviveGapTrend='steady';
 }else{
  if(rate>0.7)surviveGapTrend='extending';
  else if(rate> -0.3)surviveGapTrend='steady';
 }
 return surviveGapTrend;
}
function surviveRender(){const c=surviveData();
 const gameActive=surviveOn;
 const rideScreen=document.getElementById('screenRide');
 if(rideScreen)rideScreen.classList.toggle('survive-playing',gameActive);
 surviveGameHud.hidden=!gameActive;
 if(gameActive){
  surviveGameHud.classList.toggle('is-chase',c.phase==='CHASE'&&!c.warming);surviveGameHud.classList.toggle('is-recovery',c.phase==='RECOVER'&&!c.warming);surviveGameHud.classList.toggle('is-prepare',c.warming);
  surviveGameHud.classList.toggle('is-critical',c.gap<25&&!c.warming);
  const gapDirection=surviveGapDirection(performance.now());
  surviveGameHud.dataset.gapTrend=gapDirection;
  gameSet('surviveGameGapLabel',gapDirection==='closing'?'GAP · CLOSING':gapDirection==='extending'?'GAP · PULLING AWAY':'GAP · STEADY');
  gameSet('surviveGameState',c.warming?'THREAT STARTS SOON':c.phase==='RECOVER'?'RECOVERY MODE':'THREAT PURSUING');
  gameSet('surviveGameTheme',surviveMode==='finish'?c.theme+' · FINISH LINE · '+surviveDifficulty.toUpperCase():c.theme+' · WAVE '+c.wave);
  gameSet('surviveGameYou',c.you.toFixed(1));
  gameSet('surviveGameGap',c.warming?'—':c.gap+' m');
  gameSet('surviveGameThreat',c.enemy.toFixed(1));
  gameSet('surviveGameClockLabel',surviveMode==='finish'&&!c.warming?'EST. TIME TO FINISH':c.phase==='CHASE'?'CHASE ENDS IN':'CHASE BEGINS IN');
  gameSet('surviveGameClock',surviveMode==='finish'&&!c.warming?surviveFormatTime(Math.max(0,surviveFinishDistance-distance)/Math.max(1,speed)):surviveFormatTime(c.remaining));
  gameSet('surviveGameMessage',c.message);
  gameSet('surviveGamePower',threeSecondWatts()?.toFixed(0)??'—');
  gameSet('surviveGameGear',drivetrainMode==='virtual'?String(gear):'—');
  gameSet('surviveGameHR',document.getElementById('heartRate')?.textContent?.trim()||'—');
  gameSet('surviveGameDistance',(distance/METERS_PER_MILE).toFixed(2));
  gameSet('surviveGameAscent',String(Math.round(gainLossThrough(distance).gain*FEET_PER_METER)));
 }
surviveUpdateProfileThreat();survivePanel.classList.toggle('danger',surviveOn&&surviveGap<65);survivePanel.classList.toggle('critical',surviveOn&&surviveGap<25);se('surviveHudMain').hidden=!(surviveOn||surviveCaught);se('surviveStatus').textContent=surviveWon?'YOU SURVIVED':surviveCaught?'CAUGHT':surviveOn?(c.warming?'PREPARE':surviveMode==='finish'?'RACE TO FINISH':surviveTheme):'READY';se('surviveWave').textContent=String(c.wave);se('surviveGap').textContent=c.warming?'—':c.gap+' m';se('surviveYouMph').textContent=c.you.toFixed(1);se('surviveThreatMph').textContent=c.enemy.toFixed(1);se('survivePhase').textContent=surviveMode==='finish'&&!c.warming?'FINISH LINE':c.phase==='RECOVER'?'RECOVER & PREPARE':c.phase;se('surviveCountdown').textContent=surviveFormatTime(c.remaining);se('surviveMessage').textContent=c.message;se('surviveRiderDot').style.left='calc(100% - 13px)';se('surviveThreatDot').style.left='calc('+Math.max(2,96-94*c.gap/(c.gap+100))+'% - 5px)';(se('surviveStart') as HTMLButtonElement).disabled=surviveOn;(se('surviveStop') as HTMLButtonElement).disabled=!surviveOn;}
function surviveEnd(caught=false){if(!surviveOn)return;surviveWaitingForPedals=false;survivePedalStartSince=0;surviveOn=false;surviveCaught=caught;if(caught){const waves=Math.max(0,surviveWave-1);try{const k='breakaway-survive-beta-records',old=JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify([...(Array.isArray(old)?old:[]),{theme:surviveTheme,waves,duration:survivePeriod,date:new Date().toISOString()}].slice(-100)));}catch{}se('surviveRecord').textContent='CAUGHT · '+waves+' completed waves. Local record saved. Keep riding!';surviveFailScreen.querySelector('#surviveFailTheme')!.textContent=surviveTheme+' CAUGHT YOU';surviveFailScreen.querySelector('#surviveFailWaves')!.textContent=String(waves);const survivedSeconds=Math.floor(survivePeriod-60+surviveElapsed);surviveFailScreen.querySelector('#surviveFailTime')!.textContent=Math.floor(survivedSeconds/60)+':'+String(survivedSeconds%60).padStart(2,'0');surviveFailScreen.hidden=false;surviveFailDeadline=performance.now()+30000;surviveFailPedalSince=0;}else se('surviveRecord').textContent=surviveWon?'FINISH LINE REACHED · YOU SURVIVED!':'Chase ended. Normal riding continues.';surviveRender();lastOverlayPush=0;publishDesktopOverlay();}
function surviveTick(now:number){const dt=surviveLast?Math.max(0,Math.min(1,(now-surviveLast)/1000)):0;surviveLast=now;// SURVIVE is independent of the rider's pause state: the pursuer never stops.
 if(!surviveOn)return;
 if(surviveWaitingForPedals){
  // Require sustained fresh trainer cadence, not a stale power/speed sample.
  const pedaling=connected&&realTelemetry&&cadence>=10;
  survivePedalStartSince=pedaling?(survivePedalStartSince||now):0;
  if(!pedaling||now-survivePedalStartSince<600){surviveRender();return;}
  surviveWaitingForPedals=false;surviveLast=now;survivePedalStartSince=0;
  if(!running)beginRide();
  se('surviveStatus').textContent='SURVIVAL STARTED';
  surviveRender();return;
 }
 if(survivePrepRemaining>0){survivePrepRemaining=Math.max(0,survivePrepRemaining-dt);if(survivePrepRemaining===0){surviveEnemyDistance=distance-100;surviveEnemySpeed=Math.max(0,speed);surviveGap=100;surviveElapsed=0;surviveWave=1;}surviveRender();return;}surviveElapsed+=dt;if(surviveMode==='finish'){surviveChaseWattSeconds+=Math.max(0,power)*dt;surviveChaseSeconds+=dt;}surviveWave=surviveMode==='finish'?1:1+Math.floor(surviveElapsed/survivePeriod);surviveAdvanceEnemy(dt);if(surviveMode==='finish'&&surviveFinishDistance>0&&distance>=surviveFinishDistance&&surviveGap>0){
  surviveWon=true;
  const finishGap=Math.round(surviveGap);
  surviveEnd(false);
  const stats=surviveVictoryScreen.querySelector('#surviveVictoryStats');
  if(stats)stats.textContent='FINISHING GAP '+finishGap+' m · DISTANCE '+(surviveFinishDistance/METERS_PER_MILE).toFixed(2)+' mi · CHASE '+surviveFormatTime(surviveElapsed)+' · AVG POWER '+Math.round(surviveChaseSeconds?surviveChaseWattSeconds/surviveChaseSeconds:0)+' W';
  surviveVictoryScreen.hidden=false;
 }else if(surviveGap<=0)surviveEnd(true);surviveRender();}
se('surviveStart').addEventListener('click',()=>{if(!connected||!controlGranted||!realTelemetry){const message=!connected?'CONNECT YOUR TRAINER TO START SURVIVE':!controlGranted?'WAITING FOR TRAINER CONTROL — RECONNECT YOUR TRAINER':'WAITING FOR LIVE POWER FROM YOUR TRAINER';status(message);se('surviveStatus').textContent=message;survivePanel.classList.add('setup-warning');return;}survivePanel.classList.remove('setup-warning');
 surviveMode=(se('surviveMode') as HTMLSelectElement).value==='finish'?'finish':'classic';
 surviveDifficulty=(se('surviveDifficulty') as HTMLSelectElement).value as typeof surviveDifficulty;
 surviveFinishDistance=surviveRouteFinish();
 if(surviveMode==='finish'&&(endless||surviveFinishDistance<=distance+50)){
  const warning='FINISH LINE SURVIVAL REQUIRES A FINITE ROUTE WITH DISTANCE REMAINING. GENERATE OR UPLOAD A ROUTE FIRST.';
  se('surviveStatus').textContent=warning;status(warning);return;
 }
 surviveWon=false;surviveChaseWattSeconds=0;surviveChaseSeconds=0;surviveVictoryScreen.hidden=true;surviveOn=true;surviveWaitingForPedals=true;survivePedalStartSince=0;surviveCaught=false;survivePanel.classList.remove('setup-warning');survivePanel.classList.add('survive-collapsed');surviveExpand.setAttribute('aria-expanded','false');surviveExpand.textContent='Configure';surviveWarmupRemaining=0;surviveElapsed=0;surviveGap=100;surviveWave=1;surviveEnemyDistance=distance-100;surviveEnemySpeed=Math.max(0,speed);surviveLast=performance.now();surviveTheme=(se('surviveTheme') as HTMLSelectElement).value;survivePeriod=Number((se('survivePeriod') as HTMLSelectElement).value)||180;survivePrepRemaining=surviveMode==='finish'?120:survivePeriod-60;se('surviveStatus').textContent='START PEDALING TO BEGIN';surviveRender();lastOverlayPush=0;publishDesktopOverlay();});
se('surviveMode').addEventListener('change',()=>{const finish=(se('surviveMode') as HTMLSelectElement).value==='finish';se('surviveWaveSettings').hidden=finish;se('surviveRecord').textContent=finish?'Reach the route finish before capture. Requires a finite generated or uploaded route.':'Classic timed waves: survive as long as you can.';});
(se('surviveMode') as HTMLSelectElement).dispatchEvent(new Event('change'));
se('surviveStop').addEventListener('click',()=>surviveEnd());surviveRender();

// All overlay variables and event handlers are initialized before the first render.
last=performance.now();requestAnimationFrame(tick);update(); // profile HUD is optional until initial route generation completes
// Start each visit with a ready-to-ride randomized 5–20 mile route.
// Reuse Surprise Me so initial and button-generated routes behave identically.
setTimeout(() => {
  try {
    if (!points.length && !rideStart) {
      $('surpriseRoute').click();
      if (!points.length) status('Automatic route could not be generated. Choose Surprise Me to retry.');
    }
  } catch (error) {
    console.error('Initial route generation failed:', error);
    status('Automatic route generation failed. Choose Surprise Me to retry.');
  }
}, 0);


// OAuth navigation reloads the page. Restore only a completed ride from sessionStorage
// in the same browser tab, without cloud storage or permanent ride history.


void renderRideHistory();

// Restore drivetrain UI after all DOM event handlers are registered.
applyDrivetrainMode();

// v3.9.2: browser-specific riding guidance. This does not block route planning.
(() => {
 const panel=document.getElementById('browserCompatibility');
 if(!panel)return;
 const ua=navigator.userAgent;
 const safari=/Safari\//.test(ua)&&!/Chrome\/|Chromium\/|CriOS\/|Edg\/|EdgiOS\/|OPR\/|FxiOS\//.test(ua);
 const webBluetooth='bluetooth' in navigator;
 const documentPip='documentPictureInPicture' in window;
 const isIOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const message=document.getElementById('browserCompatibilityMessage');
 const title=document.getElementById('browserCompatibilityTitle');
 const chrome=document.getElementById('browserCompatibilityChrome');
 const dismiss=document.getElementById('browserCompatibilityDismiss');
 if(!message||!title||!chrome||!dismiss)return;
 if(safari){
  title.textContent='Safari: route planning available; riding requires a compatible browser';
  message.textContent=isIOS
   ?'You can build and edit routes here. Bluetooth trainer connections and the always-on-top ride overlay are not available in this browser. For riding, use desktop Chrome or Edge on a supported computer; Chrome on iPhone/iPad does not enable Web Bluetooth.'
   :'You can build and edit routes here. Safari does not support this app’s Web Bluetooth trainer connections or Chrome’s always-on-top ride overlay. For riding, open Breakaway in desktop Chrome or Edge.';
 }else if(!webBluetooth){
  title.textContent='Bluetooth trainer connections unavailable in this browser';
  message.textContent='Route planning remains available. To connect a Bluetooth trainer or heart-rate monitor, use a compatible desktop browser such as Chrome or Edge over HTTPS.';
 }else if(!documentPip){
  title.textContent='Floating ride overlay may be unavailable';
  message.textContent='Bluetooth connections may work, but this browser does not support Breakaway’s Chrome always-on-top overlay. Desktop Chrome is recommended for the complete riding experience.';
 }else return;
 if(isIOS)chrome.hidden=true;
 try{if(sessionStorage.getItem('breakaway-browser-notice-dismissed-v392')==='1')return;}catch{}
 panel.hidden=false;
 dismiss.addEventListener('click',()=>{panel.hidden=true;try{sessionStorage.setItem('breakaway-browser-notice-dismissed-v392','1');}catch{}});
})();


// v3.9.5: three-screen ride flow. Existing device and chart elements are moved,
// not cloned, so Bluetooth listeners and elevation rendering stay intact.
type BreakawayScreen='route'|'setup'|'ride';
let breakawayScreen:BreakawayScreen='route';
let rideCountdownTimer:number|null=null;
let rideCountdownRemaining=0;
const originalRouteStudio=document.getElementById('routeStudio')!;
const originalProfile=document.getElementById('profileSection')!;
const originalDashboard=document.querySelector<HTMLElement>('.ride-dashboard')!;
const originalConnections=document.querySelector<HTMLElement>('.connection-strip')!;
const workspace=document.getElementById('rideWorkspace')!;
// Keep navigation inside Route Studio on Create Route, and restore it on other screens.
const rideStepNav=document.querySelector<HTMLElement>('.screen-progress')!;
const rideStepNavHome=document.createComment('ride-step-navigation-home');
rideStepNav.before(rideStepNavHome);
const routeStudioHeader=originalRouteStudio.querySelector<HTMLElement>('.route-studio-header') || originalRouteStudio.querySelector<HTMLElement>('.route-studio-heading') || originalRouteStudio.querySelector<HTMLElement>('.route-panel-heading');
if(routeStudioHeader)routeStudioHeader.append(rideStepNav);
const screenRoute=document.createElement('section');screenRoute.id='screenRoute';screenRoute.className='breakaway-screen';
const screenSetup=document.createElement('section');screenSetup.id='screenSetup';screenSetup.className='breakaway-screen';
const screenRide=document.createElement('section');screenRide.id='screenRide';screenRide.className='breakaway-screen';
screenRide.prepend(survivePanel,surviveGameHud);
const rideHeading=document.createElement('div');rideHeading.className='ride-screen-header';rideHeading.innerHTML='<strong>YOUR RIDE</strong><div class="ride-screen-actions"><button id="backToSetup" class="secondary" type="button">← Devices</button><button id="backToStudio" class="secondary" type="button">Route Studio</button></div>';
const setupStepHeader=document.createElement('header');
setupStepHeader.className='breakaway-integrated-step-header';
setupStepHeader.innerHTML='<div class="integrated-step-title"><span class="route-kicker">TRAINER SETUP</span><h2>Connect your trainer</h2></div><span class="integrated-step-hint">Smart trainer and sensors</span>';
screenSetup.append(setupStepHeader);
const rideView=document.createElement('div');rideView.className='ride-screen-content';
rideView.append(originalProfile,originalDashboard);
screenRide.append(rideHeading,rideView);
// Route Studio needs its own live profile: the interactive original belongs to the ride screen.
const routePreviewPanel=document.createElement('section');
routePreviewPanel.className='route-studio-live-preview';
routePreviewPanel.innerHTML='<div class="route-studio-live-heading"><div><span class="route-step">02</span><h2>Your route preview</h2></div><span class="note">Updates when you generate or edit your route</span></div><div id="studioLiveChart" class="studio-live-chart" role="img" aria-label="Generated route elevation profile"></div><div class="studio-live-stats"><span>Distance <b id="studioPreviewMiles">—</b></span><span>Elevation gain <b id="studioPreviewGain">—</b></span><span>Terrain <b id="studioDifficulty">—</b></span><span>Est. time <b id="studioEstimatedTime">—</b></span><span>Steepest grade <b id="studioSteepestGrade">—</b></span></div>';
originalRouteStudio.querySelector('.route-studio-grid')!.append(routePreviewPanel);
// Route facts are mirrored next to the preview title, so they remain visible
// even when the detailed stats strip is clipped by the no-scroll layout.
const routeQuickFacts=document.createElement('div');routeQuickFacts.className='route-quick-facts';
routeQuickFacts.setAttribute('aria-live','polite');
routeQuickFacts.textContent='Generate a route to see terrain, estimated time and steepest grade';
routePreviewPanel.querySelector('.route-studio-live-heading')!.append(routeQuickFacts);
// Keep route metrics in the visible header instead of below the chart, where the no-scroll layout clips them.
const studioSummary=routePreviewPanel.querySelector<HTMLElement>('.studio-live-stats')!;
routePreviewPanel.querySelector('.route-studio-live-heading')!.append(studioSummary);
const studioLiveChart=routePreviewPanel.querySelector<HTMLElement>('#studioLiveChart')!;
const routeScrubReadout=document.createElement('div');
routeScrubReadout.className='studio-scrub-readout';
routeScrubReadout.innerHTML='<span>At mile <b id="studioScrubMiles">0.00 mi</b></span><span>Elevation <b id="studioScrubElevation">—</b></span><span>Gradient <b id="studioScrubGrade">—</b></span><span class="note">Drag the yellow line to explore your route</span>';
studioLiveChart.after(routeScrubReadout);
let studioScrubDistance:number|null=null;
let studioScrubPointer:number|null=null;
function paintStudioScrubber(){
 const svg=studioLiveChart.querySelector('svg');
 if(!svg||!points.length)return;
 const {start,max}=profileBounds();
 const d=Math.max(start,Math.min(max,studioScrubDistance??distance));
 const x=12+(d-start)/Math.max(1,max-start)*876;
 let marker=svg.querySelector<SVGLineElement>('.studio-scrub-marker');
 if(!marker){
  marker=document.createElementNS('http://www.w3.org/2000/svg','line');
  marker.classList.add('studio-scrub-marker');
  marker.setAttribute('y1','0');marker.setAttribute('y2','210');
  marker.setAttribute('stroke','#ffc85c');marker.setAttribute('stroke-width','4');
  marker.setAttribute('vector-effect','non-scaling-stroke');
  marker.setAttribute('pointer-events','none');
  svg.append(marker);
 }
 marker.setAttribute('x1',String(x));marker.setAttribute('x2',String(x));
 const p=overviewAt(d);
 routeScrubReadout.querySelector('#studioScrubMiles')!.textContent=(d/METERS_PER_MILE).toFixed(2)+' mi';
 routeScrubReadout.querySelector('#studioScrubElevation')!.textContent=Math.round(p.elevation*FEET_PER_METER).toLocaleString()+' ft';
 routeScrubReadout.querySelector('#studioScrubGrade')!.textContent=p.grade.toFixed(1)+'%';
}
function moveStudioScrubber(clientX:number){
 const rect=studioLiveChart.querySelector('svg')?.getBoundingClientRect();
 if(!rect||!rect.width||!points.length)return;
 const {start,max}=profileBounds();
 studioScrubDistance=start+Math.max(0,Math.min(1,(clientX-rect.left)/rect.width))*(max-start);
 paintStudioScrubber();
}
studioLiveChart.addEventListener('pointerdown',e=>{
 if(editElevation||e.button!==0||!points.length)return;
 studioScrubPointer=e.pointerId;
 studioLiveChart.setPointerCapture(e.pointerId);
 moveStudioScrubber(e.clientX);e.preventDefault();
});
studioLiveChart.addEventListener('pointermove',e=>{
 if(studioScrubPointer!==e.pointerId||editElevation)return;
 moveStudioScrubber(e.clientX);e.preventDefault();
});
function stopStudioScrub(e:PointerEvent){
 if(studioScrubPointer!==e.pointerId)return;
 studioScrubPointer=null;
 if(studioLiveChart.hasPointerCapture(e.pointerId))studioLiveChart.releasePointerCapture(e.pointerId);
}
studioLiveChart.addEventListener('pointerup',stopStudioScrub);
studioLiveChart.addEventListener('pointercancel',stopStudioScrub);


// The studio preview is a cloned SVG. Restore the original terrain editor here,
// where users actually create routes, while keeping the ride chart unchanged.
const studioEditControls=document.createElement('div');
studioEditControls.className='studio-elevation-controls';
studioEditControls.innerHTML='<button type="button" id="studioEditElevation">Edit elevation</button><button type="button" id="studioUndoElevation" class="secondary">Undo</button><button type="button" id="studioResetElevation" class="secondary">Reset</button><span class="note">Drag the profile up or down to shape your route.</span>';
studioLiveChart.before(studioEditControls);
const studioEditButton=studioEditControls.querySelector<HTMLButtonElement>('#studioEditElevation')!;
studioEditButton.addEventListener('click',()=>{$('editElevation').click();studioEditButton.textContent=editElevation?'Done editing':'Edit elevation';studioLiveChart.classList.toggle('editing',editElevation);});
studioEditControls.querySelector<HTMLButtonElement>('#studioUndoElevation')!.addEventListener('click',()=>{$('undoElevation').click();});
studioEditControls.querySelector<HTMLButtonElement>('#studioResetElevation')!.addEventListener('click',()=>{$('resetElevation').click();});
studioLiveChart.addEventListener('pointerdown',e=>{
 if(!editElevation||!editingAllowed()||e.button!==0)return;
 const rect=studioLiveChart.querySelector('svg')?.getBoundingClientRect();if(!rect||!rect.width)return;
 const {start,max,range}=editWindow();
 const center=start+Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))*(max-start);
 const radius=Math.max(150,Math.min(3000,(max-start)*.15));
 if(!editOriginal)editOriginal=copyPoints();
 editHistory.push(copyPoints());if(editHistory.length>20)editHistory.shift();
 dragEdit={pointer:e.pointerId,startY:e.clientY,center,base:points.map(p=>p.elevation),metersPerPixel:Math.max(60,range*1.6)/Math.max(1,rect.height),radius};
 studioLiveChart.setPointerCapture(e.pointerId);e.preventDefault();
});
studioLiveChart.addEventListener('pointermove',e=>{
 if(!editElevation||!dragEdit||dragEdit.pointer!==e.pointerId)return;
 const {startY,center,base,metersPerPixel,radius}=dragEdit;
 const change=Math.max(-300,Math.min(300,(startY-e.clientY)*metersPerPixel));
 for(let i=0;i<points.length;i++){
  const t=(points[i].distance-center)/radius;
  const weight=Math.abs(t)<1?Math.pow((1+Math.cos(Math.PI*t))/2,2):0;
  points[i].elevation=base[i]+change*weight;
 }
 recomputeGrades();svg();update();e.preventDefault();
});
function finishStudioElevationDrag(e:PointerEvent){
 if(dragEdit?.pointer!==e.pointerId)return;
 dragEdit=null;
 if(studioLiveChart.hasPointerCapture(e.pointerId))studioLiveChart.releasePointerCapture(e.pointerId);
}
studioLiveChart.addEventListener('pointerup',finishStudioElevationDrag);
studioLiveChart.addEventListener('pointercancel',finishStudioElevationDrag);

const liveChartSource=originalProfile.querySelector<HTMLElement>('#chart')!;
let studioPreviewQueued=false;
function syncStudioRoutePreview(){
 studioPreviewQueued=false;
 const svg=liveChartSource.querySelector('svg');
 if(svg){
  const copy=svg.cloneNode(true) as SVGSVGElement;
  // SVG clip-path references must survive cloning. Rename the mask and its
  // reference together to avoid collisions with the authoritative ride chart.
  const previewClipId='breakaway-studio-grade-clip';
  const clip=copy.querySelector('clipPath');
  const oldClipId=clip?.getAttribute('id');
  if(clip&&oldClipId){
   clip.setAttribute('id',previewClipId);
   copy.querySelectorAll('[clip-path]').forEach(el=>{
    if(el.getAttribute('clip-path')===`url(#${oldClipId})`)
     el.setAttribute('clip-path',`url(#${previewClipId})`);
   });
  }
  copy.querySelectorAll('[id]').forEach(el=>{
   if(el!==clip)el.removeAttribute('id');
  });
  copy.removeAttribute('id');
  copy.style.width='100%';copy.style.height='100%';
  studioLiveChart.replaceChildren(copy);
  paintStudioScrubber();
 }else if(!studioLiveChart.children.length){
  studioLiveChart.textContent='Generate a route to see its elevation profile.';
 }
 const miles=document.getElementById('profileRouteMiles');
 const gain=document.getElementById('profileRouteGain');
 routePreviewPanel.querySelector('#studioPreviewMiles')!.textContent=miles?.textContent||'—';
 routePreviewPanel.querySelector('#studioPreviewGain')!.textContent=gain?.textContent||'—';
 const routeMiles=(points.at(-1)?.distance||0)/METERS_PER_MILE;
 const routeGain=points.length?gainLossThrough(points.at(-1)!.distance).gain*FEET_PER_METER:0;
 const gainPerMile=routeMiles>0?routeGain/routeMiles:0;
 const difficulty=gainPerMile<35?'Flat':gainPerMile<85?'Rolling':gainPerMile<160?'Hilly':'Mountainous';
 routePreviewPanel.querySelector('#studioDifficulty')!.textContent=routeMiles>0?difficulty:'—';
 const minutes=routeMiles>0?Math.round(routeMiles/15*60):0;
 routePreviewPanel.querySelector('#studioEstimatedTime')!.textContent=routeMiles>0?Math.floor(minutes/60)+'h '+String(minutes%60).padStart(2,'0')+'m @ 15 mph':'—';
 let steepest=0;for(const point of points)if(point.grade>steepest)steepest=point.grade;
 routePreviewPanel.querySelector('#studioSteepestGrade')!.textContent=points.length?steepest.toFixed(1)+'%':'—';
 routeQuickFacts.textContent=routeMiles>0?difficulty+' terrain  ·  '+Math.floor(minutes/60)+'h '+String(minutes%60).padStart(2,'0')+'m at 15 mph  ·  Max '+steepest.toFixed(1)+'%':'Generate a route to see terrain and ride estimates';
}
const studioChartObserver=new MutationObserver(()=>{
 if(studioPreviewQueued)return;
 studioPreviewQueued=true;
 requestAnimationFrame(syncStudioRoutePreview);
});
studioChartObserver.observe(liveChartSource,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['d','points','transform','viewBox']});
requestAnimationFrame(syncStudioRoutePreview);
screenRoute.append(originalRouteStudio);
screenSetup.append(originalConnections);
// Keep the original input elements (and their persistence/physics listeners)
// while relocating rider statistics beneath Bluetooth auto-reconnect.
const riderSettingsSection=Array.from(document.querySelectorAll<HTMLElement>('section')).find(section=>section.querySelector('h2')?.textContent?.trim()==='Rider and trainer settings');
if(riderSettingsSection){
 riderSettingsSection.id='riderSettingsSection';
 riderSettingsSection.classList.add('setup-rider-settings');
 const bluetoothAutoPanel=originalConnections.querySelector<HTMLElement>('.bluetooth-auto');
 if(bluetoothAutoPanel)bluetoothAutoPanel.insertAdjacentElement('afterend',riderSettingsSection);
 else screenSetup.append(riderSettingsSection);
 // Keep the existing live settings and listeners, but make infrequent
 // calibration inputs optional instead of consuming the pairing screen.
 const advanced=document.createElement('section');
 advanced.className='setup-advanced-settings';
 const heading=document.createElement('h3');
 heading.textContent='Rider & trainer settings';
 riderSettingsSection.before(advanced);
 advanced.append(heading,riderSettingsSection);
}

// Three prominent device tiles above two settings panels. Move the existing
// elements rather than cloning them so Bluetooth handlers and state stay intact.
const setupLayout=originalConnections.querySelector<HTMLElement>('.ride-connection-layout');
const setupDevices=originalConnections.querySelector<HTMLElement>('.ride-devices-column');
const setupShifting=originalConnections.querySelector<HTMLElement>('.ride-shifting-column');
if(setupLayout&&setupDevices&&setupShifting){
 const tiles=document.createElement('div');
 tiles.className='setup-device-tiles';
 const deviceCards=Array.from(setupDevices.querySelectorAll<HTMLElement>(':scope > .device-connect-card'));
 for(const [index,card] of deviceCards.entries()){
  card.classList.add('setup-device-tile');
  const heading=card.querySelector('h3');
  if(heading)heading.textContent=['Connect Trainer','HRM (optional)','Zwift Click (optional)'][index]||heading.textContent;
  const connect=card.querySelector<HTMLButtonElement>('.device-button-row button:not(.secondary)');
  if(connect)connect.textContent=['Connect Trainer','Connect HRM','Connect Zwift Click'][index]||connect.textContent;
  tiles.append(card);
 }
 setupLayout.before(tiles);
 const settings=document.createElement('div');
 settings.className='setup-settings-row';
 const advanced=setupDevices.querySelector<HTMLElement>('.setup-advanced-settings');
 if(advanced)settings.append(advanced);
 settings.append(setupShifting);
 setupLayout.before(settings);
 setupLayout.classList.add('setup-utilities');
 // Reconnection and session utilities remain available, but secondary.
 const utilityDetails=document.createElement('section');
 utilityDetails.className='setup-utility-details';
 const utilityHeading=document.createElement('h3');
 utilityHeading.textContent='Bluetooth & session options';
 utilityDetails.append(utilityHeading);
 while(setupDevices.firstChild)utilityDetails.append(setupDevices.firstChild);
 const bluetoothPanel=utilityDetails.querySelector<HTMLElement>('.bluetooth-auto');
 const sessionPanel=utilityDetails.querySelector<HTMLElement>('.ride-session-actions');
 if(bluetoothPanel){
  const secondary=document.createElement('details');
  secondary.className='setup-secondary-options';
  const secondaryHeading=document.createElement('summary');
  secondaryHeading.textContent='Device management & session actions';
  secondary.append(secondaryHeading);
  const forget=bluetoothPanel.querySelector<HTMLElement>('#forgetBluetooth');
  if(forget)secondary.append(forget);
  if(sessionPanel)secondary.append(sessionPanel);
  utilityDetails.append(secondary);
 }
 setupLayout.replaceWith(utilityDetails);
}
// Progressive disclosure: keep setup instructions available without occupying
// the primary pairing viewport or silently clipping important help text.
// Keep the original select as the source of truth for saved settings and listeners.
// These two buttons offer a faster, clearer choice without changing shifting logic.
const shiftingSelect=originalConnections.querySelector<HTMLSelectElement>('#drivetrainMode');
if(shiftingSelect){
 const shiftingLabel=shiftingSelect.closest('label');
 if(shiftingLabel){
  const shiftingChoices=document.createElement('div');
  shiftingChoices.className='setup-shifting-choices';
  shiftingChoices.setAttribute('role','group');
  shiftingChoices.setAttribute('aria-label','How do you shift gears?');
  const choices:[string,string][]=[['traditional','Traditional'],['virtual','Virtual']];
  const buttons=choices.map(([value,title])=>{
   const button=document.createElement('button');
   button.type='button';
   button.className='setup-shifting-choice';
   button.textContent=title;
   button.addEventListener('click',()=>{
    shiftingSelect.value=value;
    shiftingSelect.dispatchEvent(new Event('change',{bubbles:true}));
    syncShiftingChoices();
   });
   shiftingChoices.append(button);
   return button;
  });
  function syncShiftingChoices(){
   for(let i=0;i<buttons.length;i++){
    const active=shiftingSelect!.value===choices[i][0];
    buttons[i].classList.toggle('active',active);
    buttons[i].setAttribute('aria-pressed',String(active));
   }
  }
  shiftingLabel.insertAdjacentElement('afterend',shiftingChoices);
  shiftingLabel.classList.add('setup-shifting-original-select');
  shiftingSelect.addEventListener('change',syncShiftingChoices);
  syncShiftingChoices();
 }
}
const drivetrainSection=originalConnections.querySelector<HTMLElement>('#drivetrainSection');
if(drivetrainSection){
 const detailedHelp=drivetrainSection.querySelector<HTMLElement>('#virtualShiftingSettings > p.note');
 if(detailedHelp){
  const helpDetails=document.createElement('details');
  helpDetails.className='setup-shifting-help';
  const helpSummary=document.createElement('summary');
  helpSummary.textContent='How virtual shifting works';
  detailedHelp.before(helpDetails);
  helpDetails.append(helpSummary,detailedHelp);
 }
}
const bluetoothPanel=originalConnections.querySelector<HTMLElement>('.bluetooth-auto');
if(bluetoothPanel){
 const autoHelp=bluetoothPanel.querySelector<HTMLElement>('#autoBleStatus');
 if(autoHelp){
  autoHelp.classList.add('setup-ble-help');
  autoHelp.hidden=true;
  const autoToggle=document.createElement('button');
  autoToggle.type='button';
  autoToggle.className='secondary setup-ble-info';
  autoToggle.textContent='Connection info';
  autoToggle.setAttribute('aria-expanded','false');
  autoToggle.addEventListener('click',()=>{
   autoHelp.hidden=!autoHelp.hidden;
   autoToggle.setAttribute('aria-expanded',String(!autoHelp.hidden));
  });
  autoHelp.before(autoToggle);
 }
}
// Instant Ride: keep only non-sensitive route-builder preferences locally.
// A saved route configuration can be regenerated without a loading screen.
const QUICK_RIDE_KEY='breakaway.quickRide.v1';
type QuickRideSettings={difficulty:string;terrain:string;miles:string;gain:string;seed:string};
const quickRideIds={difficulty:'generatedDifficulty',terrain:'generatedTerrain',miles:'generatedMiles',gain:'generatedGain',seed:'generatedSeed'} as const;
function readQuickRide():QuickRideSettings|null{
 try{
  const value=JSON.parse(localStorage.getItem(QUICK_RIDE_KEY)||'null');
  if(!value||typeof value!=='object')return null;
  if(!['flat','rolling','mountain','punchy'].includes(value.terrain))return null;
  if(!['0.55','1','1.35'].includes(value.difficulty))return null;
  if(!Number.isFinite(Number(value.miles))||Number(value.miles)<=0||Number(value.miles)>1000)return null;
  if(!Number.isFinite(Number(value.seed)))return null;
  if(value.gain!==''&&(!Number.isFinite(Number(value.gain))||Number(value.gain)<0))return null;
  return value as QuickRideSettings;
 }catch{return null;}
}
function saveQuickRide(){
 const value={} as QuickRideSettings;
 for(const [key,id] of Object.entries(quickRideIds)) (value as unknown as Record<string,string>)[key]=(document.getElementById(id) as HTMLInputElement|HTMLSelectElement).value;
 try{localStorage.setItem(QUICK_RIDE_KEY,JSON.stringify(value));}catch{}
}
// Quick starts deliberately reuse the same route generator and trainer setup.
// Presets are editable before riding; no separate loading screen or ride engine.
const quickPresets=[
 {name:'Recovery 30',terrain:'flat',difficulty:'0.55',miles:'10',gain:'',seed:'3001'},
 {name:'Rolling 45',terrain:'rolling',difficulty:'1',miles:'15',gain:'',seed:'4502'},
 {name:'Climbing 60',terrain:'mountain',difficulty:'1.35',miles:'18',gain:'1800',seed:'6003'},
] as const;
const quickPresetBar=document.createElement('div');
quickPresetBar.className='quick-preset-bar';
const presetLabel=document.createElement('span');
presetLabel.className='quick-preset-label';
presetLabel.textContent='QUICK START';
quickPresetBar.append(presetLabel);
for(const preset of quickPresets){
 const button=document.createElement('button');
 button.type='button';
 button.className='quick-preset-button secondary';
 button.textContent=preset.name;
 button.addEventListener('click',()=>{
  for(const [key,id] of Object.entries(quickRideIds)){
   (document.getElementById(id) as HTMLInputElement|HTMLSelectElement).value=preset[key as keyof QuickRideSettings];
  }
  (document.getElementById('generateRoute') as HTMLButtonElement).click();
  if(!points.length)return;
  saveQuickRide();
  refreshQuickRide();
  // Keep riders in Route Studio so they can inspect the generated elevation
  // profile and summary before choosing to connect their smart trainer.
  showBreakawayScreen('route');
  requestAnimationFrame(()=>syncStudioRoutePreview());
 });
 quickPresetBar.append(button);
}
// Quick presets sit beside the main CTA; no extra resume bar or row.
const routePrimaryCta=originalRouteStudio.querySelector<HTMLElement>('#enjoyRide');
if(routePrimaryCta?.parentElement){
 const actionRow=document.createElement('div');
 actionRow.className='route-quick-action-row';
 routePrimaryCta.before(actionRow);
 actionRow.append(quickPresetBar,routePrimaryCta);
}
function refreshQuickRide(){/* preferences persist silently; no additional UI */ }
for(const id of Object.values(quickRideIds))document.getElementById(id)?.addEventListener('change',saveQuickRide);
for(const id of ['generateRoute','endlessRoute','surpriseRoute'])document.getElementById(id)?.addEventListener('click',()=>{window.setTimeout(()=>{saveQuickRide();refreshQuickRide();},0);});
refreshQuickRide();
workspace.prepend(screenRide);
workspace.prepend(screenSetup);
workspace.prepend(screenRoute);
function stopRideCountdown(){if(rideCountdownTimer!==null){window.clearInterval(rideCountdownTimer);rideCountdownTimer=null;}rideCountdownRemaining=0;}
function trainerReadyForRide(){return connected&&controlGranted&&realTelemetry;}
function clickReadyForRide(){return !!(typeof clickDevice!=='undefined'&&clickDevice?.gatt?.connected);}
function hrReadyForRide(){return !!(typeof hrDevice!=='undefined'&&hrDevice?.gatt?.connected);}
const setupPairingPending:Record<string,boolean>={connect:false,connectHr:false,connectClick:false};
const setupDeviceDefinitions=[
 {id:'connect',name:'Trainer',ready:()=>trainerReadyForRide(),connected:()=>connected,device:()=>device,detail:()=>($('status').textContent||'')},
 {id:'connectHr',name:'HRM',ready:()=>hrReadyForRide(),connected:()=>hrReadyForRide(),device:()=>hrDevice,detail:()=>($('hrStatus').textContent||'')},
 {id:'connectClick',name:'Zwift Click',ready:()=>clickReadyForRide(),connected:()=>clickReadyForRide(),device:()=>clickDevice,detail:()=>($('clickStatus').textContent||'')}
];
function refreshSetupDeviceCards(){
 if(breakawayScreen!=='setup')return;
 for(const entry of setupDeviceDefinitions){
  const button=document.getElementById(entry.id) as HTMLButtonElement|null;
  const card=button?.closest<HTMLElement>('.setup-device-tile');
  if(!button||!card)continue;
  const connectedNow=entry.connected();
  const ready=entry.ready();
  const detail=entry.detail();
  if(setupPairingPending[entry.id]&&(connectedNow||/error|fail|cancel|not found|denied|unable|disconnected/i.test(detail)))setupPairingPending[entry.id]=false;
  const pairing=setupPairingPending[entry.id]&&!connectedNow;
  const error=!connectedNow&&!pairing&&/error|fail|not found|denied|unable/i.test(detail);
  const state=ready?'connected':connectedNow&&entry.id==='connect'?'telemetry-only':connectedNow?'initializing':pairing?'connecting':error?'error':'disconnected';
  card.dataset.connectionState=state;
  let indicator=card.querySelector<HTMLElement>('.setup-connection-indicator');
  if(!indicator){indicator=document.createElement('div');indicator.className='setup-connection-indicator';indicator.setAttribute('role','status');indicator.setAttribute('aria-live','polite');card.querySelector('h3')?.insertAdjacentElement('afterend',indicator);}
  const name=entry.device()?.name||entry.name;
  indicator.textContent=state==='connected'?'✓ Connected · '+name:state==='telemetry-only'?'◐ Power telemetry only · '+name:state==='initializing'?'◌ Initializing · '+name:state==='connecting'?'◌ Connecting…':state==='error'?'! Connection failed':'○ Not connected';
  if(entry.id==='connect'){
   let diagnostics=card.querySelector<HTMLElement>('.trainer-diagnostic');
   if(!diagnostics){diagnostics=document.createElement('p');diagnostics.className='trainer-diagnostic';diagnostics.setAttribute('role','alert');diagnostics.setAttribute('aria-live','assertive');card.append(diagnostics);}
   const detailText=detail.trim();
   diagnostics.textContent=state==='telemetry-only'?'Bluetooth connected, but resistance control is unavailable. '+(detailText||'SIM/ERG is not supported for this connection.'):state==='error'?(detailText||'Trainer connection failed. Try again after closing other trainer apps.'):'';
   diagnostics.hidden=state!=='error'&&state!=='telemetry-only';
  }
  if(state==='connected')button.textContent='Change '+entry.name;
  else if(state==='connecting')button.textContent='Connecting…';
  else button.textContent='Connect '+entry.name;
  button.disabled=pairing;
  button.setAttribute('aria-busy',String(pairing));
 }
}
for(const entry of setupDeviceDefinitions){
 document.getElementById(entry.id)?.addEventListener('click',()=>{setupPairingPending[entry.id]=true;refreshSetupDeviceCards();});
}
function updateSetupReadiness(){
 const ready=trainerReadyForRide();
 const button=document.getElementById('goToRide') as HTMLButtonElement;
 button.disabled=!ready;
 button.textContent=ready?'Start Riding →':'Connect Trainer to Continue';
 const label=document.getElementById('setupReadiness')!;
 label.textContent=ready?'✓ Trainer ready · HRM and Zwift Click are optional.':'Trainer required · HRM and Zwift Click are optional.';
 refreshSetupDeviceCards();
}
function showBreakawayScreen(screen:BreakawayScreen){
 if(document.body.dataset.rideExperience==='cyclequest'&&screen==='ride'){showCycleQuest();return;}
 const questHost=document.getElementById('cycleQuestHost');if(questHost)questHost.hidden=true;
 breakawayScreen=screen;
 // One shared navigation component, mounted inside the active screen's header.
 if(screen==='route'&&routeStudioHeader)routeStudioHeader.append(rideStepNav);
 else if(screen==='setup')setupStepHeader.append(rideStepNav);
 else if(screen==='ride')rideHeading.append(rideStepNav);
 else rideStepNavHome.parentNode?.insertBefore(rideStepNav,rideStepNavHome.nextSibling);
 document.body.dataset.breakawayScreen=screen;
 screenRoute.hidden=screen!=='route';
 screenSetup.hidden=screen!=='setup';
 screenRide.hidden=screen!=='ride';
 for(const [id,name] of [['stepRoute','route'],['stepSetup','setup'],['stepRide','ride']]){
  document.getElementById(id)!.classList.toggle('active',screen===name);
  document.getElementById(id)!.setAttribute('aria-current',screen===name?'step':'false');
 }
 document.body.classList.toggle('ride-focus-active',screen==='ride');
 if(screen==='setup')updateSetupReadiness();
 window.scrollTo(0,0);
 if(screen==='ride')requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
function enterRideScreen(){
 stopRideCountdown();
 if(!trainerReadyForRide()){updateSetupReadiness();status('Connect and initialize the smart trainer first');return;}
 // Start the ride from the Connect Trainer action itself. FTMS power and
 // cadence notifications will advance the ride when the rider pedals.
 showBreakawayScreen('ride');
 rideAwaitingPedaling=false;
 pedalSince=0;
 if(!running&&!rideEnd)beginRide();
}
// Pairing never navigates away automatically; the rider chooses when to start.
function checkAutomaticRideCountdown(){updateSetupReadiness();}
(document.getElementById('enjoyRide') as HTMLButtonElement).addEventListener('click',()=>{
 if(!points.length){status('Generate a route first');return;}
 showBreakawayScreen('setup');
 checkAutomaticRideCountdown();
});
document.getElementById('goToRide')!.addEventListener('click',enterRideScreen);
// Navigation is free between planning and devices; entering the active ride requires a trainer.
document.getElementById('stepRoute')!.addEventListener('click',()=>{stopRideCountdown();if(running){status('Pause or finish your ride before changing screens');return;}showBreakawayScreen('route');});
document.getElementById('stepSetup')!.addEventListener('click',()=>{if(running){status('Pause or finish your ride before changing screens');return;}showBreakawayScreen('setup');checkAutomaticRideCountdown();});
document.getElementById('stepRide')!.addEventListener('click',()=>{if(running){showBreakawayScreen('ride');return;}if(trainerReadyForRide())enterRideScreen();else{showBreakawayScreen('setup');updateSetupReadiness();status('Connect and initialize your trainer to access the ride screen.');}});
document.getElementById('backToRoute')!.addEventListener('click',()=>{stopRideCountdown();showBreakawayScreen('route');});
document.getElementById('backToSetup')!.addEventListener('click',()=>{if(running){status('Pause or finish your ride before changing screens');return;}showBreakawayScreen('setup');});
document.getElementById('backToStudio')!.addEventListener('click',()=>{if(running){status('Pause or finish your ride before changing screens');return;}showBreakawayScreen('route');});
window.setInterval(checkAutomaticRideCountdown,500);
showBreakawayScreen('route');

// Two distinct entry experiences, sharing the real route editor and trainer workflow.
type RideExperience='classic'|'survival'|'cyclequest';
let rideExperience:RideExperience='classic';
const modeLanding=document.createElement('section');
modeLanding.id='modeLanding';
modeLanding.className='mode-landing';
modeLanding.innerHTML='<div class="mode-landing-brand"><span>RIDE BREAKAWAY</span><small>CREATE. CONNECT. RIDE.</small></div><div class="mode-landing-intro"><span>YOUR RIDE. YOUR RULES.</span><h1>CHOOSE YOUR RIDE.</h1><p>Three ways to experience Breakaway. One smart trainer.</p></div><div class="mode-landing-cards"><button type="button" id="chooseClassic" class="mode-card mode-card-classic"><span class="mode-card-number">01 / THE ORIGINAL</span><span class="mode-card-visual">⌁</span><strong>CLASSIC</strong><span class="mode-card-description">Create a route. Conquer the climbs. Ride your way.</span><span class="mode-card-action">START CLASSIC ↗</span></button><button type="button" id="chooseSurvival" class="mode-card mode-card-survival"><span class="mode-card-number">02 / THE CHALLENGE</span><span class="mode-card-visual">☣</span><strong>SURVIVOR</strong><span class="mode-card-description">Build an escape route. Stay ahead of the threat. Reach the finish.</span><span class="mode-card-action">ENTER SURVIVOR ↗</span></button><button type="button" id="chooseCycleQuest" class="mode-card mode-card-quest"><span class="mode-card-number">03 / PRIVATE BETA</span><span class="mode-card-visual">✦</span><strong>CYCLE QUEST</strong><span class="mode-card-description">Ride. Level up. Battle random enemies. Defeat the next boss.</span><span class="mode-card-action">UNLOCK CYCLE QUEST ↗</span></button></div><p class="mode-landing-footer">SMART TRAINER REQUIRED · NO ACCOUNT NECESSARY TO PREVIEW MODES</p>';
document.body.append(modeLanding);
const modeHomeButton=document.createElement('button');
modeHomeButton.type='button';modeHomeButton.id='modeHomeButton';modeHomeButton.textContent='← CHANGE MODE';
document.body.append(modeHomeButton);
const survivalStudio=document.createElement('section');
survivalStudio.id='survivalStudio';
survivalStudio.className='survival-studio-intro';
survivalStudio.innerHTML='<div class="survival-studio-head"><span>☣ SURVIVAL STUDIO</span><h2>BUILD YOUR ESCAPE.</h2><p>Choose your challenge, set the threat, then generate or upload a route below. The live elevation editor and trainer connection are shared with Classic.</p></div><div class="survival-studio-controls"><label>CHALLENGE<select id="studioChallenge"><option value="finish">🏁 Finish Line — beat the threat to the finish</option><option value="classic">⏱ Classic Waves — survive timed chases</option></select></label><label>DIFFICULTY<select id="studioDifficulty"><option value="recovery">Recovery · Forgiving</option><option value="standard" selected>Standard · Balanced</option><option value="hard">Hard · Aggressive</option><option value="nightmare">Nightmare · Relentless</option></select></label><label>THREAT<select id="studioThreat"><option>ZOMBIES</option><option>WOLVES</option><option>THE BUTCHER</option></select></label></div><div class="survival-studio-guide"><span>01 / CONFIGURE CHALLENGE</span><span>02 / GENERATE ESCAPE ROUTE ↓</span><span>03 / CONNECT TRAINER → SURVIVE</span></div>';
screenRoute.prepend(survivalStudio);
function syncSurvivalStudio(){
 (se('surviveMode') as HTMLSelectElement).value=(document.getElementById('studioChallenge') as HTMLSelectElement).value;
 (se('surviveDifficulty') as HTMLSelectElement).value=(document.getElementById('studioDifficulty') as HTMLSelectElement).value;
 (se('surviveTheme') as HTMLSelectElement).value=(document.getElementById('studioThreat') as HTMLSelectElement).value;
 (se('surviveMode') as HTMLSelectElement).dispatchEvent(new Event('change'));
}
survivalStudio.querySelectorAll('select').forEach(select=>select.addEventListener('change',()=>{
 syncSurvivalStudio();
 const isFinish=rideExperience==='survival'&&(document.getElementById('studioChallenge') as HTMLSelectElement).value==='finish';
 const endlessButton=document.getElementById('endlessRoute') as HTMLButtonElement|null;
 if(endlessButton){endlessButton.disabled=isFinish;endlessButton.title=isFinish?'Finish Line requires a finite route. Choose Classic Waves for Endless.':'';}
}));
const studioRouteFeedback=document.createElement('div');
studioRouteFeedback.id='studioRouteFeedback';
studioRouteFeedback.setAttribute('role','status');
studioRouteFeedback.textContent='Generate a finite route or upload GPX/TCX, then inspect the elevation profile before connecting.';
survivalStudio.append(studioRouteFeedback);
const generateRouteButton=document.getElementById('generateRoute') as HTMLButtonElement|null;
generateRouteButton?.addEventListener('click',()=>{
 studioRouteFeedback.textContent='Route generation requested — review the updated elevation profile below.';
 requestAnimationFrame(()=>{syncStudioRoutePreview();});
});
const uploadRouteInput=document.querySelector<HTMLInputElement>('input[type="file"]');
uploadRouteInput?.addEventListener('change',()=>{studioRouteFeedback.textContent='Route uploaded — review the route preview below.';});

function chooseRideExperience(mode:RideExperience){
 rideExperience=mode;
 modeLanding.hidden=true;
 modeHomeButton.hidden=false;
 survivalStudio.hidden=mode!=='survival';
 document.body.dataset.rideExperience=mode;
 syncSurvivalStudio();
 survivalStudio.querySelector('select')?.dispatchEvent(new Event('change'));
 showBreakawayScreen('route');
 const routeTitle=screenRoute.querySelector('.route-studio-heading h2');
 if(routeTitle)routeTitle.textContent=mode==='survival'?'GENERATE YOUR ESCAPE ROUTE':'ROUTE STUDIO';
}
function openModeLanding(){
 const host=document.getElementById('cycleQuestHost');if(host)host.hidden=true;
 if(document.body.dataset.rideExperience==='cyclequest'){if(running)pauseRide();cycleQuestHold=false;}
 if(surviveOn){status('End your current Survival session before changing modes.');return;}
 modeLanding.hidden=false;
 modeHomeButton.hidden=true;
 screenRoute.hidden=true;screenSetup.hidden=true;screenRide.hidden=true;
 document.body.dataset.breakawayScreen='home';
 window.scrollTo(0,0);
}
modeLanding.querySelector('#chooseClassic')!.addEventListener('click',()=>chooseRideExperience('classic'));
modeLanding.querySelector('#chooseSurvival')!.addEventListener('click',()=>chooseRideExperience('survival'));
modeHomeButton.addEventListener('click',openModeLanding);
modeLanding.querySelector('#chooseCycleQuest')!.addEventListener('click',enterCycleQuest);
const originalEnterRideScreen=enterRideScreen;
// Preview starts with mode selection, not the existing route editor.
openModeLanding();

// Trainer Test Lab is a separate offline simulator, never connected to live ride state.
const trainerLabLink=document.createElement('a');
trainerLabLink.href='/trainer-lab.html';
trainerLabLink.textContent='Trainer Test Lab ↗';
trainerLabLink.title='Open simulated trainer diagnostics (no physical Bluetooth)';
trainerLabLink.style.cssText='position:fixed;right:14px;bottom:14px;z-index:1000;padding:9px 13px;border-radius:9px;background:#172129;color:#d4f47b;border:1px solid #64776a;font:700 12px system-ui;text-decoration:none;box-shadow:0 4px 16px #0008';
document.body.append(trainerLabLink);

// Real-time stationary detection continues when browser animation frames are throttled.
window.setInterval(()=>checkStationaryRide(performance.now()),500);

// Autosave every five seconds, plus when the page is hidden or navigated away.
window.setInterval(saveRideRecovery,5000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveRideRecovery();});
window.addEventListener('pagehide',saveRideRecovery);
// All ride UI and handlers are initialized by this point.
offerRideRecovery();


// Cycle Quest keeps the existing Bluetooth/physics engine as the sole trainer owner.
const cycleQuestHost=document.createElement('section');
cycleQuestHost.id='cycleQuestHost';cycleQuestHost.hidden=true;
cycleQuestHost.innerHTML='<div class="quest-host-bar"><button id="questHome" type="button">← HOME</button><span>CYCLE QUEST · PRIVATE BETA</span><button id="questDevices" type="button">TRAINER / DEVICES</button></div><iframe id="cycleQuestFrame" title="Cycle Quest cycling RPG" allow="picture-in-picture"></iframe>';
document.body.append(cycleQuestHost);
const questFrame=cycleQuestHost.querySelector<HTMLIFrameElement>('iframe')!;
let questAuthenticated=false,questReward=false,questButtonLatch=false;
function questSend(data:Record<string,unknown>){questFrame.contentWindow?.postMessage({source:'breakaway',...data},location.origin);}
function showCycleQuest(){modeLanding.hidden=true;modeHomeButton.hidden=true;screenRoute.hidden=true;screenSetup.hidden=true;screenRide.hidden=true;cycleQuestHost.hidden=false;document.body.dataset.breakawayScreen='quest';document.body.classList.remove('ride-focus-active');window.scrollTo(0,0);}
async function enterCycleQuest(){
 try{const response=await fetch('/api/cycle-quest?asset=status',{credentials:'same-origin',cache:'no-store'});if(response.ok){launchCycleQuest();return;}}catch{}
 questGate.showModal();questPassword.focus();
}
function launchCycleQuest(){questAuthenticated=true;rideExperience='cyclequest';document.body.dataset.rideExperience='cyclequest';survivalStudio.hidden=true;cycleQuestHold=false;questReward=false;if(!questFrame.src)questFrame.src='/api/cycle-quest?asset=index.html';showCycleQuest();}
const questGate=document.createElement('dialog');questGate.className='quest-access-dialog';questGate.id='questAccessGate';questGate.innerHTML='<form id="questAccessForm"><span>PRIVATE BETA</span><h2>CYCLE QUEST</h2><p>Enter the beta password to begin.</p><label for="questPassword">Password</label><input id="questPassword" type="password" autocomplete="off" required maxlength="200"><p id="questAccessError" role="alert"></p><div><button type="submit">UNLOCK CYCLE QUEST</button><button type="button" id="questAccessCancel">CANCEL</button></div></form>';document.body.append(questGate);
const questPassword=questGate.querySelector<HTMLInputElement>('#questPassword')!;
questGate.querySelector('#questAccessCancel')!.addEventListener('click',()=>questGate.close());
questGate.querySelector('form')!.addEventListener('submit',async event=>{event.preventDefault();const button=questGate.querySelector<HTMLButtonElement>('button[type=submit]')!;button.disabled=true;const error=questGate.querySelector('#questAccessError')!;error.textContent='';try{const result=await fetch('/api/cycle-quest',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({password:questPassword.value})});questPassword.value='';if(!result.ok){error.textContent=result.status===401?'Incorrect password. Try again.':'Beta access is temporarily unavailable.';return;}questGate.close();launchCycleQuest();}catch{error.textContent='Could not connect. Please try again.';}finally{button.disabled=false;}});
const questReturn=document.createElement('button');questReturn.id='questReturn';questReturn.type='button';questReturn.textContent='← RETURN TO CYCLE QUEST';questReturn.hidden=true;screenSetup.querySelector('.setup-next')?.prepend(questReturn);questReturn.addEventListener('click',showCycleQuest);
cycleQuestHost.querySelector('#questHome')!.addEventListener('click',openModeLanding);
cycleQuestHost.querySelector('#questDevices')!.addEventListener('click',()=>{if(running)pauseRide();cycleQuestHost.hidden=true;questReturn.hidden=false;showBreakawayScreen('setup');});
(window as any).openCycleQuestOverlay=async({width,height}:{width:number;height:number})=>{
 if('documentPictureInPicture' in window)return (window as any).documentPictureInPicture.requestWindow({width,height,preferInitialWindowPlacement:true});
 return window.open('','cycle-quest-overlay',`popup,width=${width},height=${height}`);
};
let questProfileRevision='';
function routeFromQuest(data:any){
 const r=data.route;if(!r||!Array.isArray(r.points)||r.points.length<2||r.points.length>1000||!Number.isFinite(r.distance)||r.distance<10||typeof r.name!=='string')return;
 if(!r.points.every((p:any,i:number)=>Number.isFinite(p.d)&&Number.isFinite(p.e)&&p.d>=0&&(!i||p.d>r.points[i-1].d)))return;
 if(r.endless===true&&(!Number.isInteger(r.seed)||!['flat','rolling','mountain','punchy'].includes(r.terrain)||!Number.isFinite(r.windowStart||0)||(r.windowStart||0)<0))return;
 if(running)pauseRide();if(rideStart&&!rideEnd)finishRide();
 questProfileRevision='';
 if(r.endless===true){
  procedural=true;endless=true;routeLimit=Infinity;proceduralTerrain=r.terrain;proceduralSeed=r.seed;proceduralIntensity=1;gainScale=1;plannedGainFeet=null;resetHills();resetClimbingTotals();clearElevationEditor();zoomMeters=null;selectedClimbIndex=-1;inspectDistance=null;
  const start=r.windowStart||0;points=r.points.map((p:any,i:number)=>{const a=r.points[Math.max(0,i-1)],b=r.points[Math.min(r.points.length-1,i+1)];return {distance:p.d+start,elevation:p.e,grade:(b.e-a.e)/Math.max(1,b.d-a.d)*100};});
  // Generate with Classic's exact 80m sampling on a new ride. On reload keep
  // the saved rolling window so long rides do not rebuild all prior terrain.
  const restore=Math.max(0,Number(data.restoreMiles)||0)*METERS_PER_MILE;
  distance=Math.max(start,Math.min(points.at(-1)!.distance,restore));
  if(!restore){points=[];generatedThrough=0;}else generatedThrough=points.at(-1)!.distance;
  routeName=r.name.slice(0,80);rideStart=null;rideEnd=null;speed=0;clearRideRecovery();resetRideMetrics();ensureTerrain();resetSimController();svg();update();return;
 }
 procedural=false;endless=false;zoomMeters=null;selectedClimbIndex=-1;inspectDistance=null;routeLimit=0;plannedGainFeet=null;gainScale=1;resetClimbingTotals();clearElevationEditor();
 points=r.points.map((p:any,i:number)=>{const a=r.points[Math.max(0,i-1)],b=r.points[Math.min(r.points.length-1,i+1)];return {distance:p.d,elevation:p.e,grade:(b.e-a.e)/Math.max(1,b.d-a.d)*100};});
 routeName=r.name.slice(0,80);rideStart=null;rideEnd=null;clearRideRecovery();distance=Math.min(points.at(-1)!.distance,Math.max(0,Number(data.restoreMiles)||0)*METERS_PER_MILE);speed=0;resetRideMetrics();svg();update();
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==questFrame.contentWindow||event.data?.source!=='cycle-quest'||!questAuthenticated||rideExperience!=='cyclequest'||document.body.dataset.breakawayScreen==='home')return;
 const data=event.data;
 if(data.type==='connect'){if(running)pauseRide();cycleQuestHost.hidden=true;questReturn.hidden=false;showBreakawayScreen('setup');}
 else if(data.type==='toggle'){if(!connected||!controlGranted||!realTelemetry){cycleQuestHost.hidden=true;questReturn.hidden=false;showBreakawayScreen('setup');status('Connect your smart trainer to start Cycle Quest.');}else if(running)pauseRide();else if(rideEnd){status('Finish the ride summary before starting another ride.');}else {rideAwaitingPedaling=true;pedalSince=0;questSend({type:'notice',message:'Ready — start pedaling to begin.'});}}
 else if(data.type==='pause'){if(running)pauseRide();if(data.autoResume===false)rideAwaitingPedaling=false;}
 else if(data.type==='finish'){if(rideStart&&!rideEnd){if(running)pauseRide();finishRide();questSend({type:'ride-finished'});}else questSend({type:'notice',message:'No active ride to finish.'});}
 else if(data.type==='route')routeFromQuest(data);
 else if(data.type==='ready'){void savedRides().then(rides=>questSend({type:'indoor-history',workouts:rides.slice(0,5000).map(r=>({start:r.start,end:r.end}))})).catch(()=>{});}
 else if(data.type==='hold'){if(data.hold&&!cycleQuestHold)cycleQuestHeldSpeed=speed;cycleQuestHold=!!data.hold;questReward=!!data.reward;questButtonLatch=plusPressed||minusPressed;}
 else if(data.type==='reward-state')questReward=!!data.reward;
 else if(data.type==='quest-summary'&&rideEnd){
  const root=$('rideSummary');if(root.querySelector('#quest-summary-section'))return;
  const section=document.createElement('section');section.id='quest-summary-section';const heading=document.createElement('h2');heading.textContent='Cycle Quest';section.append(heading);
  for(const value of (Array.isArray(data.lines)?data.lines:[]).slice(0,7)){if(typeof value!=='string')continue;const line=document.createElement('p');line.textContent=value.slice(0,100);section.append(line);}
  if(typeof data.image==='string'&&data.image.startsWith('data:image/png;base64,')&&data.image.length<2000000){const image=document.createElement('img');image.src=data.image;image.alt='Cycle Quest shareable ride summary';image.style.cssText='display:block;width:min(100%,600px);margin:16px 0';section.append(image);const link=document.createElement('a');link.href=data.image;link.download='cycle-quest-ride-summary.png';link.textContent='Download Cycle Quest image';section.append(link);}
  root.append(section);
 }
});
function routeQuestClick(plus:boolean,minus:boolean){
 if(rideExperience!=='cyclequest')return false;
 if(!plus&&!minus)questButtonLatch=false;
 questSend({type:'click',plus,minus});
 if(questReward){questButtonLatch=plus||minus;return true;}
 // A reward-selection press must be released before shifting resumes.
 return questButtonLatch;
}
window.setInterval(()=>{
 if(!questAuthenticated||rideExperience!=='cyclequest'||document.body.dataset.breakawayScreen==='home')return;
 const p=points.length?at(distance):{grade:0,elevation:0};
 let routeProfile:Record<string,unknown>|undefined;
 if(endless&&procedural&&points.length>1){
  const revision=generatedThrough+':'+points[0].distance;
  if(revision!==questProfileRevision){
   questProfileRevision=revision;const visible=points.length<=1000?points:Array.from({length:1000},(_,i)=>points[Math.round(i/999*(points.length-1))]);const start=visible[0].distance;
   routeProfile={endless:true,windowStart:start,distance:visible.at(-1)!.distance-start,hasElevation:true,gain:visible.slice(1).reduce((sum,p,i)=>sum+Math.max(0,p.elevation-visible[i].elevation),0),points:visible.map(p=>({d:p.distance-start,e:p.elevation}))};
  }
 }
 questSend({type:'telemetry',routeProfile,ascentFeet:gainLossThrough(distance).gain*FEET_PER_METER,climbs:climbs.map(c=>({start:c.start,end:c.end,category:c.category,meanGrade:c.meanGrade})),connected:connected&&realTelemetry&&controlGranted,running,power:Math.max(0,power),cadence:Math.max(0,cadence),heartRate:($('heartRate').textContent||'—').trim(),speed:speed*MPH_PER_MPS,gear,ftp:Math.max(50,Number(($('ftp') as HTMLInputElement).value)||280),activityStartTime:rideStart,distanceM:distance,grade:p.grade,elevation:p.elevation,routeComplete:!!rideEnd,buttonsReleased:!plusPressed&&!minusPressed});
},200);
