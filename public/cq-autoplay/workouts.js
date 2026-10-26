export const LB_PER_KG=2.2046226218487757,STRENGTH_DAILY_CAP=3600,METERS_PER_MILE=1609.344;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function dayAt(ms){const d=new Date(ms);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
export function fingerprint(bytes){let a=2166136261,b=0x9e3779b9;for(const n of bytes){a=Math.imul(a^n,16777619);b=Math.imul(b+n,0x85ebca6b)^(b>>>13);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
const time=v=>v instanceof Date?v.getTime():typeof v==='string'?Date.parse(v):NaN;
export function movingFromRecords(records,events=[]){
 const rows=records.filter(r=>finite(r.t)).sort((a,b)=>a.t-b.t);let seconds=0,gaps=0;
 const timers=events.filter(e=>finite(e.t)).sort((a,b)=>a.t-b.t);let timerIndex=0,on=true;
 for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i],dt=(b.t-a.t)/1000;if(dt<=0)continue;if(dt>120){gaps++;continue;}
 const delta=b.distance-a.distance,speed=finite(a.speed)?a.speed:finite(delta)&&delta>=0?delta/dt:NaN;
 if(!(speed>.3&&speed<45))continue;
 // Split sample intervals at timer events; stopped portions never earn XP.
 let cursor=a.t;while(timerIndex<timers.length&&timers[timerIndex].t<=a.t){on=timers[timerIndex++].on;}
 let idx=timerIndex;while(idx<timers.length&&timers[idx].t<b.t){if(on)seconds+=(timers[idx].t-cursor)/1000;cursor=timers[idx].t;on=timers[idx++].on;}if(on)seconds+=(b.t-cursor)/1000;timerIndex=idx;
 }
 return {seconds:Math.floor(seconds),gaps};
}
export function fromFIT(data,name='Workout.fit'){
 const sessions=data.sessions||data.sessionMesgs||[];if(sessions.length!==1)throw Error('Import a single cycling or strength activity, rather than a multisport file.');const s=sessions[0];
 const sport=String(s.sport||'').toLowerCase(),sub=String(s.sub_sport??s.subSport??'').replace(/[_ -]/g,'').toLowerCase();
 const start=time(s.start_time??s.startTime),elapsed=Number(s.total_elapsed_time??s.totalElapsedTime),end=finite(elapsed)?start+elapsed*1000:time(s.timestamp);
 if(!finite(start)||!finite(end)||end<=start)throw Error('This activity needs valid start and end times.');
 const base={name,start,end,day:dayAt(start),source:'FIT',fileHash:null};
 if(sport==='cycling'||sport==='2'){
  if(/indoor|virtual/.test(sub))throw Error('This is an indoor ride. Outdoor imports must be recorded outdoors. Ride Breakaway already awards indoor XP live.');
  const records=(data.records||data.recordMesgs||[]).map(r=>({t:time(r.timestamp),speed:r.enhanced_speed??r.enhancedSpeed??r.speed,distance:r.distance}));
  const events=(data.events||data.eventMesgs||[]).filter(e=>e.event==='timer').map(e=>({t:time(e.timestamp),on:(e.event_type??e.eventType)==='start'}));
  const recorded=s.total_moving_time??s.totalMovingTime,estimated=movingFromRecords(records,events),moving=finite(recorded)?Math.floor(recorded):estimated.seconds||null;
  return {...base,kind:'outdoor',family:'cycling',movingSeconds:moving,distanceM:Number(s.total_distance??s.totalDistance)||Math.max(0,...records.map(r=>Number(r.distance)||0)),method:finite(recorded)?'Recorded moving time':'Estimated from movement samples; stops excluded',note:estimated.gaps?'Long recording gaps excluded from the estimate.':''};
 }
 if(sub==='strengthtraining'||(data.sets||data.setMesgs||[]).length>0){
  const sets=data.sets||data.setMesgs||[];let volumeLb=0,used=0,missing=0;
  for(const set of sets){if(!['active',1].includes(set.set_type??set.setType))continue;const reps=Number(set.repetitions??set.num_reps??set.numReps),kg=Number(set.weight);if(finite(reps)&&reps>0&&reps<=1000&&finite(kg)&&kg>0){volumeLb+=kg*LB_PER_KG*reps;used++;}else missing++;}
  return {...base,kind:'strength',family:'strength',volumeLb:used?volumeLb:null,method:used?used+' weighted active sets × repetitions':'Set weights missing: enter total volume manually',note:missing?missing+' active sets have no usable weight/reps and were excluded. Review your Garmin total.':''};
 }
 throw Error('Only outdoor cycling and strength activities are supported.');
}
export function fromTCX(doc,name='Workout.tcx'){
 const list=(node,tag)=>Array.from(node.getElementsByTagNameNS('*',tag)),text=(node,tag)=>list(node,tag)[0]?.textContent||'';
 if(list(doc,'parsererror').length)throw Error('This TCX file is not valid XML.');const acts=list(doc,'Activity');if(acts.length!==1||!/^biking$/i.test(acts[0].getAttribute('Sport')||''))throw Error('Choose a single cycling activity TCX file. Strength uses FIT or manual entry.');
 const a=acts[0],records=list(a,'Trackpoint').map(r=>({t:time(text(r,'Time')),speed:text(r,'Speed')===''?NaN:Number(text(r,'Speed')),distance:text(r,'DistanceMeters')===''?NaN:Number(text(r,'DistanceMeters'))}));
 const start=time(text(a,'Id')),stamps=records.map(r=>r.t).filter(finite),end=Math.max(...stamps);if(!finite(start)||!finite(end)||end<=start)throw Error('This TCX needs timestamped trackpoints to calculate moving time.');
 const estimate=movingFromRecords(records);return {name,kind:'outdoor',family:'cycling',start,end,day:dayAt(start),source:'TCX',fileHash:null,movingSeconds:estimate.seconds||null,distanceM:list(a,'Lap').reduce((n,l)=>n+Number(text(l,'DistanceMeters')||0),0),method:'Estimated from movement samples; stops excluded',note:estimate.gaps?'Long recording gaps excluded from the estimate.':''};
}
export function duplicateOf(w,ledger=[]){return ledger.find(e=>{
 if(w.fileHash&&e.fileHash===w.fileHash)return true;if(w.family!==e.family)return false;
 if(w.family==='strength'&&w.source==='Manual'&&e.source==='Manual')return w.start===e.start&&Math.abs(w.volumeLb-e.volumeLb)<1;
 const overlap=Math.max(0,Math.min(w.end,e.end)-Math.max(w.start,e.start)),shorter=Math.min(w.end-w.start,e.end-e.start);
 return Math.abs(w.start-e.start)<=120000||shorter>0&&overlap/shorter>=.8;
});}
export function reviewWorkout(w,ledger=[],chapterMiles=0,chapterCredit=true,now=Date.now()){
 if(!finite(w.start)||!finite(w.end)||w.end<=w.start||w.start>now+300000||w.end>now+300000)throw Error('Choose a completed workout with valid times.');
 if(w.end-w.start>7*86400000)throw Error('A workout cannot exceed seven days.');
 const duplicate=duplicateOf(w,ledger);if(duplicate)throw Error(duplicate.kind==='indoor'?'This matches an indoor Ride Breakaway ride. Outdoor import rewards cannot be claimed for it.':'This workout overlaps or matches an activity already recorded. It cannot earn XP twice.');
 let xp=0,rawXP=0,miles=0,capUsed=0;
 if(w.kind==='outdoor'){if(!finite(w.movingSeconds)||w.movingSeconds<=0||w.movingSeconds>(w.end-w.start)/1000+2)throw Error('Moving time must be positive and cannot exceed elapsed time.');if(!finite(w.distanceM)||w.distanceM<0||w.distanceM>10000000)throw Error('Invalid activity distance.');xp=rawXP=Math.floor(w.movingSeconds);miles=chapterCredit?Math.min(Math.max(0,100-chapterMiles),w.distanceM/METERS_PER_MILE):0;}
 else if(w.kind==='strength'){if(!finite(w.volumeLb)||w.volumeLb<=0||w.volumeLb>10000000)throw Error('Enter a total volume greater than zero and at most 10,000,000 lb.');capUsed=ledger.filter(e=>e.kind==='strength'&&e.day===w.day).reduce((n,e)=>n+e.xp,0);rawXP=Math.floor(w.volumeLb/10+1e-8);xp=Math.min(rawXP,Math.max(0,STRENGTH_DAILY_CAP-capUsed));}
 else throw Error('Unsupported workout type.');
 return {xp,rawXP,miles,capUsed,capped:xp<rawXP,bossReady:chapterMiles+miles>=100};
}
export function creditWorkout(state,workout,chapterCredit=true,now=Date.now()){
 const ledger=state.workouts||[],result=reviewWorkout(workout,ledger,state.miles,chapterCredit,now);
 if(ledger.length>=5000)throw Error('Workout history is full. Export your save before adding more workouts.');
 const entry={...workout,id:workout.fileHash||workout.kind+':'+workout.start,xp:result.xp,miles:result.miles,creditedAt:now};
 return {result,state:{...state,xp:state.xp+result.xp,miles:Math.min(100,state.miles+result.miles),workouts:[...ledger,entry]}};
}
export function validLedger(ledger){return ledger===undefined||Array.isArray(ledger)&&ledger.length<=5000&&ledger.every(e=>e&&['outdoor','strength','indoor'].includes(e.kind)&&['cycling','strength'].includes(e.family)&&finite(e.start)&&finite(e.end)&&e.end>=e.start&&finite(e.xp)&&e.xp>=0&&e.xp<=604800&&typeof e.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.day)&&(!e.fileHash||typeof e.fileHash==='string'&&e.fileHash.length<=80));}
