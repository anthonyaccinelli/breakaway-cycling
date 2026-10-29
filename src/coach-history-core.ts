// Pure historical-activity normalization for rider-owned Strava exports and individual activity files.
// No API access, network calls or automatic sharing. All timestamps are Unix milliseconds.
export type ActivitySource='FIT'|'TCX'|'GPX'|'CSV';
export type HistoricalRide={
  key:string; stravaId:string|null; name:string;start:number;duration:number;movingSeconds:number|null;
  distanceMeters:number|null; elevationMeters:number|null;avgPower:number|null;avgHeartRate:number|null;
  avgCadence:number|null;best20minWatts:number|null;source:ActivitySource;indoor:boolean;
};
const finite=(n:unknown)=>typeof n==='number'&&Number.isFinite(n);
const val=(v:unknown):number|null=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return finite(n)?n:null;};
const nonnegative=(v:unknown,max=1e8):number|null=>{const n=val(v);return n!==null&&n>=0&&n<=max?n:null;};
const positive=(v:unknown,max=1e8):number|null=>{const n=val(v);return n!==null&&n>0&&n<=max?n:null;};
const time=(v:unknown):number|null=>{if(v instanceof Date)return Number.isFinite(v.getTime())?v.getTime():null;
 if(typeof v==='number')return Number.isFinite(v)&&v>1e11?v:null;
 if(typeof v!=='string'||!v.trim())return null;const n=Date.parse(v);return Number.isFinite(n)?n:null;};
function first(...values:unknown[]):number|null{for(const v of values){const n=val(v);if(n!==null)return n;}return null;}
export function isCyclingSport(value:unknown):boolean {
 const sport=String(value??'').trim().toLowerCase().replace(/[\s_-]/g,'');
 return ['ride','cycling','2','virtualride','virtualcycling','ebikeride','mountainbikeride','gravelride','handcycle','velomobile','e-mountainbikeride','emtbride'].includes(sport);
}
function cleanName(n:unknown):string{
 return typeof n==='string'&&n.trim()?n.trim().slice(0,120):'Cycling activity';
}
export function validateRide(raw:Omit<HistoricalRide,'key'>):HistoricalRide {
 const duration=positive(raw.duration,7*86400), start=time(raw.start);
 if(start===null||start<946684800000||start>Date.now()+86400000||duration===null||duration<60)throw Error('Invalid ride date or duration.');
 if(!['FIT','TCX','GPX','CSV'].includes(raw.source))throw Error('Unknown recording format.');
 const watts=nonnegative(raw.avgPower,2500),hr=nonnegative(raw.avgHeartRate,240),cad=nonnegative(raw.avgCadence,250);
 const best=nonnegative(raw.best20minWatts,2000),distance=nonnegative(raw.distanceMeters,1e7),elevation=nonnegative(raw.elevationMeters,100000);
 const moving=positive(raw.movingSeconds,7*86400);
 // Stable between reimports of the same data. Kept deliberately separate from other mode saves.
 const key=raw.stravaId?'strava:'+raw.stravaId:'ride:'+Math.round(start/1000)+':'+Math.round(duration);
 return {key,stravaId:raw.stravaId?String(raw.stravaId).slice(0,30):null,name:cleanName(raw.name),
   start,duration:Math.round(duration),movingSeconds:moving===null?null:Math.round(Math.min(duration,moving)),
   distanceMeters:distance,elevationMeters:elevation,avgPower:watts,avgHeartRate:hr,avgCadence:cad,
   best20minWatts:best,source:raw.source,indoor:!!raw.indoor};
}
function asRaw(source:ActivitySource,shape:Partial<HistoricalRide>):HistoricalRide {
 return validateRide({name:shape.name||'Cycling activity',start:shape.start||0,duration:shape.duration||0,
   movingSeconds:shape.movingSeconds??null,distanceMeters:shape.distanceMeters??null,elevationMeters:shape.elevationMeters??null,
   avgPower:shape.avgPower??null,avgHeartRate:shape.avgHeartRate??null,avgCadence:shape.avgCadence??null,
   best20minWatts:shape.best20minWatts??null,source,indoor:!!shape.indoor,stravaId:shape.stravaId??null});
}
function pickTime(obj:Record<string,unknown>,...names:string[]):number|null {
 for(const name of names){const t=time(obj[name]);if(t!==null)return t;}return null;
}
type PowerSample={t:number;power:number};
export function bestTwentyMinutePower(records:PowerSample[]):number|null{
 // Integrate approximately 1–10s spaced samples. Discontinuities break the window.
 let queue:{duration:number;power:number}[]=[],left=0,total=0,energy=0,best=0;
 for(let i=1;i<records.length;i++){
  const a=records[i-1],b=records[i],dt=(b.t-a.t)/1000;
  if(!finite(dt)||dt<=0)continue;
  if(dt>10){queue=[];left=0;total=0;energy=0;continue;}
  if(!finite(a.power)||a.power<0||a.power>2000)continue;
  queue.push({duration:dt,power:a.power});total+=dt;energy+=dt*a.power;
  while(total>1200&&left<queue.length){
   const edge=queue[left],excess=total-1200;
   if(edge.duration<=excess+1e-8){total-=edge.duration;energy-=edge.duration*edge.power;left++;}
   else{edge.duration-=excess;total-=excess;energy-=excess*edge.power;}
  }
  if(left>200){queue=queue.slice(left);left=0;}
  if(total>=1199.9)best=Math.max(best,energy/total);
 }
 return best>0?Math.round(best):null;
}
export function parseFitRide(data:any,filename='Activity.fit',name?:string,stravaId:string|null=null):HistoricalRide{
 const sessions=data.sessions||data.sessionMesgs||(data.session?[data.session]:[]);
 const session=Array.isArray(sessions)?sessions[0]:null;
 if(!session)throw Error('FIT activity has no session.');
 const rawSport=session.sport??data.sport??data.file_id?.sport;
 if(!isCyclingSport(rawSport))throw Error('Not a cycling activity.');
 const rawRecords=data.records||data.recordMesgs||[];
 const records=Array.isArray(rawRecords)?rawRecords:[];
 if(records.length>160000)throw Error('FIT activity has too many samples.');
 const start=pickTime(session,'start_time','startTime')??pickTime(data,'start_time','startTime')??(records.length?pickTime(records[0],'timestamp'):null);
 const end=pickTime(session,'timestamp')??(records.length?pickTime(records[records.length-1],'timestamp'):null);
 const elapsed=first(session.total_elapsed_time,session.totalElapsedTime,session.total_timer_time,session.totalTimerTime);
 const duration=elapsed&&elapsed>0?elapsed:(start!==null&&end!==null?(end-start)/1000:0);
 const powerRecords=records.map((r:any)=>({t:pickTime(r,'timestamp')??NaN,power:first(r.power,r.watts)??NaN})).filter((r:PowerSample)=>finite(r.t));
 let powerSum=0,powerCount=0,hrSum=0,hrCount=0,cadSum=0,cadCount=0;
 for(const r of records){const pw=nonnegative(r.power??r.watts,2500);if(pw!==null){powerSum+=pw;powerCount++;}
  const hr=positive(r.heart_rate??r.heartRate,240);if(hr!==null){hrSum+=hr;hrCount++;}
  const cad=positive(r.cadence,250);if(cad!==null){cadSum+=cad;cadCount++;}}
 const sportDetail=String(session.sub_sport??session.subSport??'').toLowerCase();
 return asRaw('FIT',{name:name||filename,start:start??0,duration,
  stravaId,indoor:/indoor|virtual|trainer/.test(sportDetail),
  movingSeconds:positive(session.total_timer_time??session.totalTimerTime,7*86400),
  distanceMeters:nonnegative(session.total_distance??session.totalDistance,1e7),
  elevationMeters:nonnegative(session.total_ascent??session.totalAscent,100000),
  avgPower:nonnegative(session.avg_power??session.avgPower,2500)??(powerCount?powerSum/powerCount:null),
  avgHeartRate:positive(session.avg_heart_rate??session.avgHeartRate,240)??(hrCount?hrSum/hrCount:null),
  avgCadence:positive(session.avg_cadence??session.avgCadence,250)??(cadCount?cadSum/cadCount:null),
  best20minWatts:bestTwentyMinutePower(powerRecords)});
}
const descendants=(el:Element,name:string):Element[]=>Array.from(el.getElementsByTagNameNS('*',name));
function childText(el:Element,...names:string[]):string|null{
 for(const name of names){const found=el.getElementsByTagNameNS('*',name)[0];if(found?.textContent?.trim())return found.textContent.trim();}
 return null;
}
function timeFromEl(el:Element,...names:string[]):number|null {const v=childText(el,...names);return v?time(v):null;}
type XmlPoint={t:number;power:number;hr:number|null;cad:number|null;lat:number|null;lon:number|null;ele:number|null;distance:number|null};
const coordinates=(v:string|null)=>v===null?null:val(v);
function haversine(a:XmlPoint,b:XmlPoint):number {
 if(a.lat===null||a.lon===null||b.lat===null||b.lon===null)return 0;
 const rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad;
 const q=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
 return 12742000*Math.asin(Math.min(1,Math.sqrt(q)));
}
export function parseXmlRide(text:string,filename='Activity.gpx',name?:string,stravaId:string|null=null):HistoricalRide{
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML DTD or entity declarations are not supported.');
 const doc=new DOMParser().parseFromString(text,'application/xml');
 if(descendants(doc.documentElement,'parsererror').length||doc.querySelector('parsererror'))throw Error('Invalid activity XML.');
 const isTcx=/\.tcx$/i.test(filename);
 const nodes=descendants(doc.documentElement,isTcx?'Trackpoint':'trkpt');
 if(nodes.length<2||nodes.length>160000)throw Error('Activity needs timestamped ride samples.');
 if(isTcx){const acts=descendants(doc.documentElement,'Activity');
  if(acts.length!==1||!isCyclingSport(acts[0].getAttribute('Sport')))throw Error('Not a single cycling TCX activity.');}
 const points:XmlPoint[]=[];
 for(const node of nodes){
  const t=timeFromEl(node,isTcx?'Time':'time');if(t===null)continue;
  const position=isTcx?descendants(node,'Position')[0]:null;
  points.push({t,hr:positive(childText(node,'HeartRateBpm','Value','hr'),240),
   power:nonnegative(childText(node,'Watts','watts','PowerInWatts','power'),2500)??NaN,
   cad:positive(childText(node,'Cadence','cad','RunCadence'),250),
   ele:val(childText(node,'AltitudeMeters','ele')),
   distance:nonnegative(childText(node,'DistanceMeters','distance'),1e7),
   lat:coordinates(isTcx?(position?childText(position,'LatitudeDegrees'):null):node.getAttribute('lat')),
   lon:coordinates(isTcx?(position?childText(position,'LongitudeDegrees'):null):node.getAttribute('lon'))});
 }
 if(points.length<2)throw Error('No timestamped GPS/trackpoint data.');
 points.sort((a,b)=>a.t-b.t);
 let length=0,elevation=0;
 for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   const step=b.distance!==null&&a.distance!==null&&b.distance>=a.distance?b.distance-a.distance:haversine(a,b);
   if(step>=0&&step<5000)length+=step;
   if(a.ele!==null&&b.ele!==null&&b.ele>a.ele&&b.ele-a.ele<200)elevation+=b.ele-a.ele;
 }
 const duration=(points[points.length-1].t-points[0].t)/1000;
 let powerSum=0,powerCount=0,hrSum=0,hrCount=0,cadSum=0,cadCount=0;
 for(const p of points){
  if(finite(p.power)){powerSum+=p.power;powerCount++;}
  if(p.hr!==null){hrSum+=p.hr;hrCount++;}
  if(p.cad!==null){cadSum+=p.cad;cadCount++;}
 }
 const trkName=childText(doc.documentElement,'name');
 return asRaw(isTcx?'TCX':'GPX',{name:name||trkName||filename,start:points[0].t,duration,
  stravaId,distanceMeters:length||points.at(-1)?.distance||null,elevationMeters:elevation||null,
  movingSeconds:null,avgPower:powerCount?powerSum/powerCount:null,avgHeartRate:hrCount?hrSum/hrCount:null,
  avgCadence:cadCount?cadSum/cadCount:null,best20minWatts:bestTwentyMinutePower(points.filter(p=>finite(p.power)).map(p=>({t:p.t,power:p.power})))});
}
export function csvRows(text:string,maxRows=100000):string[][] {
 if(text.length>32*1024*1024)throw Error('CSV index is too large.');
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;
   row.push(field);field='';if(row.some(x=>x.trim()))rows.push(row);row=[];if(rows.length>maxRows)throw Error('Too many activities in CSV.');}
  else field+=c;
 }
 if(quoted)throw Error('Unclosed quoted field in CSV.');
 row.push(field);if(row.some(x=>x.trim()))rows.push(row);
 if(rows[0]?.[0])rows[0][0]=rows[0][0].replace(/^\uFEFF/,'');
 return rows;
}
export type CsvRide={ride:HistoricalRide;file:string|null};
export function parseStravaCsv(text:string):CsvRide[] {
 const rows=csvRows(text),cols=(rows.shift()||[]).map(s=>s.toLowerCase().replace(/\s/g,'').replace(/[^a-z0-9]/g,''));
 const get=(row:string[],...names:string[])=>{for(const name of names){const idx=cols.indexOf(name);if(idx>=0)return row[idx]||'';}return '';};
 const out:CsvRide[]=[];
 for(const row of rows){
  if(!isCyclingSport(get(row,'activitytype','type','sporttype')))continue;
  const start=time(get(row,'activitydate','startdate','startdatetime')); if(start===null)continue;
  const duration=positive(get(row,'elapsedtime','movingtime'),7*86400);if(duration===null)continue;
  try{const id=get(row,'activityid')||null,rawFile=get(row,'filename')||null;
   const ride=asRaw('CSV',{name:get(row,'activityname','name')||'Ride',start,duration,stravaId:id,
    indoor:/virtual/.test(get(row,'activitytype','type').toLowerCase()),
    movingSeconds:positive(get(row,'movingtime'),7*86400),
    distanceMeters:nonnegative(get(row,'distance'),1e7),
    elevationMeters:nonnegative(get(row,'elevationgain'),100000),
    avgPower:nonnegative(get(row,'averagewatts','avgpower'),2500),
    avgHeartRate:nonnegative(get(row,'averageheartrate'),240),
    avgCadence:nonnegative(get(row,'averagecadence'),250)});
   out.push({ride,file:rawFile});
  }catch{/* Ignore malformed non-rides while still importing valid cycling rows. */}
 }
 return out;
}
export function duplicateRide(a:HistoricalRide,b:HistoricalRide):boolean {
 if(a.stravaId&&b.stravaId&&a.stravaId===b.stravaId)return true;
 const tolerance=Math.min(300,Math.max(90,Math.min(a.duration,b.duration)*.07));
 if(Math.abs(a.start-b.start)>120000||Math.abs(a.duration-b.duration)>tolerance)return false;
 if(a.distanceMeters!==null&&b.distanceMeters!==null)
  return Math.abs(a.distanceMeters-b.distanceMeters)<=Math.max(500,Math.min(a.distanceMeters,b.distanceMeters)*.08);
 return true;
}
const sourceScore=(s:ActivitySource)=>({FIT:4,TCX:3,GPX:2,CSV:1})[s];
export function richer(a:HistoricalRide,b:HistoricalRide):HistoricalRide {
 const metrics=(r:HistoricalRide)=>[r.avgPower,r.best20minWatts,r.avgHeartRate,r.avgCadence,r.distanceMeters,r.elevationMeters].filter(n=>n!==null).length;
 const preferB=(metrics(b)>metrics(a)) || (metrics(b)===metrics(a)&&sourceScore(b.source)>sourceScore(a.source));
 const top=preferB?b:a,other=preferB?a:b;
 return {...top,key:a.key,stravaId:a.stravaId??b.stravaId,
   name:(a.source==='CSV'&&a.name!=='Ride'?a.name:top.name),
   avgPower:top.avgPower??other.avgPower,avgHeartRate:top.avgHeartRate??other.avgHeartRate,
   avgCadence:top.avgCadence??other.avgCadence,best20minWatts:top.best20minWatts??other.best20minWatts,
   distanceMeters:top.distanceMeters??other.distanceMeters,elevationMeters:top.elevationMeters??other.elevationMeters,
   movingSeconds:top.movingSeconds??other.movingSeconds};
}
export function mergeRides(existing:HistoricalRide[],incoming:HistoricalRide[]):{rides:HistoricalRide[];added:number;updated:number;duplicates:number} {
 const rides=[...existing];let added=0,updated=0,duplicates=0;
 for(const ride of incoming){const index=rides.findIndex(other=>duplicateRide(other,ride));
  if(index>=0){duplicates++;const best=richer(rides[index],ride);
   if(JSON.stringify(best)!==JSON.stringify(rides[index])){rides[index]=best;updated++;}
  }else{rides.push(ride);added++;}}
 rides.sort((a,b)=>b.start-a.start);
 return {rides,added,updated,duplicates};
}
export function historySummary(rides:HistoricalRide[],now=Date.now()){
 const weeks=Array.from({length:8},(_,i)=>{const start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-start.getDay()-(7-i)*7);return {start:start.getTime(),hours:0,rides:0};});
 for(const ride of rides)for(const week of weeks)if(ride.start>=week.start&&ride.start<week.start+604800000){week.hours+=ride.duration/3600;week.rides++;break;}
 const weeklyHours=weeks.reduce((sum,w)=>sum+w.hours,0)/8;
 const recent=rides.filter(r=>r.start<=now&&r.start>now-56*86400000);
 const best20=rides.reduce<number|null>((max,r)=>r.best20minWatts!==null&&(max===null||r.best20minWatts>max)?r.best20minWatts:max,null);
 return {total:rides.length,recent:recent.length,weeklyHours:Math.round(weeklyHours*10)/10,weeks,
  suggestedFtp:best20!==null&&best20>100?Math.round(best20*.95):null,
  powerRides:rides.filter(r=>r.avgPower!==null).length,latest:rides[0]?.start??null,
  allHours:Math.round(rides.reduce((n,r)=>n+r.duration/3600,0))};
}
