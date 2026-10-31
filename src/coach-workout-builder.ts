import type {CoachSegment,CoachWorkout} from './coach-engine';

/** A deliberately reviewable workout import: never infer power from heart rate. */
export type ImportedTarget='heart_rate'|'power'|'ftp_percent'|'open';
export type ImportedStep={name:string;minutes:number;target:ImportedTarget;low:number|null;high:number|null};
export type WorkoutDraft={name:string;steps:ImportedStep[];notes:string;source:'description'|'screenshot'|'zwo'|'text'};
export type WorkoutParseResult={draft:WorkoutDraft|null;warnings:string[];error?:string};
export const GARMIN_BASE_EXAMPLE='Base\nTotal Time 2:00:00\nBike 2:00:00\nIntensity Target · 103–114 bpm';

const normalize=(s:string)=>s.replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const number=(s:string)=>Number(s.replace(',','.'));
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
function durationSeconds(source:string):number|null{
 const text=normalize(source);
 // Garmin displays Total Time / Bike as HH:MM:SS.
 const clock=text.match(/(?:^|\s)(\d{1,2}):(\d\d):(\d\d)(?=\s|$)/);
 if(clock)return Number(clock[1])*3600+Number(clock[2])*60+Number(clock[3]);
 const clockShort=text.match(/(?:^|\s)(\d{1,3}):(\d\d)(?=\s|$)/);
 if(clockShort && !/^\d{1,2}:\d\d$/.test(text.replace(/^(?:.*(?:total time|bike|duration)\s*)/i,'')))
   return Number(clockShort[1])*60+Number(clockShort[2]);
 const hours=text.match(/\b(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|hr|h)\b/i);
 const mins=text.match(/\b(\d+(?:[.,]\d+)?)\s*(?:minutes?|mins?|min|m)\b/i);
 const secs=text.match(/\b(\d+(?:[.,]\d+)?)\s*(?:seconds?|secs?|sec|s)\b/i);
 if(hours||mins||secs)return Math.round((hours?number(hours[1])*3600:0)+(mins?number(mins[1])*60:0)+(secs?number(secs[1]):0));
 return null;
}
function parseTarget(raw:string):{target:ImportedTarget;low:number|null;high:number|null}{
 const text=normalize(raw);
 const range=/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(bpm|watts?|w|%\s*(?:of\s*)?ftp)\b/i.exec(text);
 if(range){
  const low=number(range[1]),high=number(range[2]),unit=range[3].toLowerCase();
  if(unit.includes('bpm'))return {target:'heart_rate',low,high};
  if(unit.includes('ftp'))return {target:'ftp_percent',low,high};
  return {target:'power',low,high};
 }
 const percent=text.match(/\b(\d+(?:\.\d+)?)\s*%\s*(?:of\s*)?ftp\b/i);
 if(percent)return {target:'ftp_percent',low:number(percent[1]),high:number(percent[1])};
 const bpm=text.match(/\b(\d{2,3})\s*bpm\b/i);
 if(bpm)return {target:'heart_rate',low:number(bpm[1]),high:number(bpm[1])};
 const power=text.match(/\b(\d{2,4})\s*(?:watts?|w)\b/i);
 if(power)return {target:'power',low:number(power[1]),high:number(power[1])};
 return {target:'open',low:null,high:null};
}
export function validateDraft(raw:unknown):WorkoutDraft{
 if(!raw||typeof raw!=='object')throw Error('Enter a workout description first.');
 const d=raw as Partial<WorkoutDraft>;
 const name=typeof d.name==='string'?d.name.trim().slice(0,70):'';
 if(!name)throw Error('Give this workout a name.');
 if(!Array.isArray(d.steps)||d.steps.length<1||d.steps.length>80)throw Error('Workouts need 1 to 80 steps.');
 const steps=d.steps.map((step,i)=>{
  const minutes=Number(step?.minutes),kind=step?.target;
  const low=step?.low===null?null:Number(step?.low),high=step?.high===null?null:Number(step?.high);
  if(!Number.isFinite(minutes)||minutes<1/60||minutes>480)throw Error('Step '+(i+1)+': duration must be between 1 second and 8 hours.');
  if(!['heart_rate','power','ftp_percent','open'].includes(String(kind)))throw Error('Step '+(i+1)+': unsupported target.');
  if(kind!=='open'){
   if(low===null||high===null||!Number.isFinite(low)||!Number.isFinite(high)||low>high)throw Error('Step '+(i+1)+': enter valid low and high targets.');
   const max=kind==='heart_rate'?250:kind==='power'?1500:250;
   if(low<0||high>max)throw Error('Step '+(i+1)+': target outside a reasonable range.');
  }
  return {name:String(step.name||('Step '+(i+1))).trim().slice(0,60),minutes:Math.round(minutes*60)/60,
   target:kind as ImportedTarget,low:kind==='open'?null:low,high:kind==='open'?null:high};
 });
 const total=steps.reduce((n,s)=>n+s.minutes,0);
 if(total>720)throw Error('Total workout time must not exceed 12 hours.');
 return {name,steps,notes:String(d.notes||'').slice(0,300),source:['description','screenshot','zwo','text'].includes(String(d.source))?d.source as WorkoutDraft['source']:'description'};
}
export function parseWorkoutDescription(input:string,source:WorkoutDraft['source']='description'):WorkoutParseResult{
 const warnings:string[]=[];
 const text=input.trim();
 if(text.length<3)return {draft:null,warnings,error:'Paste a workout description or choose a workout screenshot.'};
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const first=lines[0].replace(/^(?:workout|title|name)\s*:\s*/i,'').slice(0,70);
 const title=/^(?:overview|total time|steps|bike|intensity target|notes)$/i.test(first)||/\d{1,2}:\d\d:\d\d/.test(first)
   ?'Imported cycling workout':first;
 const steps:ImportedStep[]=[];
 const add=(name:string,seconds:number,raw:string)=>{
  if(seconds<=0)return;
  const target=parseTarget(raw);
  steps.push({name:name.trim().slice(0,60)||'Ride',minutes:Math.round(seconds)/60,...target});
 };
 // Explicit interval descriptions: "Warm up: 10 min at 50-60% FTP".
 for(const line of lines){
  const repeat=/^\s*(\d{1,2})\s*(?:x|×)\s*[:(]?\s*(.+)/i.exec(line);
  if(repeat && /(min|sec|:|hour|hr)\b/i.test(repeat[2])){
   const count=clamp(Number(repeat[1]),1,20);
   const pieces=repeat[2].replace(/\)\s*$/,'').split(/\s*(?:,|;|\+|\bthen\b|\bwith\b)\s*/i).filter(Boolean);
   const parsed=pieces.map((piece,i)=>({seconds:durationSeconds(piece),piece,name:i===0?'Work':'Recovery'}));
   if(parsed.every(p=>p.seconds!==null)&&parsed.length>0&&steps.length+parsed.length*count<=80){
    for(let i=0;i<count;i++)for(const p of parsed)add(p.name+' '+(i+1),p.seconds!,p.piece);
    continue;
   }
  }
  if(/^(?:overview|total time|notes|steps|intensity target|workout)\b/i.test(line))continue;
  // Ignore a title-only row. Ignore Garmin "Bike 2:00:00" when the whole workout
  // has a single target elsewhere; otherwise it would duplicate the session.
  const seconds=durationSeconds(line);
  if(seconds!==null && /(warm|cool|interval|recover|tempo|easy|ride|steady|work|zone|spin|threshold|bike|power)/i.test(line)){
   const target=parseTarget(line);
   if(target.target!=='open' || /warm|cool|recover|easy|interval|tempo|zone|steady/i.test(line)){
    const name=line.split(/[:·]/)[0].replace(/(?:\d+\s*(?:min|minutes?|hr|hours?)\b).*$/i,'').trim()||'Ride';
    if(!/^bike\b/i.test(name)||target.target!=='open')add(name,seconds,line);
   }
  }
 }
 // When an image or plain text provides one global target and duration, use
 // exactly one interval; don't invent warmups, intervals, or wattage.
 if(!steps.length){
  const durationLine=lines.find(l=>/total\s*time/i.test(l)&&durationSeconds(l)!==null);
  const preferred=durationLine || lines.find(l=>/\bbike\b/i.test(l)&&durationSeconds(l)!==null);
  const seconds=(preferred&&durationSeconds(preferred)) || durationSeconds(text);
  if(!seconds)return {draft:null,warnings,error:'I could not find a duration. Try “2 hours at 103–114 bpm” or enter the steps manually.'};
  const globalTarget=parseTarget(text);
  steps.push({name:'Bike',minutes:seconds/60,...globalTarget});
 }
 const all=steps.map(x=>({...x}));
 if(all.some(s=>s.target==='open'))warnings.push('Some steps have no explicit intensity target. They will be free-ride guidance.');
 if(all.some(s=>s.target==='heart_rate'))warnings.push('Heart-rate targets use guidance in SIM mode, not ERG resistance control. Connect an HR monitor to see live bpm.');
 try{return {draft:validateDraft({name:title,steps:all,notes:'Review imported timing and targets before riding.',source}),warnings};}
 catch(e){return {draft:null,warnings,error:e instanceof Error?e.message:String(e)};}
}
export function draftToWorkout(draft:WorkoutDraft,id='imported-'+Date.now()):CoachWorkout{
 const validated=validateDraft(draft);
 const segments:CoachSegment[]=validated.steps.map(s=>{
  const percent=s.target==='ftp_percent',power=s.target==='power';
  return {name:s.name,minutes:s.minutes,
   low:percent?(s.low||0)/100:0,high:percent?(s.high||0)/100:0,
   targetKind:s.target==='ftp_percent'?'ftp':s.target,
   heartRateLow:s.target==='heart_rate'?s.low??undefined:undefined,
   heartRateHigh:s.target==='heart_rate'?s.high??undefined:undefined,
   powerLow:power?s.low??undefined:undefined,powerHigh:power?s.high??undefined:undefined};
 });
 return {id,name:validated.name,description:validated.notes||'Custom workout reviewed by the rider.',
   category:'My Workouts',segments};
}
export function importZwo(xml:string):WorkoutParseResult{
 const warnings:string[]=[];
 const name=xml.match(/<name>([\s\S]*?)<\/name>/i)?.[1]?.replace(/<[^>]*>/g,'').trim()||'Imported Zwift workout';
 const steps:ImportedStep[]=[];
 // A deliberate subset: steady-state, warmup, cooldown, free ride and basic intervals.
 const tag=/<(SteadyState|Warmup|Cooldown|FreeRide|IntervalsT)\b([^>]*?)\/?>/gi;
 let match:RegExpExecArray|null;
 const attr=(raw:string,key:string):number|null=>{
  const m=new RegExp("\\b"+key+"\\s*=\\s*[\"']([^\"']+)[\"']","i").exec(raw);
  return m?Number(m[1]):null;
 };
 const addStep=(label:string,seconds:number,low:number|null,high:number|null)=>{
  steps.push({name:label,minutes:seconds/60,target:low===null?'open':'ftp_percent',
   low:low===null?null:Math.round(low*100),high:high===null?null:Math.round(high*100)});
 };
 while((match=tag.exec(xml))!==null){
  const kind=match[1].toLowerCase(),args=match[2];
  if(kind==='intervalst'){
   const reps=clamp(attr(args,'Repeat')||0,0,40),on=attr(args,'OnDuration'),off=attr(args,'OffDuration'),
    onPower=attr(args,'OnPower'),offPower=attr(args,'OffPower');
   if(!reps||!on||!off||onPower===null||offPower===null||steps.length+reps*2>80)return {draft:null,warnings,error:'This interval file exceeds the supported limits or contains unsupported interval fields.'};
   for(let i=0;i<reps;i++){addStep('Work '+(i+1),on,onPower,onPower);addStep('Recovery '+(i+1),off,offPower,offPower);}
  }else{
   const duration=attr(args,'Duration');
   if(!duration||!Number.isFinite(duration))return {draft:null,warnings,error:'This workout contains a step without a valid time duration.'};
   const power=attr(args,'Power'),lo=attr(args,'PowerLow'),hi=attr(args,'PowerHigh');
   addStep(kind==='steadystate'?'Steady':kind==='warmup'?'Warm up':kind==='cooldown'?'Cool down':'Free ride',
    duration,kind==='freeride'?null:lo??power,kind==='freeride'?null:hi??power);
  }
 }
 if(!steps.length)return {draft:null,warnings,error:'No supported timed workout steps were found in the ZWO file.'};
 try{return {draft:validateDraft({name,steps,notes:'Imported Zwift workout. Verify FTP percentages before riding.',source:'zwo'}),warnings};}
 catch(e){return {draft:null,warnings,error:e instanceof Error?e.message:String(e)};}
}
